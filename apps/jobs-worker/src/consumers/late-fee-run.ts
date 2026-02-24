import { z } from "zod";
import type { QueueConsumer, QueueMessage } from "@realtyos/adapter-queues";
import type { IdempotencyStore } from "@realtyos/events";
import { withIdempotency } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";

const LateFeeRunPayloadSchema = z.object({
  clientId: z.string(),
  runDate: z.string(),
  policyVersion: z.number(),
});

const HANDLER_NAME = "late-fee-run";

export function createLateFeeRunConsumer(deps: {
  env: Env;
  idempotencyStore: IdempotencyStore;
  logger: Logger;
}): QueueConsumer {
  const { env, idempotencyStore, logger } = deps;

  const idempotentHandler = withIdempotency(
    idempotencyStore,
    HANDLER_NAME,
    async (event: { clientId: string; eventId: string }) => {
      logger.info("Processing late fee run", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      // TODO: Wire up runLateFee from @realtyos/finance
      // with real repository implementations backed by env.DB
      logger.info("Late fee run completed", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      return { success: true as const };
    },
  );

  return {
    async handle(message: QueueMessage): Promise<"success" | "retry" | "dead-letter"> {
      const parsed = LateFeeRunPayloadSchema.safeParse(message.payload);
      if (!parsed.success) {
        logger.error("Invalid late-fee-run payload", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: parsed.error.message });
        return "dead-letter";
      }

      const { clientId, runDate, policyVersion } = parsed.data;
      const idempotencyKey = `${clientId}:${runDate}:${policyVersion}`;

      try {
        const result = await idempotentHandler({
          clientId: message.clientId,
          eventId: idempotencyKey,
        });

        if (result === undefined) {
          logger.info("Late fee run already processed (idempotent skip)", {
            correlationId: message.correlationId,
            clientId: message.clientId,
          });
        }

        return "success";
      } catch (err) {
        logger.error("Late fee run failed", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: err instanceof Error ? err.message : String(err) });
        return "retry";
      }
    },
  };
}
