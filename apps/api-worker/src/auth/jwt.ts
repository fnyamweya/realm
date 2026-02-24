/**
 * JWT (JSON Web Token) verification.
 *
 * Handles the complete JWT lifecycle:
 * 1. Decode header + payload (without verification) for key selection
 * 2. Verify signature using JWKS-resolved CryptoKey
 * 3. Validate standard claims (exp, nbf, iss, aud, iat)
 * 4. Extract RealtyOS-specific claims
 *
 * Security considerations:
 * - Rejects "none" algorithm
 * - Rejects tokens with missing/empty signature
 * - Clock skew tolerance: 30 seconds
 * - Maximum token age: 24 hours
 * - Validates all standard claims
 */

import type { JwtPayload, JwtHeader, KVNamespace } from "./types.js";
import { base64urlDecode } from "./crypto-utils.js";
import { getVerificationKeyAsync, getSigningAlgorithm } from "./jwks.js";

// ─── Configuration ───────────────────────────────────────────────────────────

/** Clock skew tolerance in seconds */
const CLOCK_SKEW_SECONDS = 30;
/** Maximum token lifetime in seconds (24h) */
const MAX_TOKEN_AGE_SECONDS = 86400;
/** Algorithms we accept */
const ALLOWED_ALGORITHMS = new Set([
    "RS256", "RS384", "RS512",
    "ES256", "ES384", "ES512",
]);

// ─── Public API ──────────────────────────────────────────────────────────────

export interface JwtVerifyOptions {
    /** Expected issuer */
    issuer: string;
    /** Expected audience */
    audience: string;
    /** JWKS endpoint URL */
    jwksUrl: string;
    /** KV namespace for JWKS caching */
    kv: KVNamespace;
    /** Current time override (for testing) */
    now?: number;
}

export type JwtVerifyResult = {
    valid: true;
    header: JwtHeader;
    payload: JwtPayload;
} | {
    valid: false;
    error: string;
    errorCode: string;
}

/**
 * Verify and decode a JWT token.
 *
 * @param token - The raw JWT string (without "Bearer " prefix)
 * @param options - Verification options
 * @returns Verification result with decoded payload or error
 */
