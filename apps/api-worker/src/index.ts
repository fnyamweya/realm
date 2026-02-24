import * as Contracts from "@realtyos/contracts-api";
import { createOpenApiDocument, getDocumentedRoutes } from "./openapi.js";
import type { RouteDoc } from "./openapi.js";
import {
    authenticate,
    handlePreflight,
    addCorsHeaders,
    applySecurityHeaders,
    applyHtmlSecurityHeaders,
    applyPublicSecurityHeaders,
    authErrorResponse,
    authSystemErrorResponse,
    emitAuthenticatedAuditEvent,
    type Env,
    type AuthenticatedContext,
} from "./auth/index.js";

// ─── Response Helpers ────────────────────────────────────────────────────────

function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
    return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...headers,
        },
    });
}

function html(content: string, status = 200): Response {
    return new Response(content, {
        status,
        headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
        },
    });
}

function getBaseUrl(url: URL): string {
    return `${url.protocol}//${url.host}`;
}

function docsHtml(openApiPath: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>RealtyOS API Docs</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; background: #0b1020; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
      .topbar { display: none; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: '${openApiPath}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        docExpansion: 'list',
        persistAuthorization: true,
        requestInterceptor: (req) => {
          // Persist auth token across Swagger UI requests
          const auth = window.ui?.getState?.()?.toJSON?.()?.auth;
          if (auth?.authorized?.bearer?.value) {
            req.headers.Authorization = 'Bearer ' + auth.authorized.bearer.value;
          }
          return req;
        },
      });
    </script>
  </body>
