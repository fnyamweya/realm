import { z } from "zod";
import { generateId } from "@realtyos/validation";

export const ActorSchema = z.object({
  actorId: z.string(),
  membershipId: z.string().optional(),
  actorType: z.enum(["user", "system", "integration"]),
});

export const ResourceSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
});

export const EventMetadataSchema = z.object({
  environment: z.string().optional(),
  sourceService: z.string().optional(),
});

export const DomainEventEnvelope = z.object({
  eventId: z.string().regex(/^evt_/, "eventId must start with 'evt_'"),
  eventType: z.string(),
  occurredAt: z.string().datetime({ offset: true }),
  schemaVersion: z.number(),
  correlationId: z.string(),
  causationId: z.string(),
  clientId: z.string(),
  actor: ActorSchema,
  resource: ResourceSchema,
  payload: z.unknown(),
  metadata: EventMetadataSchema.optional(),
});

export type DomainEventEnvelope = z.infer<typeof DomainEventEnvelope>;

export interface CreateEventEnvelopeInput {
  eventType: string;
  schemaVersion: number;
  correlationId: string;
  causationId: string;
  clientId: string;
  actor: z.infer<typeof ActorSchema>;
  resource: z.infer<typeof ResourceSchema>;
  payload: unknown;
  metadata?: z.infer<typeof EventMetadataSchema>;
}

export function createEventEnvelope(
  input: CreateEventEnvelopeInput,
): DomainEventEnvelope {
  return DomainEventEnvelope.parse({
    ...input,
    eventId: generateId("evt"),
    occurredAt: new Date().toISOString(),
  });
}
