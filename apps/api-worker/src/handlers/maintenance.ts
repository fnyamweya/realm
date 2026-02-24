import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { CreateMaintenanceRequestSchema } from "@realtyos/contracts-api";
import type { Env } from "../env.js";

export async function submitMaintenanceRequest(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = CreateMaintenanceRequestSchema.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to maintenance service
  const requestId = crypto.randomUUID();
  return Response.json(
    { data: { requestId, ...parsed.data, clientId: ctx.clientId } },
    { status: 201 },
  );
}

export async function listResidentMaintenanceRequests(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list maintenance requests for authenticated resident
  return Response.json({ data: { items: [], cursor: null } });
}

export async function listMaintenanceRequests(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list all maintenance requests (console)
  return Response.json({ data: { items: [], cursor: null } });
}

export async function assignMaintenanceRequest(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const requestId = params["requestId"];
  if (!requestId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing requestId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: assign maintenance request
  return Response.json({ data: { requestId, assigned: true } });
}
