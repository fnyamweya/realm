/**
 * Security headers applied to all API responses.
 *
 * Follows OWASP security headers best practices:
 * https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html
 */

// ─── Security Headers ───────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
    // Prevent MIME type sniffing
    "X-Content-Type-Options": "nosniff",
    // Prevent clickjacking
    "X-Frame-Options": "DENY",
    // XSS protection (legacy browsers)
    "X-XSS-Protection": "0",
    // Referrer policy — don't leak URLs
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Permissions policy — disable unnecessary browser features
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    // Content Security Policy for API responses
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    // Strict Transport Security (2 years, include subdomains, preload-ready)
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    // Prevent caching of authenticated responses by default
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
};

// Headers to REMOVE from responses (set by upstream/framework)
const HEADERS_TO_REMOVE = [
    "Server",
    "X-Powered-By",
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Apply all security headers to a response.
 * Returns a new Response with security headers added.
 */
export function applySecurityHeaders(response: Response): Response {
    const newHeaders = new Headers(response.headers);

    // Add security headers (don't override existing ones)
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        if (!newHeaders.has(key)) {
            newHeaders.set(key, value);
        }
    }

    // Remove sensitive headers
    for (const header of HEADERS_TO_REMOVE) {
        newHeaders.delete(header);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

/**
 * Apply security headers specifically for HTML responses (Swagger UI).
 * More permissive CSP to allow inline scripts and external CSS/JS.
 */
export function applyHtmlSecurityHeaders(response: Response): Response {
    const newHeaders = new Headers(response.headers);

    // Swagger UI needs inline scripts and external CDN resources
    newHeaders.set("Content-Security-Policy",
        "default-src 'none'; " +
        "script-src 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "style-src 'unsafe-inline' https://cdn.jsdelivr.net; " +
        "img-src 'self' data: https:; " +
        "font-src https://cdn.jsdelivr.net; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'",
    );

    newHeaders.set("X-Content-Type-Options", "nosniff");
    newHeaders.set("X-Frame-Options", "DENY");
    newHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newHeaders.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

    for (const header of HEADERS_TO_REMOVE) {
        newHeaders.delete(header);
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
}

/**
 * Apply security headers for public/cacheable content.
 * Relaxes Cache-Control but keeps other security headers.
 */
export function applyPublicSecurityHeaders(
    response: Response,
    maxAge: number = 300,
): Response {
    const result = applySecurityHeaders(response);
    const headers = new Headers(result.headers);

    // Override cache control for public content
    headers.set("Cache-Control", `public, max-age=${maxAge}, s-maxage=${maxAge}`);
    headers.delete("Pragma");

    return new Response(result.body, {
        status: result.status,
        statusText: result.statusText,
        headers,
    });
}
