import { z } from "zod";

export const ChangeRequestStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  EXECUTED: "EXECUTED",
  CANCELLED: "CANCELLED",
} as const;

export type ChangeRequestStatus =
  (typeof ChangeRequestStatus)[keyof typeof ChangeRequestStatus];

export const ChangeRequestStatusSchema = z.enum([
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "EXECUTED",
  "CANCELLED",
]);

export const ApprovalStepSchema = z.object({
  stepId: z.string(),
  requiredRoles: z.array(z.string()),
  requiredCount: z.number(),
  separationOfDuty: z.boolean(),
});

export type ApprovalStep = z.infer<typeof ApprovalStepSchema>;

export const MakerCheckerPolicySchema = z.object({
  policyId: z.string(),
  actionType: z.string(),
  steps: z.array(ApprovalStepSchema),
  expiresAfterHours: z.number(),
  schemaVersion: z.number(),
});

export type MakerCheckerPolicy = z.infer<typeof MakerCheckerPolicySchema>;

export const StepApprovalSchema = z.object({
  approverId: z.string(),
  approvedAt: z.string(),
  role: z.string(),
});

export const RequestStepSchema = z.object({
  stepId: z.string(),
  approvals: z.array(StepApprovalSchema),
  status: z.enum(["pending", "approved", "rejected"]),
});

export const ChangeRequestSchema = z.object({
  requestId: z.string(),
  clientId: z.string(),
  actionType: z.string(),
  policyId: z.string(),
  makerId: z.string(),
  status: ChangeRequestStatusSchema,
  payload: z.unknown(),
  steps: z.array(RequestStepSchema),
  createdAt: z.string(),
  expiresAt: z.string(),
  executedAt: z.string().optional(),
});

export type ChangeRequest = z.infer<typeof ChangeRequestSchema>;
