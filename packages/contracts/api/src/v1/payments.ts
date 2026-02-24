import { z } from 'zod';
import { ChargeCategory, Money } from './finance.js';

// ═══════════════════════════════════════════════════════════════════════════
// Payment enums
// ═══════════════════════════════════════════════════════════════════════════

export const PaymentStatus = z.enum([
  'INITIATED', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELED', 'REFUNDED', 'CHARGEBACK',
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PaymentMethodType = z.enum([
  'CARD', 'ACH', 'BANK_TRANSFER', 'CASH', 'CHECK', 'MOBILE_MONEY', 'OTHER',
]);
export type PaymentMethodType = z.infer<typeof PaymentMethodType>;

export const PaymentProvider = z.enum(['STRIPE', 'MANUAL']);
export type PaymentProvider = z.infer<typeof PaymentProvider>;

// ═══════════════════════════════════════════════════════════════════════════
// Interest policy
// ═══════════════════════════════════════════════════════════════════════════

export const InterestBasis = z.enum(['ACTUAL_365', 'ACTUAL_360', 'THIRTY_360']);
export type InterestBasis = z.infer<typeof InterestBasis>;

export const AccrualFrequency = z.enum(['DAILY', 'MONTHLY', 'ONCE_PER_PERIOD']);
export type AccrualFrequency = z.infer<typeof AccrualFrequency>;

export const PostingFrequency = z.enum(['DAILY', 'MONTHLY']);
export type PostingFrequency = z.infer<typeof PostingFrequency>;

export const CompoundingMode = z.enum(['NONE', 'DAILY', 'MONTHLY']);
export type CompoundingMode = z.infer<typeof CompoundingMode>;

export const TimezoneRule = z.enum(['PROPERTY_TIMEZONE', 'LEASE_TIMEZONE_OVERRIDE']);
export type TimezoneRule = z.infer<typeof TimezoneRule>;

export const RoundingModeEnum = z.enum(['HALF_UP', 'HALF_EVEN', 'FLOOR', 'CEIL']);
export type RoundingModeEnum = z.infer<typeof RoundingModeEnum>;

export const AuditLevel = z.enum(['STANDARD', 'ENHANCED']);
export type AuditLevel = z.infer<typeof AuditLevel>;

export const InterestPolicySchema = z.object({
  enabled: z.boolean(),
  graceDays: z.number().int().min(0),
  appliesTo: z.object({
    includeCategories: z.array(ChargeCategory),
    excludeCategories: z.array(ChargeCategory),
    includeChargeDefinitionCodes: z.array(z.string()).optional(),
    excludeChargeDefinitionCodes: z.array(z.string()).optional(),
  }),
  aprPercent: z.number().min(0).max(36),
  basis: InterestBasis,
  accrualFrequency: AccrualFrequency,
  postingFrequency: PostingFrequency,
  compounding: CompoundingMode.default('NONE'),
  interestOnInterest: z.boolean().default(false),
  interestOnFees: z.boolean().default(false),
  minimumPrincipalThreshold: Money,
  minimumInterestCharge: Money.optional(),
  caps: z.object({
    maxInterestPerCharge: Money.optional(),
    maxInterestTotalPerLease: Money.optional(),
  }),
  roundingPolicy: z.object({
    precision: z.number().int().min(0).max(4).default(2),
    roundingMode: RoundingModeEnum.default('HALF_UP'),
    carryRemainder: z.boolean().default(true),
  }),
  timezoneRule: TimezoneRule.default('PROPERTY_TIMEZONE'),
  backdating: z.object({
    allowBackdatedAccrual: z.boolean().default(false),
    backdatedMaxDays: z.number().int().min(0).default(0),
    requiresMakerChecker: z.boolean().default(true),
  }),
  auditLevel: AuditLevel.default('STANDARD'),
}).strict();
export type InterestPolicy = z.infer<typeof InterestPolicySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Late fee policy
// ═══════════════════════════════════════════════════════════════════════════

export const LateFeeType = z.enum(['FIXED', 'PERCENTAGE']);
export type LateFeeType = z.infer<typeof LateFeeType>;

export const LateFeeFrequency = z.enum(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY']);
export type LateFeeFrequency = z.infer<typeof LateFeeFrequency>;

export const LateFeePolicySchema = z.object({
  enabled: z.boolean(),
  graceDays: z.number().int().min(0),
  appliesTo: z.object({
    includeCategories: z.array(ChargeCategory).default(['RENT']),
    excludeCategories: z.array(ChargeCategory).default([]),
  }),
  feeType: LateFeeType,
  amount: Money.optional(),
  percent: z.number().min(0).max(100).optional(),
  frequency: LateFeeFrequency.default('ONCE'),
  capAmount: Money.optional(),
  minOutstandingThreshold: Money.optional(),
  maxOccurrencesPerCharge: z.number().int().min(1).optional(),
  doNotApplyIfInterestEnabled: z.boolean().optional(),
  roundingPolicy: z.object({
    precision: z.number().int().min(0).max(4).default(2),
    roundingMode: RoundingModeEnum.default('HALF_UP'),
  }),
  timezoneRule: TimezoneRule.default('PROPERTY_TIMEZONE'),
  auditLevel: AuditLevel.default('STANDARD'),
}).strict();
export type LateFeePolicy = z.infer<typeof LateFeePolicySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Allocation policy (payment → charges)
// ═══════════════════════════════════════════════════════════════════════════

export const AllocationMode = z.enum([
  'OLDEST_DUE_FIRST', 'PRIORITY_THEN_OLDEST', 'RENT_FIRST_THEN_FEES_THEN_INTEREST',
  'MANUAL_ONLY', 'PROPORTIONAL',
]);
export type AllocationMode = z.infer<typeof AllocationMode>;

export const AllocationPolicySchema = z.object({
  mode: AllocationMode,
  priorityOrder: z.array(ChargeCategory).default([]),
  includeDisputedCharges: z.boolean().default(false),
  excludeCategories: z.array(ChargeCategory).default([]),
  minimumAllocationUnit: Money,
  allocateUnappliedCreditAutomatically: z.boolean().default(true),
  tieBreakers: z.object({
    byDueDate: z.boolean().default(true),
    byPostedAt: z.boolean().default(true),
    byCategoryPriority: z.boolean().default(false),
  }),
  interestHandling: z.object({
    payPrincipalBeforeInterest: z.boolean().default(true),
    payLateFeesBeforeInterest: z.boolean().default(true),
  }),
}).strict();
export type AllocationPolicy = z.infer<typeof AllocationPolicySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Reminder policy
// ═══════════════════════════════════════════════════════════════════════════

export const ReminderChannel = z.enum(['EMAIL', 'SMS', 'PUSH']);
export type ReminderChannel = z.infer<typeof ReminderChannel>;

export const ReminderAudience = z.enum(['RESIDENT', 'MANAGER', 'BOTH']);
export type ReminderAudience = z.infer<typeof ReminderAudience>;

export const ReminderTriggerWhen = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('RELATIVE_TO_DUE_DATE'),
    offsetDays: z.number().int(),
  }),
  z.object({
    type: z.literal('RELATIVE_TO_OVERDUE'),
    overdueDays: z.number().int().min(1),
  }),
]);
export type ReminderTriggerWhen = z.infer<typeof ReminderTriggerWhen>;

