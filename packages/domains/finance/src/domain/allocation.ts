import { Money } from './money.js';

export const AllocationMethod = {
  SINGLE_PAYER: 'SINGLE_PAYER',
  SPLIT_EQUAL: 'SPLIT_EQUAL',
  SPLIT_PERCENTAGES: 'SPLIT_PERCENTAGES',
  SPLIT_FIXED_AMOUNTS: 'SPLIT_FIXED_AMOUNTS',
} as const;
export type AllocationMethod = (typeof AllocationMethod)[keyof typeof AllocationMethod];

export interface AllocationSplit {
  readonly residentId: string;
  readonly percentage: number | undefined;
  readonly fixedAmount: number | undefined;
}

export interface AllocationRule {
  readonly method: AllocationMethod;
  readonly splits: ReadonlyArray<AllocationSplit> | undefined;
}

export interface AllocatedAmount {
  readonly residentId: string;
  readonly amount: Money;
}

const SPLIT_TOLERANCE = 0.01;

/**
 * Allocate a total amount across payers based on the allocation rule.
 */
export function allocate(total: Money, rule: AllocationRule, payers: string[]): AllocatedAmount[] {
  if (payers.length === 0) throw new Error('At least one payer is required');

  switch (rule.method) {
    case AllocationMethod.SINGLE_PAYER: {
      const payer = payers[0];
      if (!payer) throw new Error('No payer available');
      return [{ residentId: payer, amount: total }];
    }

    case AllocationMethod.SPLIT_EQUAL: {
      const share = Money.of(
        Math.floor((total.amount / payers.length) * 100) / 100,
        total.currency,
      );
      const result: AllocatedAmount[] = [];
      let allocated = Money.zero(total.currency);
      for (let i = 0; i < payers.length; i++) {
        const payerId = payers[i];
        if (!payerId) continue;
        if (i === payers.length - 1) {
          // Last payer gets remainder to avoid rounding gaps
          result.push({ residentId: payerId, amount: total.subtract(allocated) });
        } else {
          result.push({ residentId: payerId, amount: share });
          allocated = allocated.add(share);
        }
      }
      return result;
    }

    case AllocationMethod.SPLIT_PERCENTAGES: {
      if (!rule.splits || rule.splits.length === 0) throw new Error('Splits are required for SPLIT_PERCENTAGES');
      const totalPct = rule.splits.reduce((sum, s) => sum + (s.percentage ?? 0), 0);
      if (Math.abs(totalPct - 100) > SPLIT_TOLERANCE) throw new Error('Percentages must sum to 100');

      const result: AllocatedAmount[] = [];
      let allocated = Money.zero(total.currency);
      for (let i = 0; i < rule.splits.length; i++) {
        const split = rule.splits[i];
        if (!split) continue;
        if (i === rule.splits.length - 1) {
          result.push({ residentId: split.residentId, amount: total.subtract(allocated) });
        } else {
          const amt = Money.of(total.amount * (split.percentage ?? 0) / 100, total.currency);
          result.push({ residentId: split.residentId, amount: amt });
          allocated = allocated.add(amt);
        }
      }
      return result;
    }

    case AllocationMethod.SPLIT_FIXED_AMOUNTS: {
      if (!rule.splits || rule.splits.length === 0) throw new Error('Splits are required for SPLIT_FIXED_AMOUNTS');
      const totalFixed = rule.splits.reduce((sum, s) => sum + (s.fixedAmount ?? 0), 0);
      if (Math.abs(totalFixed - total.amount) > SPLIT_TOLERANCE) throw new Error('Fixed amounts must sum to total');

      return rule.splits.map(s => ({
        residentId: s.residentId,
        amount: Money.of(s.fixedAmount ?? 0, total.currency),
      }));
    }
  }
}
