import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { CreateLeaseRequest } from "@realtyos/contracts-api";
import type { Env } from "../env.js";

export async function createLease(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = CreateLeaseRequest.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to lease service
  const leaseId = crypto.randomUUID();
  return Response.json(
    { data: { leaseId, ...parsed.data, clientId: ctx.clientId } },
    { status: 201 },
  );
}

export async function listLeases(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list leases
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getLease(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const leaseId = params["leaseId"];
  if (!leaseId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing leaseId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: fetch lease
  return Response.json({ data: { leaseId, clientId: ctx.clientId } });
}

export async function transitionLease(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const leaseId = params["leaseId"];
  if (!leaseId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing leaseId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: validate transition and delegate
  return Response.json({ data: { leaseId, transitioned: true } });
}

export async function listResidentLeases(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list leases for authenticated resident
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getResidentLease(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const leaseId = params["leaseId"];
  if (!leaseId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing leaseId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: fetch lease scoped to resident
  return Response.json({ data: { leaseId } });
}
