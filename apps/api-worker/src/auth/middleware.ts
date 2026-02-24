/**
 * Authentication middleware pipeline.
 *
 * This is the central orchestrator that ties together all auth subsystems.
 * It processes every request through the following pipeline:
 *
 * 1. Extract correlation ID (from header or generate)
 * 2. Hash IP and User-Agent for privacy-preserving tracking
 * 3. Route-level auth configuration lookup
 * 4. Short-circuit for public routes
 * 5. Rate limiting (IP-based + key-based)
 * 6. Extract credentials (Bearer token or API key)
 * 7. Authenticate (JWT verification or API key lookup)
 * 8. Session validation (load from D1/KV, check revocation)
 * 9. Token revocation check (JTI-based)
 * 10. Build authenticated context
 * 11. Enforce route requirements:
 *     a. Audience restrictions
 *     b. Client selection
 *     c. Role-based access control
 *     d. Scope-based access control
 *     e. MFA level enforcement
 *     f. Policy engine evaluation (future)
 * 12. Emit audit events
 * 13. Return context or error response
 */

import type { Env, AuthResult, AuthSuccess, AuthenticatedContext, RouteAuthConfig } from "./types.js";
import { verifyJwt } from "./jwt.js";
import { extractApiKey, authenticateApiKey } from "./api-key.js";
import { validateSession, isRevoked } from "./session.js";
import { checkIpRateLimit, checkApiKeyRateLimit, rateLimitHeaders } from "./rate-limiter.js";
import { getRouteAuthConfig } from "./route-requirements.js";
import {
    authErrorResponse,
    rateLimitedResponse,
    mfaRequiredResponse,
    clientSelectionRequiredResponse,
    policyDeniedResponse,
    authSystemErrorResponse,
} from "./errors.js";
import { emitAuditEvent } from "./audit.js";
import { generateCorrelationId, hashIp, hashUserAgent } from "./crypto-utils.js";

// ─── MFA Level Ordering ──────────────────────────────────────────────────────

const MFA_LEVEL_ORDER: Record<string, number> = {
    NONE: 0,
    STEP_UP: 1,
    STRONG: 2,
};

// ─── Public API ──────────────────────────────────────────────────────────────

export interface MiddlewareSuccess {
    allowed: true;
    context: AuthenticatedContext;
}

export interface MiddlewareFailure {
    allowed: false;
    response: Response;
}

export type MiddlewareResult = MiddlewareSuccess | MiddlewareFailure;

/**
 * Run the complete authentication middleware pipeline.
 *
 * @param request - The incoming request
 * @param env - Worker environment bindings
 * @returns Either an authenticated context or an error response
 */
