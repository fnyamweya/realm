// ═══════════════════════════════════════════════════════════════════════════
// Provider Balance Transaction — normalized internal representation
// ═══════════════════════════════════════════════════════════════════════════

export const ProviderTxnType = {
  CHARGE: 'CHARGE',
  REFUND: 'REFUND',
  DISPUTE: 'DISPUTE',
  DISPUTE_FEE: 'DISPUTE_FEE',
  PAYOUT: 'PAYOUT',
  PAYOUT_REVERSAL: 'PAYOUT_REVERSAL',
  ADJUSTMENT: 'ADJUSTMENT',
  FEE: 'FEE',
} as const;
export type ProviderTxnType = (typeof ProviderTxnType)[keyof typeof ProviderTxnType];

export interface ProviderBalanceTransactionData {
  readonly id: string;
  readonly clientId: string;
  readonly provider: string;
  readonly providerTxnId: string;
  readonly type: ProviderTxnType;
  readonly amount: number;
  readonly currency: string;
  readonly feeAmount: number;
  readonly feeCurrency: string;
  readonly netAmount: number;
  readonly occurredAt: string;
  readonly availableOn: string | undefined;
  readonly relatedProviderPaymentId: string | undefined;
  readonly relatedProviderChargeId: string | undefined;
  readonly rawRef: string | undefined;
  readonly createdAt: string;
}

/**
 * ProviderBalanceTransaction is an immutable value object representing
 * a normalized balance line item from a payment provider.
 * No state machine needed — these are ingested facts.
 */
export class ProviderBalanceTransaction {
  readonly data: ProviderBalanceTransactionData;

  private constructor(data: ProviderBalanceTransactionData) {
    this.data = data;
    Object.freeze(this.data);
  }

  static create(props: ProviderBalanceTransactionData): ProviderBalanceTransaction {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.providerTxnId) throw new Error('providerTxnId is required');
    if (!props.provider) throw new Error('provider is required');
    return new ProviderBalanceTransaction(props);
  }

  static fromData(data: ProviderBalanceTransactionData): ProviderBalanceTransaction {
    return new ProviderBalanceTransaction(data);
  }

  isFeeTransaction(): boolean {
    return this.data.type === ProviderTxnType.FEE ||
           this.data.type === ProviderTxnType.DISPUTE_FEE;
  }

  isPayoutRelated(): boolean {
    return this.data.type === ProviderTxnType.PAYOUT ||
           this.data.type === ProviderTxnType.PAYOUT_REVERSAL;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Reconciliation Match — links provider txns to internal payments/ledger
// ═══════════════════════════════════════════════════════════════════════════

export const ReconciliationStatus = {
  MATCHED: 'MATCHED',
  MISMATCH: 'MISMATCH',
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;
export type ReconciliationStatus = (typeof ReconciliationStatus)[keyof typeof ReconciliationStatus];

export const MismatchReason = {
  AMOUNT: 'AMOUNT',
  CURRENCY: 'CURRENCY',
  MISSING_INTERNAL: 'MISSING_INTERNAL',
  MISSING_PROVIDER: 'MISSING_PROVIDER',
  DUPLICATE: 'DUPLICATE',
  TIMING: 'TIMING',
} as const;
export type MismatchReason = (typeof MismatchReason)[keyof typeof MismatchReason];

export interface ReconciliationMatchData {
  readonly id: string;
  readonly clientId: string;
  readonly provider: string;
  readonly providerTxnId: string;
  readonly paymentId: string | undefined;
  readonly ledgerEntryId: string | undefined;
  readonly status: ReconciliationStatus;
  readonly mismatchReasons: readonly string[];
  readonly providerAmount: number;
  readonly providerCurrency: string;
  readonly internalAmount: number | undefined;
  readonly internalCurrency: string | undefined;
  readonly matchedAt: string;
  readonly notes: string | undefined;
  readonly correlationId: string;
  readonly createdAt: string;
}

export class ReconciliationMatch {
  readonly data: ReconciliationMatchData;

  private constructor(data: ReconciliationMatchData) {
    this.data = data;
    Object.freeze(this.data);
  }

  static createMatched(props: Omit<ReconciliationMatchData, 'status' | 'mismatchReasons'>): ReconciliationMatch {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.providerTxnId) throw new Error('providerTxnId is required');
    return new ReconciliationMatch({
      ...props,
      status: ReconciliationStatus.MATCHED,
      mismatchReasons: [],
    });
  }

  static createMismatch(
    props: Omit<ReconciliationMatchData, 'status'>,
    reasons: readonly string[],
  ): ReconciliationMatch {
    if (!props.clientId) throw new Error('clientId is required');
    if (reasons.length === 0) throw new Error('At least one mismatch reason required');
    return new ReconciliationMatch({
      ...props,
      status: ReconciliationStatus.MISMATCH,
      mismatchReasons: reasons,
    });
  }

  static createNeedsReview(
    props: Omit<ReconciliationMatchData, 'status'>,
    reasons: readonly string[],
  ): ReconciliationMatch {
    if (!props.clientId) throw new Error('clientId is required');
    return new ReconciliationMatch({
      ...props,
      status: ReconciliationStatus.NEEDS_REVIEW,
      mismatchReasons: reasons,
    });
  }

  static fromData(data: ReconciliationMatchData): ReconciliationMatch {
    return new ReconciliationMatch(data);
  }

  isMatched(): boolean { return this.data.status === ReconciliationStatus.MATCHED; }
  hasMismatch(): boolean { return this.data.status === ReconciliationStatus.MISMATCH; }
}
