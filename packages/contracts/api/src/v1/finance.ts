import { z } from 'zod';

// ── Shared enums ───────────────────────────────────────────────────────────

export const ChargeCategory = z.enum([
  'RENT', 'PARKING', 'UTILITY', 'FEE', 'DEPOSIT', 'PET', 'AMENITY',
  'LATE_FEE', 'INSURANCE', 'TAX', 'OTHER',
]);
export type ChargeCategory = z.infer<typeof ChargeCategory>;

export const Frequency = z.enum(['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']);
export type Frequency = z.infer<typeof Frequency>;

export const BillingMode = z.enum(['IN_ADVANCE', 'IN_ARREARS']);
export type BillingMode = z.infer<typeof BillingMode>;

export const ProrationPolicy = z.enum(['NONE', 'DAILY_ACTUAL', 'DAILY_30', 'HOURLY']);
export type ProrationPolicy = z.infer<typeof ProrationPolicy>;

export const AllocationMethod = z.enum([
  'SINGLE_PAYER', 'SPLIT_EQUAL', 'SPLIT_PERCENTAGES', 'SPLIT_FIXED_AMOUNTS',
]);
export type AllocationMethod = z.infer<typeof AllocationMethod>;

export const LedgerEntryType = z.enum([
  'CHARGE', 'PAYMENT', 'CREDIT', 'WAIVER', 'ADJUSTMENT', 'REFUND', 'VOID',
]);
export type LedgerEntryType = z.infer<typeof LedgerEntryType>;

export const AssignmentScope = z.enum(['PROPERTY', 'UNIT', 'LEASE', 'RESIDENT']);
export type AssignmentScope = z.infer<typeof AssignmentScope>;

export const ChargeDefinitionStatus = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export type ChargeDefinitionStatus = z.infer<typeof ChargeDefinitionStatus>;

export const ChargePlanStatus = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export type ChargePlanStatus = z.infer<typeof ChargePlanStatus>;

export const ChargeAssignmentStatus = z.enum(['ACTIVE', 'ENDED', 'SUSPENDED']);
export type ChargeAssignmentStatus = z.infer<typeof ChargeAssignmentStatus>;

// ── Money VO ───────────────────────────────────────────────────────────────

