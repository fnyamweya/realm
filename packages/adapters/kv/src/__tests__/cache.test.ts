import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { KVCacheAdapter } from "../cache.js";
import type { KVNamespace } from "../cache.js";

function createMockKV(): KVNamespace {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

const TestSchema = z.object({
  name: z.string(),
  value: z.number(),
});

describe("KVCacheAdapter", () => {
  describe("get", () => {
    it("returns null on cache miss", async () => {
      const kv = createMockKV();
      const cache = new KVCacheAdapter(kv);

      const result = await cache.get("key-1", TestSchema);

      expect(result).toBeNull();
    });

    it("returns parsed data on cache hit", async () => {
      const kv = createMockKV();
      vi.mocked(kv.get).mockResolvedValue(
        JSON.stringify({ name: "test", value: 42 }),
      );
      const cache = new KVCacheAdapter(kv);

      const result = await cache.get("key-1", TestSchema);

      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("returns null and deletes invalid cached data", async () => {
      const kv = createMockKV();
      vi.mocked(kv.get).mockResolvedValue(
        JSON.stringify({ name: "test", value: "not-a-number" }),
      );
      const cache = new KVCacheAdapter(kv);

      const result = await cache.get("key-1", TestSchema);

      expect(result).toBeNull();
      expect(kv.delete).toHaveBeenCalledWith("key-1");
    });
  });

  describe("set", () => {
    it("serializes and stores value", async () => {
      const kv = createMockKV();
      const cache = new KVCacheAdapter(kv);

      await cache.set("key-1", { name: "test", value: 42 });

      expect(kv.put).toHaveBeenCalledWith(
        "key-1",
        JSON.stringify({ name: "test", value: 42 }),
        undefined,
      );
    });

    it("sets TTL when provided", async () => {
      const kv = createMockKV();
      const cache = new KVCacheAdapter(kv);

      await cache.set("key-1", { name: "test", value: 42 }, 300);

      expect(kv.put).toHaveBeenCalledWith(
        "key-1",
        JSON.stringify({ name: "test", value: 42 }),
        { expirationTtl: 300 },
      );
    });
  });

  describe("delete", () => {
    it("deletes the cached key", async () => {
      const kv = createMockKV();
      const cache = new KVCacheAdapter(kv);

      await cache.delete("key-1");

      expect(kv.delete).toHaveBeenCalledWith("key-1");
    });
  });
});
