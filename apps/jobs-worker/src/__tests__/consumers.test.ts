import { describe, it, expect, vi, beforeEach } from "vitest";
import type { QueueMessage } from "@realtyos/adapter-queues";
import type { IdempotencyStore, ProcessedEventMarker } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";
import { createPaymentAllocationConsumer } from "../consumers/payment-allocation.js";
import { createLateFeeRunConsumer } from "../consumers/late-fee-run.js";
import { createInterestAccrualConsumer } from "../consumers/interest-accrual.js";
import { createReminderSchedulerConsumer } from "../consumers/reminder-scheduler.js";
import { dispatchOutboxEvents } from "../consumers/outbox-dispatcher.js";
import type { OutboxRepository, OutboxEntry } from "@realtyos/events";

function createMockLogger(): Logger {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
}

function createMockIdempotencyStore(
  processed: Set<string> = new Set(),
): IdempotencyStore {
  return {
    async isProcessed(clientId: string, eventId: string, handlerName: string): Promise<boolean> {
      return processed.has(`${clientId}:${eventId}:${handlerName}`);
    },
    async markProcessed(marker: ProcessedEventMarker): Promise<void> {
      processed.add(`${marker.clientId}:${marker.eventId}:${marker.handlerName}`);
    },
  };
}

function createMockEnv(): Env {
  return {
    DB: {} as D1Database,
    EVENTS_QUEUE: {
      send: vi.fn(),
    } as unknown as Queue,
    ENVIRONMENT: "test",
  };
}

function createQueueMessage(overrides: Partial<QueueMessage> = {}): QueueMessage {
  return {
    messageId: "msg_001",
    eventType: "finance.payment-allocation",
    payload: { paymentId: "pay_001", clientId: "cli_001", policyVersion: 1 },
    clientId: "cli_001",
    correlationId: "cor_001",
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Payment Allocation Consumer", () => {
  let env: Env;
  let logger: Logger;

  beforeEach(() => {
    env = createMockEnv();
    logger = createMockLogger();
  });

  it("should process a valid payment allocation message", async () => {
    const store = createMockIdempotencyStore();
    const consumer = createPaymentAllocationConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage();
    const result = await consumer.handle(message);

    expect(result).toBe("success");
  });

  it("should return success for duplicate messages (idempotent)", async () => {
    const processed = new Set<string>();
    const store = createMockIdempotencyStore(processed);
    const consumer = createPaymentAllocationConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage();

    const first = await consumer.handle(message);
    expect(first).toBe("success");

    const second = await consumer.handle(message);
    expect(second).toBe("success");
  });

  it("should dead-letter messages with invalid payloads", async () => {
    const store = createMockIdempotencyStore();
    const consumer = createPaymentAllocationConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage({ payload: { invalid: true } });
    const result = await consumer.handle(message);

    expect(result).toBe("dead-letter");
    expect(logger.error).toHaveBeenCalled();
  });
});

describe("Late Fee Run Consumer", () => {
  it("should process a valid late fee run message", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();
    const store = createMockIdempotencyStore();
    const consumer = createLateFeeRunConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage({
      eventType: "finance.late-fee-run",
      payload: { clientId: "cli_001", runDate: "2025-01-15", policyVersion: 1 },
    });

    const result = await consumer.handle(message);
    expect(result).toBe("success");
  });

  it("should dead-letter messages with invalid payloads", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();
    const store = createMockIdempotencyStore();
    const consumer = createLateFeeRunConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage({
      eventType: "finance.late-fee-run",
      payload: { missing: "fields" },
    });

    const result = await consumer.handle(message);
    expect(result).toBe("dead-letter");
  });
});

describe("Interest Accrual Consumer", () => {
  it("should process a valid interest accrual message", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();
    const store = createMockIdempotencyStore();
    const consumer = createInterestAccrualConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage({
      eventType: "finance.interest-accrual",
      payload: {
        clientId: "cli_001",
        periodStart: "2025-01-01",
        periodEnd: "2025-01-31",
        policyVersion: 1,
      },
    });

    const result = await consumer.handle(message);
    expect(result).toBe("success");
  });
});

