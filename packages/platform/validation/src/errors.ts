import { z } from "zod";

export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  RATE_LIMITED: "RATE_LIMITED",
  CLIENT_SCOPE_VIOLATION: "CLIENT_SCOPE_VIOLATION",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const ErrorCodeEnum = z.enum([
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "CONFLICT",
  "INTERNAL_ERROR",
  "RATE_LIMITED",
  "CLIENT_SCOPE_VIOLATION",
]);

export const ApiErrorEnvelope = z.object({
  code: ErrorCodeEnum,
  message: z.string(),
  correlationId: z.string(),
  detailsSafe: z.unknown().optional(),
});
export type ApiErrorEnvelope = z.infer<typeof ApiErrorEnvelope>;
