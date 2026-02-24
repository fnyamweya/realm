import { describe, it, expect } from 'vitest';
import { Refund, RefundStatus } from '../refund.js';

function makeRefundProps(overrides: Partial<Parameters<typeof Refund.create>[0]> = {}) {
  return {
    id: 'ref-1',
    clientId: 'client-1',
    paymentId: 'pay-1',
    provider: 'STRIPE',
    providerRefundId: undefined as string | undefined,
    amount: 5000,
    currency: 'USD',
    reason: 'Customer request',
    reversalMapId: undefined as string | undefined,
    idempotencyKey: 'idem-ref-1' as string | undefined,
    createdByActorId: 'actor-1',
    correlationId: 'cor-1',
    ...overrides,
  };
}

describe('Refund', () => {
  it('creates with INITIATED status', () => {
    const r = Refund.create(makeRefundProps());
    expect(r.data.status).toBe(RefundStatus.INITIATED);
    expect(r.data.amount).toBe(5000);
  });

  it('requires clientId', () => {
    expect(() => Refund.create(makeRefundProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires paymentId', () => {
    expect(() => Refund.create(makeRefundProps({ paymentId: '' }))).toThrow('paymentId is required');
  });

  it('requires positive amount', () => {
    expect(() => Refund.create(makeRefundProps({ amount: 0 }))).toThrow('amount must be positive');
  });

  it('requires createdByActorId', () => {
    expect(() => Refund.create(makeRefundProps({ createdByActorId: '' }))).toThrow('createdByActorId is required');
  });

  it('emits refund.initiated event', () => {
    const r = Refund.create(makeRefundProps());
    const events = r.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('finance.refund.initiated');
  });

  it('transitions INITIATED → SUCCEEDED', () => {
    const r = Refund.create(makeRefundProps());
    r.markSucceeded('re_provider_123');
    expect(r.data.status).toBe(RefundStatus.SUCCEEDED);
    expect(r.data.providerRefundId).toBe('re_provider_123');
  });

  it('transitions INITIATED → FAILED', () => {
    const r = Refund.create(makeRefundProps());
    r.markFailed('Card expired');
    expect(r.data.status).toBe(RefundStatus.FAILED);
  });

  it('rejects SUCCEEDED → FAILED', () => {
    const r = Refund.create(makeRefundProps());
    r.markSucceeded('re_123');
    expect(() => r.markFailed('late')).toThrow('Invalid refund transition');
  });

  it('rejects FAILED → SUCCEEDED', () => {
    const r = Refund.create(makeRefundProps());
    r.markFailed('reason');
    expect(() => r.markSucceeded('re_123')).toThrow('Invalid refund transition');
  });

  it('collects events through lifecycle', () => {
    const r = Refund.create(makeRefundProps());
    r.markSucceeded('re_123');
    const events = r.getDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0]!.eventType).toBe('finance.refund.initiated');
    expect(events[1]!.eventType).toBe('finance.refund.succeeded');
  });
});