describe("Reminder Scheduler Consumer", () => {
  it("should process a valid reminder scheduler message", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();
    const store = createMockIdempotencyStore();
    const consumer = createReminderSchedulerConsumer({ env, idempotencyStore: store, logger });

    const message = createQueueMessage({
      eventType: "finance.reminder-scheduler",
      payload: {
        clientId: "cli_001",
        leaseId: "les_001",
        reminderType: "rent_due",
        scheduledDate: "2025-02-01",
      },
    });

    const result = await consumer.handle(message);
    expect(result).toBe("success");
  });
});

describe("Outbox Dispatcher", () => {
  it("should dispatch pending outbox events to the queue", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();
    const correlationId = "cor_test";

    const pendingEntries: OutboxEntry[] = [
      {
        id: "evt_001",
        clientId: "cli_001",
        eventType: "finance.payment-allocation",
        payload: JSON.stringify({ paymentId: "pay_001" }),
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "evt_002",
        clientId: "cli_001",
        eventType: "finance.late-fee-run",
        payload: JSON.stringify({ clientId: "cli_001", runDate: "2025-01-15" }),
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const outboxRepository: OutboxRepository = {
      insert: vi.fn(),
      markPublished: vi.fn(),
      markFailed: vi.fn(),
      getPending: vi.fn().mockResolvedValue(pendingEntries),
      getDeadLetters: vi.fn().mockResolvedValue([]),
    };

    const result = await dispatchOutboxEvents({
      env,
      clientId: "cli_001",
      outboxRepository,
      logger,
      correlationId,
    });

    expect(result.dispatched).toBe(2);
    expect(result.failed).toBe(0);
    expect(env.EVENTS_QUEUE.send).toHaveBeenCalledTimes(2);
    expect(outboxRepository.markPublished).toHaveBeenCalledTimes(2);
  });

  it("should return zero when no pending events exist", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();

    const outboxRepository: OutboxRepository = {
      insert: vi.fn(),
      markPublished: vi.fn(),
      markFailed: vi.fn(),
      getPending: vi.fn().mockResolvedValue([]),
      getDeadLetters: vi.fn().mockResolvedValue([]),
    };

    const result = await dispatchOutboxEvents({
      env,
      clientId: "cli_001",
      outboxRepository,
      logger,
      correlationId: "cor_test",
    });

    expect(result.dispatched).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("should mark failed events and continue processing", async () => {
    const env = createMockEnv();
    const logger = createMockLogger();

    (env.EVENTS_QUEUE.send as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error("Queue unavailable"))
      .mockResolvedValueOnce(undefined);

    const pendingEntries: OutboxEntry[] = [
      {
        id: "evt_001",
        clientId: "cli_001",
        eventType: "finance.payment-allocation",
        payload: JSON.stringify({ paymentId: "pay_001" }),
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "evt_002",
        clientId: "cli_001",
        eventType: "finance.late-fee-run",
        payload: JSON.stringify({ clientId: "cli_001" }),
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const outboxRepository: OutboxRepository = {
      insert: vi.fn(),
      markPublished: vi.fn(),
      markFailed: vi.fn(),
      getPending: vi.fn().mockResolvedValue(pendingEntries),
      getDeadLetters: vi.fn().mockResolvedValue([]),
    };

    const result = await dispatchOutboxEvents({
      env,
      clientId: "cli_001",
      outboxRepository,
      logger,
      correlationId: "cor_test",
    });

    expect(result.dispatched).toBe(1);
    expect(result.failed).toBe(1);
    expect(outboxRepository.markFailed).toHaveBeenCalledWith("evt_001", "Queue unavailable");
    expect(outboxRepository.markPublished).toHaveBeenCalledWith("evt_002");
  });
});
