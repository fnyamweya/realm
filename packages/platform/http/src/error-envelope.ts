import { z } from "zod";

// ─── Error Codes ─────────────────────────────────────────────────────────────

export const ErrorCode = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Maps error codes to HTTP status codes. */
export const httpStatusMap: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  VALIDATION_FAILED: 422,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// ─── Error Envelope ──────────────────────────────────────────────────────────

export const ErrorEnvelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  correlationId: z.string(),
  detailsSafe: z.record(z.unknown()).optional(),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;

/**
 * Creates a standard error envelope. Never includes PII — only safe,
 * client-facing information is returned.
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  correlationId: string,
  detailsSafe?: Record<string, unknown>,
): { status: number; body: ErrorEnvelope } {
  return {
    status: httpStatusMap[code],
    body: {
      code,
      message,
      correlationId,
      ...(detailsSafe ? { detailsSafe } : {}),
    },
  };
}

/** Resolves the HTTP status code for a given error code. */
export function getHttpStatus(code: ErrorCode): number {
  return httpStatusMap[code];
}
