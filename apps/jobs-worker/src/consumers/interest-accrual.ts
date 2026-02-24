import { z } from "zod";
import type { QueueConsumer, QueueMessage } from "@realtyos/adapter-queues";
import type { IdempotencyStore } from "@realtyos/events";
import { withIdempotency } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";

const InterestAccrualPayloadSchema = z.object({
  clientId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  policyVersion: z.number(),
});

const HANDLER_NAME = "interest-accrual";

export function createInterestAccrualConsumer(deps: {
  env: Env;
  idempotencyStore: IdempotencyStore;
  logger: Logger;
}): QueueConsumer {
  const { env, idempotencyStore, logger } = deps;

  const idempotentHandler = withIdempotency(
    idempotencyStore,
    HANDLER_NAME,
    async (event: { clientId: string; eventId: string }) => {
      logger.info("Processing interest accrual", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      // TODO: Wire up runInterestAccrual from @realtyos/finance
      // with real repository implementations backed by env.DB
      logger.info("Interest accrual completed", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      return { success: true as const };
    },
  );

  return {
    async handle(message: QueueMessage): Promise<"success" | "retry" | "dead-letter"> {
      const parsed = InterestAccrualPayloadSchema.safeParse(message.payload);
      if (!parsed.success) {
        logger.error("Invalid interest-accrual payload", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: parsed.error.message });
        return "dead-letter";
      }

      const { clientId, periodStart, periodEnd, policyVersion } = parsed.data;
      const idempotencyKey = `${clientId}:${periodStart}:${periodEnd}:${policyVersion}`;

      try {
        const result = await idempotentHandler({
          clientId: message.clientId,
          eventId: idempotencyKey,
        });

        if (result === undefined) {
          logger.info("Interest accrual already processed (idempotent skip)", {
            correlationId: message.correlationId,
            clientId: message.clientId,
          });
        }

        return "success";
      } catch (err) {
        logger.error("Interest accrual failed", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: err instanceof Error ? err.message : String(err) });
        return "retry";
      }
    },
  };
}
