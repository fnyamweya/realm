import { describe, it, expect } from 'vitest';
import {
  allocatePayment,
  PaymentAllocationMode,
  type OutstandingCharge,
  type PaymentAllocationPolicy,
} from '../payment-allocation-engine.js';

function makeCharge(overrides: Partial<OutstandingCharge> = {}): OutstandingCharge {
  return {
    chargeEntryId: 'ch-1',
    dueDate: '2024-01-01T00:00:00.000Z',
    postedAt: '2023-12-15T00:00:00.000Z',
    category: 'RENT',
    outstandingAmount: 100000,
    isDisputed: false,
    isInterest: false,
    isLateFee: false,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<PaymentAllocationPolicy> = {}): PaymentAllocationPolicy {
  return {
    mode: PaymentAllocationMode.OLDEST_DUE_FIRST,
    priorityOrder: [],
    includeDisputedCharges: false,
    excludeCategories: [],
    minimumAllocationUnit: 1,
    payPrincipalBeforeInterest: true,
    payLateFeesBeforeInterest: true,
    ...overrides,
  };
}

describe('PaymentAllocationEngine', () => {
  it('allocates full payment to single charge', () => {
    const charges = [makeCharge({ chargeEntryId: 'ch-1', outstandingAmount: 100000 })];
    const result = allocatePayment(100000, charges, makePolicy());
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-1');
    expect(result.allocations[0]!.amount).toBe(100000);
    expect(result.remainderUnapplied).toBe(0);
  });

  it('allocates partial payment (underpay)', () => {
    const charges = [makeCharge({ chargeEntryId: 'ch-1', outstandingAmount: 100000 })];
    const result = allocatePayment(50000, charges, makePolicy());
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.amount).toBe(50000);
    expect(result.remainderUnapplied).toBe(0);
  });

  it('returns remainder for overpayment', () => {
    const charges = [makeCharge({ chargeEntryId: 'ch-1', outstandingAmount: 50000 })];
    const result = allocatePayment(100000, charges, makePolicy());
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.amount).toBe(50000);
    expect(result.remainderUnapplied).toBe(50000);
  });

  it('sorts by oldest due date first', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-new', dueDate: '2024-03-01T00:00:00.000Z', outstandingAmount: 50000 }),
      makeCharge({ chargeEntryId: 'ch-old', dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 50000 }),
    ];
    const result = allocatePayment(60000, charges, makePolicy());
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-old');
    expect(result.allocations[0]!.amount).toBe(50000);
    expect(result.allocations[1]!.chargeEntryId).toBe('ch-new');
    expect(result.allocations[1]!.amount).toBe(10000);
  });

  it('skips disputed charges when policy excludes them', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-disputed', isDisputed: true, outstandingAmount: 50000 }),
      makeCharge({ chargeEntryId: 'ch-normal', outstandingAmount: 50000 }),
    ];
    const result = allocatePayment(100000, charges, makePolicy({ includeDisputedCharges: false }));
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-normal');
    expect(result.remainderUnapplied).toBe(50000);
  });

  it('includes disputed charges when policy allows', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-disputed', isDisputed: true, outstandingAmount: 50000 }),
      makeCharge({ chargeEntryId: 'ch-normal', outstandingAmount: 50000 }),
    ];
    const result = allocatePayment(100000, charges, makePolicy({ includeDisputedCharges: true }));
    expect(result.allocations).toHaveLength(2);
  });

  it('excludes specified categories', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-deposit', category: 'DEPOSIT', outstandingAmount: 50000 }),
      makeCharge({ chargeEntryId: 'ch-rent', category: 'RENT', outstandingAmount: 50000 }),
    ];
    const result = allocatePayment(100000, charges, makePolicy({ excludeCategories: ['DEPOSIT'] }));
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-rent');
  });

  it('uses priority order for PRIORITY_THEN_OLDEST mode', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-utility', category: 'UTILITY', dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 30000 }),
      makeCharge({ chargeEntryId: 'ch-rent', category: 'RENT', dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 50000 }),
    ];
    const result = allocatePayment(40000, charges, makePolicy({
      mode: PaymentAllocationMode.PRIORITY_THEN_OLDEST,
      priorityOrder: ['RENT', 'UTILITY'],
    }));
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-rent');
  });

  it('pays principal before interest when policy says so', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-interest', category: 'OTHER', isInterest: true, dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 20000 }),
      makeCharge({ chargeEntryId: 'ch-rent', category: 'RENT', dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 80000 }),
    ];
    const result = allocatePayment(50000, charges, makePolicy({ payPrincipalBeforeInterest: true }));
    // Principal (rent) first
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-rent');
    expect(result.allocations[0]!.amount).toBe(50000);
  });

  it('handles zero payment gracefully', () => {
    const charges = [makeCharge()];
    const result = allocatePayment(0, charges, makePolicy());
    expect(result.allocations).toHaveLength(0);
    expect(result.remainderUnapplied).toBe(0);
  });

  it('handles no outstanding charges', () => {
    const result = allocatePayment(100000, [], makePolicy());
    expect(result.allocations).toHaveLength(0);
    expect(result.remainderUnapplied).toBe(100000);
  });

  it('allocates across multiple charges in order', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-1', dueDate: '2024-01-01T00:00:00.000Z', outstandingAmount: 30000 }),
      makeCharge({ chargeEntryId: 'ch-2', dueDate: '2024-02-01T00:00:00.000Z', outstandingAmount: 30000 }),
      makeCharge({ chargeEntryId: 'ch-3', dueDate: '2024-03-01T00:00:00.000Z', outstandingAmount: 30000 }),
    ];
    const result = allocatePayment(75000, charges, makePolicy());
    expect(result.allocations).toHaveLength(3);
    expect(result.allocations[0]!.amount).toBe(30000);
    expect(result.allocations[1]!.amount).toBe(30000);
    expect(result.allocations[2]!.amount).toBe(15000);
    expect(result.remainderUnapplied).toBe(0);
  });

  it('RENT_FIRST mode puts rent before fees before interest', () => {
    const charges = [
      makeCharge({ chargeEntryId: 'ch-interest', category: 'OTHER', isInterest: true, outstandingAmount: 10000 }),
      makeCharge({ chargeEntryId: 'ch-latefee', category: 'LATE_FEE', isLateFee: true, outstandingAmount: 5000 }),
      makeCharge({ chargeEntryId: 'ch-rent', category: 'RENT', outstandingAmount: 100000 }),
    ];
    const result = allocatePayment(120000, charges, makePolicy({
      mode: PaymentAllocationMode.RENT_FIRST_THEN_FEES_THEN_INTEREST,
    }));
    expect(result.allocations[0]!.chargeEntryId).toBe('ch-rent');
    expect(result.allocations[1]!.chargeEntryId).toBe('ch-latefee');
    expect(result.allocations[2]!.chargeEntryId).toBe('ch-interest');
  });
});
