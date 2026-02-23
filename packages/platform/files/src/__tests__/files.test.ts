import { describe, it, expect } from "vitest";
import {
  validateFileMetadata,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from "../types.js";
import { PresignRequestSchema } from "../presign.js";

describe("validateFileMetadata", () => {
  const validMetadata = {
    fileId: "file-1",
    clientId: "client-1",
    fileName: "report.pdf",
    mimeType: "application/pdf",
    sizeBytes: 1024,
    uploadedBy: "user-1",
    uploadedAt: new Date().toISOString(),
    scanStatus: "pending" as const,
  };

  it("should validate correct metadata", () => {
    const result = validateFileMetadata(validMetadata);
    expect(result.fileId).toBe("file-1");
    expect(result.scanStatus).toBe("pending");
  });

  it("should accept metadata with linkedResource", () => {
    const result = validateFileMetadata({
      ...validMetadata,
      linkedResource: { resourceType: "property", resourceId: "prop-1" },
    });
    expect(result.linkedResource?.resourceType).toBe("property");
  });

  it("should reject invalid metadata", () => {
    expect(() => validateFileMetadata({})).toThrow();
  });

  it("should reject invalid scanStatus", () => {
    expect(() =>
      validateFileMetadata({ ...validMetadata, scanStatus: "unknown" }),
    ).toThrow();
  });

  it("should have reasonable ALLOWED_MIME_TYPES", () => {
    expect(ALLOWED_MIME_TYPES.has("application/pdf")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("image/jpeg")).toBe(true);
    expect(ALLOWED_MIME_TYPES.has("application/exe")).toBe(false);
  });

  it("should define MAX_FILE_SIZE", () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});

describe("PresignRequestSchema", () => {
  it("should validate a correct presign request", () => {
    const result = PresignRequestSchema.parse({
      clientId: "client-1",
      fileId: "file-1",
      fileName: "doc.pdf",
      mimeType: "application/pdf",
      ttlSeconds: 300,
    });
    expect(result.ttlSeconds).toBe(300);
  });

  it("should reject ttlSeconds above 3600", () => {
    expect(() =>
      PresignRequestSchema.parse({
        clientId: "client-1",
        fileId: "file-1",
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        ttlSeconds: 7200,
      }),
    ).toThrow();
  });

  it("should reject ttlSeconds of 0", () => {
    expect(() =>
      PresignRequestSchema.parse({
        clientId: "client-1",
        fileId: "file-1",
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        ttlSeconds: 0,
      }),
    ).toThrow();
  });

  it("should require clientId and fileId (never presign by key alone)", () => {
    expect(() =>
      PresignRequestSchema.parse({
        fileName: "doc.pdf",
        mimeType: "application/pdf",
        ttlSeconds: 300,
      }),
    ).toThrow();
  });
});
