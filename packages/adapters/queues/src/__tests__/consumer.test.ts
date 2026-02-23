import { describe, it, expect, vi } from "vitest";
import { QueueMessageSchema } from "../publisher.js";
import { createConsumerHandler } from "../consumer.js";
import type { QueueConsumer } from "../consumer.js";
import type { DeadLetterStore } from "../dlq.js";

const validMessage = {
  messageId: "msg-1",
  eventType: "property.created",
  payload: { id: "prop-1" },
  clientId: "client-1",
  correlationId: "corr-1",
  retryCount: 0,
  maxRetries: 3,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("QueueMessageSchema", () => {
  it("validates a correct message", () => {
    const result = QueueMessageSchema.safeParse(validMessage);
    expect(result.success).toBe(true);
  });

  it("rejects a message missing required fields", () => {
    const result = QueueMessageSchema.safeParse({ messageId: "msg-1" });
    expect(result.success).toBe(false);
  });

  it("rejects non-object input", () => {
    const result = QueueMessageSchema.safeParse("not-an-object");
    expect(result.success).toBe(false);
  });
});

describe("createConsumerHandler", () => {
  it("routes messages to the correct handler", async () => {
    const handler: QueueConsumer = { handle: vi.fn().mockResolvedValue("success") };
    const handlers = new Map([["property.created", handler]]);
    const consumer = createConsumerHandler(handlers);

    await consumer([validMessage]);

    expect(handler.handle).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "msg-1" }),
    );
  });

  it("sends to DLQ when max retries exceeded", async () => {
    const handler: QueueConsumer = { handle: vi.fn().mockResolvedValue("retry") };
    const handlers = new Map([["property.created", handler]]);
    const dlq: DeadLetterStore = {
      store: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
    };

    const consumer = createConsumerHandler(handlers, dlq);

    await consumer([{ ...validMessage, retryCount: 3, maxRetries: 3 }]);

    expect(dlq.store).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: "msg-1", error: "Max retries exceeded" }),
    );
  });

  it("sends invalid messages to DLQ", async () => {
    const handlers = new Map<string, QueueConsumer>();
    const dlq: DeadLetterStore = {
      store: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockResolvedValue([]),
    };

    const consumer = createConsumerHandler(handlers, dlq);

    await consumer([{ invalid: true }]);

    expect(dlq.store).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Validation failed") }),
    );
  });
});
