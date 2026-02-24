import { Money } from './money.js';

/**
 * Charge categories for priority sorting.
 */
export const ChargeCategoryPriority = {
  RENT: 'RENT',
  LATE_FEE: 'LATE_FEE',
  FEE: 'FEE',
  UTILITY: 'UTILITY',
  PARKING: 'PARKING',
  INSURANCE: 'INSURANCE',
  TAX: 'TAX',
  PET: 'PET',
  AMENITY: 'AMENITY',
  DEPOSIT: 'DEPOSIT',
  OTHER: 'OTHER',
} as const;

export const PaymentAllocationMode = {
  OLDEST_DUE_FIRST: 'OLDEST_DUE_FIRST',
  PRIORITY_THEN_OLDEST: 'PRIORITY_THEN_OLDEST',
  RENT_FIRST_THEN_FEES_THEN_INTEREST: 'RENT_FIRST_THEN_FEES_THEN_INTEREST',
  MANUAL_ONLY: 'MANUAL_ONLY',
  PROPORTIONAL: 'PROPORTIONAL',
} as const;
export type PaymentAllocationMode = (typeof PaymentAllocationMode)[keyof typeof PaymentAllocationMode];

export interface OutstandingCharge {
  readonly chargeEntryId: string;
  readonly dueDate: string;
  readonly postedAt: string;
  readonly category: string;
  readonly outstandingAmount: number; // minor units
  readonly isDisputed: boolean;
  readonly isInterest: boolean;
  readonly isLateFee: boolean;
}

export interface PaymentAllocationPolicy {
  readonly mode: PaymentAllocationMode;
  readonly priorityOrder: readonly string[];
  readonly includeDisputedCharges: boolean;
  readonly excludeCategories: readonly string[];
  readonly minimumAllocationUnit: number; // minor units
  readonly payPrincipalBeforeInterest: boolean;
  readonly payLateFeesBeforeInterest: boolean;
}

export interface AllocationResult {
  readonly chargeEntryId: string;
  readonly amount: number; // minor units
}

export interface PaymentAllocationOutput {
  readonly allocations: readonly AllocationResult[];
  readonly remainderUnapplied: number; // minor units
}

/**
 * Deterministic payment allocation engine.
 * Allocates a payment amount to outstanding charges following the policy.
 */
export function allocatePayment(
  paymentAmountMinorUnits: number,
  charges: readonly OutstandingCharge[],
  policy: PaymentAllocationPolicy,
): PaymentAllocationOutput {
  if (paymentAmountMinorUnits <= 0) {
    return { allocations: [], remainderUnapplied: 0 };
  }

  // Filter charges
  let eligible = charges.filter(c => {
    if (!policy.includeDisputedCharges && c.isDisputed) return false;
    if (policy.excludeCategories.includes(c.category)) return false;
    if (c.outstandingAmount <= 0) return false;
    return true;
  });

  // Sort based on policy
  eligible = sortCharges(eligible, policy);

  // If payPrincipalBeforeInterest, split into principal and interest buckets
  let orderedCharges: readonly OutstandingCharge[];
  if (policy.payPrincipalBeforeInterest) {
    const principal = eligible.filter(c => !c.isInterest && !c.isLateFee);
    const lateFees = eligible.filter(c => c.isLateFee);
    const interest = eligible.filter(c => c.isInterest);

    if (policy.payLateFeesBeforeInterest) {
      orderedCharges = [...principal, ...lateFees, ...interest];
    } else {
      orderedCharges = [...principal, ...interest, ...lateFees];
    }
  } else {
    orderedCharges = eligible;
  }

  // Allocate
  const allocations: AllocationResult[] = [];
  let remaining = paymentAmountMinorUnits;

  for (const charge of orderedCharges) {
    if (remaining <= 0) break;
    if (remaining < policy.minimumAllocationUnit && remaining < charge.outstandingAmount) {
      // Remaining is less than min unit and less than charge: skip
      break;
    }

    const alloc = Math.min(remaining, charge.outstandingAmount);
    allocations.push({
      chargeEntryId: charge.chargeEntryId,
      amount: alloc,
    });
    remaining -= alloc;
  }

  return {
    allocations,
    remainderUnapplied: remaining,
  };
}

function sortCharges(
  charges: OutstandingCharge[],
  policy: PaymentAllocationPolicy,
): OutstandingCharge[] {
  const priorityMap = new Map<string, number>();
  for (let i = 0; i < policy.priorityOrder.length; i++) {
    const cat = policy.priorityOrder[i];
    if (cat !== undefined) {
      priorityMap.set(cat, i);
    }
  }
  const defaultPriority = policy.priorityOrder.length;

  return [...charges].sort((a, b) => {
    switch (policy.mode) {
      case PaymentAllocationMode.OLDEST_DUE_FIRST: {
        const dueCmp = compareDates(a.dueDate, b.dueDate);
        if (dueCmp !== 0) return dueCmp;
        return compareDates(a.postedAt, b.postedAt);
      }
      case PaymentAllocationMode.PRIORITY_THEN_OLDEST: {
        const aPri = priorityMap.get(a.category) ?? defaultPriority;
        const bPri = priorityMap.get(b.category) ?? defaultPriority;
        if (aPri !== bPri) return aPri - bPri;
        const dueCmp = compareDates(a.dueDate, b.dueDate);
        if (dueCmp !== 0) return dueCmp;
        return compareDates(a.postedAt, b.postedAt);
      }
      case PaymentAllocationMode.RENT_FIRST_THEN_FEES_THEN_INTEREST: {
        const aOrder = getRentFirstOrder(a);
        const bOrder = getRentFirstOrder(b);
        if (aOrder !== bOrder) return aOrder - bOrder;
        const dueCmp = compareDates(a.dueDate, b.dueDate);
        if (dueCmp !== 0) return dueCmp;
        return compareDates(a.postedAt, b.postedAt);
      }
      case PaymentAllocationMode.PROPORTIONAL:
      case PaymentAllocationMode.MANUAL_ONLY:
      default: {
        // For proportional/manual, no specific sort needed; use date
        return compareDates(a.dueDate, b.dueDate);
      }
    }
  });
}

function compareDates(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

function getRentFirstOrder(charge: OutstandingCharge): number {
  if (charge.category === 'RENT') return 0;
  if (charge.isLateFee) return 1;
  if (charge.category === 'FEE') return 2;
  if (charge.isInterest) return 3;
  return 4;
}
