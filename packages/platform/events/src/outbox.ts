import { z } from "zod";

export const OutboxEntryStatus = z.enum(["pending", "published", "failed"]);

export const OutboxEntrySchema = z.object({
  id: z.string(),
  clientId: z.string(),
  eventType: z.string(),
  payload: z.string(),
  status: OutboxEntryStatus,
  retryCount: z.number(),
  createdAt: z.string(),
  publishedAt: z.string().optional(),
  failedAt: z.string().optional(),
  errorMessage: z.string().optional(),
});

export type OutboxEntry = z.infer<typeof OutboxEntrySchema>;

export interface OutboxRepository {
  insert(entry: OutboxEntry): Promise<void>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
  getPending(clientId: string, limit: number): Promise<OutboxEntry[]>;
  getDeadLetters(clientId: string, limit: number): Promise<OutboxEntry[]>;
}
