import * as Contracts from "@realtyos/contracts-api";
import { createOpenApiDocument, getDocumentedRoutes } from "./openapi.js";
import type { RouteDoc } from "./openapi.js";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
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

async function handleApiRequest(request: Request, url: URL): Promise<Response> {
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
  }, 501);
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          "access-control-allow-headers": "content-type,authorization",
          "access-control-max-age": "86400",
        },
      });
    }

    if (url.pathname === "/health") {
      return json({
        ok: true,
        service: "realtyos-api",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/openapi.json") {
      return json(createOpenApiDocument(getBaseUrl(url)));
    }

    if (url.pathname === "/docs") {
      return html(docsHtml("/openapi.json"));
    }

    if (url.pathname.startsWith("/v1/")) {
      return handleApiRequest(request, url);
    }

    return json({
      service: "realtyos-api",
      docs: "/docs",
      openapi: "/openapi.json",
      health: "/health",
    });
  },
};
