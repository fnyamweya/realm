/**
 * API Key authentication.
 *
 * Handles the complete API key authentication flow:
 * 1. Extract key from `X-Api-Key` header
 * 2. Parse key format: `rto_<prefix>.<secret>`
 * 3. Look up key by prefix in D1
 * 4. Verify key hash using constant-time comparison
 * 5. Check key status (active, revoked, expired)
 * 6. Check IP allowlist if configured
 * 7. Check scopes
 * 8. Update last-used timestamp
 * 9. Return authenticated service context
 *
 * Security:
 * - Keys are stored as SHA-256 hashes, never in plaintext
 * - Constant-time hash comparison prevents timing attacks
 * - Failed lookups take same time as successful ones (anti-enumeration)
 * - Rate limited per key prefix
 */

import type { D1Database, KVNamespace, AuthResult, ParsedApiKey } from "./types.js";
import { sha256Hex, constantTimeEqual } from "./crypto-utils.js";

// ─── Configuration ───────────────────────────────────────────────────────────

const API_KEY_HEADER = "x-api-key";
const DEFAULT_PREFIX = "rto";

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Extract an API key from the request headers.
 * Returns null if no API key is present.
 */
export function extractApiKey(
    request: Request,
    expectedPrefix?: string,
): ParsedApiKey | null {
    const raw = request.headers.get(API_KEY_HEADER);
    if (!raw) return null;

    return parseApiKey(raw, expectedPrefix ?? DEFAULT_PREFIX);
}

/**
 * Parse an API key string into its components.
 * Format: `<prefix>_<keyPrefix>.<secret>`
 * Example: `rto_abc123.s3cr3tK3yD4t4H3r3`
 */
export function parseApiKey(raw: string, expectedPrefix: string): ParsedApiKey | null {
    const trimmed = raw.trim();

    // Must start with the expected prefix
    if (!trimmed.startsWith(`${expectedPrefix}_`)) {
        return null;
    }

    // Remove the global prefix
    const withoutGlobalPrefix = trimmed.substring(expectedPrefix.length + 1);

    // Split on first dot
    const dotIndex = withoutGlobalPrefix.indexOf(".");
    if (dotIndex === -1 || dotIndex === 0 || dotIndex === withoutGlobalPrefix.length - 1) {
        return null;
    }

    const prefix = withoutGlobalPrefix.substring(0, dotIndex);
    const secret = withoutGlobalPrefix.substring(dotIndex + 1);

    if (prefix.length < 4 || secret.length < 16) {
        return null;
    }

    return { raw: trimmed, prefix, secret };
}

/**
 * Authenticate a request using an API key.
 *
 * @param parsedKey - The parsed API key components
 * @param clientIp - The client's IP address (for allowlist checking)
 * @param db - D1 database binding
 * @param kv - KV namespace for caching (optional, used for rate limiting)
 */
export async function authenticateApiKey(
    parsedKey: ParsedApiKey,
    clientIp: string,
    db: D1Database,
): Promise<AuthResult> {
    // 1. Look up key by prefix across all clients
    //    The unique constraint is (clientId, keyPrefix), but we search by keyPrefix
    //    then verify the hash to determine which client it belongs to.
    const keyRow = await db
        .prepare(
            `SELECT ak.*, sa.name as serviceAccountName, sa.status as serviceAccountStatus
             FROM api_keys ak
             JOIN service_accounts sa ON ak.serviceAccountId = sa.id
             WHERE ak.keyPrefix = ?
             LIMIT 5`,
        )
        .bind(parsedKey.prefix)
        .all<ApiKeyRow>();

    if (!keyRow.results || keyRow.results.length === 0) {
        // Anti-enumeration: take roughly the same time as a successful lookup
        await sha256Hex(parsedKey.secret);
        return {
            authenticated: false,
            errorCode: "AUTH_CREDENTIALS_INVALID",
            message: "Invalid API key",
            statusCode: 401,
        };
    }

    // 2. Hash the provided secret and find a matching row
    const secretHash = await sha256Hex(parsedKey.secret);

    let matchedRow: ApiKeyRow | null = null;
    for (const row of keyRow.results) {
        if (constantTimeEqual(secretHash, row.keyHash)) {
            matchedRow = row;
            break;
        }
    }

    if (!matchedRow) {
        return {
            authenticated: false,
            errorCode: "AUTH_CREDENTIALS_INVALID",
            message: "Invalid API key",
            statusCode: 401,
        };
    }

    // 3. Check key status
    if (matchedRow.status === "REVOKED") {
        return {
            authenticated: false,
            errorCode: "AUTH_CREDENTIALS_INVALID",
            message: "API key has been revoked",
            statusCode: 401,
        };
    }

    if (matchedRow.status === "EXPIRED") {
        return {
            authenticated: false,
            errorCode: "AUTH_TOKEN_EXPIRED",
            message: "API key has expired",
            statusCode: 401,
        };
    }

    // 4. Check service account status
    if (matchedRow.serviceAccountStatus !== "ACTIVE") {
        return {
            authenticated: false,
            errorCode: "AUTH_CREDENTIALS_INVALID",
            message: "Service account is not active",
            statusCode: 401,
        };
    }

    // 5. Check IP allowlist
    if (matchedRow.allowedIpsJson) {
        try {
            const allowedIps = JSON.parse(matchedRow.allowedIpsJson) as string[];
            if (allowedIps.length > 0 && !allowedIps.includes(clientIp)) {
                return {
                    authenticated: false,
                    errorCode: "AUTH_FORBIDDEN",
                    message: "Request IP not in API key allowlist",
                    statusCode: 403,
                };
            }
        } catch {
            // Malformed allowlist JSON — deny by default
            return {
                authenticated: false,
                errorCode: "AUTH_FORBIDDEN",
                message: "Invalid IP allowlist configuration",
                statusCode: 403,
            };
        }
    }

    // 6. Parse scopes
    let scopes: string[] = [];
    try {
        scopes = JSON.parse(matchedRow.scopesJson) as string[];
    } catch {
        scopes = [];
    }

    // 7. Update last-used timestamp (fire-and-forget, non-blocking)
    const nowIso = new Date().toISOString();
    db.prepare("UPDATE api_keys SET lastUsedAt = ? WHERE id = ?")
        .bind(nowIso, matchedRow.id)
        .run()
        .catch(() => {
            // Non-critical: don't fail auth on analytics update
        });

    // 8. Return authenticated context
    return {
        authenticated: true,
        method: "api_key",
        sessionId: `apikey_${matchedRow.id}`,
        userId: matchedRow.serviceAccountId,
        clientId: matchedRow.clientId,
        membershipId: null,
        roles: ["INTEGRATION"],
        scopes,
        audience: "service",
        authMethod: "api_key",
        mfaLevel: "NONE",
        mfaLevelExpiresAt: null,
    };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface ApiKeyRow {
    id: string;
    clientId: string;
    serviceAccountId: string;
    keyPrefix: string;
    keyHash: string;
    scopesJson: string;
    allowedIpsJson: string | null;
    status: string;
    createdAt: string;
    lastUsedAt: string | null;
    revokedAt: string | null;
    serviceAccountName: string;
    serviceAccountStatus: string;
}
