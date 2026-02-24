import { z } from "zod";

export const MAINTENANCE_REQUEST_CREATED =
  "maintenance_request.created" as const;
export const MAINTENANCE_REQUEST_STATUS_CHANGED =
  "maintenance_request.status_changed" as const;

export const MaintenanceRequestCreatedPayload = z.object({
  maintenanceRequestId: z.string(),
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  requestedBy: z.string(),
  priority: z.enum(["low", "medium", "high", "emergency"]),
  category: z.string(),
});
export type MaintenanceRequestCreatedPayload = z.infer<
  typeof MaintenanceRequestCreatedPayload
>;

export const MaintenanceRequestStatusChangedPayload = z.object({
  maintenanceRequestId: z.string(),
  clientId: z.string(),
  previousStatus: z.string(),
  newStatus: z.string(),
});
export type MaintenanceRequestStatusChangedPayload = z.infer<
  typeof MaintenanceRequestStatusChangedPayload
>;
