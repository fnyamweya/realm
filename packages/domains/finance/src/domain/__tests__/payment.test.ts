import { describe, it, expect } from 'vitest';
import { Payment, PaymentStatus } from '../payment.js';

function makePaymentProps(overrides: Partial<Parameters<typeof Payment.create>[0]> = {}) {
  return {
    id: 'pay-1',
    clientId: 'client-1',
    leaseId: 'lease-1' as string | undefined,
    residentId: 'res-1' as string | undefined,
    paymentMethodType: 'CARD' as const,
    provider: 'STRIPE' as const,
    providerPaymentId: undefined as string | undefined,
    providerCustomerId: undefined as string | undefined,
    amountReceived: 10000,
    receivedCurrency: 'USD',
    amountLedger: 10000,
    ledgerCurrency: 'USD',
    fxRate: undefined as number | undefined,
    initiatedAt: '2024-01-15T00:00:00.000Z',
    idempotencyKey: 'idem-1' as string | undefined,
    createdByActorId: 'actor-1',
    correlationId: 'cor-1',
    ...overrides,
  };
}

describe('Payment', () => {
  it('creates with INITIATED status', () => {
    const p = Payment.create(makePaymentProps());
    expect(p.data.status).toBe(PaymentStatus.INITIATED);
    expect(p.data.amountReceived).toBe(10000);
  });

  it('requires clientId', () => {
    expect(() => Payment.create(makePaymentProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires positive amount', () => {
    expect(() => Payment.create(makePaymentProps({ amountReceived: 0 }))).toThrow('amountReceived must be positive');
    expect(() => Payment.create(makePaymentProps({ amountReceived: -100 }))).toThrow('amountReceived must be positive');
  });

  it('emits PaymentInitiated event on create', () => {
    const p = Payment.create(makePaymentProps());
    const events = p.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('finance.payment.initiated');
  });

  it('transitions INITIATED → SUCCEEDED', () => {
    const p = Payment.create(makePaymentProps());
    p.markSucceeded('2024-01-15T01:00:00.000Z', 'pi_123');
    expect(p.data.status).toBe(PaymentStatus.SUCCEEDED);
    expect(p.data.settledAt).toBe('2024-01-15T01:00:00.000Z');
    expect(p.data.providerPaymentId).toBe('pi_123');
  });

  it('transitions INITIATED → FAILED', () => {
    const p = Payment.create(makePaymentProps());
    p.markFailed('Card declined');
    expect(p.data.status).toBe(PaymentStatus.FAILED);
  });

  it('transitions SUCCEEDED → REFUNDED', () => {
    const p = Payment.create(makePaymentProps());
    p.markSucceeded('2024-01-15T01:00:00.000Z', undefined);
    p.markRefunded('Customer request');
    expect(p.data.status).toBe(PaymentStatus.REFUNDED);
  });

  it('transitions SUCCEEDED → CHARGEBACK', () => {
    const p = Payment.create(makePaymentProps());
    p.markSucceeded('2024-01-15T01:00:00.000Z', undefined);
    p.markChargeback();
    expect(p.data.status).toBe(PaymentStatus.CHARGEBACK);
  });

  it('rejects invalid transition INITIATED → REFUNDED', () => {
    const p = Payment.create(makePaymentProps());
    expect(() => p.markRefunded('invalid')).toThrow('Invalid transition');
  });

  it('rejects invalid transition FAILED → SUCCEEDED', () => {
    const p = Payment.create(makePaymentProps());
    p.markFailed('reason');
    expect(() => p.markSucceeded('2024-01-15T01:00:00.000Z', undefined)).toThrow('Invalid transition');
  });

  it('createSettled creates with SUCCEEDED status', () => {
    const p = Payment.createSettled({
      ...makePaymentProps(),
      settledAt: '2024-01-15T00:00:00.000Z',
    });
    expect(p.data.status).toBe(PaymentStatus.SUCCEEDED);
    expect(p.isSettled()).toBe(true);
  });

  it('collects multiple events for full lifecycle', () => {
    const p = Payment.create(makePaymentProps());
    p.markSucceeded('2024-01-15T01:00:00.000Z', 'pi_123');
    const events = p.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]!.eventType).toBe('finance.payment.initiated');
    expect(events[1]!.eventType).toBe('finance.payment.succeeded');
  });
});
