import { describe, it, expect } from "vitest";
import {
  DomainEventEnvelope,
  createEventEnvelope,
  type CreateEventEnvelopeInput,
} from "../envelope.js";

const validInput: CreateEventEnvelopeInput = {
  eventType: "membership.created",
  schemaVersion: 1,
  correlationId: "cor_test123",
  causationId: "evt_cause123",
  clientId: "cli_test123",
  actor: { actorId: "usr_abc", actorType: "user" },
  resource: { resourceType: "membership", resourceId: "mem_xyz" },
  payload: { name: "Test" },
};

describe("DomainEventEnvelope", () => {
  it("creates an event envelope with all required fields", () => {
    const envelope = createEventEnvelope(validInput);

    expect(envelope.eventId).toMatch(/^evt_/);
    expect(envelope.eventType).toBe("membership.created");
    expect(envelope.schemaVersion).toBe(1);
    expect(envelope.correlationId).toBe("cor_test123");
    expect(envelope.causationId).toBe("evt_cause123");
    expect(envelope.clientId).toBe("cli_test123");
    expect(envelope.actor).toEqual({
      actorId: "usr_abc",
      actorType: "user",
    });
    expect(envelope.resource).toEqual({
      resourceType: "membership",
      resourceId: "mem_xyz",
    });
    expect(envelope.payload).toEqual({ name: "Test" });
    expect(envelope.occurredAt).toBeDefined();
  });

  it("rejects missing required fields", () => {
    const result = DomainEventEnvelope.safeParse({
      eventId: "evt_123",
      eventType: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects eventId without evt_ prefix", () => {
    const result = DomainEventEnvelope.safeParse({
      ...validInput,
      eventId: "bad_prefix",
      occurredAt: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("generates eventId with evt_ prefix", () => {
    const envelope = createEventEnvelope(validInput);
    expect(envelope.eventId).toMatch(/^evt_/);
  });

  it("sets occurredAt to a valid ISO8601 string", () => {
    const envelope = createEventEnvelope(validInput);
    const parsed = new Date(envelope.occurredAt);
    expect(parsed.toISOString()).toBe(envelope.occurredAt);
    expect(isNaN(parsed.getTime())).toBe(false);
  });
});
