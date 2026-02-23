import { describe, it, expect, vi } from "vitest";
import { ScopedQueryBuilder } from "../query-builder.js";
import type { D1Database, D1PreparedStatement } from "../client.js";

function createMockDb(): D1Database {
  const mockStatement: D1PreparedStatement = {
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    run: vi.fn().mockResolvedValue({ results: [], success: true, meta: { duration: 0 } }),
    all: vi.fn().mockResolvedValue({ results: [], success: true, meta: { duration: 0 } }),
  };

  return {
    prepare: vi.fn().mockReturnValue(mockStatement),
    batch: vi.fn().mockResolvedValue([]),
    exec: vi.fn().mockResolvedValue({ count: 0, duration: 0 }),
  };
}

describe("ScopedQueryBuilder", () => {
  describe("clientId guard", () => {
    it("throws when clientId is empty string", async () => {
      const db = createMockDb();
      const builder = new ScopedQueryBuilder(db, "properties");

      await expect(builder.findByIdScoped("", "id-1")).rejects.toThrow(
        "clientId is required",
      );
    });

    it("throws when clientId is undefined", async () => {
      const db = createMockDb();
      const builder = new ScopedQueryBuilder(db, "properties");

      await expect(
        builder.findByIdScoped(undefined as unknown as string, "id-1"),
      ).rejects.toThrow("clientId is required");
    });

    it("throws when clientId is null", async () => {
      const db = createMockDb();
      const builder = new ScopedQueryBuilder(db, "properties");

      await expect(
        builder.findByIdScoped(null as unknown as string, "id-1"),
      ).rejects.toThrow("clientId is required");
    });
  });

  describe("findByIdScoped", () => {
    it("includes clientId in WHERE clause", async () => {
      const db = createMockDb();
      const builder = new ScopedQueryBuilder(db, "properties");

      await builder.findByIdScoped("client-1", "id-1");

      expect(db.prepare).toHaveBeenCalledWith(
        expect.stringContaining("client_id = ?"),
      );
      const stmt = db.prepare("") as unknown as { bind: ReturnType<typeof vi.fn> };
      expect(stmt.bind).toHaveBeenCalledWith("client-1", "id-1");
    });
  });

  describe("no unscoped findById", () => {
    it("does not have a findById method", () => {
      const db = createMockDb();
      const builder = new ScopedQueryBuilder(db, "properties");

      expect("findById" in builder).toBe(false);
    });
  });
});
