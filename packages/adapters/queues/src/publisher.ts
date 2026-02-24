import { z } from "zod";

export const QueueMessageSchema = z.object({
  messageId: z.string(),
  eventType: z.string(),
  payload: z.unknown(),
  clientId: z.string(),
  correlationId: z.string(),
  retryCount: z.number().int().min(0),
  maxRetries: z.number().int().min(0),
  createdAt: z.string(),
});

export type QueueMessage = z.infer<typeof QueueMessageSchema>;

/** Publishes messages to a named queue. */
export interface QueuePublisher {
  publish(
    queueName: string,
    message: unknown,
    options?: { delaySeconds?: number },
  ): Promise<void>;
}
