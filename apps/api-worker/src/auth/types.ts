/**
 * Core type definitions for the authentication subsystem.
 *
 * This module defines the Worker environment bindings, JWT token shapes,
 * authentication results, and the authenticated request context that flows
 * through the entire middleware pipeline.
 */

// ─── Cloudflare Worker Environment Bindings ──────────────────────────────────

/** D1 database binding for auth tables (sessions, users, api_keys, audit, etc.) */
export interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
    exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
    bind(...values: unknown[]): D1PreparedStatement;
    first<T = unknown>(colName?: string): Promise<T | null>;
    run<T = unknown>(): Promise<D1Result<T>>;
    all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
    results: T[];
    success: boolean;
    meta: Record<string, unknown>;
}

export interface D1ExecResult {
    count: number;
    duration: number;
}

/** KV namespace binding for caches (JWKS, sessions, revocation, rate limits) */
export interface KVNamespace {
    get(key: string, options?: { type?: string }): Promise<string | null>;
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
}

/**
 * Complete Worker environment with all auth-related bindings.
 */
export interface Env {
    // ─── Data stores ─────────────────────────────────────────────────────
    /** D1 database for identity-access tables */
    AUTH_DB: D1Database;
    /** KV namespace for auth caches (JWKS, sessions, revocation lists) */
    AUTH_CACHE: KVNamespace;

    // ─── OIDC / JWT configuration ────────────────────────────────────────
    /** JWKS endpoint URL (e.g. https://auth.realtyos.com/.well-known/jwks.json) */
    JWKS_URL: string;
    /** Expected JWT issuer claim */
    AUTH_ISSUER: string;
    /** Expected JWT audience claim */
    AUTH_AUDIENCE: string;

    // ─── CORS ────────────────────────────────────────────────────────────
    /** Comma-separated list of allowed origins. "*" for dev/staging. */
    ALLOWED_ORIGINS: string;

    // ─── API Key settings ────────────────────────────────────────────────
    /** Prefix for API keys (default: "rto") */
    API_KEY_PREFIX?: string;

    // ─── Rate limiting ───────────────────────────────────────────────────
    /** Max requests per IP per minute (default: 60) */
    RATE_LIMIT_PER_MINUTE?: string;
    /** Max requests per API key per minute (default: 120) */
    RATE_LIMIT_API_KEY_PER_MINUTE?: string;

    // ─── Feature flags ───────────────────────────────────────────────────
    /** "true" to enable detailed error messages (dev/staging only) */
    AUTH_DEBUG?: string;
    /** "true" to skip auth entirely (local dev) */
    AUTH_BYPASS?: string;
    /** Environment name: production | staging | development */
    ENVIRONMENT?: string;
}

// ─── JWT Token Payload ───────────────────────────────────────────────────────

/**
 * Standard + custom claims expected in JWTs issued by the RealtyOS auth service.
 */
export interface JwtPayload {
    // Standard claims
    /** Subject (user ID) */
    sub: string;
    /** Issuer */
    iss: string;
    /** Audience (string or array) */
    aud: string | string[];
    /** Expiration (Unix seconds) */
    exp: number;
    /** Issued at (Unix seconds) */
    iat: number;
    /** Not before (Unix seconds) */
    nbf?: number;
    /** JWT ID (unique token identifier for revocation) */
    jti?: string;

    // RealtyOS-specific claims
    /** Session ID */
    session_id: string;
    /** Active client (tenant) ID */
    client_id?: string;
    /** Membership ID */
    membership_id?: string;
    /** Roles within the active client */
    roles?: string[];
    /** OAuth2 scopes */
    scopes?: string[];
    /** Target audience (console, resident, command, service) */
    audience?: string;
    /** Auth method used (oidc, password_phone, api_key, magic_link) */
    auth_method?: string;
    /** MFA level achieved (NONE, STEP_UP, STRONG) */
    mfa_level?: string;
    /** When the current MFA level expires */
    mfa_level_expires_at?: string;
}

/**
 * The decoded JWT header.
 */
