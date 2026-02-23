import { z } from "zod";

export const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** 50 MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export const FileMetadataSchema = z.object({
  fileId: z.string(),
  clientId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  uploadedBy: z.string(),
  uploadedAt: z.string(),
  scanStatus: z.enum(["pending", "clean", "infected", "error"]),
  linkedResource: z
    .object({
      resourceType: z.string(),
      resourceId: z.string(),
    })
    .optional(),
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export function validateFileMetadata(metadata: unknown): FileMetadata {
  return FileMetadataSchema.parse(metadata);
}