export const ReminderTrigger = z.object({
  triggerId: z.string().min(1),
  when: ReminderTriggerWhen,
  conditions: z.object({
    minOutstandingThreshold: Money.optional(),
    categories: z.array(ChargeCategory).optional(),
    excludeIfDispute: z.boolean().default(false),
  }),
  channels: z.array(ReminderChannel).min(1),
  audience: ReminderAudience.default('RESIDENT'),
  escalation: z.object({
    notifyRoles: z.array(z.string()).optional(),
    createTask: z.boolean().default(false),
    generateNoticeDocument: z.boolean().default(false),
  }),
});
export type ReminderTrigger = z.infer<typeof ReminderTrigger>;

export const ReminderPolicySchema = z.object({
  enabled: z.boolean(),
  timezoneRule: TimezoneRule.default('PROPERTY_TIMEZONE'),
  quietHours: z.object({
    startLocalTime: z.string().regex(/^\d{2}:\d{2}$/),
    endLocalTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  triggers: z.array(ReminderTrigger),
  compliance: z.object({
    maxSendsPerWeek: z.number().int().min(1).optional(),
    dedupeWindowDays: z.number().int().min(1).default(1),
    perChargeOrPerLease: z.enum(['PER_LEASE', 'PER_CHARGE']).default('PER_LEASE'),
  }),
}).strict();
export type ReminderPolicy = z.infer<typeof ReminderPolicySchema>;

// ═══════════════════════════════════════════════════════════════════════════
// Policy version wrapper (stored in D1)
// ═══════════════════════════════════════════════════════════════════════════

export const PolicyKind = z.enum(['INTEREST', 'LATE_FEE', 'ALLOCATION', 'REMINDER']);
export type PolicyKind = z.infer<typeof PolicyKind>;

export const PolicyScopeType = z.enum(['CLIENT', 'PROPERTY', 'LEASE', 'GEO']);
export type PolicyScopeType = z.infer<typeof PolicyScopeType>;

export const PolicyVersionStatus = z.enum(['DRAFT', 'PUBLISHED', 'DEPRECATED']);
export type PolicyVersionStatus = z.infer<typeof PolicyVersionStatus>;

export const PolicyVersionResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  kind: PolicyKind,
  policyId: z.string(),
  schemaVersion: z.number().int(),
  policyVersion: z.number().int(),
  status: PolicyVersionStatus,
  scopeType: PolicyScopeType,
  scopeId: z.string().optional(),
  publishedAt: z.string().optional(),
  publishedByActorId: z.string().optional(),
  createdAt: z.string(),
});
export type PolicyVersionResponse = z.infer<typeof PolicyVersionResponse>;

