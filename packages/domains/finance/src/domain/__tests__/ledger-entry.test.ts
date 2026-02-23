import { describe, it, expect } from 'vitest';
import { LedgerEntry, LedgerEntryType } from '../ledger-entry.js';
import { Money } from '../money.js';

function makeChargeProps(overrides: Partial<Parameters<typeof LedgerEntry.create>[0]> = {}) {
  return {
    id: 'le-1',
    clientId: 'client-1',
    entryType: LedgerEntryType.CHARGE as const,
    propertyId: 'prop-1',
    unitId: 'unit-1',
    leaseId: 'lease-1',
    residentId: 'res-1',
    amount: Money.of(100, 'USD'),
    dueDate: '2024-02-01T00:00:00.000Z',
    postedAt: '2024-01-15T00:00:00.000Z',
    chargeDefinitionId: 'cd-1',
    chargePlanId: 'cp-1',
    chargeAssignmentId: 'ca-1',
    occurrenceId: 'occ-1',
    allocationGroupId: 'ag-1',
    linkedEntryId: undefined,
    description: 'Monthly rent',
    idempotencyKey: 'idem-1',
    createdByActorId: 'actor-1',
    correlationId: 'corr-1',
    createdAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  };
}

describe('LedgerEntry', () => {
  it('creates immutable CHARGE entry', () => {
    const entry = LedgerEntry.create(makeChargeProps());
    expect(entry.data.entryType).toBe(LedgerEntryType.CHARGE);
    expect(entry.data.amount.amount).toBe(100);
  });

  it('requires clientId', () => {
    expect(() => LedgerEntry.create(makeChargeProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires propertyId', () => {
    expect(() => LedgerEntry.create(makeChargeProps({ propertyId: '' }))).toThrow('propertyId is required');
  });

  it('requires createdByActorId', () => {
    expect(() => LedgerEntry.create(makeChargeProps({ createdByActorId: '' }))).toThrow('createdByActorId is required');
  });

  it('requires correlationId', () => {
    expect(() => LedgerEntry.create(makeChargeProps({ correlationId: '' }))).toThrow('correlationId is required');
  });

  it('VOID entries must have linkedEntryId', () => {
    expect(() =>
      LedgerEntry.create(makeChargeProps({ entryType: LedgerEntryType.VOID, linkedEntryId: undefined })),
    ).toThrow('VOID entries must reference a linkedEntryId');
  });

  it('createVoid() creates negated entry linked to original', () => {
    const original = LedgerEntry.create(makeChargeProps());
    const voided = original.createVoid('void-1', 'actor-2', 'corr-2', 'mistake');

    expect(voided.data.entryType).toBe(LedgerEntryType.VOID);
    expect(voided.data.amount.amount).toBe(-100);
    expect(voided.data.linkedEntryId).toBe('le-1');
    expect(voided.data.description).toBe('VOID: mistake');
    expect(voided.data.createdByActorId).toBe('actor-2');
    expect(voided.data.correlationId).toBe('corr-2');
  });

  it('data is frozen (Object.isFrozen)', () => {
    const entry = LedgerEntry.create(makeChargeProps());
    expect(Object.isFrozen(entry.data)).toBe(true);
  });

  it('getDomainEvents() returns posted event', () => {
    const entry = LedgerEntry.create(makeChargeProps());
    const events = entry.getDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('finance.ledger_entry.posted');
    expect(events[0]!.payload.ledgerEntryId).toBe('le-1');
  });

  it('isDebit/isCredit for CHARGE entry', () => {
    const charge = LedgerEntry.create(makeChargeProps());
    expect(charge.isDebit()).toBe(true);
    expect(charge.isCredit()).toBe(false);
  });

  it('isDebit/isCredit for PAYMENT entry', () => {
    const payment = LedgerEntry.create(makeChargeProps({ entryType: LedgerEntryType.PAYMENT }));
    expect(payment.isDebit()).toBe(false);
    expect(payment.isCredit()).toBe(true);
  });

  it('isDebit/isCredit for REFUND entry', () => {
    const refund = LedgerEntry.create(makeChargeProps({ entryType: LedgerEntryType.REFUND }));
    expect(refund.isDebit()).toBe(true);
    expect(refund.isCredit()).toBe(false);
  });

  it('isDebit for positive ADJUSTMENT', () => {
    const adj = LedgerEntry.create(makeChargeProps({ entryType: LedgerEntryType.ADJUSTMENT, amount: Money.of(50, 'USD') }));
    expect(adj.isDebit()).toBe(true);
  });

  it('isCredit for negative ADJUSTMENT', () => {
    const adj = LedgerEntry.create(makeChargeProps({ entryType: LedgerEntryType.ADJUSTMENT, amount: Money.of(-50, 'USD') }));
    expect(adj.isDebit()).toBe(false);
    expect(adj.isCredit()).toBe(true);
  });
});
