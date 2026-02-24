/**
 * Tests for route-requirements.ts
 *
 * Covers: Route matching, public route detection, default auth config,
 * audience restrictions, role requirements, scope requirements, MFA levels,
 * regex pattern matching, security-first defaults.
 */

import { describe, it, expect } from "vitest";
import { getRouteAuthConfig, isPublicRoute } from "../route-requirements.js";

// ─── Public Routes ───────────────────────────────────────────────────────────

describe("public routes", () => {
    it("GET /health is public", () => {
        expect(isPublicRoute("GET", "/health")).toBe(true);
    });

    it("GET /health has skipRateLimit", () => {
        const config = getRouteAuthConfig("GET", "/health");
        expect(config.skipRateLimit).toBe(true);
    });

    it("GET /openapi.json is public", () => {
        expect(isPublicRoute("GET", "/openapi.json")).toBe(true);
    });

    it("GET /docs is public", () => {
        expect(isPublicRoute("GET", "/docs")).toBe(true);
    });

    it("GET / is public", () => {
        expect(isPublicRoute("GET", "/")).toBe(true);
    });

    it("POST /v1/auth/login is public", () => {
        expect(isPublicRoute("POST", "/v1/auth/login")).toBe(true);
    });

    it("POST /v1/auth/callback is public", () => {
        expect(isPublicRoute("POST", "/v1/auth/callback")).toBe(true);
    });

    it("POST /v1/auth/password/reset-request is public", () => {
        expect(isPublicRoute("POST", "/v1/auth/password/reset-request")).toBe(true);
    });

    it("POST /v1/auth/password/reset-verify is public", () => {
        expect(isPublicRoute("POST", "/v1/auth/password/reset-verify")).toBe(true);
    });

    it("POST /v1/auth/password/reset-complete is public", () => {
        expect(isPublicRoute("POST", "/v1/auth/password/reset-complete")).toBe(true);
    });
});

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

describe("auth endpoints", () => {
    it("POST /v1/auth/logout requires auth", () => {
        expect(isPublicRoute("POST", "/v1/auth/logout")).toBe(false);
    });

    it("GET /v1/auth/whoami requires auth", () => {
        expect(isPublicRoute("GET", "/v1/auth/whoami")).toBe(false);
    });

    it("POST /v1/auth/select-client requires auth and specific audiences", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/select-client");
        expect(config.requireAuth).toBe(true);
        expect(config.allowedAudiences).toEqual(["console", "resident", "command"]);
    });

    it("POST /v1/auth/refresh requires auth and specific audiences", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/refresh");
        expect(config.requireAuth).toBe(true);
        expect(config.allowedAudiences).toEqual(["console", "resident", "command"]);
    });
});

// ─── MFA Endpoints ───────────────────────────────────────────────────────────

describe("MFA endpoints", () => {
    it("POST /v1/auth/mfa/enroll requires auth and console/resident audience", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/mfa/enroll");
        expect(config.requireAuth).toBe(true);
        expect(config.allowedAudiences).toEqual(["console", "resident"]);
    });

    it("POST /v1/auth/mfa/challenge requires auth", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/mfa/challenge");
        expect(config.requireAuth).toBe(true);
    });

    it("POST /v1/auth/mfa/verify requires auth", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/mfa/verify");
        expect(config.requireAuth).toBe(true);
    });

    it("GET /v1/auth/mfa/factors requires auth", () => {
        const config = getRouteAuthConfig("GET", "/v1/auth/mfa/factors");
        expect(config.requireAuth).toBe(true);
    });
});

// ─── API Key Management ──────────────────────────────────────────────────────

describe("API key management", () => {
    it("POST /v1/auth/api-keys requires STRONG MFA", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/api-keys");
        expect(config.requiredMfaLevel).toBe("STRONG");
    });

    it("POST /v1/auth/api-keys requires OWNER or MANAGER role", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/api-keys");
        expect(config.requiredRoles).toContain("OWNER");
        expect(config.requiredRoles).toContain("MANAGER");
    });

    it("POST /v1/auth/api-keys requires client selection", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/api-keys");
        expect(config.requireClientId).toBe(true);
    });

    it("DELETE /v1/auth/api-keys/:id matches regex and requires STRONG MFA", () => {
        const config = getRouteAuthConfig("DELETE", "/v1/auth/api-keys/key_abc123");
        expect(config.requiredMfaLevel).toBe("STRONG");
        expect(config.requiredRoles).toContain("OWNER");
    });
});

// ─── Password Management ─────────────────────────────────────────────────────