export async function authenticate(
    request: Request,
    env: Env,
): Promise<MiddlewareResult> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;
    const debug = env.AUTH_DEBUG === "true";

    // ─── 1. Correlation ID ───────────────────────────────────────────────
    const correlationId =
        request.headers.get("X-Correlation-Id") ||
        request.headers.get("X-Request-Id") ||
        generateCorrelationId();

    // ─── 2. Hash IP & User-Agent ─────────────────────────────────────────
    const clientIp =
        request.headers.get("CF-Connecting-IP") ||
        request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
        "unknown";
    const ipHash = await hashIp(clientIp);
    const userAgentRaw = request.headers.get("User-Agent") || "unknown";
    const uaHash = await hashUserAgent(userAgentRaw);

    // ─── 3. Route auth config ────────────────────────────────────────────
    const routeConfig = getRouteAuthConfig(method, pathname);

    // ─── 4. Public routes ────────────────────────────────────────────────
    if (!routeConfig.requireAuth) {
        // Still apply rate limiting to public routes (unless exempted)
        if (!routeConfig.skipRateLimit) {
            const rl = await checkIpRateLimit(ipHash, env.AUTH_CACHE,
                parseOptionalInt(env.RATE_LIMIT_PER_MINUTE));

            if (!rl.allowed) {
                return {
                    allowed: false,
                    response: rateLimitedResponse(rl.retryAfter ?? 60, correlationId),
                };
            }
        }

        // Return a "no auth" context for public routes
        return {
            allowed: true,
            context: {
                auth: {
                    authenticated: true,
                    method: "none",
                    sessionId: "anonymous",
                    userId: "anonymous",
                    clientId: null,
                    membershipId: null,
                    roles: [],
                    scopes: [],
                    audience: "public",
                    authMethod: "none",
                    mfaLevel: "NONE",
                    mfaLevelExpiresAt: null,
                },
                correlationId,
                ipHash,
                userAgentHash: uaHash,
                debug,
                env,
            },
        };
    }

    // ─── 5. Auth bypass (dev only) ───────────────────────────────────────
    if (env.AUTH_BYPASS === "true" && env.ENVIRONMENT === "development") {
        return {
            allowed: true,
            context: {
                auth: {
                    authenticated: true,
                    method: "none",
                    sessionId: "dev-bypass",
                    userId: "dev-user",
                    clientId: "dev-client",
                    membershipId: "dev-membership",
                    roles: ["OWNER"],
                    scopes: ["*"],
                    audience: "console",
                    authMethod: "bypass",
                    mfaLevel: "STRONG",
                    mfaLevelExpiresAt: null,
                },
                correlationId,
                ipHash,
                userAgentHash: uaHash,
                debug: true,
                env,
            },
        };
    }

    // ─── 6. Rate limiting ────────────────────────────────────────────────
    if (!routeConfig.skipRateLimit) {
        const rl = await checkIpRateLimit(ipHash, env.AUTH_CACHE,
            parseOptionalInt(env.RATE_LIMIT_PER_MINUTE));

        if (!rl.allowed) {
            emitAuditEvent({
                eventType: "AUTH_RATE_LIMITED",
                actorId: "unknown",
                correlationId,
                ipHash,
                metadata: { path: pathname },
            }, env.AUTH_DB);

            return {
                allowed: false,
                response: rateLimitedResponse(rl.retryAfter ?? 60, correlationId),
            };
        }
    }

    // ─── 7. Extract credentials ──────────────────────────────────────────
    let authResult: AuthResult;

    const authHeader = request.headers.get("Authorization");
    const apiKey = extractApiKey(request, env.API_KEY_PREFIX);

    if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        // JWT authentication
        const token = authHeader.substring(7).trim();

        if (!token) {
            return {
                allowed: false,
                response: authErrorResponse("AUTH_TOKEN_INVALID", {
                    message: "Bearer token is empty",
                    correlationId,
                    debug,
                }),
            };
        }

        authResult = await authenticateJwt(token, env, clientIp, correlationId, ipHash);
    } else if (apiKey) {
        // API key authentication
        // Rate limit per API key
        const keyRl = await checkApiKeyRateLimit(
            apiKey.prefix,
            env.AUTH_CACHE,
            parseOptionalInt(env.RATE_LIMIT_API_KEY_PER_MINUTE),
        );

        if (!keyRl.allowed) {
            emitAuditEvent({
                eventType: "AUTH_RATE_LIMITED",
                actorId: `apikey:${apiKey.prefix}`,
                correlationId,
                ipHash,
                metadata: { keyPrefix: apiKey.prefix, path: pathname },
            }, env.AUTH_DB);

            return {
                allowed: false,
                response: rateLimitedResponse(keyRl.retryAfter ?? 60, correlationId),
            };
        }

        authResult = await authenticateApiKey(apiKey, clientIp, env.AUTH_DB);
    } else {
        // No credentials provided
        return {
            allowed: false,
            response: authErrorResponse("AUTH_TOKEN_INVALID", {
                message: "Missing authentication. Provide a Bearer token or X-Api-Key header.",
                correlationId,
                debug,
            }),
        };
    }

    // ─── 8. Handle auth failure ──────────────────────────────────────────
    if (!authResult.authenticated) {
        emitAuditEvent({
            eventType: authResult.errorCode === "AUTH_TOKEN_EXPIRED"
                ? "AUTH_SESSION_EXPIRED"
                : "AUTH_TOKEN_INVALID",
            actorId: "unknown",
            correlationId,
            ipHash,
            metadata: {
                errorCode: authResult.errorCode,
                path: pathname,
            },
        }, env.AUTH_DB);

        return {
            allowed: false,
            response: authErrorResponse(authResult.errorCode, {
                message: authResult.message,
                correlationId,
                ...(debug && authResult.details ? { details: authResult.details } : {}),
                debug,
            }),
        };
    }

    // ─── 9. Enforce route requirements ───────────────────────────────────
    const enforceResult = enforceRouteRequirements(
        authResult,
        routeConfig,
        correlationId,
        ipHash,
        env,
    );

    if (enforceResult !== null) {
        return { allowed: false, response: enforceResult };
    }

    // ─── 10. Build context ───────────────────────────────────────────────
    return {
        allowed: true,
        context: {
            auth: authResult,
            correlationId,
            ipHash,
            userAgentHash: uaHash,
            debug,
            env,
        },
    };
}

