import { z } from "zod";

export const MaintenancePriority = z.enum([
  "low",
  "medium",
  "high",
  "emergency",
]);
export type MaintenancePriority = z.infer<typeof MaintenancePriority>;

export const MaintenanceRequestStatus = z.enum([
  "submitted",
  "triaged",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);
export type MaintenanceRequestStatus = z.infer<typeof MaintenanceRequestStatus>;

export const CreateMaintenanceRequestSchema = z.object({
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  requestedBy: z.string(),
  title: z.string(),
  description: z.string(),
  priority: MaintenancePriority,
  category: z.string(),
});
export type CreateMaintenanceRequestSchema = z.infer<
  typeof CreateMaintenanceRequestSchema
>;

export const MaintenanceRequestResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  requestedBy: z.string(),
  title: z.string(),
  description: z.string(),
  priority: MaintenancePriority,
  category: z.string(),
  status: MaintenanceRequestStatus,
  createdAt: z.string(),
});
export type MaintenanceRequestResponse = z.infer<
  typeof MaintenanceRequestResponse
>;