describe("password management", () => {
    it("POST /v1/auth/password/change requires STRONG MFA", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/password/change");
        expect(config.requiredMfaLevel).toBe("STRONG");
    });

    it("POST /v1/auth/password/change is resident-only", () => {
        const config = getRouteAuthConfig("POST", "/v1/auth/password/change");
        expect(config.allowedAudiences).toEqual(["resident"]);
    });
});

// ─── Session Management ──────────────────────────────────────────────────────

describe("session management", () => {
    it("GET /v1/auth/sessions requires auth", () => {
        const config = getRouteAuthConfig("GET", "/v1/auth/sessions");
        expect(config.requireAuth).toBe(true);
    });

    it("DELETE /v1/auth/sessions/:id matches regex", () => {
        const config = getRouteAuthConfig("DELETE", "/v1/auth/sessions/ses_abc123");
        expect(config.requireAuth).toBe(true);
    });
});

// ─── Audit ───────────────────────────────────────────────────────────────────

describe("audit endpoints", () => {
    it("GET /v1/auth/audit requires OWNER, MANAGER, or SUPPORT_ADMIN", () => {
        const config = getRouteAuthConfig("GET", "/v1/auth/audit");
        expect(config.requiredRoles).toContain("OWNER");
        expect(config.requiredRoles).toContain("MANAGER");
        expect(config.requiredRoles).toContain("SUPPORT_ADMIN");
    });

    it("GET /v1/auth/audit requires client selection", () => {
        const config = getRouteAuthConfig("GET", "/v1/auth/audit");
        expect(config.requireClientId).toBe(true);
    });
});

// ─── Business Routes ─────────────────────────────────────────────────────────

describe("business routes", () => {
    it("POST /v1/properties requires OWNER or MANAGER role", () => {
        const config = getRouteAuthConfig("POST", "/v1/properties");
        expect(config.requiredRoles).toContain("OWNER");
        expect(config.requiredRoles).toContain("MANAGER");
    });

    it("GET /v1/properties allows all service audiences", () => {
        const config = getRouteAuthConfig("GET", "/v1/properties");
        expect(config.allowedAudiences).toContain("console");
        expect(config.allowedAudiences).toContain("resident");
        expect(config.allowedAudiences).toContain("service");
    });

    it("POST /v1/finance/charges/manual requires MFA STEP_UP", () => {
        const config = getRouteAuthConfig("POST", "/v1/finance/charges/manual");
        expect(config.requiredMfaLevel).toBe("STEP_UP");
    });

    it("POST /v1/finance/adjustments requires MFA STEP_UP", () => {
        const config = getRouteAuthConfig("POST", "/v1/finance/adjustments");
        expect(config.requiredMfaLevel).toBe("STEP_UP");
    });

    it("POST /v1/settlement/refunds requires STRONG MFA", () => {
        const config = getRouteAuthConfig("POST", "/v1/settlement/refunds");
        expect(config.requiredMfaLevel).toBe("STRONG");
    });

    it("POST /v1/settlement/exports requires STRONG MFA", () => {
        const config = getRouteAuthConfig("POST", "/v1/settlement/exports");
        expect(config.requiredMfaLevel).toBe("STRONG");
    });

    it("POST /v1/maintenance/requests allows all audiences incl. resident", () => {
        const config = getRouteAuthConfig("POST", "/v1/maintenance/requests");
        expect(config.allowedAudiences).toContain("resident");
        expect(config.allowedAudiences).toContain("console");
        expect(config.allowedAudiences).toContain("command");
        expect(config.allowedAudiences).toContain("service");
    });
});

// ─── Default Config (Security-First) ─────────────────────────────────────────

describe("default config", () => {
    it("unknown routes default to require auth", () => {
        const config = getRouteAuthConfig("GET", "/v1/unknown/endpoint");
        expect(config.requireAuth).toBe(true);
    });

    it("unknown POST routes default to require auth", () => {
        const config = getRouteAuthConfig("POST", "/some/random/path");
        expect(config.requireAuth).toBe(true);
    });
});

// ─── Method Matching ─────────────────────────────────────────────────────────

describe("method matching", () => {
    it("GET /v1/properties is case-insensitive for method", () => {
        const configUpper = getRouteAuthConfig("GET", "/v1/properties");
        const configLower = getRouteAuthConfig("get", "/v1/properties");
        // Both should resolve to the same
        expect(configUpper.requireAuth).toBe(configLower.requireAuth);
    });

    it("wrong method returns default config", () => {
        // POST /health is not defined — should fallback to default
        const config = getRouteAuthConfig("POST", "/health");
        expect(config.requireAuth).toBe(true); // default
    });
});
