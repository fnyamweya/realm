/**
 * Route-level authentication requirements.
 *
 * Each route in the API worker declares its auth requirements:
 * - Whether authentication is required at all
 * - Which audiences can access it
 * - Whether a client must be selected
 * - Required roles (RBAC)
 * - Required scopes (for API keys)
 * - Required MFA level
 * - Policy action for the policy engine
 *
 * Routes are matched by method + path pattern.
 */

import type { RouteAuthConfig } from "./types.js";

// ─── Route Definitions ───────────────────────────────────────────────────────

interface RouteMatch {
    method: string;
    pattern: string | RegExp;
    config: RouteAuthConfig;
}

/**
 * All route auth configurations.
 *
 * Order matters: first match wins. More specific patterns should come first.
 */
const ROUTES: RouteMatch[] = [
    // ─── Public Endpoints (no auth required) ─────────────────────────────
    {
        method: "GET",
        pattern: "/health",
        config: {
            requireAuth: false,
            skipRateLimit: true,
        },
    },
    {
        method: "GET",
        pattern: "/openapi.json",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "GET",
        pattern: "/docs",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "GET",
        pattern: "/",
        config: {
            requireAuth: false,
        },
    },

    // ─── Auth Endpoints (special handling) ───────────────────────────────
    {
        method: "POST",
        pattern: "/v1/auth/login",
        config: {
            requireAuth: false,
            // Rate limited by auth-specific rate limiter, not general one
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/callback",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/refresh",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident", "command"],
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/logout",
        config: {
            requireAuth: true,
        },
    },
    {
        method: "GET",
        pattern: "/v1/auth/whoami",
        config: {
            requireAuth: true,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/select-client",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident", "command"],
        },
    },

    // ─── MFA Endpoints ──────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/auth/mfa/enroll",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident"],
            policyAction: "mfa.enroll",
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/mfa/challenge",
        config: {
            requireAuth: true,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/mfa/verify",
        config: {
            requireAuth: true,
        },
    },
    {
        method: "GET",
        pattern: "/v1/auth/mfa/factors",
        config: {
            requireAuth: true,
        },
    },

    // ─── API Key Management ──────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/auth/api-keys",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            requiredMfaLevel: "STRONG",
            policyAction: "apikey.create",
        },
    },
    {
        method: "GET",
        pattern: "/v1/auth/api-keys",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            policyAction: "apikey.list",
        },
    },
    {
        method: "DELETE",
        pattern: /^\/v1\/auth\/api-keys\/[^/]+$/,
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            requiredMfaLevel: "STRONG",
            policyAction: "apikey.revoke",
        },
    },

    // ─── Password Management ─────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/auth/password/reset-request",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/password/reset-verify",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/password/reset-complete",
        config: {
            requireAuth: false,
        },
    },
    {
        method: "POST",
        pattern: "/v1/auth/password/change",
        config: {
            requireAuth: true,
            allowedAudiences: ["resident"],
            requiredMfaLevel: "STRONG",
            policyAction: "password.change",
        },
    },

    // ─── Session Management ──────────────────────────────────────────────
    {
        method: "GET",
        pattern: "/v1/auth/sessions",
        config: {
            requireAuth: true,
            policyAction: "session.list",
        },
    },
    {
        method: "DELETE",
        pattern: /^\/v1\/auth\/sessions\/[^/]+$/,
        config: {
            requireAuth: true,
            policyAction: "session.revoke",
        },
    },

    // ─── Audit Log ───────────────────────────────────────────────────────
    {
        method: "GET",
        pattern: "/v1/auth/audit",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "SUPPORT_ADMIN"],
            policyAction: "audit.read",
        },
    },

    // ─── Properties ──────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/properties",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command", "service"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            requiredScopes: ["properties.write"],
            policyAction: "property.create",
        },
    },
    {
        method: "GET",
        pattern: "/v1/properties",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident", "command", "service"],
            requireClientId: true,
            requiredScopes: ["properties.read"],
            policyAction: "property.list",
        },
    },

    // ─── Memberships ─────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/memberships",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            requiredScopes: ["memberships.write"],
            policyAction: "membership.create",
        },
    },

    // ─── Leases ──────────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/leases",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command", "service"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER"],
            requiredScopes: ["leases.write"],
            policyAction: "lease.create",
        },
    },

    // ─── Maintenance ─────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/maintenance/requests",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident", "command", "service"],
            requireClientId: true,
            requiredScopes: ["maintenance.write"],
            policyAction: "maintenance.create",
        },
    },

    // ─── Finance ─────────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/finance/charge-definitions",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command", "service"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredScopes: ["finance.write"],
            policyAction: "finance.charge-definition.create",
        },
    },
    {
        method: "POST",
        pattern: "/v1/finance/charge-plans",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command", "service"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredScopes: ["finance.write"],
            policyAction: "finance.charge-plan.create",
        },
    },
    {
        method: "POST",
        pattern: "/v1/finance/charge-assignments",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command", "service"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredScopes: ["finance.write"],
            policyAction: "finance.charge-assignment.create",
        },
    },
    {
        method: "POST",
        pattern: "/v1/finance/charges/manual",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredMfaLevel: "STEP_UP",
            requiredScopes: ["finance.write"],
            policyAction: "finance.charge.manual",
        },
    },
    {
        method: "POST",
        pattern: "/v1/finance/adjustments",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredMfaLevel: "STEP_UP",
            requiredScopes: ["finance.write"],
            policyAction: "finance.adjustment.apply",
        },
    },

    // ─── Payments ────────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/payments/initiate",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "resident", "service"],
            requireClientId: true,
            requiredScopes: ["payments.write"],
            policyAction: "payment.initiate",
        },
    },
    {
        method: "POST",
        pattern: "/v1/payments/manual",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredMfaLevel: "STEP_UP",
            requiredScopes: ["payments.write"],
            policyAction: "payment.manual",
        },
    },

    // ─── Settlement ──────────────────────────────────────────────────────
    {
        method: "POST",
        pattern: "/v1/settlement/refunds",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredMfaLevel: "STRONG",
            requiredScopes: ["settlement.write"],
            policyAction: "settlement.refund.create",
        },
    },
    {
        method: "POST",
        pattern: "/v1/settlement/exports",
        config: {
            requireAuth: true,
            allowedAudiences: ["console", "command"],
            requireClientId: true,
            requiredRoles: ["OWNER", "MANAGER", "ACCOUNTANT"],
            requiredMfaLevel: "STRONG",
            requiredScopes: ["settlement.read"],
            policyAction: "settlement.export.create",
        },
    },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Find the auth configuration for a given route.
 * Returns a default "require auth" config if no match is found.
 */
export function getRouteAuthConfig(
    method: string,
    pathname: string,
): RouteAuthConfig {
    const upperMethod = method.toUpperCase();

    for (const route of ROUTES) {
        if (route.method !== upperMethod) continue;

        if (typeof route.pattern === "string") {
            if (route.pattern === pathname) {
                return route.config;
            }
        } else {
            if (route.pattern.test(pathname)) {
                return route.config;
            }
        }
    }

    // Default: require auth with no audience restriction
    // This is a security-first default — unknown routes require authentication
    return {
        requireAuth: true,
    };
}

/**
 * Check if a route requires authentication.
 */
export function isPublicRoute(method: string, pathname: string): boolean {
    return !getRouteAuthConfig(method, pathname).requireAuth;
}