export const Money = z.object({
  amount: z.number(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
});
export type Money = z.infer<typeof Money>;

// ── Recurrence spec ────────────────────────────────────────────────────────

export const RecurrenceSpec = z.object({
  frequency: Frequency,
  interval: z.number().int().min(1).default(1),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  endOfMonthPolicy: z.enum(['LAST_DAY', 'EXACT', 'NEXT_MONTH_1ST']).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  hour: z.number().int().min(0).max(23).optional(),
  minute: z.number().int().min(0).max(59).optional(),
  billingMode: BillingMode.default('IN_ADVANCE'),
  timezone: z.string().default('UTC'),
});
export type RecurrenceSpec = z.infer<typeof RecurrenceSpec>;

// ── Due rule spec ──────────────────────────────────────────────────────────

export const DueRuleSpec = z.object({
  dueAtPeriodStart: z.boolean().default(true),
  dueAtPeriodEnd: z.boolean().default(false),
  dueOffsetDays: z.number().int().default(0),
  graceDays: z.number().int().min(0).default(0),
});
export type DueRuleSpec = z.infer<typeof DueRuleSpec>;

// ── Allocation rule ────────────────────────────────────────────────────────

export const AllocationSplit = z.object({
  residentId: z.string(),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().min(0).optional(),
});
export type AllocationSplit = z.infer<typeof AllocationSplit>;

export const AllocationRule = z.object({
  method: AllocationMethod,
  splits: z.array(AllocationSplit).optional(),
});
export type AllocationRule = z.infer<typeof AllocationRule>;

// ── Charge definition (catalog item) ───────────────────────────────────────

export const CreateChargeDefinitionRequest = z.object({
  clientId: z.string(),
  name: z.string().min(1).max(200),
  category: ChargeCategory,
  description: z.string().max(1000).optional(),
  glCode: z.string().max(50).optional(),
  taxable: z.boolean().default(false),
  metadataSchema: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type CreateChargeDefinitionRequest = z.infer<typeof CreateChargeDefinitionRequest>;

export const UpdateChargeDefinitionRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  glCode: z.string().max(50).optional(),
  taxable: z.boolean().optional(),
  status: ChargeDefinitionStatus.optional(),
  metadataSchema: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type UpdateChargeDefinitionRequest = z.infer<typeof UpdateChargeDefinitionRequest>;

export const ChargeDefinitionResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  category: ChargeCategory,
  description: z.string().optional(),
  glCode: z.string().optional(),
  taxable: z.boolean(),
  status: ChargeDefinitionStatus,
  metadataSchema: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChargeDefinitionResponse = z.infer<typeof ChargeDefinitionResponse>;

// ── Charge plan (calculation + schedule template) ──────────────────────────

export const CreateChargePlanRequest = z.object({
  clientId: z.string(),
  chargeDefinitionId: z.string(),
  name: z.string().min(1).max(200),
  baseAmount: Money,
  recurrence: RecurrenceSpec,
  dueRule: DueRuleSpec.optional(),
  prorationPolicy: ProrationPolicy.default('NONE'),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type CreateChargePlanRequest = z.infer<typeof CreateChargePlanRequest>;

export const UpdateChargePlanRequest = z.object({
  name: z.string().min(1).max(200).optional(),
  baseAmount: Money.optional(),
  recurrence: RecurrenceSpec.optional(),
  dueRule: DueRuleSpec.optional(),
  prorationPolicy: ProrationPolicy.optional(),
  status: ChargePlanStatus.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type UpdateChargePlanRequest = z.infer<typeof UpdateChargePlanRequest>;

export const ChargePlanResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  chargeDefinitionId: z.string(),
  name: z.string(),
  baseAmount: Money,
  recurrence: RecurrenceSpec,
  dueRule: DueRuleSpec,
  prorationPolicy: ProrationPolicy,
  status: ChargePlanStatus,
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChargePlanResponse = z.infer<typeof ChargePlanResponse>;

// ── Charge assignment (binding plan to scope) ──────────────────────────────

export const CreateChargeAssignmentRequest = z.object({
  clientId: z.string(),
  chargePlanId: z.string(),
  scopeType: AssignmentScope,
  scopeId: z.string(),
  leaseId: z.string().optional(),
  overrideAmount: Money.optional(),
  overrideRecurrence: RecurrenceSpec.optional(),
  allocationRule: AllocationRule.optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type CreateChargeAssignmentRequest = z.infer<typeof CreateChargeAssignmentRequest>;

export const ChargeAssignmentResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  chargePlanId: z.string(),
  scopeType: AssignmentScope,
  scopeId: z.string(),
  leaseId: z.string().optional(),
  overrideAmount: Money.optional(),
  overrideRecurrence: RecurrenceSpec.optional(),
  allocationRule: AllocationRule.optional(),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
  status: ChargeAssignmentStatus,
  metadata: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChargeAssignmentResponse = z.infer<typeof ChargeAssignmentResponse>;

// ── Manual charge posting ──────────────────────────────────────────────────

export const PostManualChargeRequest = z.object({
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string().optional(),
  leaseId: z.string().optional(),
  residentId: z.string().optional(),
  chargeDefinitionId: z.string(),
  amount: Money,
  description: z.string().min(1).max(500),
  dueDate: z.string(),
  idempotencyKey: z.string().min(1).max(100),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict();
export type PostManualChargeRequest = z.infer<typeof PostManualChargeRequest>;

// ── Adjustment / Credit / Waiver / Void ────────────────────────────────────

export const AdjustmentType = z.enum(['CREDIT', 'WAIVER', 'ADJUSTMENT', 'VOID']);
export type AdjustmentType = z.infer<typeof AdjustmentType>;

export const ApplyAdjustmentRequest = z.object({
  clientId: z.string(),
  ledgerEntryId: z.string(),
  type: AdjustmentType,
  amount: Money.optional(),
  reason: z.string().min(1).max(1000),
  idempotencyKey: z.string().min(1).max(100),
}).strict();
export type ApplyAdjustmentRequest = z.infer<typeof ApplyAdjustmentRequest>;

// ── Ledger entry response ──────────────────────────────────────────────────

export const LedgerEntryResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  entryType: LedgerEntryType,
  propertyId: z.string(),
  unitId: z.string().optional(),
  leaseId: z.string().optional(),
  residentId: z.string().optional(),
  amount: Money,
  dueDate: z.string().optional(),
  postedAt: z.string(),
  chargeDefinitionId: z.string().optional(),
  chargePlanId: z.string().optional(),
  chargeAssignmentId: z.string().optional(),
  occurrenceId: z.string().optional(),
  allocationGroupId: z.string().optional(),
  linkedEntryId: z.string().optional(),
  description: z.string(),
  idempotencyKey: z.string().optional(),
  createdByActorId: z.string(),
  correlationId: z.string(),
  createdAt: z.string(),
});
export type LedgerEntryResponse = z.infer<typeof LedgerEntryResponse>;

// ── Balance response ───────────────────────────────────────────────────────

export const BalanceResponse = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  totalCharges: Money,
  totalPayments: Money,
  totalCredits: Money,
  totalWaivers: Money,
  currentBalance: Money,
  asOf: z.string(),
});
export type BalanceResponse = z.infer<typeof BalanceResponse>;

// ── Ledger list query ──────────────────────────────────────────────────────

export const ListLedgerEntriesRequest = z.object({
  clientId: z.string(),
  leaseId: z.string().optional(),
  propertyId: z.string().optional(),
  unitId: z.string().optional(),
  residentId: z.string().optional(),
  entryType: LedgerEntryType.optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(25),
});
export type ListLedgerEntriesRequest = z.infer<typeof ListLedgerEntriesRequest>;
