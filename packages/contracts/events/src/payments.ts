import { z } from "zod";

// ── Payment event type constants ───────────────────────────────────────────

export const PAYMENT_INITIATED = "finance.payment.initiated" as const;
export const PAYMENT_SUCCEEDED = "finance.payment.succeeded" as const;
export const PAYMENT_FAILED = "finance.payment.failed" as const;
export const PAYMENT_ALLOCATED = "finance.payment.allocated" as const;
export const PAYMENT_REFUNDED = "finance.payment.refunded" as const;
export const PAYMENT_CHARGEBACKED = "finance.payment.chargebacked" as const;
export const INTEREST_CHARGED = "finance.interest.charged" as const;
export const REMINDER_SCHEDULED = "finance.reminder.scheduled" as const;
export const REMINDER_SENT = "finance.reminder.sent" as const;
export const REMINDER_FAILED = "finance.reminder.failed" as const;

// ── Payment event payloads ─────────────────────────────────────────────────

export const PaymentInitiatedPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  leaseId: z.string(),
  amount: z.number(),
  currency: z.string(),
  provider: z.string(),
});
export type PaymentInitiatedPayload = z.infer<typeof PaymentInitiatedPayload>;

export const PaymentSucceededPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  leaseId: z.string(),
  amount: z.number(),
  currency: z.string(),
  provider: z.string(),
  providerPaymentId: z.string().optional(),
});
export type PaymentSucceededPayload = z.infer<typeof PaymentSucceededPayload>;

export const PaymentFailedPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  reason: z.string(),
});
export type PaymentFailedPayload = z.infer<typeof PaymentFailedPayload>;

export const PaymentAllocatedPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  allocationsCount: z.number().int(),
  totalAllocated: z.number(),
  remainderUnapplied: z.number(),
  currency: z.string(),
});
export type PaymentAllocatedPayload = z.infer<typeof PaymentAllocatedPayload>;

export const PaymentRefundedPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  refundAmount: z.number(),
  currency: z.string(),
  reason: z.string(),
});
export type PaymentRefundedPayload = z.infer<typeof PaymentRefundedPayload>;

export const PaymentChargebackedPayload = z.object({
  paymentId: z.string(),
  clientId: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type PaymentChargebackedPayload = z.infer<typeof PaymentChargebackedPayload>;

export const InterestChargedPayload = z.object({
  interestRunId: z.string(),
  clientId: z.string(),
  totalInterestPosted: z.number(),
  currency: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  entriesCount: z.number().int(),
});
export type InterestChargedPayload = z.infer<typeof InterestChargedPayload>;

export const ReminderScheduledPayload = z.object({
  clientId: z.string(),
  taskCount: z.number().int(),
  windowStart: z.string(),
  windowEnd: z.string(),
});
export type ReminderScheduledPayload = z.infer<typeof ReminderScheduledPayload>;

export const ReminderSentPayload = z.object({
  reminderTaskId: z.string(),
  clientId: z.string(),
  channel: z.string(),
  targetType: z.string(),
  targetId: z.string(),
});
export type ReminderSentPayload = z.infer<typeof ReminderSentPayload>;

export const ReminderFailedPayload = z.object({
  reminderTaskId: z.string(),
  clientId: z.string(),
  channel: z.string(),
  reason: z.string(),
});
export type ReminderFailedPayload = z.infer<typeof ReminderFailedPayload>;

// ── Queue job payload schemas ──────────────────────────────────────────────

const BaseJobFields = z.object({
  jobId: z.string(),
  schemaVersion: z.number().int().default(1),
  clientId: z.string(),
  correlationId: z.string(),
  causationId: z.string(),
  occurredAt: z.string(),
  attempt: z.number().int().default(1),
  idempotencyKey: z.string(),
  actor: z.object({
    type: z.enum(['SYSTEM', 'INTEGRATION', 'USER']),
    id: z.string().optional(),
  }),
});

export const PaymentWebhookJobSchema = BaseJobFields.extend({
  provider: z.string(),
  providerEventId: z.string(),
  signatureVerified: z.boolean(),
  processingMode: z.enum(['UAT', 'PRODUCTION']),
}).strict();
export type PaymentWebhookJob = z.infer<typeof PaymentWebhookJobSchema>;

export const PaymentAllocationJobSchema = BaseJobFields.extend({
  paymentId: z.string(),
  targetLeaseId: z.string(),
  allocationPolicyRef: z.object({
    policyId: z.string(),
    version: z.number().int(),
  }),
}).strict();
export type PaymentAllocationJob = z.infer<typeof PaymentAllocationJobSchema>;

export const InterestAccrualJobSchema = BaseJobFields.extend({
  asOfDate: z.string(),
  scope: z.enum(['CLIENT', 'PROPERTY', 'LEASE']),
  scopeId: z.string().optional(),
  policyRef: z.object({
    policyId: z.string(),
    version: z.number().int(),
  }),
  periodStart: z.string(),
  periodEnd: z.string(),
}).strict();
export type InterestAccrualJob = z.infer<typeof InterestAccrualJobSchema>;

export const LateFeeRunJobSchema = BaseJobFields.extend({
  asOfDate: z.string(),
  policyRef: z.object({
    policyId: z.string(),
    version: z.number().int(),
  }),
}).strict();
export type LateFeeRunJob = z.infer<typeof LateFeeRunJobSchema>;

export const ReminderSchedulerJobSchema = BaseJobFields.extend({
  scheduleWindowStart: z.string(),
  scheduleWindowEnd: z.string(),
  policyRef: z.object({
    policyId: z.string(),
    version: z.number().int(),
  }),
}).strict();
export type ReminderSchedulerJob = z.infer<typeof ReminderSchedulerJobSchema>;

export const ReminderSendJobSchema = BaseJobFields.extend({
  reminderTaskId: z.string(),
  channel: z.string(),
  templateId: z.string().optional(),
  targetType: z.string(),
  targetId: z.string(),
}).strict();
export type ReminderSendJob = z.infer<typeof ReminderSendJobSchema>;
