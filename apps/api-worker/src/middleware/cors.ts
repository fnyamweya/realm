export function handleCors(request: Request): Response | undefined {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request),
    });
  }
  return undefined;
}

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("Origin") ?? "*";
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Correlation-Id, X-Api-Key");
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set("Access-Control-Max-Age", "86400");
  return headers;
}

export function withCorsHeaders(response: Response, request: Request): Response {
  const cors = corsHeaders(request);
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