// ─── JWT Authentication Flow ─────────────────────────────────────────────────

async function authenticateJwt(
    token: string,
    env: Env,
    clientIp: string,
    correlationId: string,
    ipHash: string,
): Promise<AuthResult> {
    // 1. Verify JWT signature and claims
    const jwtResult = await verifyJwt(token, {
        issuer: env.AUTH_ISSUER,
        audience: env.AUTH_AUDIENCE,
        jwksUrl: env.JWKS_URL,
        kv: env.AUTH_CACHE,
    });

    if (!jwtResult.valid) {
        return {
            authenticated: false,
            errorCode: jwtResult.errorCode,
            message: jwtResult.error,
            statusCode: jwtResult.errorCode === "AUTH_TOKEN_EXPIRED" ? 401 : 401,
        };
    }

    const { payload } = jwtResult;

    // 2. Check token revocation (by JTI)
    if (payload.jti) {
        const tokenRevoked = await isRevoked(payload.jti, "token", env.AUTH_CACHE);
        if (tokenRevoked) {
            return {
                authenticated: false,
                errorCode: "AUTH_SESSION_REVOKED",
                message: "Token has been revoked",
                statusCode: 401,
            };
        }
    }

    // 3. Check session revocation
    const sessionRevoked = await isRevoked(payload.session_id, "session", env.AUTH_CACHE);
    if (sessionRevoked) {
        return {
            authenticated: false,
            errorCode: "AUTH_SESSION_REVOKED",
            message: "Session has been revoked",
            statusCode: 401,
        };
    }

    // 4. Validate session in D1 (loads membership and roles)
    const sessionResult = await validateSession(
        payload.session_id,
        env.AUTH_DB,
        env.AUTH_CACHE,
    );

    if (!sessionResult.valid) {
        return {
            authenticated: false,
            errorCode: sessionResult.errorCode,
            message: sessionResult.message,
            statusCode: 401,
        };
    }

    const { session, membership, roles } = sessionResult;

    // 5. Build auth success from token + session
    return {
        authenticated: true,
        method: "jwt",
        tokenPayload: payload,
        ...(payload.jti ? { tokenId: payload.jti } : {}),
        sessionId: payload.session_id,
        userId: payload.sub,
        // Prefer session's clientId over token's (session may have been updated via select-client)
        clientId: session.activeClientId ?? payload.client_id ?? null,
        membershipId: membership?.id ?? payload.membership_id ?? null,
        // Prefer session-loaded roles (most up-to-date)
        roles: roles.length > 0 ? roles : (payload.roles ?? []),
        scopes: payload.scopes ?? [],
        audience: session.audience ?? payload.audience ?? "console",
        authMethod: session.authMethod ?? payload.auth_method ?? "oidc",
        // Session MFA level may have been upgraded since token was issued
        mfaLevel: session.mfaLevel ?? payload.mfa_level ?? "NONE",
        mfaLevelExpiresAt: session.mfaLevelExpiresAt ?? payload.mfa_level_expires_at ?? null,
    };
}

