/**
 * Tests for errors.ts
 *
 * Covers: Error response envelope format, status code mapping,
 * WWW-Authenticate header, obligations, debug details, rate limit responses,
 * MFA required responses, client selection required, policy denied, system errors.
 */

import { describe, it, expect } from "vitest";
import {
    authErrorResponse,
    rateLimitedResponse,
    mfaRequiredResponse,
    clientSelectionRequiredResponse,
    policyDeniedResponse,
    authSystemErrorResponse,
} from "../errors.js";
import type { AuthErrorEnvelope } from "../errors.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function parseBody(response: Response): Promise<AuthErrorEnvelope> {
    return response.json() as Promise<AuthErrorEnvelope>;
}

// ─── authErrorResponse ───────────────────────────────────────────────────────

describe("authErrorResponse", () => {
    it("returns correct status for AUTH_TOKEN_INVALID", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID");
        expect(resp.status).toBe(401);
    });

    it("returns correct status for AUTH_TOKEN_EXPIRED", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_EXPIRED");
        expect(resp.status).toBe(401);
    });

    it("returns correct status for AUTH_FORBIDDEN", async () => {
        const resp = authErrorResponse("AUTH_FORBIDDEN");
        expect(resp.status).toBe(403);
    });

    it("returns correct status for AUTH_RATE_LIMITED", async () => {
        const resp = authErrorResponse("AUTH_RATE_LIMITED");
        expect(resp.status).toBe(429);
    });

    it("returns correct status for AUTH_ACCOUNT_LOCKED", async () => {
        const resp = authErrorResponse("AUTH_ACCOUNT_LOCKED");
        expect(resp.status).toBe(423);
    });

    it("returns JSON content type", () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID");
        expect(resp.headers.get("content-type")).toContain("application/json");
    });

    it("includes no-store cache control", () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID");
        expect(resp.headers.get("cache-control")).toBe("no-store");
    });

    it("includes WWW-Authenticate header for 401 responses", () => {
        const resp = authErrorResponse("AUTH_TOKEN_EXPIRED");
        const wwwAuth = resp.headers.get("www-authenticate");
        expect(wwwAuth).toBeDefined();
        expect(wwwAuth).toContain("Bearer");
        expect(wwwAuth).toContain("AUTH_TOKEN_EXPIRED");
    });

    it("does NOT include WWW-Authenticate for 403 responses", () => {
        const resp = authErrorResponse("AUTH_FORBIDDEN");
        expect(resp.headers.get("www-authenticate")).toBeNull();
    });

    it("includes error envelope with code and message", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID");
        const body = await parseBody(resp);
        expect(body.error.code).toBe("AUTH_TOKEN_INVALID");
        expect(body.error.message).toContain("invalid");
    });

    it("uses custom message when provided", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID", {
            message: "Custom error message",
        });
        const body = await parseBody(resp);
        expect(body.error.message).toBe("Custom error message");
    });

    it("includes correlationId when provided", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID", {
            correlationId: "cor_test123",
        });
        const body = await parseBody(resp);
        expect(body.error.correlationId).toBe("cor_test123");
    });

    it("includes docsUrl", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_EXPIRED");
        const body = await parseBody(resp);
        expect(body.error.docsUrl).toContain("auth_token_expired");
    });

    it("does NOT include details when debug is false", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID", {
            details: { foo: "bar" },
            debug: false,
        });
        const body = await parseBody(resp);
        expect(body.error.details).toBeUndefined();
    });

    it("includes details when debug is true", async () => {
        const resp = authErrorResponse("AUTH_TOKEN_INVALID", {
            details: { foo: "bar" },
            debug: true,
        });
        const body = await parseBody(resp);
        expect(body.error.details).toEqual({ foo: "bar" });
    });

    it("includes obligations when provided", async () => {
        const resp = authErrorResponse("AUTH_MFA_STEP_UP_REQUIRED", {
            obligations: [{ type: "MFA_STEP_UP_REQUIRED", level: "STRONG" }],
        });
        const body = await parseBody(resp);
        expect(body.error.obligations).toHaveLength(1);
        expect(body.error.obligations![0].type).toBe("MFA_STEP_UP_REQUIRED");
    });

    it("includes custom headers", () => {
        const resp = authErrorResponse("AUTH_RATE_LIMITED", {
            headers: { "Retry-After": "30" },
        });
        expect(resp.headers.get("Retry-After")).toBe("30");
    });

    it("defaults to 403 for unknown error codes", () => {
        const resp = authErrorResponse("UNKNOWN_ERROR");
        expect(resp.status).toBe(403);
    });
});

// ─── rateLimitedResponse ─────────────────────────────────────────────────────

