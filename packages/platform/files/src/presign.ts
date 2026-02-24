import { z } from "zod";

export const PresignRequestSchema = z.object({
  clientId: z.string(),
  fileId: z.string(),
  fileName: z.string(),
  mimeType: z.string(),
  ttlSeconds: z.number().int().min(1).max(3600),
});

export type PresignRequest = z.infer<typeof PresignRequestSchema>;

/**
 * Port for generating presigned URLs.
 * NEVER presign by object key alone — always require clientId + fileId + access check.
 */
export interface FilePresigner {
  generateUploadUrl(
    req: PresignRequest,
  ): Promise<{ url: string; expiresAt: string }>;

  generateDownloadUrl(
    clientId: string,
    fileId: string,
    ttlSeconds: number,
  ): Promise<{ url: string; expiresAt: string }>;
}
