import type { OutboxRepository } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";

const OUTBOX_BATCH_LIMIT = 50;

/**
 * Reads pending outbox entries from D1 and publishes them to the queue.
 * Called by the scheduled (cron) handler.
 */
export async function dispatchOutboxEvents(deps: {
  env: Env;
  clientId: string;
  outboxRepository: OutboxRepository;
  logger: Logger;
  correlationId: string;
}): Promise<{ dispatched: number; failed: number }> {
  const { env, clientId, outboxRepository, logger, correlationId } = deps;

  const pending = await outboxRepository.getPending(clientId, OUTBOX_BATCH_LIMIT);

  if (pending.length === 0) {
    logger.debug("No pending outbox events", { correlationId, clientId });
    return { dispatched: 0, failed: 0 };
  }

  logger.info(`Dispatching ${pending.length} outbox events`, { correlationId, clientId });

  let dispatched = 0;
  let failed = 0;

  for (const entry of pending) {
    try {
      const message = {
        messageId: entry.id,
        eventType: entry.eventType,
        payload: JSON.parse(entry.payload),
        clientId: entry.clientId,
        correlationId,
        retryCount: 0,
        maxRetries: 3,
        createdAt: entry.createdAt,
      };

      await env.EVENTS_QUEUE.send(message);
      await outboxRepository.markPublished(entry.id);
      dispatched++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Failed to dispatch outbox entry ${entry.id}`, {
        correlationId,
        clientId,
      }, { error: errorMessage, entryId: entry.id });
      await outboxRepository.markFailed(entry.id, errorMessage);
      failed++;
    }
  }

  logger.info("Outbox dispatch complete", { correlationId, clientId }, {
    dispatched: String(dispatched),
    failed: String(failed),
  });

  return { dispatched, failed };
}
