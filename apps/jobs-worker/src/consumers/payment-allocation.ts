import { z } from "zod";
import type { QueueConsumer, QueueMessage } from "@realtyos/adapter-queues";
import type { IdempotencyStore } from "@realtyos/events";
import { withIdempotency } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";

const PaymentAllocationPayloadSchema = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  policyVersion: z.number(),
});

const HANDLER_NAME = "payment-allocation";

export function createPaymentAllocationConsumer(deps: {
  env: Env;
  idempotencyStore: IdempotencyStore;
  logger: Logger;
}): QueueConsumer {
  const { env, idempotencyStore, logger } = deps;

  const idempotentHandler = withIdempotency(
    idempotencyStore,
    HANDLER_NAME,
    async (event: { clientId: string; eventId: string }) => {
      logger.info("Processing payment allocation", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      // TODO: Wire up allocatePaymentUseCase from @realtyos/finance
      // with real repository implementations backed by env.DB
      logger.info("Payment allocation completed", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      return { success: true as const };
    },
  );

  return {
    async handle(message: QueueMessage): Promise<"success" | "retry" | "dead-letter"> {
      const parsed = PaymentAllocationPayloadSchema.safeParse(message.payload);
      if (!parsed.success) {
        logger.error("Invalid payment-allocation payload", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: parsed.error.message });
        return "dead-letter";
      }

      try {
        const result = await idempotentHandler({
          clientId: message.clientId,
          eventId: `${parsed.data.paymentId}:${parsed.data.policyVersion}`,
        });

        if (result === undefined) {
          logger.info("Payment allocation already processed (idempotent skip)", {
            correlationId: message.correlationId,
            clientId: message.clientId,
          });
        }

        return "success";
      } catch (err) {
        logger.error("Payment allocation failed", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: err instanceof Error ? err.message : String(err) });
        return "retry";
      }
    },
  };
}
