import type { QueueConsumer } from "@realtyos/adapter-queues";
import { createConsumerHandler } from "@realtyos/adapter-queues";
import type { IdempotencyStore } from "@realtyos/events";
import { createStructuredLogger } from "@realtyos/observability";
import { generateId } from "@realtyos/validation";
import type { Env } from "./env.js";
import { createPaymentAllocationConsumer } from "./consumers/payment-allocation.js";
import { createLateFeeRunConsumer } from "./consumers/late-fee-run.js";
import { createInterestAccrualConsumer } from "./consumers/interest-accrual.js";
import { createReminderSchedulerConsumer } from "./consumers/reminder-scheduler.js";
import { dispatchOutboxEvents } from "./consumers/outbox-dispatcher.js";
import type { OutboxRepository } from "@realtyos/events";

/** D1-backed idempotency store using the processed_markers table. */
function createD1IdempotencyStore(db: D1Database): IdempotencyStore {
  return {
    async isProcessed(clientId: string, eventId: string, handlerName: string): Promise<boolean> {
      const result = await db
        .prepare(
          "SELECT 1 FROM processed_markers WHERE client_id = ? AND event_id = ? AND handler_name = ? LIMIT 1",
        )
        .bind(clientId, eventId, handlerName)
        .first();
      return result !== null;
    },
    async markProcessed(marker): Promise<void> {
      await db
        .prepare(
          "INSERT INTO processed_markers (client_id, event_id, handler_name, processed_at) VALUES (?, ?, ?, ?)",
        )
        .bind(marker.clientId, marker.eventId, marker.handlerName, marker.processedAt)
        .run();
    },
  };
}

/** D1-backed outbox repository using the outbox_events table. */
function createD1OutboxRepository(db: D1Database): OutboxRepository {
  return {
    async insert(entry): Promise<void> {
      await db
        .prepare(
          "INSERT INTO outbox_events (id, client_id, event_type, payload, status, retry_count, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(entry.id, entry.clientId, entry.eventType, entry.payload, entry.status, entry.retryCount, entry.createdAt)
        .run();
    },
    async markPublished(id: string): Promise<void> {
      await db
        .prepare("UPDATE outbox_events SET status = 'published', published_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), id)
        .run();
    },
    async markFailed(id: string, error: string): Promise<void> {
      await db
        .prepare(
          "UPDATE outbox_events SET status = 'failed', failed_at = ?, error_message = ?, retry_count = retry_count + 1 WHERE id = ?",
        )
        .bind(new Date().toISOString(), error, id)
        .run();
    },
    async getPending(clientId: string, limit: number) {
      const result = await db
        .prepare("SELECT * FROM outbox_events WHERE client_id = ? AND status = 'pending' ORDER BY created_at ASC LIMIT ?")
        .bind(clientId, limit)
        .all();
      return (result.results ?? []).map((row) => ({
        id: String(row["id"]),
        clientId: String(row["client_id"]),
        eventType: String(row["event_type"]),
        payload: String(row["payload"]),
        status: String(row["status"]) as "pending" | "published" | "failed",
        retryCount: Number(row["retry_count"]),
        createdAt: String(row["created_at"]),
        publishedAt: row["published_at"] != null ? String(row["published_at"]) : undefined,
        failedAt: row["failed_at"] != null ? String(row["failed_at"]) : undefined,
        errorMessage: row["error_message"] != null ? String(row["error_message"]) : undefined,
      }));
    },
    async getDeadLetters(clientId: string, limit: number) {
      const result = await db
        .prepare("SELECT * FROM outbox_events WHERE client_id = ? AND status = 'failed' ORDER BY failed_at DESC LIMIT ?")
        .bind(clientId, limit)
        .all();
      return (result.results ?? []).map((row) => ({
        id: String(row["id"]),
        clientId: String(row["client_id"]),
        eventType: String(row["event_type"]),
        payload: String(row["payload"]),
        status: String(row["status"]) as "pending" | "published" | "failed",
        retryCount: Number(row["retry_count"]),
        createdAt: String(row["created_at"]),
        publishedAt: row["published_at"] != null ? String(row["published_at"]) : undefined,
        failedAt: row["failed_at"] != null ? String(row["failed_at"]) : undefined,
        errorMessage: row["error_message"] != null ? String(row["error_message"]) : undefined,
      }));
    },
  };
}

/** Builds the consumer handler map for queue message routing. */
function buildConsumerHandlers(env: Env, logger: ReturnType<typeof createStructuredLogger>): Map<string, QueueConsumer> {
  const idempotencyStore = createD1IdempotencyStore(env.DB);

  const handlers = new Map<string, QueueConsumer>();
  handlers.set(
    "finance.payment-allocation",
    createPaymentAllocationConsumer({ env, idempotencyStore, logger }),
  );
  handlers.set(
    "finance.late-fee-run",
    createLateFeeRunConsumer({ env, idempotencyStore, logger }),
  );
  handlers.set(
    "finance.interest-accrual",
    createInterestAccrualConsumer({ env, idempotencyStore, logger }),
  );
  handlers.set(
    "finance.reminder-scheduler",
    createReminderSchedulerConsumer({ env, idempotencyStore, logger }),
  );

  return handlers;
}

export default {
  /**
   * Queue handler — processes batches of messages from the realtyos-events queue.
   * Routes each message to the appropriate consumer based on eventType.
   */
  async queue(batch: MessageBatch, env: Env, _ctx: ExecutionContext): Promise<void> {
    const correlationId = generateId("cor");
    const logger = createStructuredLogger({ correlationId });

    logger.info(`Processing queue batch of ${batch.messages.length} messages`, { correlationId });

    const handlers = buildConsumerHandlers(env, logger);
    const batchHandler = createConsumerHandler(handlers);

    const messages = batch.messages.map((msg) => msg.body);
    await batchHandler(messages);

    for (const msg of batch.messages) {
      msg.ack();
    }

    logger.info("Queue batch processing complete", { correlationId });
  },

  /**
   * Scheduled handler — cron-triggered outbox dispatch.
   * Reads pending outbox events from D1 and publishes them to the queue.
   */
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const correlationId = generateId("cor");
    const logger = createStructuredLogger({ correlationId });
    const outboxRepository = createD1OutboxRepository(env.DB);

    logger.info("Scheduled outbox dispatch started", { correlationId });

    // Query distinct client IDs with pending events
    const clientRows = await env.DB
      .prepare("SELECT DISTINCT client_id FROM outbox_events WHERE status = 'pending' LIMIT 100")
      .all();

    const clientIds = (clientRows.results ?? []).map((row) => String(row["client_id"]));

    let totalDispatched = 0;
    let totalFailed = 0;

    for (const clientId of clientIds) {
      const result = await dispatchOutboxEvents({
        env,
        clientId,
        outboxRepository,
        logger,
        correlationId,
      });
      totalDispatched += result.dispatched;
      totalFailed += result.failed;
    }

    logger.info("Scheduled outbox dispatch complete", { correlationId }, {
      totalDispatched: String(totalDispatched),
      totalFailed: String(totalFailed),
      clientCount: String(clientIds.length),
    });
  },
};
