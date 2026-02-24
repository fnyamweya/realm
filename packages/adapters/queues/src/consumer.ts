import { QueueMessageSchema } from "./publisher.js";
import type { QueueMessage } from "./publisher.js";
import type { DeadLetterStore } from "./dlq.js";

/**
 * Handles a single queue message.
 * Jobs must be idempotent — consumers should check idempotency before processing.
 */
export interface QueueConsumer {
  handle(message: QueueMessage): Promise<"success" | "retry" | "dead-letter">;
}

/**
 * Creates a batch consumer handler that routes messages to the appropriate consumer
 * based on eventType, validates with Zod, and handles retries/DLQ.
 */
export function createConsumerHandler(
  handlers: Map<string, QueueConsumer>,
  dlq?: DeadLetterStore,
): (batch: unknown) => Promise<void> {
  return async (batch: unknown) => {
    const messages = Array.isArray(batch) ? batch : [];

    for (const raw of messages) {
      const parsed = QueueMessageSchema.safeParse(raw);
      if (!parsed.success) {
        if (dlq) {
          await dlq.store({
            messageId: typeof raw === "object" && raw !== null && "messageId" in raw
              ? String((raw as Record<string, unknown>)["messageId"])
              : "unknown",
            eventType: "unknown",
            payload: raw,
            clientId: "unknown",
            correlationId: "unknown",
            error: `Validation failed: ${parsed.error.message}`,
            failedAt: new Date().toISOString(),
          });
        }
        continue;
      }

      const message = parsed.data;
      const consumer = handlers.get(message.eventType);

      if (!consumer) {
        if (dlq) {
          await dlq.store({
            messageId: message.messageId,
            eventType: message.eventType,
            payload: message.payload,
            clientId: message.clientId,
            correlationId: message.correlationId,
            error: `No handler registered for eventType: ${message.eventType}`,
            failedAt: new Date().toISOString(),
          });
        }
        continue;
      }

      const result = await consumer.handle(message);

      if (result === "dead-letter" || (result === "retry" && message.retryCount >= message.maxRetries)) {
        if (dlq) {
          await dlq.store({
            messageId: message.messageId,
            eventType: message.eventType,
            payload: message.payload,
            clientId: message.clientId,
            correlationId: message.correlationId,
            error: result === "dead-letter" ? "Consumer rejected message" : "Max retries exceeded",
            failedAt: new Date().toISOString(),
          });
        }
      }
    }
  };
}
