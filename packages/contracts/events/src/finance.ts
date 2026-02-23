import { z } from "zod";

// ── Event type constants ───────────────────────────────────────────────────

export const CHARGE_DEFINITION_CREATED = "finance.charge_definition.created" as const;
export const CHARGE_DEFINITION_UPDATED = "finance.charge_definition.updated" as const;
export const CHARGE_PLAN_CREATED = "finance.charge_plan.created" as const;
export const CHARGE_PLAN_UPDATED = "finance.charge_plan.updated" as const;
export const CHARGE_ASSIGNED = "finance.charge.assigned" as const;
export const CHARGE_ASSIGNMENT_ENDED = "finance.charge_assignment.ended" as const;
export const CHARGE_OCCURRENCE_GENERATED = "finance.charge_occurrence.generated" as const;
export const LEDGER_ENTRY_POSTED = "finance.ledger_entry.posted" as const;
export const LEDGER_ENTRY_VOIDED = "finance.ledger_entry.voided" as const;
export const CREDIT_APPLIED = "finance.credit.applied" as const;
export const WAIVER_APPLIED = "finance.waiver.applied" as const;
export const ADJUSTMENT_APPLIED = "finance.adjustment.applied" as const;
export const LATE_FEE_APPLIED = "finance.late_fee.applied" as const;

// ── Payload schemas ────────────────────────────────────────────────────────

export const ChargeDefinitionCreatedPayload = z.object({
  chargeDefinitionId: z.string(),
  clientId: z.string(),
  name: z.string(),
  category: z.string(),
});
export type ChargeDefinitionCreatedPayload = z.infer<typeof ChargeDefinitionCreatedPayload>;

export const ChargeDefinitionUpdatedPayload = z.object({
  chargeDefinitionId: z.string(),
  clientId: z.string(),
  changedFields: z.array(z.string()),
});
export type ChargeDefinitionUpdatedPayload = z.infer<typeof ChargeDefinitionUpdatedPayload>;

export const ChargePlanCreatedPayload = z.object({
  chargePlanId: z.string(),
  clientId: z.string(),
  chargeDefinitionId: z.string(),
  name: z.string(),
});
export type ChargePlanCreatedPayload = z.infer<typeof ChargePlanCreatedPayload>;

export const ChargePlanUpdatedPayload = z.object({
  chargePlanId: z.string(),
  clientId: z.string(),
  changedFields: z.array(z.string()),
});
export type ChargePlanUpdatedPayload = z.infer<typeof ChargePlanUpdatedPayload>;

export const ChargeAssignedPayload = z.object({
  chargeAssignmentId: z.string(),
  clientId: z.string(),
  chargePlanId: z.string(),
  scopeType: z.string(),
  scopeId: z.string(),
  effectiveFrom: z.string(),
});
export type ChargeAssignedPayload = z.infer<typeof ChargeAssignedPayload>;

export const ChargeAssignmentEndedPayload = z.object({
  chargeAssignmentId: z.string(),
  clientId: z.string(),
  endedAt: z.string(),
});
export type ChargeAssignmentEndedPayload = z.infer<typeof ChargeAssignmentEndedPayload>;

export const ChargeOccurrenceGeneratedPayload = z.object({
  occurrenceId: z.string(),
  clientId: z.string(),
  chargeAssignmentId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  ledgerEntryIds: z.array(z.string()),
});
export type ChargeOccurrenceGeneratedPayload = z.infer<typeof ChargeOccurrenceGeneratedPayload>;

export const LedgerEntryPostedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  entryType: z.string(),
  amount: z.number(),
  currency: z.string(),
  leaseId: z.string().optional(),
  propertyId: z.string(),
});
export type LedgerEntryPostedPayload = z.infer<typeof LedgerEntryPostedPayload>;

export const LedgerEntryVoidedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  voidEntryId: z.string(),
  reason: z.string(),
});
export type LedgerEntryVoidedPayload = z.infer<typeof LedgerEntryVoidedPayload>;

export const CreditAppliedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  amount: z.number(),
  currency: z.string(),
  linkedEntryId: z.string(),
});
export type CreditAppliedPayload = z.infer<typeof CreditAppliedPayload>;

export const WaiverAppliedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  amount: z.number(),
  currency: z.string(),
  linkedEntryId: z.string(),
  reason: z.string(),
});
export type WaiverAppliedPayload = z.infer<typeof WaiverAppliedPayload>;

export const AdjustmentAppliedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  amount: z.number(),
  currency: z.string(),
  linkedEntryId: z.string().optional(),
  reason: z.string(),
});
export type AdjustmentAppliedPayload = z.infer<typeof AdjustmentAppliedPayload>;

export const LateFeeAppliedPayload = z.object({
  ledgerEntryId: z.string(),
  clientId: z.string(),
  amount: z.number(),
  currency: z.string(),
  originalChargeEntryId: z.string(),
  leaseId: z.string(),
});
export type LateFeeAppliedPayload = z.infer<typeof LateFeeAppliedPayload>;