export const PublishPolicyRequest = z.object({
  clientId: z.string(),
  kind: PolicyKind,
  payload: z.unknown(),
  scopeType: PolicyScopeType.default('CLIENT'),
  scopeId: z.string().optional(),
}).strict();
export type PublishPolicyRequest = z.infer<typeof PublishPolicyRequest>;

// ═══════════════════════════════════════════════════════════════════════════
// Payment API DTOs
// ═══════════════════════════════════════════════════════════════════════════

export const InitiatePaymentRequest = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  amount: Money,
  paymentMethodType: PaymentMethodType,
  provider: PaymentProvider.default('STRIPE'),
  idempotencyKey: z.string().min(1).max(100),
}).strict();
export type InitiatePaymentRequest = z.infer<typeof InitiatePaymentRequest>;

export const RecordManualPaymentRequest = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  propertyId: z.string(),
  residentId: z.string().optional(),
  amount: Money,
  paymentMethodType: PaymentMethodType,
  description: z.string().min(1).max(500),
  receivedAt: z.string(),
  idempotencyKey: z.string().min(1).max(100),
}).strict();
export type RecordManualPaymentRequest = z.infer<typeof RecordManualPaymentRequest>;

export const PaymentResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  leaseId: z.string().optional(),
  residentId: z.string().optional(),
  status: PaymentStatus,
  paymentMethodType: PaymentMethodType,
  provider: PaymentProvider,
  providerPaymentId: z.string().optional(),
  amountReceived: z.number().int(),
  receivedCurrency: z.string().length(3),
  amountLedger: z.number().int(),
  ledgerCurrency: z.string().length(3),
  initiatedAt: z.string(),
  settledAt: z.string().optional(),
  idempotencyKey: z.string().optional(),
  createdByActorId: z.string(),
  correlationId: z.string(),
  createdAt: z.string(),
});
export type PaymentResponse = z.infer<typeof PaymentResponse>;

export const PaymentAllocationResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  targetLedgerChargeEntryId: z.string(),
  allocatedAmount: z.number().int(),
  currency: z.string().length(3),
  allocationOrder: z.number().int(),
  allocationRuleApplied: z.string(),
  allocatedAt: z.string(),
  actorId: z.string(),
  correlationId: z.string(),
});
export type PaymentAllocationResponse = z.infer<typeof PaymentAllocationResponse>;

// ═══════════════════════════════════════════════════════════════════════════
// Delinquency run triggers
// ═══════════════════════════════════════════════════════════════════════════

export const RunInterestAccrualRequest = z.object({
  clientId: z.string(),
  asOfDate: z.string(),
  scope: z.enum(['CLIENT', 'PROPERTY', 'LEASE']).default('CLIENT'),
  scopeId: z.string().optional(),
}).strict();
export type RunInterestAccrualRequest = z.infer<typeof RunInterestAccrualRequest>;

export const RunLateFeeRequest = z.object({
  clientId: z.string(),
  asOfDate: z.string(),
}).strict();
export type RunLateFeeRequest = z.infer<typeof RunLateFeeRequest>;

export const ScheduleRemindersRequest = z.object({
  clientId: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
}).strict();
export type ScheduleRemindersRequest = z.infer<typeof ScheduleRemindersRequest>;
