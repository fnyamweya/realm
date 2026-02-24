/**
 * Tests for cors.ts
 *
 * Covers: Preflight handling, origin matching (exact, wildcard subdomain, wildcard all),
 * credential support, CORS header application, edge cases.
 */

import { describe, it, expect } from "vitest";
import { handlePreflight, addCorsHeaders } from "../cors.js";
import type { Env } from "../types.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEnv(overrides?: Partial<Env>): Env {
    return {
        AUTH_DB: {} as Env["AUTH_DB"],
        AUTH_CACHE: {} as Env["AUTH_CACHE"],
        JWKS_URL: "https://auth.test.com/.well-known/jwks.json",
        AUTH_ISSUER: "https://auth.test.com/",
        AUTH_AUDIENCE: "test-api",
        ALLOWED_ORIGINS: "*",
        ...overrides,
    } as Env;
}

function makeRequest(origin?: string): Request {
    const headers: Record<string, string> = {};
    if (origin) headers["Origin"] = origin;
    return new Request("https://api.test.com/v1/properties", { headers });
}

// ─── handlePreflight ─────────────────────────────────────────────────────────

describe("handlePreflight", () => {
    it("returns 204 No Content", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        expect(resp.status).toBe(204);
    });

    it("includes Access-Control-Allow-Methods", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        const methods = resp.headers.get("Access-Control-Allow-Methods");
        expect(methods).toContain("GET");
        expect(methods).toContain("POST");
        expect(methods).toContain("PUT");
        expect(methods).toContain("DELETE");
        expect(methods).toContain("OPTIONS");
    });

    it("includes Access-Control-Allow-Headers", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        const headers = resp.headers.get("Access-Control-Allow-Headers");
        expect(headers).toContain("Authorization");
        expect(headers).toContain("X-Api-Key");
        expect(headers).toContain("Content-Type");
    });

    it("includes Access-Control-Max-Age", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        const maxAge = resp.headers.get("Access-Control-Max-Age");
        expect(maxAge).toBe("86400");
    });

    it("returns wildcard origin when ALLOWED_ORIGINS is '*'", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("does NOT include credentials for wildcard origin", () => {
        const resp = handlePreflight(makeRequest("https://app.test.com"), makeEnv());
        expect(resp.headers.get("Access-Control-Allow-Credentials")).toBeNull();
    });

    it("returns specific origin when configured", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "https://console.realtyos.com" });
        const resp = handlePreflight(
            makeRequest("https://console.realtyos.com"),
            env,
        );
        expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("https://console.realtyos.com");
    });

    it("includes credentials for specific origin", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "https://console.realtyos.com" });
        const resp = handlePreflight(
            makeRequest("https://console.realtyos.com"),
            env,
        );
        expect(resp.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("rejects non-matching origin", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "https://console.realtyos.com" });
        const resp = handlePreflight(
            makeRequest("https://evil.com"),
            env,
        );
        expect(resp.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
});

// ─── addCorsHeaders ──────────────────────────────────────────────────────────

describe("addCorsHeaders", () => {
    it("adds CORS headers to existing response", () => {
        const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
        const request = makeRequest("https://app.test.com");
        const result = addCorsHeaders(response, request, makeEnv());
        expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("preserves original response status and body", async () => {
        const response = new Response(JSON.stringify({ data: "test" }), { status: 201 });
        const result = addCorsHeaders(response, makeRequest("https://app.test.com"), makeEnv());
        expect(result.status).toBe(201);
        const body = await result.json();
        expect(body).toEqual({ data: "test" });
    });

    it("includes Vary: Origin header", () => {
        const response = new Response(null, { status: 200 });
        const result = addCorsHeaders(response, makeRequest("https://app.test.com"), makeEnv());
        expect(result.headers.get("Vary")).toBe("Origin");
    });

    it("skips CORS headers when origin is not allowed", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "https://console.realtyos.com" });
        const response = new Response(null, { status: 200 });
        const result = addCorsHeaders(response, makeRequest("https://evil.com"), env);
        expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });

    it("skips CORS headers when no Origin header", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "https://console.realtyos.com" });
        const response = new Response(null, { status: 200 });
        const result = addCorsHeaders(response, makeRequest(), env);
        expect(result.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
});

// ─── Wildcard subdomain matching ─────────────────────────────────────────────

describe("wildcard subdomain matching", () => {
    it("matches wildcard subdomain pattern", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "*.realtyos.com" });
        const resp = handlePreflight(
            makeRequest("https://console.realtyos.com"),
            env,
        );
        expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("https://console.realtyos.com");
    });

    it("matches nested subdomains", () => {
        const env = makeEnv({ ALLOWED_ORIGINS: "*.realtyos.com" });
        const resp = handlePreflight(
            makeRequest("https://staging.console.realtyos.com"),
            env,
        );
        expect(resp.headers.get("Access-Control-Allow-Origin")).toBe("https://staging.console.realtyos.com");
    });

    it("matches multiple origins (comma-separated)", () => {
        const env = makeEnv({
            ALLOWED_ORIGINS: "https://console.realtyos.com,https://resident.realtyos.com",
        });

        const resp1 = handlePreflight(makeRequest("https://console.realtyos.com"), env);
        expect(resp1.headers.get("Access-Control-Allow-Origin")).toBe("https://console.realtyos.com");

        const resp2 = handlePreflight(makeRequest("https://resident.realtyos.com"), env);
        expect(resp2.headers.get("Access-Control-Allow-Origin")).toBe("https://resident.realtyos.com");

        const resp3 = handlePreflight(makeRequest("https://evil.com"), env);
        expect(resp3.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
});