</html>`;
}

function resolveSchema(name: string): unknown {
    return (Contracts as Record<string, unknown>)[name];
}

async function validateRequestBody(request: Request, schemaName?: string): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
    if (!schemaName) {
        return { ok: true, body: undefined };
    }

    const schema = resolveSchema(schemaName) as { safeParse?: (input: unknown) => { success: boolean; data?: unknown; error?: unknown } };
    if (!schema || typeof schema.safeParse !== "function") {
        return {
            ok: false,
            response: json({
                error: `Missing contract schema: ${schemaName}`,
            }, 500),
        };
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return {
            ok: false,
            response: json({
                error: "Invalid JSON body",
            }, 400),
        };
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return {
            ok: false,
            response: json({
                error: "Request validation failed",
                details: parsed.error,
            }, 400),
        };
    }

    return { ok: true, body: parsed.data };
}

const documentedRoutes = getDocumentedRoutes();

// ─── Auth Endpoint Handlers ──────────────────────────────────────────────────

async function handleAuthEndpoint(
    request: Request,
    url: URL,
    ctx: AuthenticatedContext,
): Promise<Response> {
    const pathname = url.pathname;

    // POST /v1/auth/whoami
    if (pathname === "/v1/auth/whoami" && request.method === "GET") {
        return json({
            actorType: ctx.auth.method === "api_key" ? "SERVICE_ACCOUNT" : "USER",
            userId: ctx.auth.userId,
            clientId: ctx.auth.clientId,
            membershipId: ctx.auth.membershipId,
            roles: ctx.auth.roles,
            audience: ctx.auth.audience,
            authMethod: ctx.auth.authMethod,
            mfaLevel: ctx.auth.mfaLevel,
            sessionId: ctx.auth.sessionId,
        });
    }

    // POST /v1/auth/logout
    if (pathname === "/v1/auth/logout" && request.method === "POST") {
        const { revokeSession } = await import("./auth/session.js");
        await revokeSession(ctx.auth.sessionId, ctx.env.AUTH_DB, ctx.env.AUTH_CACHE);

        emitAuthenticatedAuditEvent(
            "AUTH_LOGOUT",
            ctx.auth,
            ctx.correlationId,
            ctx.ipHash,
            ctx.env.AUTH_DB,
        );

        return json({ ok: true, message: "Logged out successfully" });
    }

    // POST /v1/auth/select-client
    if (pathname === "/v1/auth/select-client" && request.method === "POST") {
        let body: { clientId?: string };
        try {
            body = await request.json() as { clientId?: string };
        } catch {
            return json({ error: "Invalid JSON body" }, 400);
        }

        if (!body.clientId) {
            return json({ error: "clientId is required" }, 400);
        }

        // Look up membership
        const membership = await ctx.env.AUTH_DB
            .prepare(
                "SELECT id, userId, clientId, status, rolesJson FROM memberships WHERE userId = ? AND clientId = ? AND status = 'ACTIVE'",
            )
            .bind(ctx.auth.userId, body.clientId)
            .first<{ id: string; clientId: string; rolesJson: string }>();

        if (!membership) {
            return json({ error: "No active membership for this client" }, 403);
        }

        // Update session
        await ctx.env.AUTH_DB
            .prepare(
                "UPDATE sessions SET activeClientId = ? WHERE id = ?",
            )
            .bind(body.clientId, ctx.auth.sessionId)
            .run();

        // Invalidate session cache
        await ctx.env.AUTH_CACHE.delete(`session:${ctx.auth.sessionId}`);

        emitAuthenticatedAuditEvent(
            "AUTH_CLIENT_SELECTED",
            ctx.auth,
            ctx.correlationId,
            ctx.ipHash,
            ctx.env.AUTH_DB,
            { targetClientId: body.clientId },
        );

        let roles: string[] = [];
        try {
            roles = JSON.parse(membership.rolesJson) as string[];
        } catch {
            roles = [];
        }

        return json({
            ok: true,
            clientId: body.clientId,
            membershipId: membership.id,
            roles,
        });
    }

    // GET /v1/auth/sessions — list active sessions
    if (pathname === "/v1/auth/sessions" && request.method === "GET") {
        const sessions = await ctx.env.AUTH_DB
            .prepare(
                `SELECT id, audience, authMethod, mfaLevel, activeClientId,
                        createdAt, lastSeenAt, expiresAt, ipHash, userAgentHash
                 FROM sessions
                 WHERE userId = ? AND revokedAt IS NULL AND expiresAt > ?
                 ORDER BY lastSeenAt DESC
                 LIMIT 50`,
            )
            .bind(ctx.auth.userId, new Date().toISOString())
            .all();

        return json({ sessions: sessions.results ?? [] });
    }

    // DELETE /v1/auth/sessions/:id — revoke a specific session
    const sessionDeleteMatch = pathname.match(/^\/v1\/auth\/sessions\/([^/]+)$/);
    if (sessionDeleteMatch && request.method === "DELETE") {
        const targetSessionId = sessionDeleteMatch[1]!;

        // Verify session belongs to the user
        const targetSession = await ctx.env.AUTH_DB
            .prepare("SELECT id, userId FROM sessions WHERE id = ?")
            .bind(targetSessionId)
            .first<{ id: string; userId: string }>();

        if (!targetSession || targetSession.userId !== ctx.auth.userId) {
            return json({ error: "Session not found" }, 404);
        }

        const { revokeSession } = await import("./auth/session.js");
        await revokeSession(targetSessionId, ctx.env.AUTH_DB, ctx.env.AUTH_CACHE);

        emitAuthenticatedAuditEvent(
            "AUTH_SESSION_REVOKED",
            ctx.auth,
            ctx.correlationId,
            ctx.ipHash,
            ctx.env.AUTH_DB,
            { targetSessionId },
        );

        return json({ ok: true, message: "Session revoked" });
    }

    // GET /v1/auth/mfa/factors — list user's MFA factors
    if (pathname === "/v1/auth/mfa/factors" && request.method === "GET") {
        const factors = await ctx.env.AUTH_DB
            .prepare(
                `SELECT id as factorId, factorType, status, createdAt, lastUsedAt
                 FROM mfa_factors WHERE userId = ? AND status = 'ACTIVE'`,
            )
            .bind(ctx.auth.userId)
            .all();

        return json({ factors: factors.results ?? [] });
    }

    // GET /v1/auth/audit — list audit events
    if (pathname === "/v1/auth/audit" && request.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
        const events = await ctx.env.AUTH_DB
            .prepare(
                `SELECT id, actorType, actorId, eventType, occurredAt,
                        correlationId, severity, metadataJson
                 FROM audit_events WHERE clientId = ?
                 ORDER BY occurredAt DESC LIMIT ?`,
            )
            .bind(ctx.auth.clientId, limit)
            .all();

        return json({ events: events.results ?? [] });
    }

    return json({ error: "Not found", path: pathname }, 404);
}

// ─── Business API Handlers ───────────────────────────────────────────────────

async function handleApiRequest(
    request: Request,
    url: URL,
    ctx: AuthenticatedContext,
): Promise<Response> {
    const pathname = url.pathname;
    const method = request.method.toLowerCase();

    const route = documentedRoutes.find((candidate: RouteDoc) =>
        candidate.method === method && candidate.path === pathname,
    );

    if (!route) {
        return json({
            error: "Not found",
            path: pathname,
            method: request.method,
        }, 404);
    }

    if (route.requestBodySchema && ["post", "put", "patch"].includes(route.method)) {
        const validated = await validateRequestBody(request, route.requestBodySchema);
        if (!validated.ok) {
            return validated.response;
        }
    }

    return json({
        error: "Not implemented",
        message: "Endpoint contract is documented and validated, handler implementation is pending.",
        route: {
            method: request.method,
            path: pathname,
        },
        auth: {
            userId: ctx.auth.userId,
            clientId: ctx.auth.clientId,
            audience: ctx.auth.audience,
            roles: ctx.auth.roles,
        },
    }, 501, {
        "X-Correlation-Id": ctx.correlationId,
    });
}

// ─── Worker Entry Point ──────────────────────────────────────────────────────

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        try {
            // ─── CORS Preflight ──────────────────────────────────────────
            if (request.method === "OPTIONS") {
                return handlePreflight(request, env);
            }

            // ─── Authentication Middleware ────────────────────────────────
            const authResult = await authenticate(request, env);

            if (!authResult.allowed) {
                return addCorsHeaders(
                    applySecurityHeaders(authResult.response),
                    request,
                    env,
                );
            }

            const ctx = authResult.context;
            let response: Response;

            // ─── Route Dispatch ──────────────────────────────────────────

            // Public endpoints
            if (url.pathname === "/health") {
                response = json({
                    ok: true,
                    service: "realtyos-api",
                    timestamp: new Date().toISOString(),
                    version: "1.0.0",
                });
                return addCorsHeaders(applyPublicSecurityHeaders(response, 10), request, env);
            }

            if (url.pathname === "/openapi.json") {
                response = json(createOpenApiDocument(getBaseUrl(url)));
                return addCorsHeaders(applyPublicSecurityHeaders(response, 300), request, env);
            }

            if (url.pathname === "/docs") {
                response = html(docsHtml("/openapi.json"));
                return addCorsHeaders(applyHtmlSecurityHeaders(response), request, env);
            }

            // Auth endpoints
            if (url.pathname.startsWith("/v1/auth/")) {
                response = await handleAuthEndpoint(request, url, ctx);
                response = applySecurityHeaders(response);
                // Add correlation ID header
                const headers = new Headers(response.headers);
                headers.set("X-Correlation-Id", ctx.correlationId);
                response = new Response(response.body, {
                    status: response.status,
                    headers,
                });
                return addCorsHeaders(response, request, env);
            }

            // Business API endpoints
            if (url.pathname.startsWith("/v1/")) {
                response = await handleApiRequest(request, url, ctx);
                response = applySecurityHeaders(response);
                return addCorsHeaders(response, request, env);
            }

            // Root endpoint
            response = json({
                service: "realtyos-api",
                version: "1.0.0",
                docs: "/docs",
                openapi: "/openapi.json",
                health: "/health",
                auth: "/v1/auth/whoami",
            });
            return addCorsHeaders(applyPublicSecurityHeaders(response, 60), request, env);

        } catch (error) {
            // Global error handler — never leak stack traces
            console.error("Unhandled error:", error);

            const debug = env.AUTH_DEBUG === "true";
            const response = authSystemErrorResponse(
                undefined,
                debug,
                debug && error instanceof Error
                    ? { message: error.message, stack: error.stack }
                    : undefined,
            );
            return addCorsHeaders(applySecurityHeaders(response), request, env);
        }
    },
};
