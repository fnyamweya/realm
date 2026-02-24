import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import type { Env } from "../env.js";

const PUBLIC_PREFIXES = [
  "/v1/auth/resident/login",
  "/v1/auth/resident/password-reset",
  "/v1/auth/oidc/",
  "/v1/auth/mfa/challenge",
  "/v1/auth/mfa/verify",
];

function isPublicRoute(path: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function resolveAuth(
  request: Request,
  env: Env,
  ctx: RequestContext,
): Promise<{ authenticated: boolean; errorResponse: Response | undefined }> {
  if (isPublicRoute(ctx.path)) {
    return { authenticated: false, errorResponse: undefined };
  }

  const sessionCookie = request.headers.get("Cookie")?.match(/session=([^;]+)/)?.[1];
  const apiKey = request.headers.get("X-Api-Key");

  if (!sessionCookie && !apiKey) {
    if (ctx.path.startsWith("/v1/auth/")) {
      return { authenticated: false, errorResponse: undefined };
    }

    const { status, body } = createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      "Authentication required",
      ctx.correlationId,
    );
    return {
      authenticated: false,
      errorResponse: Response.json({ error: body }, { status }),
    };
  }

  // TODO: validate session/api-key and populate ctx.actorId, ctx.clientId
  return { authenticated: true, errorResponse: undefined };
}
