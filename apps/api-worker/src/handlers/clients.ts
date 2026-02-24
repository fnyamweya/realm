import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { z } from "zod";
import type { Env } from "../env.js";

const CreateClientRequest = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
}).strict();

export async function createClient(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  const parsed = CreateClientRequest.safeParse(body);
  if (!parsed.success) {
    const { status, body: errBody } = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Invalid request body",
      ctx.correlationId,
      { issues: parsed.error.issues },
    );
    return Response.json({ error: errBody }, { status });
  }

  // TODO: delegate to command service
  const clientId = crypto.randomUUID();
  return Response.json(
    { data: { clientId, name: parsed.data.name, slug: parsed.data.slug } },
    { status: 201 },
  );
}

export async function listClients(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  // TODO: list clients
  return Response.json({ data: { items: [], cursor: null } });
}

export async function getClient(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const clientId = params["clientId"];
  if (!clientId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing clientId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: fetch client
  return Response.json({ data: { clientId, name: "stub", slug: "stub" } });
}
