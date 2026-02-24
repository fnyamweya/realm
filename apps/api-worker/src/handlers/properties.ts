import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { CreatePropertyRequest, ListPropertiesRequest } from "@realtyos/contracts-api";
import type { Env } from "../env.js";

export async function createProperty(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = CreatePropertyRequest.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to property service
  const propertyId = crypto.randomUUID();
  return Response.json(
    { data: { propertyId, ...parsed.data, clientId: ctx.clientId } },
    { status: 201 },
  );
}

export async function listProperties(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const url = new URL(req.url);
  const query = Object.fromEntries(url.searchParams);
  const parsed = ListPropertiesRequest.safeParse(query);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid query parameters",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: query properties from D1
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getProperty(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const propertyId = params["propertyId"];
  if (!propertyId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing propertyId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: fetch property
  return Response.json({ data: { propertyId, clientId: ctx.clientId } });
}

export async function updateProperty(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const propertyId = params["propertyId"];
  if (!propertyId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing propertyId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: validate partial update and delegate
  return Response.json({ data: { propertyId, updated: true } });
}

export async function createUnit(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const propertyId = params["propertyId"];
  if (!propertyId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing propertyId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: validate and create unit
  const unitId = crypto.randomUUID();
  return Response.json(
    { data: { unitId, propertyId, clientId: ctx.clientId } },
    { status: 201 },
  );
}

export async function listUnits(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const _propertyId = params["propertyId"];
  // TODO: list units for property
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getUnit(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const unitId = params["unitId"];
  if (!unitId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing unitId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: fetch unit
  return Response.json({ data: { unitId, clientId: ctx.clientId } });
}

export async function updateUnit(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const unitId = params["unitId"];
  if (!unitId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing unitId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  const body: unknown = await req.json();
  // TODO: validate and update unit
  return Response.json({ data: { unitId, updated: true } });
}
