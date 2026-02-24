import { z } from "zod";
import type { QueueConsumer, QueueMessage } from "@realtyos/adapter-queues";
import type { IdempotencyStore } from "@realtyos/events";
import { withIdempotency } from "@realtyos/events";
import type { Logger } from "@realtyos/observability";
import type { Env } from "../env.js";

const ReminderSchedulerPayloadSchema = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  reminderType: z.string(),
  scheduledDate: z.string(),
});

const HANDLER_NAME = "reminder-scheduler";

export function createReminderSchedulerConsumer(deps: {
  env: Env;
  idempotencyStore: IdempotencyStore;
  logger: Logger;
}): QueueConsumer {
  const { env, idempotencyStore, logger } = deps;

  const idempotentHandler = withIdempotency(
    idempotencyStore,
    HANDLER_NAME,
    async (event: { clientId: string; eventId: string }) => {
      logger.info("Scheduling reminder", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      // TODO: Wire up reminder creation logic
      // Insert reminder task into D1 via env.DB
      logger.info("Reminder scheduled", {
        correlationId: event.eventId,
        clientId: event.clientId,
      });

      return { success: true as const };
    },
  );

  return {
    async handle(message: QueueMessage): Promise<"success" | "retry" | "dead-letter"> {
      const parsed = ReminderSchedulerPayloadSchema.safeParse(message.payload);
      if (!parsed.success) {
        logger.error("Invalid reminder-scheduler payload", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: parsed.error.message });
        return "dead-letter";
      }

      const { clientId, leaseId, reminderType, scheduledDate } = parsed.data;
      const idempotencyKey = `${clientId}:${leaseId}:${reminderType}:${scheduledDate}`;

      try {
        const result = await idempotentHandler({
          clientId: message.clientId,
          eventId: idempotencyKey,
        });

        if (result === undefined) {
          logger.info("Reminder already scheduled (idempotent skip)", {
            correlationId: message.correlationId,
            clientId: message.clientId,
          });
        }

        return "success";
      } catch (err) {
        logger.error("Reminder scheduling failed", {
          correlationId: message.correlationId,
          clientId: message.clientId,
        }, { error: err instanceof Error ? err.message : String(err) });
        return "retry";
      }
    },
  };
}
