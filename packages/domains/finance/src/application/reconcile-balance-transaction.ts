import type { ProviderBalanceTransactionRepository, ReconciliationMatchRepository } from '../ports/settlement-repository.js';
import type { PaymentRepository } from '../ports/payment-repository.js';
import {
  ReconciliationMatch,
  MismatchReason,
  type ReconciliationMatchData,
  type ProviderBalanceTransactionData,
} from '../domain/settlement.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface ReconcileBalanceTransactionInput {
  readonly clientId: string;
  readonly provider: string;
  readonly providerTxnId: string;
  readonly matchId: string;
  readonly correlationId: string;
}

export interface ReconcileBalanceTransactionOutput {
  readonly match: ReconciliationMatchData;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Reconciles a single provider balance transaction against internal records.
 * Idempotent by providerTxnId (checks if match already exists).
 */
export async function reconcileBalanceTransaction(
  input: ReconcileBalanceTransactionInput,
  txnRepo: ProviderBalanceTransactionRepository,
  matchRepo: ReconciliationMatchRepository,
  paymentRepo: PaymentRepository,
): Promise<ReconcileBalanceTransactionOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  // Idempotency: check if already reconciled
  const existing = await matchRepo.findByProviderTxnId(input.clientId, input.provider, input.providerTxnId);
  if (existing) {
    return { match: existing, events: [] };
  }

  // Fetch the provider transaction
  const providerTxn = await txnRepo.findByProviderTxnId(input.clientId, input.provider, input.providerTxnId);
  if (!providerTxn) {
    throw new Error(`Provider transaction not found: ${input.providerTxnId}`);
  }

  const events: DomainEvent[] = [];

  // Try to find matching internal payment
  let internalPayment;
  if (providerTxn.relatedProviderPaymentId) {
    internalPayment = await paymentRepo.findByProviderPaymentId(
      input.clientId, input.provider, providerTxn.relatedProviderPaymentId,
    );
  }

  const now = new Date().toISOString();
  let match: ReconciliationMatch;

  if (!internalPayment) {
    // No internal payment found — might be fee-only or missing
    match = ReconciliationMatch.createNeedsReview(
      {
        id: input.matchId,
        clientId: input.clientId,
        provider: input.provider,
        providerTxnId: input.providerTxnId,
        paymentId: undefined,
        ledgerEntryId: undefined,
        mismatchReasons: [MismatchReason.MISSING_INTERNAL],
        providerAmount: providerTxn.amount,
        providerCurrency: providerTxn.currency,
        internalAmount: undefined,
        internalCurrency: undefined,
        matchedAt: now,
        notes: undefined,
        correlationId: input.correlationId,
        createdAt: now,
      },
      [MismatchReason.MISSING_INTERNAL],
    );
    events.push({
      eventType: 'finance.settlement.mismatch_detected',
      payload: {
        clientId: input.clientId,
        reconciliationMatchId: input.matchId,
        providerTxnId: input.providerTxnId,
        mismatchReasons: [MismatchReason.MISSING_INTERNAL],
      },
    });
  } else {
    // Found internal payment — verify amounts
    const mismatchReasons: string[] = [];

    if (providerTxn.amount !== internalPayment.amountLedger) {
      mismatchReasons.push(MismatchReason.AMOUNT);
    }
    if (providerTxn.currency !== internalPayment.ledgerCurrency) {
      mismatchReasons.push(MismatchReason.CURRENCY);
    }

    if (mismatchReasons.length > 0) {
      match = ReconciliationMatch.createMismatch(
        {
          id: input.matchId,
          clientId: input.clientId,
          provider: input.provider,
          providerTxnId: input.providerTxnId,
          paymentId: internalPayment.id,
          ledgerEntryId: undefined,
          mismatchReasons,
          providerAmount: providerTxn.amount,
          providerCurrency: providerTxn.currency,
          internalAmount: internalPayment.amountLedger,
          internalCurrency: internalPayment.ledgerCurrency,
          matchedAt: now,
          notes: undefined,
          correlationId: input.correlationId,
          createdAt: now,
        },
        mismatchReasons,
      );
      events.push({
        eventType: 'finance.settlement.mismatch_detected',
        payload: {
          clientId: input.clientId,
          reconciliationMatchId: input.matchId,
          providerTxnId: input.providerTxnId,
          mismatchReasons,
        },
      });
    } else {
      match = ReconciliationMatch.createMatched({
        id: input.matchId,
        clientId: input.clientId,
        provider: input.provider,
        providerTxnId: input.providerTxnId,
        paymentId: internalPayment.id,
        ledgerEntryId: undefined,
        providerAmount: providerTxn.amount,
        providerCurrency: providerTxn.currency,
        internalAmount: internalPayment.amountLedger,
        internalCurrency: internalPayment.ledgerCurrency,
        matchedAt: now,
        notes: undefined,
        correlationId: input.correlationId,
        createdAt: now,
      });
      events.push({
        eventType: 'finance.settlement.reconciliation_updated',
        payload: {
          clientId: input.clientId,
          reconciliationMatchId: input.matchId,
          providerTxnId: input.providerTxnId,
          paymentId: internalPayment.id,
          status: 'MATCHED',
        },
      });
    }
  }

  await matchRepo.insert(match.data);

  return { match: match.data, events };
}
