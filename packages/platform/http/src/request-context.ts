// ─── Request Context ─────────────────────────────────────────────────────────

export interface RequestContext {
  correlationId: string;
  clientId?: string;
  actorId?: string;
  membershipId?: string;
  startTime: number;
  path: string;
  method: string;
}

/** Standard middleware signature. */
export type Middleware = (
  ctx: RequestContext,
  next: () => Promise<Response>,
) => Promise<Response>;

/**
 * Creates a RequestContext from a standard Request object.
 * Extracts or generates a correlationId from the `x-correlation-id` header.
 */
export function createRequestContext(request: Request): RequestContext {
  const url = new URL(request.url);
  const correlationId =
    request.headers.get("x-correlation-id") ?? generateId();

  return {
    correlationId,
    startTime: Date.now(),
    path: url.pathname,
    method: request.method,
  };
}

function generateId(): string {
  return crypto.randomUUID();
}
