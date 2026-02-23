import { describe, it, expect } from 'vitest';
import { allocate, AllocationMethod } from '../allocation.js';
import { Money } from '../money.js';
import type { AllocationRule } from '../allocation.js';

describe('Allocation', () => {
  it('SINGLE_PAYER gives full amount to first payer', () => {
    const total = Money.of(1000, 'USD');
    const rule: AllocationRule = { method: AllocationMethod.SINGLE_PAYER, splits: undefined };
    const result = allocate(total, rule, ['res-1', 'res-2']);

    expect(result).toHaveLength(1);
    expect(result[0]!.residentId).toBe('res-1');
    expect(result[0]!.amount.amount).toBe(1000);
  });

  it('SPLIT_EQUAL splits evenly with remainder to last', () => {
    const total = Money.of(100, 'USD');
    const rule: AllocationRule = { method: AllocationMethod.SPLIT_EQUAL, splits: undefined };
    const result = allocate(total, rule, ['res-1', 'res-2', 'res-3']);

    expect(result).toHaveLength(3);
    expect(result[0]!.amount.amount).toBe(33.33);
    expect(result[1]!.amount.amount).toBe(33.33);
    // Last payer gets remainder: 100 - 33.33 - 33.33 = 33.34
    expect(result[2]!.amount.amount).toBe(33.34);
  });

  it('SPLIT_PERCENTAGES distributes by percentage', () => {
    const total = Money.of(1000, 'USD');
    const rule: AllocationRule = {
      method: AllocationMethod.SPLIT_PERCENTAGES,
      splits: [
        { residentId: 'res-1', percentage: 60, fixedAmount: undefined },
        { residentId: 'res-2', percentage: 40, fixedAmount: undefined },
      ],
    };
    const result = allocate(total, rule, ['res-1', 'res-2']);

    expect(result).toHaveLength(2);
    expect(result[0]!.residentId).toBe('res-1');
    expect(result[0]!.amount.amount).toBe(600);
    expect(result[1]!.residentId).toBe('res-2');
    expect(result[1]!.amount.amount).toBe(400);
  });

  it('SPLIT_PERCENTAGES throws if percentages do not sum to 100', () => {
    const total = Money.of(1000, 'USD');
    const rule: AllocationRule = {
      method: AllocationMethod.SPLIT_PERCENTAGES,
      splits: [
        { residentId: 'res-1', percentage: 50, fixedAmount: undefined },
        { residentId: 'res-2', percentage: 30, fixedAmount: undefined },
      ],
    };
    expect(() => allocate(total, rule, ['res-1', 'res-2'])).toThrow('Percentages must sum to 100');
  });

  it('SPLIT_FIXED_AMOUNTS distributes exact amounts', () => {
    const total = Money.of(1000, 'USD');
    const rule: AllocationRule = {
      method: AllocationMethod.SPLIT_FIXED_AMOUNTS,
      splits: [
        { residentId: 'res-1', percentage: undefined, fixedAmount: 700 },
        { residentId: 'res-2', percentage: undefined, fixedAmount: 300 },
      ],
    };
    const result = allocate(total, rule, ['res-1', 'res-2']);

    expect(result).toHaveLength(2);
    expect(result[0]!.amount.amount).toBe(700);
    expect(result[1]!.amount.amount).toBe(300);
  });

  it('SPLIT_FIXED_AMOUNTS throws if amounts do not sum to total', () => {
    const total = Money.of(1000, 'USD');
    const rule: AllocationRule = {
      method: AllocationMethod.SPLIT_FIXED_AMOUNTS,
      splits: [
        { residentId: 'res-1', percentage: undefined, fixedAmount: 600 },
        { residentId: 'res-2', percentage: undefined, fixedAmount: 300 },
      ],
    };
    expect(() => allocate(total, rule, ['res-1', 'res-2'])).toThrow('Fixed amounts must sum to total');
  });

  it('empty payers throws', () => {
    const total = Money.of(100, 'USD');
    const rule: AllocationRule = { method: AllocationMethod.SINGLE_PAYER, splits: undefined };
    expect(() => allocate(total, rule, [])).toThrow('At least one payer is required');
  });
});
