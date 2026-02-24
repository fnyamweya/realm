import { describe, it, expect } from 'vitest';
import {
  ProviderBalanceTransaction,
  ProviderTxnType,
  ReconciliationMatch,
  ReconciliationStatus,
  MismatchReason,
  type ReconciliationMatchData,
} from '../settlement.js';

describe('ProviderBalanceTransaction', () => {
  it('creates immutable transaction', () => {
    const txn = ProviderBalanceTransaction.create({
      id: 'pbt-1',
      clientId: 'client-1',
      provider: 'STRIPE',
      providerTxnId: 'txn_123',
      type: ProviderTxnType.CHARGE,
      amount: 10000,
      currency: 'USD',
      feeAmount: 290,
      feeCurrency: 'USD',
      netAmount: 9710,
      occurredAt: '2024-01-15T00:00:00.000Z',
      availableOn: '2024-01-17T00:00:00.000Z',
      relatedProviderPaymentId: 'pi_123',
      relatedProviderChargeId: undefined,
      rawRef: undefined,
      createdAt: '2024-01-15T00:00:00.000Z',
    });
    expect(txn.data.amount).toBe(10000);
    expect(txn.data.feeAmount).toBe(290);
    expect(txn.isFeeTransaction()).toBe(false);
    expect(txn.isPayoutRelated()).toBe(false);
  });

  it('requires clientId', () => {
    expect(() => ProviderBalanceTransaction.create({
      id: 'pbt-1',
      clientId: '',
      provider: 'STRIPE',
      providerTxnId: 'txn_123',
      type: ProviderTxnType.CHARGE,
      amount: 10000,
      currency: 'USD',
      feeAmount: 0,
      feeCurrency: 'USD',
      netAmount: 10000,
      occurredAt: '2024-01-15T00:00:00.000Z',
      availableOn: undefined,
      relatedProviderPaymentId: undefined,
      relatedProviderChargeId: undefined,
      rawRef: undefined,
      createdAt: '2024-01-15T00:00:00.000Z',
    })).toThrow('clientId is required');
  });

  it('identifies FEE and DISPUTE_FEE as fee transactions', () => {
    const fee = ProviderBalanceTransaction.create({
      id: 'pbt-2',
      clientId: 'c1',
      provider: 'STRIPE',
      providerTxnId: 'txn_fee',
      type: ProviderTxnType.FEE,
      amount: -290,
      currency: 'USD',
      feeAmount: 290,
      feeCurrency: 'USD',
      netAmount: -290,
      occurredAt: '2024-01-15T00:00:00.000Z',
      availableOn: undefined,
      relatedProviderPaymentId: undefined,
      relatedProviderChargeId: undefined,
      rawRef: undefined,
      createdAt: '2024-01-15T00:00:00.000Z',
    });
    expect(fee.isFeeTransaction()).toBe(true);
  });

  it('identifies PAYOUT as payout-related', () => {
    const payout = ProviderBalanceTransaction.create({
      id: 'pbt-3',
      clientId: 'c1',
      provider: 'STRIPE',
      providerTxnId: 'txn_po',
      type: ProviderTxnType.PAYOUT,
      amount: -50000,
      currency: 'USD',
      feeAmount: 0,
      feeCurrency: 'USD',
      netAmount: -50000,
      occurredAt: '2024-01-15T00:00:00.000Z',
      availableOn: undefined,
      relatedProviderPaymentId: undefined,
      relatedProviderChargeId: undefined,
      rawRef: undefined,
      createdAt: '2024-01-15T00:00:00.000Z',
    });
    expect(payout.isPayoutRelated()).toBe(true);
  });
});

describe('ReconciliationMatch', () => {
  const baseProps: Omit<ReconciliationMatchData, 'status' | 'mismatchReasons'> = {
    id: 'rm-1',
    clientId: 'client-1',
    provider: 'STRIPE',
    providerTxnId: 'txn_123',
    paymentId: 'pay-1',
    ledgerEntryId: undefined,
    providerAmount: 10000,
    providerCurrency: 'USD',
    internalAmount: 10000,
    internalCurrency: 'USD',
    matchedAt: '2024-01-15T00:00:00.000Z',
    notes: undefined,
    correlationId: 'cor-1',
    createdAt: '2024-01-15T00:00:00.000Z',
  };

  it('creates MATCHED reconciliation', () => {
    const match = ReconciliationMatch.createMatched(baseProps);
    expect(match.data.status).toBe(ReconciliationStatus.MATCHED);
    expect(match.data.mismatchReasons).toEqual([]);
    expect(match.isMatched()).toBe(true);
    expect(match.hasMismatch()).toBe(false);
  });

  it('creates MISMATCH reconciliation', () => {
    const match = ReconciliationMatch.createMismatch(
      { ...baseProps, mismatchReasons: [MismatchReason.AMOUNT] },
      [MismatchReason.AMOUNT],
    );
    expect(match.data.status).toBe(ReconciliationStatus.MISMATCH);
    expect(match.hasMismatch()).toBe(true);
    expect(match.data.mismatchReasons).toContain('AMOUNT');
  });

  it('requires at least one mismatch reason for MISMATCH', () => {
    expect(() => ReconciliationMatch.createMismatch(
      { ...baseProps, mismatchReasons: [] },
      [],
    )).toThrow('At least one mismatch reason required');
  });

  it('creates NEEDS_REVIEW for missing internal payment', () => {
    const match = ReconciliationMatch.createNeedsReview(
      { ...baseProps, paymentId: undefined, mismatchReasons: [MismatchReason.MISSING_INTERNAL] },
      [MismatchReason.MISSING_INTERNAL],
    );
    expect(match.data.status).toBe(ReconciliationStatus.NEEDS_REVIEW);
    expect(match.data.paymentId).toBeUndefined();
  });

  it('requires clientId', () => {
    expect(() => ReconciliationMatch.createMatched({ ...baseProps, clientId: '' })).toThrow('clientId is required');
  });
});
