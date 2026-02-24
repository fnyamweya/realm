/**
 * Session management and validation.
 *
 * Handles:
 * 1. Loading sessions from D1 with KV read-through cache
 * 2. Session status validation (active, expired, revoked)
 * 3. Sliding window expiration with lastSeenAt updates
 * 4. Membership and roles loading for the active client
 * 5. Session activity tracking
 *
 * Caching strategy:
 * - Sessions are cached in KV with a short TTL (2 minutes)
 * - Session revocation invalidates KV cache immediately
 * - Stale sessions are revalidated against D1 on cache miss
 */

import type { D1Database, KVNamespace } from "./types.js";

// ─── Configuration ───────────────────────────────────────────────────────────

/** Session cache TTL in seconds */
const SESSION_CACHE_TTL = 120; // 2 minutes
/** KV key prefix for session cache */
const SESSION_KV_PREFIX = "session:";
/** How often to update lastSeenAt in D1 (in seconds) */
const ACTIVITY_UPDATE_INTERVAL = 60;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionData {
    id: string;
    userId: string;
    activeClientId: string | null;
    audience: string;
    authMethod: string;
    mfaLevel: string;
    mfaLevelExpiresAt: string | null;
    createdAt: string;
    lastSeenAt: string;
    expiresAt: string;
    revokedAt: string | null;
    ipHash: string | null;
    deviceHash: string | null;
    userAgentHash: string | null;
}

export interface MembershipData {
    id: string;
    userId: string;
    clientId: string;
    status: string;
    rolesJson: string;
}

