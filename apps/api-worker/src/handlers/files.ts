import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import type { Env } from "../env.js";

export async function getUploadUrl(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const body: unknown = await req.json();
  // TODO: validate presign request and generate upload URL via R2
  const fileId = crypto.randomUUID();
  return Response.json({ data: { fileId, uploadUrl: `https://files.example.com/${fileId}` } });
}

export async function completeUpload(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const fileId = params["fileId"];
  if (!fileId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing fileId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: mark file upload as complete
  return Response.json({ data: { fileId, completed: true } });
}

export async function getDownloadUrl(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const fileId = params["fileId"];
  if (!fileId) {
    const { status, body } = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Missing fileId",
      ctx.correlationId,
    );
    return Response.json({ error: body }, { status });
  }

  // TODO: generate download URL via R2
  return Response.json({ data: { fileId, downloadUrl: `https://files.example.com/${fileId}` } });
}
