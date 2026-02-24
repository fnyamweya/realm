/**
 * Late fee computation domain service.
 * Pure functions—no DB/framework imports.
 */

export const LateFeeType = {
  FIXED: 'FIXED',
  PERCENTAGE: 'PERCENTAGE',
} as const;
export type LateFeeType = (typeof LateFeeType)[keyof typeof LateFeeType];

export interface LateFeeComputationInput {
  readonly outstandingMinorUnits: number;
  readonly feeType: LateFeeType;
  readonly fixedAmountMinorUnits: number | undefined;
  readonly percent: number | undefined;
  readonly capAmountMinorUnits: number | undefined;
  readonly previousOccurrences: number;
  readonly maxOccurrencesPerCharge: number | undefined;
  readonly minOutstandingThresholdMinorUnits: number | undefined;
  readonly graceDays: number;
  readonly daysOverdue: number;
}

export interface LateFeeComputationOutput {
  readonly feeAmountMinorUnits: number;
  readonly occurrenceNumber: number;
  readonly skipped: boolean;
  readonly skipReason: string | undefined;
}

/**
 * Compute the late fee for a single overdue charge.
 * Returns 0 if conditions not met (within grace, below threshold, max occurrences).
 */
export function computeLateFee(input: LateFeeComputationInput): LateFeeComputationOutput {
  // Grace period check
  if (input.daysOverdue <= input.graceDays) {
    return { feeAmountMinorUnits: 0, occurrenceNumber: input.previousOccurrences, skipped: true, skipReason: 'within_grace_period' };
  }

  // Min outstanding threshold
  if (input.minOutstandingThresholdMinorUnits !== undefined && input.outstandingMinorUnits < input.minOutstandingThresholdMinorUnits) {
    return { feeAmountMinorUnits: 0, occurrenceNumber: input.previousOccurrences, skipped: true, skipReason: 'below_threshold' };
  }

  // Max occurrences
  if (input.maxOccurrencesPerCharge !== undefined && input.previousOccurrences >= input.maxOccurrencesPerCharge) {
    return { feeAmountMinorUnits: 0, occurrenceNumber: input.previousOccurrences, skipped: true, skipReason: 'max_occurrences_reached' };
  }

  // Compute raw fee
  let feeAmount: number;
  switch (input.feeType) {
    case LateFeeType.FIXED: {
      feeAmount = input.fixedAmountMinorUnits ?? 0;
      break;
    }
    case LateFeeType.PERCENTAGE: {
      const pct = input.percent ?? 0;
      feeAmount = Math.round(input.outstandingMinorUnits * pct / 100);
      break;
    }
    default: {
      const _exhaustive: never = input.feeType;
      throw new Error(`Unsupported fee type: ${_exhaustive}`);
    }
  }

  // Apply cap
  if (input.capAmountMinorUnits !== undefined && feeAmount > input.capAmountMinorUnits) {
    feeAmount = input.capAmountMinorUnits;
  }

  // Ensure non-negative
  if (feeAmount <= 0) {
    return { feeAmountMinorUnits: 0, occurrenceNumber: input.previousOccurrences, skipped: true, skipReason: 'zero_fee' };
  }

  return {
    feeAmountMinorUnits: feeAmount,
    occurrenceNumber: input.previousOccurrences + 1,
    skipped: false,
    skipReason: undefined,
  };
}
