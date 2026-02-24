import { describe, it, expect, vi } from "vitest";
import { R2StorageAdapter } from "../storage.js";
import type { R2Bucket } from "../storage.js";

function createMockBucket(): R2Bucket {
  return {
    get: vi.fn().mockResolvedValue(null),
    put: vi.fn().mockResolvedValue({ key: "", size: 0, etag: "" }),
    delete: vi.fn().mockResolvedValue(undefined),
    list: vi.fn().mockResolvedValue({ objects: [], truncated: false }),
  };
}

describe("R2StorageAdapter", () => {
  describe("scopedKey", () => {
    it("scopes object key by clientId", () => {
      const key = R2StorageAdapter.scopedKey("client-1", "file-1");
      expect(key).toBe("client-1/file-1");
    });

    it("throws when clientId is empty", () => {
      expect(() => R2StorageAdapter.scopedKey("", "file-1")).toThrow(
        "clientId and fileId are required",
      );
    });

    it("throws when fileId is empty", () => {
      expect(() => R2StorageAdapter.scopedKey("client-1", "")).toThrow(
        "clientId and fileId are required",
      );
    });
  });

  describe("object operations are scoped", () => {
    it("getObject uses scoped key", async () => {
      const bucket = createMockBucket();
      const adapter = new R2StorageAdapter(bucket, async () => true);

      await adapter.getObject("client-1", "file-1");

      expect(bucket.get).toHaveBeenCalledWith("client-1/file-1");
    });

    it("putObject uses scoped key", async () => {
      const bucket = createMockBucket();
      const adapter = new R2StorageAdapter(bucket, async () => true);

      await adapter.putObject("client-1", "file-1", "data");

      expect(bucket.put).toHaveBeenCalledWith(
        "client-1/file-1",
        "data",
        undefined,
      );
    });

    it("deleteObject uses scoped key", async () => {
      const bucket = createMockBucket();
      const adapter = new R2StorageAdapter(bucket, async () => true);

      await adapter.deleteObject("client-1", "file-1");

      expect(bucket.delete).toHaveBeenCalledWith("client-1/file-1");
    });

    it("listObjects uses clientId prefix", async () => {
      const bucket = createMockBucket();
      const adapter = new R2StorageAdapter(bucket, async () => true);

      await adapter.listObjects("client-1");

      expect(bucket.list).toHaveBeenCalledWith(
        expect.objectContaining({ prefix: "client-1/" }),
      );
    });
  });

  describe("access check", () => {
    it("denies presign when access check fails", async () => {
      const bucket = createMockBucket();
      const adapter = new R2StorageAdapter(bucket, async () => false);

      await expect(
        adapter.generateUploadUrl({
          clientId: "client-1",
          fileId: "file-1",
          fileName: "doc.pdf",
          mimeType: "application/pdf",
          ttlSeconds: 3600,
        }),
      ).rejects.toThrow("Access denied");
    });
  });
});