export interface JwtHeader {
    /** Algorithm (RS256, ES256, etc.) */
    alg: string;
    /** Key ID — used to select the correct JWKS key */
    kid?: string;
    /** Token type (always "JWT") */
    typ?: string;
}

// ─── JWKS Types ──────────────────────────────────────────────────────────────

export interface JwksKey {
    kty: string;
    kid?: string;
    alg?: string;
    use?: string;
    n?: string; // RSA modulus
    e?: string; // RSA exponent
    x?: string; // EC x coordinate
    y?: string; // EC y coordinate
    crv?: string; // EC curve name
}

export interface JwksDocument {
    keys: JwksKey[];
}

// ─── Authentication Results ──────────────────────────────────────────────────

export type AuthMethod = "jwt" | "api_key" | "none";

/**
 * Successful authentication result.
 */
export interface AuthSuccess {
    authenticated: true;
    method: AuthMethod;
    /** Decoded JWT payload (for JWT auth) */
    tokenPayload?: JwtPayload | undefined;
    /** Token ID for revocation tracking */
    tokenId?: string | undefined;
    /** Session ID */
    sessionId: string;
    /** User ID */
    userId: string;
    /** Active client ID (null if no client selected) */
    clientId: string | null;
    /** Membership ID */
    membershipId: string | null;
    /** User roles in the active client */
    roles: string[];
    /** OAuth2 scopes */
    scopes: string[];
    /** Audience */
    audience: string;
    /** Auth method used */
    authMethod: string;
    /** MFA level */
    mfaLevel: string;
    /** MFA level expiration */
    mfaLevelExpiresAt: string | null;
}

/**
 * Failed authentication result.
 */
export interface AuthFailure {
    authenticated: false;
    /** Error code from AuthErrorCode enum */
    errorCode: string;
    /** Human-readable error message */
    message: string;
    /** HTTP status code to return */
    statusCode: number;
    /** Additional details (only in debug mode) */
    details?: Record<string, unknown> | undefined;
}

export type AuthResult = AuthSuccess | AuthFailure;

// ─── API Key Format ──────────────────────────────────────────────────────────

/**
 * Parsed API key components.
 * Format: `rto_<prefix>.<secret>`
 */
export interface ParsedApiKey {
    /** Full raw key */
    raw: string;
    /** Key prefix (for lookup) */
    prefix: string;
    /** Key secret (for verification) */
    secret: string;
}

// ─── Auth Context for Downstream Handlers ────────────────────────────────────

/**
 * The complete authentication context that is passed to route handlers.
 * This is the bridge between the auth middleware and business logic.
 */
export interface AuthenticatedContext {
    /** Authentication result */
    auth: AuthSuccess;
    /** Correlation ID for distributed tracing */
    correlationId: string;
    /** Hashed client IP for rate limiting and audit */
    ipHash: string;
    /** Hashed User-Agent for device fingerprinting */
    userAgentHash: string;
    /** Whether the request is in debug mode */
    debug: boolean;
    /** Environment bindings */
    env: Env;
}

// ─── Middleware Types ────────────────────────────────────────────────────────

/**
 * Defines the authentication requirements for a route.
 */
export interface RouteAuthConfig {
    /** Whether authentication is required (false for public endpoints) */
    requireAuth: boolean;
    /** Allowed audiences (empty = all audiences) */
    allowedAudiences?: string[];
    /** Whether a client must be selected */
    requireClientId?: boolean;
    /** Required roles (any match = allowed) */
    requiredRoles?: string[];
    /** Required scopes (all must be present) */
    requiredScopes?: string[];
    /** Minimum MFA level required */
    requiredMfaLevel?: "NONE" | "STEP_UP" | "STRONG";
    /** Policy action for RBAC evaluation */
    policyAction?: string;
    /** Whether rate limiting is disabled for this route */
    skipRateLimit?: boolean;
}

/**
 * Result of the full middleware pipeline evaluation.
 */
export type MiddlewareResult = {
    /** Whether the request is allowed to proceed */
    allowed: true;
    /** The authenticated context */
    context: AuthenticatedContext;
} | {
    /** The request was rejected */
    allowed: false;
    /** The error response to return */
    response: Response;
}
