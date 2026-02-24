import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// Settlement / Dispute / Refund / Export API DTOs
// ═══════════════════════════════════════════════════════════════════════════

// ── Provider balance transaction ───────────────────────────────────────────

export const ProviderTxnTypeEnum = z.enum([
  'CHARGE', 'REFUND', 'DISPUTE', 'DISPUTE_FEE', 'PAYOUT', 'PAYOUT_REVERSAL', 'ADJUSTMENT', 'FEE',
]);

export const ProviderBalanceTransactionResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  provider: z.string(),
  providerTxnId: z.string(),
  type: ProviderTxnTypeEnum,
  amount: z.number().int(),
  currency: z.string().length(3),
  feeAmount: z.number().int(),
  feeCurrency: z.string().length(3),
  netAmount: z.number().int(),
  occurredAt: z.string(),
  availableOn: z.string().optional(),
  relatedProviderPaymentId: z.string().optional(),
  createdAt: z.string(),
});
export type ProviderBalanceTransactionResponse = z.infer<typeof ProviderBalanceTransactionResponse>;

// ── Reconciliation ─────────────────────────────────────────────────────────

export const ReconciliationStatusEnum = z.enum(['MATCHED', 'MISMATCH', 'NEEDS_REVIEW']);
export const MismatchReasonEnum = z.enum(['AMOUNT', 'CURRENCY', 'MISSING_INTERNAL', 'MISSING_PROVIDER', 'DUPLICATE', 'TIMING']);

export const ReconciliationMatchResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  provider: z.string(),
  providerTxnId: z.string(),
  paymentId: z.string().optional(),
  ledgerEntryId: z.string().optional(),
  status: ReconciliationStatusEnum,
  mismatchReasons: z.array(z.string()),
  providerAmount: z.number().int(),
  providerCurrency: z.string().length(3),
  internalAmount: z.number().int().optional(),
  internalCurrency: z.string().length(3).optional(),
  matchedAt: z.string(),
  createdAt: z.string(),
});
export type ReconciliationMatchResponse = z.infer<typeof ReconciliationMatchResponse>;

// ── Disputes ───────────────────────────────────────────────────────────────

export const DisputeStatusEnum = z.enum(['OPEN', 'EVIDENCE_SUBMITTED', 'WON', 'LOST', 'CLOSED']);
export const DisputeReasonEnum = z.enum([
  'FRAUDULENT', 'DUPLICATE', 'PRODUCT_NOT_RECEIVED', 'PRODUCT_UNACCEPTABLE',
  'SUBSCRIPTION_CANCELED', 'UNRECOGNIZED', 'GENERAL', 'OTHER',
]);

export const DisputeResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  provider: z.string(),
  providerDisputeId: z.string(),
  status: DisputeStatusEnum,
  reason: DisputeReasonEnum,
  amount: z.number().int(),
  currency: z.string().length(3),
  feeAmount: z.number().int().optional(),
  feeCurrency: z.string().length(3).optional(),
  openedAt: z.string(),
  evidenceDueBy: z.string().optional(),
  closedAt: z.string().optional(),
  createdAt: z.string(),
});
export type DisputeResponse = z.infer<typeof DisputeResponse>;

// ── Refunds ────────────────────────────────────────────────────────────────

export const RefundStatusEnum = z.enum(['INITIATED', 'SUCCEEDED', 'FAILED']);

export const InitiateRefundRequest = z.object({
  clientId: z.string(),
  paymentId: z.string(),
  amount: z.number().int().min(1),
  currency: z.string().length(3),
  reason: z.string().min(1).max(500),
  idempotencyKey: z.string().min(1).max(100),
}).strict();
export type InitiateRefundRequest = z.infer<typeof InitiateRefundRequest>;

export const RefundResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  provider: z.string(),
  providerRefundId: z.string().optional(),
  status: RefundStatusEnum,
  amount: z.number().int(),
  currency: z.string().length(3),
  reason: z.string(),
  createdByActorId: z.string(),
  createdAt: z.string(),
});
export type RefundResponse = z.infer<typeof RefundResponse>;

// ── Exports ────────────────────────────────────────────────────────────────

export const ExportJobKindEnum = z.enum(['LEDGER_EXPORT', 'STATEMENT', 'RECON_REPORT', 'DISPUTE_REPORT']);
export const ExportJobStatusEnum = z.enum(['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED']);

export const CreateExportJobRequest = z.object({
  clientId: z.string(),
  kind: ExportJobKindEnum,
  parameters: z.record(z.unknown()),
}).strict();
export type CreateExportJobRequest = z.infer<typeof CreateExportJobRequest>;

export const ExportJobResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  kind: ExportJobKindEnum,
  status: ExportJobStatusEnum,
  resultRef: z.string().optional(),
  isSandboxWatermarked: z.boolean(),
  createdByActorId: z.string(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  failureReason: z.string().optional(),
});
export type ExportJobResponse = z.infer<typeof ExportJobResponse>;

// ── Sync trigger ───────────────────────────────────────────────────────────

export const SyncBalanceTransactionsRequest = z.object({
  clientId: z.string(),
  provider: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
}).strict();
export type SyncBalanceTransactionsRequest = z.infer<typeof SyncBalanceTransactionsRequest>;

// ── Balance summary (projections) ──────────────────────────────────────────

export const LeaseBalanceSummaryResponse = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  propertyId: z.string(),
  totalCharges: z.number().int(),
  totalPayments: z.number().int(),
  totalCredits: z.number().int(),
  totalRefunds: z.number().int(),
  currentBalance: z.number().int(),
  currency: z.string().length(3),
  lastUpdatedAt: z.string(),
});
export type LeaseBalanceSummaryResponse = z.infer<typeof LeaseBalanceSummaryResponse>;

export const AgingBucketSummaryResponse = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  propertyId: z.string(),
  current: z.number().int(),
  days1to30: z.number().int(),
  days31to60: z.number().int(),
  days61to90: z.number().int(),
  days90plus: z.number().int(),
  currency: z.string().length(3),
  lastUpdatedAt: z.string(),
});
export type AgingBucketSummaryResponse = z.infer<typeof AgingBucketSummaryResponse>;

export const DelinquencyStatusEnum = z.enum(['CURRENT', 'AT_RISK', 'DELINQUENT', 'IN_DISPUTE']);

export const DelinquencyStatusResponse = z.object({
  clientId: z.string(),
  leaseId: z.string(),
  propertyId: z.string(),
  status: DelinquencyStatusEnum,
  daysOverdue: z.number().int(),
  totalOverdue: z.number().int(),
  currency: z.string().length(3),
  hasOpenDispute: z.boolean(),
  lastUpdatedAt: z.string(),
});
export type DelinquencyStatusResponse = z.infer<typeof DelinquencyStatusResponse>;

// ── Compliance profile ─────────────────────────────────────────────────────

export const ComplianceProfileResponse = z.object({
  geoKey: z.string(),
  maxAprPercent: z.number(),
  lateFeeAllowed: z.boolean(),
  recurringLateFeeAllowed: z.boolean(),
  compoundingAllowed: z.boolean(),
  retentionYears: z.number().int().min(1),
});
export type ComplianceProfileResponse = z.infer<typeof ComplianceProfileResponse>;
