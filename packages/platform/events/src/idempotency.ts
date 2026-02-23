export interface ProcessedEventMarker {
  clientId: string;
  eventId: string;
  handlerName: string;
  processedAt: string;
}

export interface IdempotencyStore {
  isProcessed(
    clientId: string,
    eventId: string,
    handlerName: string,
  ): Promise<boolean>;
  markProcessed(marker: ProcessedEventMarker): Promise<void>;
}

export function withIdempotency<T>(
  store: IdempotencyStore,
  handlerName: string,
  handler: (event: { clientId: string; eventId: string }) => Promise<T>,
): (event: { clientId: string; eventId: string }) => Promise<T | undefined> {
  return async (event) => {
    const already = await store.isProcessed(
      event.clientId,
      event.eventId,
      handlerName,
    );
    if (already) {
      return undefined;
    }

    const result = await handler(event);

    await store.markProcessed({
      clientId: event.clientId,
      eventId: event.eventId,
      handlerName,
      processedAt: new Date().toISOString(),
    });

    return result;
  };
}