describe("rateLimitedResponse", () => {
    it("returns 429 status", () => {
        const resp = rateLimitedResponse(30);
        expect(resp.status).toBe(429);
    });

    it("includes Retry-After header", () => {
        const resp = rateLimitedResponse(45);
        expect(resp.headers.get("Retry-After")).toBe("45");
    });

    it("includes rate limited error code", async () => {
        const resp = rateLimitedResponse(30);
        const body = await parseBody(resp);
        expect(body.error.code).toBe("AUTH_RATE_LIMITED");
    });

    it("includes correlationId when provided", async () => {
        const resp = rateLimitedResponse(30, "cor_abc");
        const body = await parseBody(resp);
        expect(body.error.correlationId).toBe("cor_abc");
    });
});

// ─── mfaRequiredResponse ─────────────────────────────────────────────────────

describe("mfaRequiredResponse", () => {
    it("returns 403 status", () => {
        const resp = mfaRequiredResponse();
        expect(resp.status).toBe(403);
    });

    it("includes MFA obligation with defaults", async () => {
        const resp = mfaRequiredResponse();
        const body = await parseBody(resp);
        expect(body.error.code).toBe("AUTH_MFA_STEP_UP_REQUIRED");
        expect(body.error.obligations).toHaveLength(1);
        const obligation = body.error.obligations![0];
        expect(obligation.type).toBe("MFA_STEP_UP_REQUIRED");
        expect(obligation.level).toBe("STRONG");
        expect(obligation.expiresInSeconds).toBe(300);
        expect(obligation.allowedFactors).toEqual(["TOTP", "WEBAUTHN", "SMS_OTP"]);
    });

    it("uses custom level", async () => {
        const resp = mfaRequiredResponse({ level: "STEP_UP" });
        const body = await parseBody(resp);
        expect(body.error.obligations![0].level).toBe("STEP_UP");
    });

    it("uses custom allowed factors", async () => {
        const resp = mfaRequiredResponse({ allowedFactors: ["TOTP"] });
        const body = await parseBody(resp);
        expect(body.error.obligations![0].allowedFactors).toEqual(["TOTP"]);
    });
});

// ─── clientSelectionRequiredResponse ─────────────────────────────────────────

describe("clientSelectionRequiredResponse", () => {
    it("returns 403 status", () => {
        const resp = clientSelectionRequiredResponse();
        expect(resp.status).toBe(403);
    });

    it("includes SELECT_CLIENT obligation", async () => {
        const resp = clientSelectionRequiredResponse();
        const body = await parseBody(resp);
        expect(body.error.code).toBe("AUTH_CLIENT_NOT_SELECTED");
        expect(body.error.obligations).toHaveLength(1);
        expect(body.error.obligations![0].type).toBe("SELECT_CLIENT");
    });

    it("includes correlationId", async () => {
        const resp = clientSelectionRequiredResponse("cor_xyz");
        const body = await parseBody(resp);
        expect(body.error.correlationId).toBe("cor_xyz");
    });
});

// ─── policyDeniedResponse ────────────────────────────────────────────────────

describe("policyDeniedResponse", () => {
    it("returns 403 status", () => {
        const resp = policyDeniedResponse("Not allowed");
        expect(resp.status).toBe(403);
    });

    it("includes custom reason as message", async () => {
        const resp = policyDeniedResponse("IP not in allowlist");
        const body = await parseBody(resp);
        expect(body.error.message).toBe("IP not in allowlist");
    });

    it("includes obligations when provided", async () => {
        const resp = policyDeniedResponse("Needs approval", [
            { type: "MAKER_CHECKER_REQUIRED" },
        ]);
        const body = await parseBody(resp);
        expect(body.error.obligations).toHaveLength(1);
        expect(body.error.obligations![0].type).toBe("MAKER_CHECKER_REQUIRED");
    });
});

// ─── authSystemErrorResponse ─────────────────────────────────────────────────

describe("authSystemErrorResponse", () => {
    it("returns 500 status", () => {
        const resp = authSystemErrorResponse();
        expect(resp.status).toBe(500);
    });

    it("uses generic error message (never leaks internals)", async () => {
        const resp = authSystemErrorResponse();
        const body = await parseBody(resp);
        expect(body.error.code).toBe("AUTH_SYSTEM_ERROR");
        expect(body.error.message).toContain("internal");
    });

    it("includes correlationId", async () => {
        const resp = authSystemErrorResponse("cor_err");
        const body = await parseBody(resp);
        expect(body.error.correlationId).toBe("cor_err");
    });

    it("excludes details when debug is false", async () => {
        const resp = authSystemErrorResponse("cor_err", false, { stack: "..." });
        const body = await parseBody(resp);
        expect(body.error.details).toBeUndefined();
    });

    it("includes details when debug is true", async () => {
        const resp = authSystemErrorResponse("cor_err", true, { message: "oops" });
        const body = await parseBody(resp);
        expect(body.error.details).toEqual({ message: "oops" });
    });
});
