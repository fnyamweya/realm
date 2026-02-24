import type { RequestContext } from "@realtyos/http";
import type { Env } from "../env.js";

export async function getResolvedConfig(
  req: Request,
  params: Record<string, string>,
  env: Env,
  ctx: RequestContext,
): Promise<Response> {
  const clientId = ctx.clientId;
  // TODO: resolve merged config for client
  return Response.json({ data: { clientId: clientId ?? null, config: {} } });
}
