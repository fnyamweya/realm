/**
 * Auth subsystem barrel export.
 *
 * Re-exports all authentication components for clean imports:
 *
 * ```ts
 * import { authenticate, authErrorResponse, getRouteAuthConfig } from "./auth/index.js";
 * ```
 */

// Types
export type {
    Env,
    JwtPayload,
    JwtHeader,
    JwksKey,
    JwksDocument,
    AuthMethod,
    AuthSuccess,
    AuthFailure,
    AuthResult,
    ParsedApiKey,
    AuthenticatedContext,
    RouteAuthConfig,
    KVNamespace,
    D1Database,
} from "./types.js";

// Middleware pipeline
export {
    authenticate,
    type MiddlewareResult,
    type MiddlewareSuccess,
    type MiddlewareFailure,
} from "./middleware.js";

// JWT
export { verifyJwt, decodeJwtUnsafe, type JwtVerifyOptions } from "./jwt.js";

// JWKS
export { getVerificationKeyAsync, clearJwksCache } from "./jwks.js";

// API Key
export { extractApiKey, parseApiKey, authenticateApiKey } from "./api-key.js";

// Session
export {
    validateSession,
    revokeSession,
    revokeAllSessions,
    isRevoked,
    markRevoked,
    revokeToken,
} from "./session.js";

// Rate limiting
export {
    checkRateLimit,
    checkIpRateLimit,
    checkApiKeyRateLimit,
    checkUserRateLimit,
    checkAuthRateLimit,
    rateLimitHeaders,
    type RateLimitConfig,
    type RateLimitResult,
} from "./rate-limiter.js";

// Error responses
export {
    authErrorResponse,
    rateLimitedResponse,
    mfaRequiredResponse,
    clientSelectionRequiredResponse,
    policyDeniedResponse,
    authSystemErrorResponse,
    type AuthObligation,
    type AuthErrorEnvelope,
} from "./errors.js";

// CORS
export { handlePreflight, addCorsHeaders } from "./cors.js";

// Security headers
export {
    applySecurityHeaders,
    applyHtmlSecurityHeaders,
    applyPublicSecurityHeaders,
} from "./security-headers.js";

// Audit
export {
    emitAuditEvent,
    emitAuthenticatedAuditEvent,
    type AuditLogInput,
    type AuditEventType,
    type AuditSeverity,
} from "./audit.js";

// Route requirements
export { getRouteAuthConfig, isPublicRoute } from "./route-requirements.js";

// Crypto utilities
export {
    sha256Hex,
    sha256Base64url,
    hmacSha256Hex,
    constantTimeEqual,
    base64urlDecode,
    base64urlEncode,
    bufferToHex,
    bufferToBase64url,
    generateId,
    generateCorrelationId,
    hashIp,
    hashUserAgent,
} from "./crypto-utils.js";
