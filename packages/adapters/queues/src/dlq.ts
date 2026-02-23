import { z } from "zod";

export const DeadLetterEntrySchema = z.object({
  messageId: z.string(),
  eventType: z.string(),
  payload: z.unknown(),
  clientId: z.string(),
  correlationId: z.string(),
  error: z.string(),
  failedAt: z.string(),
});

export type DeadLetterEntry = z.infer<typeof DeadLetterEntrySchema>;

/** Stores and retrieves dead-letter messages. */
export interface DeadLetterStore {
  store(entry: DeadLetterEntry): Promise<void>;
  list(clientId: string, limit: number): Promise<DeadLetterEntry[]>;
}