export type SessionValidationResult = {
    valid: true;
    session: SessionData;
    membership: MembershipData | null;
    roles: string[];
} | {
    valid: false;
    errorCode: string;
    message: string;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Load and validate a session by ID.
 * Uses KV cache with D1 fallback.
 *
 * @param sessionId - The session ID to validate
 * @param db - D1 database binding
 * @param kv - KV namespace for caching
 * @returns Session validation result with membership and roles
 */
export async function validateSession(
    sessionId: string,
    db: D1Database,
    kv: KVNamespace,
): Promise<SessionValidationResult> {
    // 1. Try KV cache
    let session = await loadSessionFromCache(sessionId, kv);

    // 2. Fall back to D1
    if (!session) {
        session = await loadSessionFromDb(sessionId, db);

        if (session) {
            // Populate cache (fire-and-forget)
            cacheSession(session, kv).catch(() => { });
        }
    }

    // 3. Session not found
    if (!session) {
        return {
            valid: false,
            errorCode: "AUTH_SESSION_EXPIRED",
            message: "Session not found",
        };
    }

    // 4. Check revocation
    if (session.revokedAt !== null) {
        // Clear cache for revoked session
        invalidateSessionCache(sessionId, kv).catch(() => { });
        return {
            valid: false,
            errorCode: "AUTH_SESSION_REVOKED",
            message: "Session has been revoked",
        };
    }

    // 5. Check expiration
    if (new Date(session.expiresAt).getTime() < Date.now()) {
        invalidateSessionCache(sessionId, kv).catch(() => { });
        return {
            valid: false,
            errorCode: "AUTH_SESSION_EXPIRED",
            message: "Session has expired",
        };
    }

    // 6. Load membership (if client is selected)
    let membership: MembershipData | null = null;
    let roles: string[] = [];

    if (session.activeClientId) {
        membership = await loadMembership(session.userId, session.activeClientId, db);

        if (membership) {
            if (membership.status !== "ACTIVE") {
                return {
                    valid: false,
                    errorCode: "AUTH_FORBIDDEN",
                    message: "Membership is not active",
                };
            }

            try {
                roles = JSON.parse(membership.rolesJson) as string[];
            } catch {
                roles = [];
            }
        }
    }

    // 7. Update session activity (non-blocking)
    touchSession(session, db, kv).catch(() => { });

    return {
        valid: true,
        session,
        membership,
        roles,
    };
}

/**
 * Revoke a session and clear its cache.
 */
export async function revokeSession(
    sessionId: string,
    db: D1Database,
    kv: KVNamespace,
): Promise<void> {
    const now = new Date().toISOString();

    await Promise.all([
        db.prepare("UPDATE sessions SET revokedAt = ? WHERE id = ?")
            .bind(now, sessionId)
            .run(),
        invalidateSessionCache(sessionId, kv),
        // Also mark in revocation list for JWT-based checks
        markRevoked(sessionId, kv),
    ]);
}

/**
 * Revoke all sessions for a user in a specific audience.
 */
export async function revokeAllSessions(
    userId: string,
    audience: string,
    db: D1Database,
    kv: KVNamespace,
): Promise<void> {
    const now = new Date().toISOString();

    // Get all active sessions to invalidate their caches
    const sessions = await db
        .prepare(
            "SELECT id FROM sessions WHERE userId = ? AND audience = ? AND revokedAt IS NULL",
        )
        .bind(userId, audience)
        .all<{ id: string }>();

    // Revoke in D1
    await db
        .prepare(
            "UPDATE sessions SET revokedAt = ? WHERE userId = ? AND audience = ? AND revokedAt IS NULL",
        )
        .bind(now, userId, audience)
        .run();

    // Invalidate caches
    await Promise.all(
        (sessions.results ?? []).map((s) =>
            Promise.all([
                invalidateSessionCache(s.id, kv),
                markRevoked(s.id, kv),
            ]),
        ),
    );
}

// ─── Revocation Checking ─────────────────────────────────────────────────────

/**
 * Check if a session or token has been revoked.
 * Used for JWT verification to catch revocations between token refresh periods.
 */
export async function isRevoked(
    identifier: string,
    type: "session" | "token",
    kv: KVNamespace,
): Promise<boolean> {
    const key = `revoked:${type}:${identifier}`;
    const value = await kv.get(key);
    return value !== null;
}

/**
 * Mark a session or token as revoked in KV.
 * TTL matches the maximum token lifetime (24h).
 */
export async function markRevoked(
    identifier: string,
    kv: KVNamespace,
    type: "session" | "token" = "session",
): Promise<void> {
    const key = `revoked:${type}:${identifier}`;
    await kv.put(key, new Date().toISOString(), {
        expirationTtl: 86400, // 24 hours — matches max token lifetime
    });
}

/**
 * Mark a JWT token ID (jti) as revoked.
 */
export async function revokeToken(
    jti: string,
    kv: KVNamespace,
): Promise<void> {
    await markRevoked(jti, kv, "token");
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

async function loadSessionFromCache(
    sessionId: string,
    kv: KVNamespace,
): Promise<SessionData | null> {
    try {
        const raw = await kv.get(`${SESSION_KV_PREFIX}${sessionId}`);
        if (!raw) return null;

        const data = JSON.parse(raw) as SessionData;

        // Sanity check — cached data should have an id
        if (!data.id || data.id !== sessionId) return null;

        return data;
    } catch {
        return null;
    }
}

async function loadSessionFromDb(
    sessionId: string,
    db: D1Database,
): Promise<SessionData | null> {
    return db
        .prepare(
            `SELECT id, userId, activeClientId, audience, authMethod,
                    mfaLevel, mfaLevelExpiresAt, createdAt, lastSeenAt,
                    expiresAt, revokedAt, ipHash, deviceHash, userAgentHash
             FROM sessions WHERE id = ?`,
        )
        .bind(sessionId)
        .first<SessionData>();
}

async function loadMembership(
    userId: string,
    clientId: string,
    db: D1Database,
): Promise<MembershipData | null> {
    return db
        .prepare(
            `SELECT id, userId, clientId, status, rolesJson
             FROM memberships WHERE userId = ? AND clientId = ?`,
        )
        .bind(userId, clientId)
        .first<MembershipData>();
}

async function cacheSession(
    session: SessionData,
    kv: KVNamespace,
): Promise<void> {
    await kv.put(
        `${SESSION_KV_PREFIX}${session.id}`,
        JSON.stringify(session),
        { expirationTtl: SESSION_CACHE_TTL },
    );
}

async function invalidateSessionCache(
    sessionId: string,
    kv: KVNamespace,
): Promise<void> {
    await kv.delete(`${SESSION_KV_PREFIX}${sessionId}`);
}

async function touchSession(
    session: SessionData,
    db: D1Database,
    kv: KVNamespace,
): Promise<void> {
    const now = new Date();
    const lastSeen = new Date(session.lastSeenAt);

    // Only update if enough time has passed
    if (now.getTime() - lastSeen.getTime() < ACTIVITY_UPDATE_INTERVAL * 1000) {
        return;
    }

    const nowIso = now.toISOString();

    // Update D1
    await db
        .prepare("UPDATE sessions SET lastSeenAt = ? WHERE id = ?")
        .bind(nowIso, session.id)
        .run();

    // Update cache
    const updated = { ...session, lastSeenAt: nowIso };
    await cacheSession(updated, kv);
}
