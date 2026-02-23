import { describe, it, expect } from "vitest";
import {
  createErrorResponse,
  getHttpStatus,
  ErrorCode,
  httpStatusMap,
} from "../index.js";

describe("Error Envelope", () => {
  it("creates a standard error response with correct status", () => {
    const result = createErrorResponse(
      ErrorCode.NOT_FOUND,
      "Resource not found",
      "corr-123",
    );

    expect(result.status).toBe(404);
    expect(result.body.code).toBe("NOT_FOUND");
    expect(result.body.message).toBe("Resource not found");
    expect(result.body.correlationId).toBe("corr-123");
    expect(result.body.detailsSafe).toBeUndefined();
  });

  it("includes detailsSafe when provided", () => {
    const result = createErrorResponse(
      ErrorCode.VALIDATION_FAILED,
      "Validation failed",
      "corr-456",
      { field: "email", reason: "invalid format" },
    );

    expect(result.status).toBe(422);
    expect(result.body.detailsSafe).toEqual({
      field: "email",
      reason: "invalid format",
    });
  });

  it("never includes PII fields in the envelope", () => {
    const result = createErrorResponse(
      ErrorCode.BAD_REQUEST,
      "Bad request",
      "corr-789",
    );

    const bodyKeys = Object.keys(result.body);
    expect(bodyKeys).not.toContain("email");
    expect(bodyKeys).not.toContain("name");
    expect(bodyKeys).not.toContain("ssn");
    expect(bodyKeys).not.toContain("password");
  });

  it("maps all error codes to HTTP status codes", () => {
    const codes: ErrorCode[] = [
      ErrorCode.BAD_REQUEST,
      ErrorCode.UNAUTHORIZED,
      ErrorCode.FORBIDDEN,
      ErrorCode.NOT_FOUND,
      ErrorCode.CONFLICT,
      ErrorCode.RATE_LIMITED,
      ErrorCode.VALIDATION_FAILED,
      ErrorCode.INTERNAL_ERROR,
      ErrorCode.SERVICE_UNAVAILABLE,
    ];

    for (const code of codes) {
      expect(getHttpStatus(code)).toBeGreaterThanOrEqual(400);
      expect(getHttpStatus(code)).toBeLessThan(600);
    }
  });

  it("returns correct status codes for known error codes", () => {
    expect(httpStatusMap.BAD_REQUEST).toBe(400);
    expect(httpStatusMap.UNAUTHORIZED).toBe(401);
    expect(httpStatusMap.FORBIDDEN).toBe(403);
    expect(httpStatusMap.NOT_FOUND).toBe(404);
    expect(httpStatusMap.CONFLICT).toBe(409);
    expect(httpStatusMap.RATE_LIMITED).toBe(429);
    expect(httpStatusMap.VALIDATION_FAILED).toBe(422);
    expect(httpStatusMap.INTERNAL_ERROR).toBe(500);
    expect(httpStatusMap.SERVICE_UNAVAILABLE).toBe(503);
  });
});
