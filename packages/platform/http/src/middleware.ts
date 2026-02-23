// ─── CORS Configuration ──────────────────────────────────────────────────────

export interface CorsConfig {
  allowOrigins: string[];
  allowMethods: string[];
  allowHeaders: string[];
  exposeHeaders?: string[];
  maxAge?: number;
  allowCredentials?: boolean;
}

// ─── Rate Limit Configuration ────────────────────────────────────────────────

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Standard header name for idempotency keys. */
export const IDEMPOTENCY_KEY_HEADER = "x-idempotency-key";
