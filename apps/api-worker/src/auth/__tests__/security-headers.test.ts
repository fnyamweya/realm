/**
 * Tests for security-headers.ts
 *
 * Covers: OWASP security headers, CSP, HSTS, Swagger UI CSP,
 * cacheable public headers, header removal
 */

import { describe, it, expect } from "vitest";
import {
    applySecurityHeaders,
    applyHtmlSecurityHeaders,
    applyPublicSecurityHeaders,
} from "../security-headers.js";

// ─── applySecurityHeaders ────────────────────────────────────────────────────

describe("applySecurityHeaders", () => {
    it("adds X-Content-Type-Options: nosniff", () => {
        const resp = applySecurityHeaders(new Response(null));
        expect(resp.headers.get("X-Content-Type-Options")).toBe("nosniff");
    });

    it("adds X-Frame-Options: DENY", () => {
        const resp = applySecurityHeaders(new Response(null));
        expect(resp.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("adds Referrer-Policy", () => {
        const resp = applySecurityHeaders(new Response(null));
        expect(resp.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    });

    it("adds Permissions-Policy", () => {
        const resp = applySecurityHeaders(new Response(null));
        const pp = resp.headers.get("Permissions-Policy");
        expect(pp).toContain("camera=()");
        expect(pp).toContain("microphone=()");
        expect(pp).toContain("geolocation=()");
    });

    it("adds Content-Security-Policy", () => {
        const resp = applySecurityHeaders(new Response(null));
        expect(resp.headers.get("Content-Security-Policy")).toContain("default-src 'none'");
    });

    it("adds HSTS header (2 years)", () => {
        const resp = applySecurityHeaders(new Response(null));
        const hsts = resp.headers.get("Strict-Transport-Security");
        expect(hsts).toContain("max-age=63072000");
        expect(hsts).toContain("includeSubDomains");
        expect(hsts).toContain("preload");
    });

    it("adds no-store Cache-Control", () => {
        const resp = applySecurityHeaders(new Response(null));
        expect(resp.headers.get("Cache-Control")).toContain("no-store");
    });

    it("removes Server header", () => {
        const original = new Response(null, {
            headers: { "Server": "nginx/1.0" },
        });
        const resp = applySecurityHeaders(original);
        expect(resp.headers.get("Server")).toBeNull();
    });

    it("removes X-Powered-By header", () => {
        const original = new Response(null, {
            headers: { "X-Powered-By": "Express" },
        });
        const resp = applySecurityHeaders(original);
        expect(resp.headers.get("X-Powered-By")).toBeNull();
    });

    it("does not override existing security headers", () => {
        const original = new Response(null, {
            headers: { "X-Frame-Options": "SAMEORIGIN" },
        });
        const resp = applySecurityHeaders(original);
        expect(resp.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    });

    it("preserves response status", () => {
        const resp = applySecurityHeaders(new Response(null, { status: 404 }));
        expect(resp.status).toBe(404);
    });

    it("preserves response body", async () => {
        const resp = applySecurityHeaders(
            new Response(JSON.stringify({ ok: true }), { status: 200 }),
        );
        const body = await resp.json();
        expect(body).toEqual({ ok: true });
    });
});

// ─── applyHtmlSecurityHeaders ────────────────────────────────────────────────

describe("applyHtmlSecurityHeaders", () => {
    it("allows unsafe-inline scripts (for Swagger UI)", () => {
        const resp = applyHtmlSecurityHeaders(new Response(null));
        const csp = resp.headers.get("Content-Security-Policy");
        expect(csp).toContain("'unsafe-inline'");
        expect(csp).toContain("cdn.jsdelivr.net");
    });

    it("allows connect-src self (for API calls from Swagger UI)", () => {
        const resp = applyHtmlSecurityHeaders(new Response(null));
        const csp = resp.headers.get("Content-Security-Policy");
        expect(csp).toContain("connect-src 'self'");
    });

    it("still prevents framing", () => {
        const resp = applyHtmlSecurityHeaders(new Response(null));
        const csp = resp.headers.get("Content-Security-Policy");
        expect(csp).toContain("frame-ancestors 'none'");
    });

    it("includes HSTS", () => {
        const resp = applyHtmlSecurityHeaders(new Response(null));
        expect(resp.headers.get("Strict-Transport-Security")).toContain("max-age=63072000");
    });
});

// ─── applyPublicSecurityHeaders ──────────────────────────────────────────────

describe("applyPublicSecurityHeaders", () => {
    it("uses public cache control with specified max-age", () => {
        const resp = applyPublicSecurityHeaders(new Response(null), 600);
        const cc = resp.headers.get("Cache-Control");
        expect(cc).toContain("public");
        expect(cc).toContain("max-age=600");
        expect(cc).toContain("s-maxage=600");
    });

    it("defaults to 300s max-age", () => {
        const resp = applyPublicSecurityHeaders(new Response(null));
        expect(resp.headers.get("Cache-Control")).toContain("max-age=300");
    });

    it("still includes security headers", () => {
        const resp = applyPublicSecurityHeaders(new Response(null));
        expect(resp.headers.get("X-Content-Type-Options")).toBe("nosniff");
        expect(resp.headers.get("X-Frame-Options")).toBe("DENY");
    });

    it("removes Pragma header", () => {
        const resp = applyPublicSecurityHeaders(new Response(null));
        expect(resp.headers.get("Pragma")).toBeNull();
    });
});
