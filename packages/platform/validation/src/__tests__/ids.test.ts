import { describe, expect, it } from "vitest";
import {
  generateId,
  ClientId,
  UserId,
  MembershipId,
  PropertyId,
  UnitId,
  LeaseId,
  MaintenanceRequestId,
  WorkOrderId,
  EventId,
  CorrelationId,
} from "../ids.js";

const schemas = [
  { name: "ClientId", schema: ClientId, prefix: "cli" },
  { name: "UserId", schema: UserId, prefix: "usr" },
  { name: "MembershipId", schema: MembershipId, prefix: "mem" },
  { name: "PropertyId", schema: PropertyId, prefix: "prp" },
  { name: "UnitId", schema: UnitId, prefix: "unt" },
  { name: "LeaseId", schema: LeaseId, prefix: "les" },
  { name: "MaintenanceRequestId", schema: MaintenanceRequestId, prefix: "mtr" },
  { name: "WorkOrderId", schema: WorkOrderId, prefix: "wor" },
  { name: "EventId", schema: EventId, prefix: "evt" },
  { name: "CorrelationId", schema: CorrelationId, prefix: "cor" },
] as const;

describe("generateId", () => {
  it("produces IDs matching the expected format", () => {
    const id = generateId("cli");
    expect(id).toMatch(/^cli_[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("produces unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId("usr")));
    expect(ids.size).toBe(100);
  });
});

describe.each(schemas)("$name", ({ schema, prefix }) => {
  it("accepts a valid ID", () => {
    const id = generateId(prefix);
    expect(schema.safeParse(id).success).toBe(true);
  });

  it("rejects an ID with wrong prefix", () => {
    const wrongPrefix = prefix === "cli" ? "usr" : "cli";
    const id = generateId(wrongPrefix);
    expect(schema.safeParse(id).success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(schema.safeParse("").success).toBe(false);
  });

  it("rejects a plain string without prefix", () => {
    expect(schema.safeParse("not-an-id").success).toBe(false);
  });

  it("rejects an ID with invalid ULID characters", () => {
    // Lowercase letters and excluded chars (I, L, O, U) are invalid in Crockford Base32
    const invalid = `${prefix}_0000000000000000000000000i`;
    expect(schema.safeParse(invalid).success).toBe(false);
  });
});
