import { describe, it, expect, vi } from "vitest";
import { createStructuredLogger, redactPII, PII_REDACT_KEYS } from "../logger.js";

describe("redactPII", () => {
  it("redacts email, phone, password, ssn, token, and secret fields", () => {
    const input = {
      email: "user@example.com",
      phone: "555-1234",
      password: "hunter2",
      ssn: "123-45-6789",
      token: "abc123",
      secret: "s3cret",
      name: "Alice",
    };
    const result = redactPII(input);

    expect(result["email"]).toBe("[REDACTED]");
    expect(result["phone"]).toBe("[REDACTED]");
    expect(result["password"]).toBe("[REDACTED]");
    expect(result["ssn"]).toBe("[REDACTED]");
    expect(result["token"]).toBe("[REDACTED]");
    expect(result["secret"]).toBe("[REDACTED]");
    expect(result["name"]).toBe("Alice");
  });

  it("redacts nested object fields", () => {
    const input = {
      user: {
        email: "nested@example.com",
        displayName: "Bob",
        credentials: {
          password: "p@ss",
          token: "tok",
        },
      },
    };
    const result = redactPII(input);
    const user = result["user"] as Record<string, unknown>;
    const credentials = user["credentials"] as Record<string, unknown>;

    expect(user["email"]).toBe("[REDACTED]");
    expect(user["displayName"]).toBe("Bob");
    expect(credentials["password"]).toBe("[REDACTED]");
    expect(credentials["token"]).toBe("[REDACTED]");
  });

  it("preserves non-PII fields unchanged", () => {
    const input = { status: "active", count: 42 };
    const result = redactPII(input);

    expect(result["status"]).toBe("active");
    expect(result["count"]).toBe(42);
  });
});

describe("createStructuredLogger", () => {
  it("outputs structured JSON with level and message", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createStructuredLogger({ correlationId: "corr-1" });

    logger.info("hello");

    expect(logSpy).toHaveBeenCalledOnce();
    const output = JSON.parse(logSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(output["level"]).toBe("info");
    expect(output["message"]).toBe("hello");
    expect(output["correlationId"]).toBe("corr-1");
    expect(output["timestamp"]).toBeDefined();

    logSpy.mockRestore();
  });

  it("propagates correlationId and clientId from base context", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createStructuredLogger({ correlationId: "corr-2", clientId: "client-1" });

    logger.info("test");

    const output = JSON.parse(logSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(output["correlationId"]).toBe("corr-2");
    expect(output["clientId"]).toBe("client-1");

    logSpy.mockRestore();
  });

  it("merges per-call context with base context", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createStructuredLogger({ correlationId: "corr-3" });

    logger.info("test", { actorId: "actor-1" });

    const output = JSON.parse(logSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    expect(output["correlationId"]).toBe("corr-3");
    expect(output["actorId"]).toBe("actor-1");

    logSpy.mockRestore();
  });

  it("automatically redacts PII in data", () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const logger = createStructuredLogger({ correlationId: "corr-4" });

    logger.info("user lookup", undefined, {
      email: "user@example.com",
      userId: "u-123",
    });

    const output = JSON.parse(logSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    const data = output["data"] as Record<string, unknown>;
    expect(data["email"]).toBe("[REDACTED]");
    expect(data["userId"]).toBe("u-123");

    logSpy.mockRestore();
  });

  it("logs at different levels", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createStructuredLogger({ correlationId: "corr-5" });

    logger.warn("warning");
    logger.error("error");
    logger.debug("debug");

    const warnOutput = JSON.parse(warnSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    const errorOutput = JSON.parse(errorSpy.mock.calls[0]![0] as string) as Record<string, unknown>;
    const debugOutput = JSON.parse(debugSpy.mock.calls[0]![0] as string) as Record<string, unknown>;

    expect(warnOutput["level"]).toBe("warn");
    expect(errorOutput["level"]).toBe("error");
    expect(debugOutput["level"]).toBe("debug");

    warnSpy.mockRestore();
    errorSpy.mockRestore();
    debugSpy.mockRestore();
  });
});
