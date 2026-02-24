import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// Settlement / Reconciliation / Dispute / Export event payloads
// ═══════════════════════════════════════════════════════════════════════════

export const PROVIDER_EVENT_INGESTED = 'finance.provider.event_ingested' as const;
export const BALANCE_TRANSACTIONS_SYNCED = 'finance.settlement.balance_txns_synced' as const;
export const RECONCILIATION_UPDATED = 'finance.settlement.reconciliation_updated' as const;
export const RECONCILIATION_MISMATCH_DETECTED = 'finance.settlement.mismatch_detected' as const;
export const PROVIDER_FEE_POSTED = 'finance.settlement.fee_posted' as const;
export const PAYOUT_RECONCILED = 'finance.settlement.payout_reconciled' as const;
export const PAYOUT_MISMATCH_DETECTED = 'finance.settlement.payout_mismatch' as const;
export const DISPUTE_OPENED = 'finance.dispute.opened' as const;
export const DISPUTE_UPDATED = 'finance.dispute.updated' as const;
export const DISPUTE_CLOSED = 'finance.dispute.closed' as const;
export const CHARGEBACK_APPLIED = 'finance.chargeback.applied' as const;
export const REFUND_SUCCEEDED = 'finance.refund.succeeded' as const;
export const REFUND_FAILED = 'finance.refund.failed' as const;
export const EXPORT_QUEUED = 'finance.export.queued' as const;
export const EXPORT_COMPLETED = 'finance.export.completed' as const;
export const EXPORT_FAILED = 'finance.export.failed' as const;
export const PROJECTION_UPDATED = 'finance.projection.updated' as const;

// ── Event payloads ─────────────────────────────────────────────────────────

export const ProviderEventIngestedPayload = z.object({
  clientId: z.string(),
  provider: z.string(),
  providerEventId: z.string(),
  eventType: z.string(),
});
export type ProviderEventIngestedPayload = z.infer<typeof ProviderEventIngestedPayload>;

export const BalanceTransactionsSyncedPayload = z.object({
  clientId: z.string(),
  provider: z.string(),
  transactionCount: z.number().int(),
  windowStart: z.string(),
  windowEnd: z.string(),
});
export type BalanceTransactionsSyncedPayload = z.infer<typeof BalanceTransactionsSyncedPayload>;

export const ReconciliationUpdatedPayload = z.object({
  clientId: z.string(),
  reconciliationMatchId: z.string(),
  providerTxnId: z.string(),
  paymentId: z.string().optional(),
  status: z.enum(['MATCHED', 'MISMATCH', 'NEEDS_REVIEW']),
});
export type ReconciliationUpdatedPayload = z.infer<typeof ReconciliationUpdatedPayload>;

export const ReconciliationMismatchPayload = z.object({
  clientId: z.string(),
  reconciliationMatchId: z.string(),
  providerTxnId: z.string(),
  mismatchReasons: z.array(z.string()),
});
export type ReconciliationMismatchPayload = z.infer<typeof ReconciliationMismatchPayload>;

export const ProviderFeePostedPayload = z.object({
  clientId: z.string(),
  ledgerEntryId: z.string(),
  providerTxnId: z.string(),
  feeAmount: z.number(),
  currency: z.string(),
});
export type ProviderFeePostedPayload = z.infer<typeof ProviderFeePostedPayload>;

export const PayoutReconciledPayload = z.object({
  clientId: z.string(),
  providerPayoutId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['MATCHED', 'MISMATCH']),
});
export type PayoutReconciledPayload = z.infer<typeof PayoutReconciledPayload>;

export const DisputeOpenedPayload = z.object({
  disputeId: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string(),
});
export type DisputeOpenedPayload = z.infer<typeof DisputeOpenedPayload>;

export const DisputeUpdatedPayload = z.object({
  disputeId: z.string(),
  clientId: z.string(),
  status: z.string(),
});
export type DisputeUpdatedPayload = z.infer<typeof DisputeUpdatedPayload>;

export const DisputeClosedPayload = z.object({
  disputeId: z.string(),
  clientId: z.string(),
  outcome: z.string(),
});
export type DisputeClosedPayload = z.infer<typeof DisputeClosedPayload>;

export const ChargebackAppliedPayload = z.object({
  disputeId: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type ChargebackAppliedPayload = z.infer<typeof ChargebackAppliedPayload>;

export const RefundSucceededEventPayload = z.object({
  refundId: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type RefundSucceededEventPayload = z.infer<typeof RefundSucceededEventPayload>;

export const RefundFailedEventPayload = z.object({
  refundId: z.string(),
  clientId: z.string(),
  paymentId: z.string(),
  reason: z.string(),
});
export type RefundFailedEventPayload = z.infer<typeof RefundFailedEventPayload>;

export const ExportQueuedPayload = z.object({
  exportJobId: z.string(),
  clientId: z.string(),
  kind: z.string(),
});
export type ExportQueuedPayload = z.infer<typeof ExportQueuedPayload>;

export const ExportCompletedPayload = z.object({
  exportJobId: z.string(),
  clientId: z.string(),
  kind: z.string(),
});
export type ExportCompletedPayload = z.infer<typeof ExportCompletedPayload>;

export const ExportFailedPayload = z.object({
  exportJobId: z.string(),
  clientId: z.string(),
  kind: z.string(),
  reason: z.string(),
});
export type ExportFailedPayload = z.infer<typeof ExportFailedPayload>;

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

export const ReconcileBalanceTxnJobSchema = BaseJobFields.extend({
  provider: z.string(),
  providerTxnId: z.string(),
}).strict();
export type ReconcileBalanceTxnJob = z.infer<typeof ReconcileBalanceTxnJobSchema>;

export const ReconcilePayoutJobSchema = BaseJobFields.extend({
  provider: z.string(),
  providerPayoutId: z.string(),
}).strict();
export type ReconcilePayoutJob = z.infer<typeof ReconcilePayoutJobSchema>;

export const DisputeUpdateJobSchema = BaseJobFields.extend({
  provider: z.string(),
  providerDisputeId: z.string(),
  newStatus: z.string(),
}).strict();
export type DisputeUpdateJob = z.infer<typeof DisputeUpdateJobSchema>;

export const RefundUpdateJobSchema = BaseJobFields.extend({
  provider: z.string(),
  providerRefundId: z.string(),
  newStatus: z.string(),
}).strict();
export type RefundUpdateJob = z.infer<typeof RefundUpdateJobSchema>;

export const ExportRunJobSchema = BaseJobFields.extend({
  exportJobId: z.string(),
}).strict();
export type ExportRunJob = z.infer<typeof ExportRunJobSchema>;

export const ProjectionsUpdateJobSchema = BaseJobFields.extend({
  eventId: z.string(),
  eventType: z.string(),
}).strict();
export type ProjectionsUpdateJob = z.infer<typeof ProjectionsUpdateJobSchema>;
