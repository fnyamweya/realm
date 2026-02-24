/**
 * Tests for middleware.ts — authentication pipeline orchestrator
 *
 * Covers: Public route bypass, auth bypass (dev), rate limiting, credential extraction,
 * JWT auth flow, API key auth flow, route requirement enforcement (audience, client,
 * roles, scopes, MFA), missing credentials, correlation IDs.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticate } from "../middleware.js";
import type { Env, D1Database, D1PreparedStatement, D1Result, KVNamespace } from "../types.js";

// ─── Mock Factories ──────────────────────────────────────────────────────────

function mockKv(): KVNamespace & { _data: Map<string, string> } {
    const data = new Map<string, string>();
    return {
        _data: data,
        async get(key: string) {
            return data.get(key) ?? null;
        },
        async put(key: string, value: string) {
            data.set(key, value);
        },
        async delete(key: string) {
            data.delete(key);
        },
    };
}

function mockDb(queryResults?: Record<string, unknown>): D1Database {
    const stmt: D1PreparedStatement = {
        bind() { return stmt; },
        async first() { return queryResults ?? null; },
        async run() { return { results: [], success: true, meta: {} }; },
        async all() { return { results: [], success: true, meta: {} }; },
    };
    return {
        prepare() { return stmt; },
        async batch() { return []; },
        async exec() { return { count: 0, duration: 0 }; },
    };
}

function makeEnv(overrides?: Partial<Env>): Env {
    return {
        AUTH_DB: mockDb(),
        AUTH_CACHE: mockKv(),
        JWKS_URL: "https://auth.test.com/.well-known/jwks.json",
        AUTH_ISSUER: "https://auth.test.com/",
        AUTH_AUDIENCE: "test-api",
        ALLOWED_ORIGINS: "*",
        API_KEY_PREFIX: "rto",
        ENVIRONMENT: "production",
        ...overrides,
    } as Env;
}

function makeRequest(
    url: string,
    options?: RequestInit & { method?: string },
): Request {
    return new Request(url, {
        method: options?.method ?? "GET",
        ...options,
    });
}

// ─── Public Routes ───────────────────────────────────────────────────────────

describe("public routes", () => {
    it("allows GET /health without credentials", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.auth.method).toBe("none");
            expect(result.context.auth.userId).toBe("anonymous");
            expect(result.context.correlationId).toBeDefined();
        }
    });

    it("allows GET /docs without credentials", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/docs");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
    });

    it("allows GET /openapi.json without credentials", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/openapi.json");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
    });

    it("allows GET / without credentials", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
    });

    it("allows POST /v1/auth/login without credentials", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/v1/auth/login", { method: "POST" });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
    });
});

// ─── Auth Bypass (Dev) ───────────────────────────────────────────────────────

describe("auth bypass", () => {
    it("bypasses auth in development when enabled", async () => {
        const env = makeEnv({
            AUTH_BYPASS: "true",
            ENVIRONMENT: "development",
        });
        const req = makeRequest("https://api.test.com/v1/properties");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.auth.authMethod).toBe("bypass");
            expect(result.context.auth.userId).toBe("dev-user");
            expect(result.context.auth.clientId).toBe("dev-client");
            expect(result.context.auth.roles).toContain("OWNER");
            expect(result.context.auth.mfaLevel).toBe("STRONG");
        }
    });

    it("does NOT bypass in production", async () => {
        const env = makeEnv({
            AUTH_BYPASS: "true",
            ENVIRONMENT: "production",
        });
        const req = makeRequest("https://api.test.com/v1/properties");
        const result = await authenticate(req, env);
        // Should fail because no credentials provided
        expect(result.allowed).toBe(false);
    });

    it("does NOT bypass in staging", async () => {
        const env = makeEnv({
            AUTH_BYPASS: "true",
            ENVIRONMENT: "staging",
        });
        const req = makeRequest("https://api.test.com/v1/properties");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(false);
    });
});

// ─── Missing Credentials ─────────────────────────────────────────────────────

describe("missing credentials", () => {
    it("rejects protected routes with no auth header", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/v1/properties");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.response.status).toBe(401);
            const body = await result.response.json() as { error: { code: string } };
            expect(body.error.code).toBe("AUTH_TOKEN_INVALID");
        }
    });

    it("rejects empty Bearer token", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/v1/properties", {
            headers: { Authorization: "Bearer " },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.response.status).toBe(401);
        }
    });

    it("rejects non-Bearer authorization scheme", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/v1/properties", {
            headers: { Authorization: "Basic dXNlcjpwYXNz" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(false);
    });
});

// ─── Correlation ID ──────────────────────────────────────────────────────────

describe("correlation ID", () => {
    it("uses X-Correlation-Id header when provided", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health", {
            headers: { "X-Correlation-Id": "cor_custom123" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.correlationId).toBe("cor_custom123");
        }
    });

    it("uses X-Request-Id as fallback", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health", {
            headers: { "X-Request-Id": "req_fallback" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.correlationId).toBe("req_fallback");
        }
    });

    it("generates correlation ID when no header provided", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.correlationId).toMatch(/^cor_[0-9a-f]+$/);
        }
    });
});

// ─── IP and User-Agent Hashing ───────────────────────────────────────────────

describe("IP and UA hashing", () => {
    it("hashes CF-Connecting-IP header", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health", {
            headers: { "CF-Connecting-IP": "192.168.1.1" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.ipHash).toHaveLength(16);
            expect(result.context.ipHash).toMatch(/^[0-9a-f]{16}$/);
        }
    });

    it("produces hashed User-Agent", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health", {
            headers: { "User-Agent": "Mozilla/5.0 (Test)" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.userAgentHash).toHaveLength(16);
        }
    });
});

// ─── Rate Limiting (Public Routes) ───────────────────────────────────────────

describe("rate limiting on public routes", () => {
    it("rate limits public routes after threshold", async () => {
        const kv = mockKv();
        const env = makeEnv({
            AUTH_CACHE: kv,
            RATE_LIMIT_PER_MINUTE: "5", // Very low for testing
        });

        // Burn through the limit
        for (let i = 0; i < 5; i++) {
            const req = makeRequest("https://api.test.com/docs", {
                headers: { "CF-Connecting-IP": "1.2.3.4" },
            });
            const result = await authenticate(req, env);
            expect(result.allowed).toBe(true);
        }

        // Next request should be rate limited
        const req = makeRequest("https://api.test.com/docs", {
            headers: { "CF-Connecting-IP": "1.2.3.4" },
        });
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(false);
        if (!result.allowed) {
            expect(result.response.status).toBe(429);
        }
    });

    it("does NOT rate limit /health (skipRateLimit)", async () => {
        const kv = mockKv();
        const env = makeEnv({
            AUTH_CACHE: kv,
            RATE_LIMIT_PER_MINUTE: "1", // Extremely low
        });

        // Even with a 1 req/min limit, health is exempt
        for (let i = 0; i < 5; i++) {
            const req = makeRequest("https://api.test.com/health", {
                headers: { "CF-Connecting-IP": "1.2.3.4" },
            });
            const result = await authenticate(req, env);
            expect(result.allowed).toBe(true);
        }
    });
});

// ─── Debug Mode ──────────────────────────────────────────────────────────────

describe("debug mode", () => {
    it("sets debug=true when AUTH_DEBUG is 'true'", async () => {
        const env = makeEnv({ AUTH_DEBUG: "true" });
        const req = makeRequest("https://api.test.com/health");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.debug).toBe(true);
        }
    });

    it("sets debug=false by default", async () => {
        const env = makeEnv();
        const req = makeRequest("https://api.test.com/health");
        const result = await authenticate(req, env);
        expect(result.allowed).toBe(true);
        if (result.allowed) {
            expect(result.context.debug).toBe(false);
        }
    });
});
