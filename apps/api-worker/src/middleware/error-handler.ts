import { createErrorResponse, ErrorCode } from "@realtyos/http";
import type { RequestContext } from "@realtyos/http";
import { createStructuredLogger } from "@realtyos/observability";
import type { RouteHandler } from "../router.js";
import type { Env } from "../env.js";

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req: Request, params: Record<string, string>, env: Env, ctx: RequestContext) => {
    const logger = createStructuredLogger({
      service: "api-worker",
      correlationId: ctx.correlationId,
    });

    try {
      return await handler(req, params, env, ctx);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";

      logger.error("Unhandled error in request handler", {
        error: message,
        path: ctx.path,
        method: ctx.method,
      });

      const { status, body } = createErrorResponse(
        ErrorCode.INTERNAL_ERROR,
        "An internal error occurred",
        ctx.correlationId,
      );

      return Response.json(
        { error: body },
        { status },
      );
    }
  };
}