// ─── Route Requirement Enforcement ───────────────────────────────────────────

function enforceRouteRequirements(
    auth: AuthSuccess,
    config: RouteAuthConfig,
    correlationId: string,
    ipHash: string,
    env: Env,
): Response | null {
    // ─── Audience check ──────────────────────────────────────────────────
    if (config.allowedAudiences && config.allowedAudiences.length > 0) {
        if (!config.allowedAudiences.includes(auth.audience)) {
            emitAuditEvent({
                eventType: "AUDIENCE_MISMATCH",
                actorId: auth.userId,
                clientId: auth.clientId,
                correlationId,
                ipHash,
                metadata: {
                    actual: auth.audience,
                    allowed: config.allowedAudiences,
                },
            }, env.AUTH_DB);

            return authErrorResponse("AUTH_AUDIENCE_MISMATCH", {
                correlationId,
                message: `This endpoint is not available for the '${auth.audience}' audience`,
            });
        }
    }

    // ─── Client selection check ──────────────────────────────────────────
    if (config.requireClientId && !auth.clientId) {
        return clientSelectionRequiredResponse(correlationId);
    }

    // ─── Role check (any match) ──────────────────────────────────────────
    if (config.requiredRoles && config.requiredRoles.length > 0) {
        const hasRequiredRole = config.requiredRoles.some((role) =>
            auth.roles.includes(role),
        );

        if (!hasRequiredRole) {
            emitAuditEvent({
                eventType: "POLICY_DENIED",
                actorId: auth.userId,
                clientId: auth.clientId,
                correlationId,
                ipHash,
                metadata: {
                    reason: "insufficient_role",
                    required: config.requiredRoles,
                    actual: auth.roles,
                },
            }, env.AUTH_DB);

            return authErrorResponse("AUTH_INSUFFICIENT_ROLE", {
                correlationId,
                message: "Your role does not have access to this resource",
            });
        }
    }

    // ─── Scope check (all must be present) ───────────────────────────────
    if (config.requiredScopes && config.requiredScopes.length > 0) {
        // Wildcard scope grants everything
        if (!auth.scopes.includes("*")) {
            const missingScopes = config.requiredScopes.filter(
                (scope) => !auth.scopes.includes(scope),
            );

            if (missingScopes.length > 0) {
                emitAuditEvent({
                    eventType: "POLICY_DENIED",
                    actorId: auth.userId,
                    clientId: auth.clientId,
                    correlationId,
                    ipHash,
                    metadata: {
                        reason: "insufficient_scope",
                        missing: missingScopes,
                        actual: auth.scopes,
                    },
                }, env.AUTH_DB);

                return authErrorResponse("AUTH_INSUFFICIENT_SCOPE", {
                    correlationId,
                    message: `Missing required scopes: ${missingScopes.join(", ")}`,
                });
            }
        }
    }

    // ─── MFA level check ─────────────────────────────────────────────────
    if (config.requiredMfaLevel && config.requiredMfaLevel !== "NONE") {
        const required = MFA_LEVEL_ORDER[config.requiredMfaLevel] ?? 0;
        const actual = MFA_LEVEL_ORDER[auth.mfaLevel] ?? 0;

        if (actual < required) {
            return mfaRequiredResponse({
                level: config.requiredMfaLevel,
                correlationId,
            });
        }

        // Check MFA level expiration
        if (auth.mfaLevel !== "NONE" && auth.mfaLevelExpiresAt) {
            if (new Date(auth.mfaLevelExpiresAt).getTime() < Date.now()) {
                return mfaRequiredResponse({
                    level: config.requiredMfaLevel,
                    correlationId,
                });
            }
        }
    }

    // All checks passed
    return null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseOptionalInt(value?: string): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
}
