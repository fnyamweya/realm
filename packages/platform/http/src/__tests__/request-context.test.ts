import { describe, it, expect } from "vitest";
import { createRequestContext } from "../index.js";

describe("Request Context", () => {
  it("creates context from a request with correlation ID header", () => {
    const request = new Request("https://api.example.com/v1/properties", {
      method: "GET",
      headers: { "x-correlation-id": "test-corr-id" },
    });

    const ctx = createRequestContext(request);

    expect(ctx.correlationId).toBe("test-corr-id");
    expect(ctx.path).toBe("/v1/properties");
    expect(ctx.method).toBe("GET");
    expect(ctx.startTime).toBeGreaterThan(0);
  });

  it("generates a correlation ID when header is missing", () => {
    const request = new Request("https://api.example.com/v1/leases", {
      method: "POST",
    });

    const ctx = createRequestContext(request);

    expect(ctx.correlationId).toBeDefined();
    expect(ctx.correlationId.length).toBeGreaterThan(0);
    expect(ctx.path).toBe("/v1/leases");
    expect(ctx.method).toBe("POST");
  });

  it("does not populate optional fields by default", () => {
    const request = new Request("https://api.example.com/health", {
      method: "GET",
    });

    const ctx = createRequestContext(request);

    expect(ctx.clientId).toBeUndefined();
    expect(ctx.actorId).toBeUndefined();
    expect(ctx.membershipId).toBeUndefined();
  });

  it("generates unique correlation IDs for different requests", () => {
    const req1 = new Request("https://api.example.com/a");
    const req2 = new Request("https://api.example.com/b");

    const ctx1 = createRequestContext(req1);
    const ctx2 = createRequestContext(req2);

    expect(ctx1.correlationId).not.toBe(ctx2.correlationId);
  });
});
