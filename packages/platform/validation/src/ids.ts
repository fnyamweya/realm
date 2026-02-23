import { z } from "zod";
import { randomUUID } from "node:crypto";

function brandedIdSchema<P extends string>(prefix: P) {
  const pattern = new RegExp(`^${prefix}_[0-9A-HJKMNP-TV-Z]{26}$`);
  return z.string().regex(pattern, {
    message: `Invalid ID: must match format ${prefix}_{ulid}`,
  });
}

// ULID-compatible generator using crypto.randomUUID as entropy source
export function generateId(prefix: string): string {
  const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const now = Date.now();

  // Encode timestamp (10 chars, 48-bit millisecond precision)
  // Non-null assertions are safe: modulo 32 always yields a valid ENCODING index
  let ts = now;
  const timePart = new Array<string>(10);
  for (let i = 9; i >= 0; i--) {
    timePart[i] = ENCODING[ts % 32]!;
    ts = Math.floor(ts / 32);
  }

  // Encode randomness (16 chars from crypto)
  const uuid = randomUUID().replace(/-/g, "");
  const bytes = Buffer.from(uuid, "hex");
  const randPart = new Array<string>(16);
  for (let i = 0; i < 16; i++) {
    randPart[i] = ENCODING[bytes[i]! % 32]!;
  }

  return `${prefix}_${timePart.join("")}${randPart.join("")}`;
}

export const ClientId = brandedIdSchema("cli");
export type ClientId = z.infer<typeof ClientId>;

export const UserId = brandedIdSchema("usr");
export type UserId = z.infer<typeof UserId>;

export const MembershipId = brandedIdSchema("mem");
export type MembershipId = z.infer<typeof MembershipId>;

export const PropertyId = brandedIdSchema("prp");
export type PropertyId = z.infer<typeof PropertyId>;

export const UnitId = brandedIdSchema("unt");
export type UnitId = z.infer<typeof UnitId>;

export const LeaseId = brandedIdSchema("les");
export type LeaseId = z.infer<typeof LeaseId>;

export const MaintenanceRequestId = brandedIdSchema("mtr");
export type MaintenanceRequestId = z.infer<typeof MaintenanceRequestId>;

export const WorkOrderId = brandedIdSchema("wor");
export type WorkOrderId = z.infer<typeof WorkOrderId>;

export const EventId = brandedIdSchema("evt");
export type EventId = z.infer<typeof EventId>;

export const CorrelationId = brandedIdSchema("cor");
export type CorrelationId = z.infer<typeof CorrelationId>;