export async function verifyJwt(
    token: string,
    options: JwtVerifyOptions,
): Promise<JwtVerifyResult> {
    // 1. Split into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
        return {
            valid: false,
            error: "Malformed JWT: expected 3 parts",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

    // 2. Reject empty signature (prevents "none" algorithm attack)
    if (!signatureB64 || signatureB64.length === 0) {
        return {
            valid: false,
            error: "JWT signature is empty",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 3. Decode header
    let header: JwtHeader;
    try {
        const headerJson = new TextDecoder().decode(base64urlDecode(headerB64));
        header = JSON.parse(headerJson) as JwtHeader;
    } catch {
        return {
            valid: false,
            error: "Failed to decode JWT header",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 4. Validate algorithm
    if (!header.alg || !ALLOWED_ALGORITHMS.has(header.alg)) {
        return {
            valid: false,
            error: `Unsupported algorithm: ${header.alg ?? "none"}`,
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    if (header.alg.toLowerCase() === "none") {
        return {
            valid: false,
            error: "Algorithm 'none' is not allowed",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 5. Decode payload (before signature verification — we need claims for error reporting)
    let payload: JwtPayload;
    try {
        const payloadJson = new TextDecoder().decode(base64urlDecode(payloadB64));
        payload = JSON.parse(payloadJson) as JwtPayload;
    } catch {
        return {
            valid: false,
            error: "Failed to decode JWT payload",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 6. Get verification key from JWKS
    const cryptoKey = await getVerificationKeyAsync(
        header.kid,
        header.alg,
        options.jwksUrl,
        options.kv,
    );

    if (!cryptoKey) {
        return {
            valid: false,
            error: header.kid
                ? `No matching key found for kid: ${header.kid}`
                : "No matching signing key found",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 7. Verify signature
    const signingAlg = getSigningAlgorithm(header.alg);
    if (!signingAlg) {
        return {
            valid: false,
            error: `Cannot verify algorithm: ${header.alg}`,
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64urlDecode(signatureB64);

    let signatureValid: boolean;
    try {
        signatureValid = await crypto.subtle.verify(
            signingAlg,
            cryptoKey,
            signature.buffer as ArrayBuffer,
            signingInput,
        );
    } catch {
        return {
            valid: false,
            error: "Signature verification failed",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    if (!signatureValid) {
        return {
            valid: false,
            error: "Invalid JWT signature",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // 8. Validate claims
    const now = options.now ?? Math.floor(Date.now() / 1000);
    const claimsResult = validateClaims(payload, options.issuer, options.audience, now);
    if (!claimsResult.valid) {
        return claimsResult;
    }

    return {
        valid: true,
        header,
        payload,
    };
}

/**
 * Decode a JWT without verification.
 * Use only for inspecting tokens in non-security contexts (logging, debugging).
 */
export function decodeJwtUnsafe(token: string): { header: JwtHeader; payload: JwtPayload } | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const header = JSON.parse(
            new TextDecoder().decode(base64urlDecode(parts[0]!)),
        ) as JwtHeader;
        const payload = JSON.parse(
            new TextDecoder().decode(base64urlDecode(parts[1]!)),
        ) as JwtPayload;

        return { header, payload };
    } catch {
        return null;
    }
}

// ─── Claim Validation ────────────────────────────────────────────────────────

function validateClaims(
    payload: JwtPayload,
    expectedIssuer: string,
    expectedAudience: string,
    now: number,
): { valid: true } | { valid: false; error: string; errorCode: string } {
    // Required claims
    if (!payload.sub) {
        return { valid: false, error: "Missing 'sub' claim", errorCode: "AUTH_TOKEN_INVALID" };
    }

    if (!payload.exp) {
        return { valid: false, error: "Missing 'exp' claim", errorCode: "AUTH_TOKEN_INVALID" };
    }

    if (!payload.iat) {
        return { valid: false, error: "Missing 'iat' claim", errorCode: "AUTH_TOKEN_INVALID" };
    }

    if (!payload.iss) {
        return { valid: false, error: "Missing 'iss' claim", errorCode: "AUTH_TOKEN_INVALID" };
    }

    // ─── Issuer validation ───────────────────────────────────────────────
    if (payload.iss !== expectedIssuer) {
        return {
            valid: false,
            error: `Invalid issuer: expected ${expectedIssuer}, got ${payload.iss}`,
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // ─── Audience validation ─────────────────────────────────────────────
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(expectedAudience)) {
        return {
            valid: false,
            error: `Invalid audience: token does not include ${expectedAudience}`,
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // ─── Expiration validation (with clock skew) ─────────────────────────
    if (payload.exp + CLOCK_SKEW_SECONDS < now) {
        return {
            valid: false,
            error: "Token has expired",
            errorCode: "AUTH_TOKEN_EXPIRED",
        };
    }

    // ─── Not Before validation (with clock skew) ─────────────────────────
    if (payload.nbf !== undefined && payload.nbf - CLOCK_SKEW_SECONDS > now) {
        return {
            valid: false,
            error: "Token is not yet valid (nbf)",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // ─── Issued At validation ────────────────────────────────────────────
    // Reject tokens issued in the future (with clock skew)
    if (payload.iat - CLOCK_SKEW_SECONDS > now) {
        return {
            valid: false,
            error: "Token issued in the future",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    // Reject tokens that are too old
    if (now - payload.iat > MAX_TOKEN_AGE_SECONDS) {
        return {
            valid: false,
            error: "Token is too old (max age exceeded)",
            errorCode: "AUTH_TOKEN_EXPIRED",
        };
    }

    // ─── Session ID validation ───────────────────────────────────────────
    if (!payload.session_id) {
        return {
            valid: false,
            error: "Missing 'session_id' claim",
            errorCode: "AUTH_TOKEN_INVALID",
        };
    }

    return { valid: true };
}
