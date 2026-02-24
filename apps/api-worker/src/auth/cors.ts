/**
 * CORS (Cross-Origin Resource Sharing) handler.
 *
 * Configurable per-origin CORS with:
 * - Origin allowlist with wildcard support
 * - Audience-aware origin restrictions
 * - Preflight (OPTIONS) caching for 24 hours
 * - Credential support for cookie-based auth
 * - Configurable exposed headers (rate limit, correlation)
 */

import type { Env } from "./types.js";

// ─── Configuration ───────────────────────────────────────────────────────────

const PREFLIGHT_CACHE_SECONDS = 86400; // 24 hours

const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

const ALLOWED_HEADERS = [
    "Content-Type",
    "Authorization",
    "X-Api-Key",
    "X-Correlation-Id",
    "X-Requested-With",
    "Accept",
    "Accept-Language",
    "X-Client-Version",
].join(", ");

const EXPOSED_HEADERS = [
    "X-Correlation-Id",
    "X-RateLimit-Limit",
    "X-RateLimit-Remaining",
    "X-RateLimit-Reset",
    "Retry-After",
    "X-Request-Id",
].join(", ");

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Handle CORS preflight (OPTIONS) request.
 */
export function handlePreflight(
    request: Request,
    env: Env,
): Response {
    const origin = request.headers.get("Origin");
    const allowedOrigin = resolveAllowedOrigin(origin, env);

    const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": ALLOWED_METHODS,
        "Access-Control-Allow-Headers": ALLOWED_HEADERS,
        "Access-Control-Max-Age": PREFLIGHT_CACHE_SECONDS.toString(),
        "Access-Control-Expose-Headers": EXPOSED_HEADERS,
    };

    if (allowedOrigin) {
        headers["Access-Control-Allow-Origin"] = allowedOrigin;
        headers["Vary"] = "Origin";

        // Allow credentials for non-wildcard origins
        if (allowedOrigin !== "*") {
            headers["Access-Control-Allow-Credentials"] = "true";
        }
    }

    return new Response(null, { status: 204, headers });
}

/**
 * Add CORS headers to an existing response.
 */
export function addCorsHeaders(
    response: Response,
    request: Request,
    env: Env,
): Response {
    const origin = request.headers.get("Origin");
    const allowedOrigin = resolveAllowedOrigin(origin, env);

    if (!allowedOrigin) {
        return response;
    }

    // Clone response to add headers (Response headers may be immutable)
    const newHeaders = new Headers(response.headers);
    newHeaders.set("Access-Control-Allow-Origin", allowedOrigin);
    newHeaders.set("Access-Control-Expose-Headers", EXPOSED_HEADERS);
    newHeaders.set("Vary", "Origin");

    if (allowedOrigin !== "*") {
        newHeaders.set("Access-Control-Allow-Credentials", "true");
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Resolve the allowed origin for a request.
 * Returns the matched origin, "*", or null (deny).
 */
function resolveAllowedOrigin(
    requestOrigin: string | null,
    env: Env,
): string | null {
    const allowedOriginsRaw = env.ALLOWED_ORIGINS || "*";

    // If set to "*", allow all origins
    if (allowedOriginsRaw.trim() === "*") {
        return "*";
    }

    // No Origin header — same-origin or non-browser request
    if (!requestOrigin) {
        return null;
    }

    const allowedOrigins = allowedOriginsRaw
        .split(",")
        .map((o) => o.trim().toLowerCase())
        .filter((o) => o.length > 0);

    const normalizedOrigin = requestOrigin.toLowerCase();

    for (const allowed of allowedOrigins) {
        // Exact match
        if (allowed === normalizedOrigin) {
            return requestOrigin; // Return original casing
        }

        // Wildcard subdomain match: *.example.com
        if (allowed.startsWith("*.")) {
            const domain = allowed.substring(2);
            if (
                normalizedOrigin.endsWith(domain) &&
                normalizedOrigin.charAt(normalizedOrigin.length - domain.length - 1) === "/" ||
                normalizedOrigin.endsWith(`.${domain}`) ||
                normalizedOrigin === `https://${domain}` ||
                normalizedOrigin === `http://${domain}`
            ) {
                return requestOrigin;
            }

            // Check protocol://subdomain.domain format
            try {
                const originUrl = new URL(normalizedOrigin);
                if (originUrl.hostname.endsWith(`.${domain}`) || originUrl.hostname === domain) {
                    return requestOrigin;
                }
            } catch {
                // Invalid URL — skip
            }
        }
    }

    // No match found
    return null;
}
