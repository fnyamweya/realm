import { describe, it, expect } from 'vitest';
import { Dispute, DisputeStatus, DisputeReason } from '../dispute.js';

function makeDisputeProps(overrides: Partial<Parameters<typeof Dispute.create>[0]> = {}) {
  return {
    id: 'disp-1',
    clientId: 'client-1',
    paymentId: 'pay-1',
    provider: 'STRIPE',
    providerDisputeId: 'dp_123',
    reason: DisputeReason.FRAUDULENT,
    amount: 10000,
    currency: 'USD',
    feeAmount: 1500 as number | undefined,
    feeCurrency: 'USD' as string | undefined,
    openedAt: '2024-01-15T00:00:00.000Z',
    evidenceDueBy: '2024-01-30T00:00:00.000Z' as string | undefined,
    pauseReminders: true,
    correlationId: 'cor-1',
    ...overrides,
  };
}

describe('Dispute', () => {
  it('creates with OPEN status', () => {
    const d = Dispute.create(makeDisputeProps());
    expect(d.data.status).toBe(DisputeStatus.OPEN);
    expect(d.data.amount).toBe(10000);
    expect(d.isOpen()).toBe(true);
  });

  it('requires clientId', () => {
    expect(() => Dispute.create(makeDisputeProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires paymentId', () => {
    expect(() => Dispute.create(makeDisputeProps({ paymentId: '' }))).toThrow('paymentId is required');
  });

  it('requires positive amount', () => {
    expect(() => Dispute.create(makeDisputeProps({ amount: 0 }))).toThrow('amount must be positive');
  });

  it('emits DisputeOpened event', () => {
    const d = Dispute.create(makeDisputeProps());
    const events = d.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('finance.dispute.opened');
  });

  it('transitions OPEN → EVIDENCE_SUBMITTED', () => {
    const d = Dispute.create(makeDisputeProps());
    d.submitEvidence();
    expect(d.data.status).toBe(DisputeStatus.EVIDENCE_SUBMITTED);
    expect(d.isOpen()).toBe(true);
  });

  it('transitions EVIDENCE_SUBMITTED → WON', () => {
    const d = Dispute.create(makeDisputeProps());
    d.submitEvidence();
    d.markWon();
    expect(d.data.status).toBe(DisputeStatus.WON);
    expect(d.isOpen()).toBe(false);
  });

  it('transitions EVIDENCE_SUBMITTED → LOST with chargeback event', () => {
    const d = Dispute.create(makeDisputeProps());
    d.submitEvidence();
    d.markLost();
    expect(d.data.status).toBe(DisputeStatus.LOST);
    expect(d.isLost()).toBe(true);
    const events = d.getDomainEvents();
    const chargebackEvent = events.find(e => e.eventType === 'finance.chargeback.applied');
    expect(chargebackEvent).toBeDefined();
    expect(chargebackEvent!.payload['amount']).toBe(10000);
  });

  it('transitions OPEN → LOST directly', () => {
    const d = Dispute.create(makeDisputeProps());
    d.markLost();
    expect(d.data.status).toBe(DisputeStatus.LOST);
    expect(d.data.closedAt).toBeDefined();
  });

  it('transitions LOST → CLOSED', () => {
    const d = Dispute.create(makeDisputeProps());
    d.markLost();
    d.close();
    expect(d.data.status).toBe(DisputeStatus.CLOSED);
  });

  it('rejects invalid transition CLOSED → OPEN', () => {
    const d = Dispute.create(makeDisputeProps());
    d.markWon();
    d.close();
    // Cannot re-open a closed dispute
    expect(() => d.submitEvidence()).toThrow('Invalid dispute transition');
  });

  it('rejects invalid transition WON → LOST', () => {
    const d = Dispute.create(makeDisputeProps());
    d.markWon();
    expect(() => d.markLost()).toThrow('Invalid dispute transition');
  });

  it('fromData reconstructs dispute', () => {
    const d = Dispute.create(makeDisputeProps());
    d.submitEvidence();
    const d2 = Dispute.fromData(d.data);
    expect(d2.data.status).toBe(DisputeStatus.EVIDENCE_SUBMITTED);
  });
});
