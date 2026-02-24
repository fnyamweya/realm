import { describe, it, expect } from "vitest";
import { Router } from "../router.js";

describe("Router", () => {
  it("matches a simple GET route", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.get("/v1/properties", handler);

    const match = router.match("GET", "http://localhost/v1/properties");
    expect(match).toBeDefined();
    expect(match!.handler).toBe(handler);
  });

  it("extracts path parameters", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.get("/v1/properties/:propertyId", handler);

    const match = router.match("GET", "http://localhost/v1/properties/abc-123");
    expect(match).toBeDefined();
    expect(match!.params["propertyId"]).toBe("abc-123");
  });

  it("returns undefined for unmatched routes", () => {
    const router = new Router();
    router.get("/v1/properties", async () => new Response("ok"));

    const match = router.match("GET", "http://localhost/v1/unknown");
    expect(match).toBeUndefined();
  });

  it("does not match wrong HTTP method", () => {
    const router = new Router();
    router.post("/v1/properties", async () => new Response("ok"));

    const match = router.match("GET", "http://localhost/v1/properties");
    expect(match).toBeUndefined();
  });

  it("matches nested path parameters", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.post("/v1/properties/:propertyId/units", handler);

    const match = router.match("POST", "http://localhost/v1/properties/prop-1/units");
    expect(match).toBeDefined();
    expect(match!.params["propertyId"]).toBe("prop-1");
    expect(match!.handler).toBe(handler);
  });

  it("supports DELETE routes", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.delete("/v1/auth/api-keys/:id", handler);

    const match = router.match("DELETE", "http://localhost/v1/auth/api-keys/key-99");
    expect(match).toBeDefined();
    expect(match!.params["id"]).toBe("key-99");
  });

  it("supports PUT routes", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.put("/v1/finance/policies/:kind", handler);

    const match = router.match("PUT", "http://localhost/v1/finance/policies/late-fee");
    expect(match).toBeDefined();
    expect(match!.params["kind"]).toBe("late-fee");
  });

  it("supports PATCH routes", () => {
    const router = new Router();
    const handler = async () => new Response("ok");
    router.patch("/v1/properties/:propertyId", handler);

    const match = router.match("PATCH", "http://localhost/v1/properties/prop-1");
    expect(match).toBeDefined();
    expect(match!.params["propertyId"]).toBe("prop-1");
  });
});
