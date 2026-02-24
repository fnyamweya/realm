import { z } from "zod";

export const PROPERTY_CREATED = "property.created" as const;
export const PROPERTY_STATUS_CHANGED = "property.status_changed" as const;
export const UNIT_CREATED = "unit.created" as const;

export const PropertyCreatedPayload = z.object({
  propertyId: z.string(),
  clientId: z.string(),
  name: z.string(),
  type: z.enum(["residential", "commercial", "mixed"]),
});
export type PropertyCreatedPayload = z.infer<typeof PropertyCreatedPayload>;

export const PropertyStatusChangedPayload = z.object({
  propertyId: z.string(),
  clientId: z.string(),
  previousStatus: z.string(),
  newStatus: z.string(),
});
export type PropertyStatusChangedPayload = z.infer<
  typeof PropertyStatusChangedPayload
>;

export const UnitCreatedPayload = z.object({
  unitId: z.string(),
  propertyId: z.string(),
  clientId: z.string(),
  unitNumber: z.string(),
});
export type UnitCreatedPayload = z.infer<typeof UnitCreatedPayload>;
