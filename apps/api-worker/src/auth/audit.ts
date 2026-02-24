/**
 * Audit logging for authentication events.
 *
 * Records all security-relevant events to D1 for compliance and debugging.
 * Supports structured metadata and correlation IDs for distributed tracing.
 *
 * Events are written asynchronously (fire-and-forget) to avoid blocking
 * the request pipeline. Critical events are also logged to console for
 * Cloudflare's real-time log streaming.
 */

import type { D1Database, AuthSuccess } from "./types.js";
import { generateId } from "./crypto-utils.js";

// ─── Audit Event Types ───────────────────────────────────────────────────────

export type AuditEventType =
    | "AUTH_LOGIN_SUCCESS"
    | "AUTH_LOGIN_FAIL"
    | "AUTH_LOGOUT"
    | "AUTH_SESSION_CREATED"
    | "AUTH_SESSION_REVOKED"
    | "AUTH_CLIENT_SELECTED"
    | "MFA_ENROLL_SUCCESS"
    | "MFA_ENROLL_FAIL"
    | "MFA_CHALLENGE_CREATED"
    | "MFA_STEP_UP_SUCCESS"
    | "MFA_STEP_UP_FAIL"
    | "MFA_FACTOR_DISABLED"
    | "APIKEY_CREATED"
    | "APIKEY_REVOKED"
    | "APIKEY_USED"
    | "PASSWORD_CHANGED"
    | "PASSWORD_RESET_REQUESTED"
    | "PASSWORD_RESET_COMPLETED"
    | "ACCOUNT_LOCKED"
    | "ACCOUNT_UNLOCKED"
    | "POLICY_DENIED"
    | "AUDIENCE_MISMATCH"
    | "AUTH_TOKEN_INVALID"
    | "AUTH_RATE_LIMITED"
    | "AUTH_SESSION_EXPIRED";

export type AuditSeverity = "INFO" | "WARNING" | "CRITICAL";

// ─── Severity Mapping ────────────────────────────────────────────────────────

const EVENT_SEVERITY: Record<string, AuditSeverity> = {
    AUTH_LOGIN_SUCCESS: "INFO",
    AUTH_LOGIN_FAIL: "WARNING",
    AUTH_LOGOUT: "INFO",
    AUTH_SESSION_CREATED: "INFO",
    AUTH_SESSION_REVOKED: "INFO",
    AUTH_CLIENT_SELECTED: "INFO",
    MFA_ENROLL_SUCCESS: "INFO",
    MFA_ENROLL_FAIL: "WARNING",
    MFA_CHALLENGE_CREATED: "INFO",
    MFA_STEP_UP_SUCCESS: "INFO",
    MFA_STEP_UP_FAIL: "WARNING",
    MFA_FACTOR_DISABLED: "WARNING",
    APIKEY_CREATED: "INFO",
    APIKEY_REVOKED: "WARNING",
    APIKEY_USED: "INFO",
    PASSWORD_CHANGED: "INFO",
    PASSWORD_RESET_REQUESTED: "INFO",
    PASSWORD_RESET_COMPLETED: "INFO",
    ACCOUNT_LOCKED: "CRITICAL",
    ACCOUNT_UNLOCKED: "INFO",
    POLICY_DENIED: "WARNING",
    AUDIENCE_MISMATCH: "WARNING",
    AUTH_TOKEN_INVALID: "WARNING",
    AUTH_RATE_LIMITED: "WARNING",
    AUTH_SESSION_EXPIRED: "INFO",
};

// ─── Public API ──────────────────────────────────────────────────────────────

export interface AuditLogInput {
    eventType: AuditEventType;
    actorId: string;
    actorType?: string;
    clientId?: string | null;
    membershipId?: string | null;
    correlationId: string;
    ipHash: string;
    deviceHash?: string | null;
    metadata?: Record<string, unknown> | undefined;
}

/**
 * Write an audit event. Fire-and-forget: never throws, never blocks.
 */
export function emitAuditEvent(
    input: AuditLogInput,
    db: D1Database,
): void {
    const severity = EVENT_SEVERITY[input.eventType] ?? "INFO";
    const id = generateId("evt");
    const occurredAt = new Date().toISOString();

    // Console log for real-time log streaming (Cloudflare Workers)
    if (severity === "CRITICAL" || severity === "WARNING") {
        console.log(
            JSON.stringify({
                level: severity,
                type: input.eventType,
                actor: input.actorId,
                client: input.clientId,
                correlationId: input.correlationId,
                ts: occurredAt,
            }),
        );
    }

    // Write to D1 (fire-and-forget)
    db.prepare(
        `INSERT INTO audit_events
         (id, clientId, actorType, actorId, membershipId, eventType,
          occurredAt, correlationId, ipHash, deviceHash, metadataJson, severity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
        .bind(
            id,
            input.clientId ?? null,
            input.actorType ?? "USER",
            input.actorId,
            input.membershipId ?? null,
            input.eventType,
            occurredAt,
            input.correlationId,
            input.ipHash,
            input.deviceHash ?? null,
            input.metadata ? JSON.stringify(input.metadata) : null,
            severity,
        )
        .run()
        .catch((err) => {
            // Never let audit failure break the request
            console.error("Audit write failed:", err);
        });
}

/**
 * Emit an audit event from an authenticated context.
 * Convenience wrapper that extracts standard fields from AuthSuccess.
 */
export function emitAuthenticatedAuditEvent(
    eventType: AuditEventType,
    auth: AuthSuccess,
    correlationId: string,
    ipHash: string,
    db: D1Database,
    metadata?: Record<string, unknown>,
): void {
    emitAuditEvent(
        {
            eventType,
            actorId: auth.userId,
            actorType: auth.method === "api_key" ? "SERVICE_ACCOUNT" : "USER",
            clientId: auth.clientId,
            membershipId: auth.membershipId,
            correlationId,
            ipHash,
            ...(metadata ? { metadata } : {}),
        },
        db,
    );
}
