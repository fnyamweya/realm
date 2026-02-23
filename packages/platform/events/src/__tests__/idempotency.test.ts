import { describe, it, expect, vi } from "vitest";
import {
  withIdempotency,
  type IdempotencyStore,
  type ProcessedEventMarker,
} from "../idempotency.js";

function createMockStore(processedSet: Set<string>): IdempotencyStore {
  return {
    isProcessed: vi.fn(
      async (clientId: string, eventId: string, handlerName: string) =>
        processedSet.has(`${clientId}:${eventId}:${handlerName}`),
    ),
    markProcessed: vi.fn(async (marker: ProcessedEventMarker) => {
      processedSet.add(
        `${marker.clientId}:${marker.eventId}:${marker.handlerName}`,
      );
    }),
  };
}

describe("withIdempotency", () => {
  it("skips already-processed events", async () => {
    const store = createMockStore(
      new Set(["cli_1:evt_abc:myHandler"]),
    );
    const handler = vi.fn(async () => "result");

    const wrapped = withIdempotency(store, "myHandler", handler);
    const result = await wrapped({
      clientId: "cli_1",
      eventId: "evt_abc",
    });

    expect(result).toBeUndefined();
    expect(handler).not.toHaveBeenCalled();
    expect(store.isProcessed).toHaveBeenCalledWith(
      "cli_1",
      "evt_abc",
      "myHandler",
    );
  });

  it("processes new events and marks them", async () => {
    const store = createMockStore(new Set());
    const handler = vi.fn(async () => "processed");

    const wrapped = withIdempotency(store, "myHandler", handler);
    const result = await wrapped({
      clientId: "cli_1",
      eventId: "evt_new",
    });

    expect(result).toBe("processed");
    expect(handler).toHaveBeenCalledWith({
      clientId: "cli_1",
      eventId: "evt_new",
    });
    expect(store.markProcessed).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: "cli_1",
        eventId: "evt_new",
        handlerName: "myHandler",
      }),
    );
  });
});
