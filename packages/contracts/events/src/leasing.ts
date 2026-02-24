import { z } from "zod";

export const LEASE_CREATED = "lease.created" as const;
export const LEASE_STATUS_CHANGED = "lease.status_changed" as const;
export const LEASE_TERMINATED = "lease.terminated" as const;

export const LeaseCreatedPayload = z.object({
  leaseId: z.string(),
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});
export type LeaseCreatedPayload = z.infer<typeof LeaseCreatedPayload>;

export const LeaseStatusChangedPayload = z.object({
  leaseId: z.string(),
  clientId: z.string(),
  previousStatus: z.string(),
  newStatus: z.string(),
});
export type LeaseStatusChangedPayload = z.infer<
  typeof LeaseStatusChangedPayload
>;

export const LeaseTerminatedPayload = z.object({
  leaseId: z.string(),
  clientId: z.string(),
  terminatedAt: z.string(),
  reason: z.string().optional(),
});
export type LeaseTerminatedPayload = z.infer<typeof LeaseTerminatedPayload>;
