/**
 * Interest computation domain service.
 * Pure functions—no DB/framework imports.
 */

export const InterestBasis = {
  ACTUAL_365: 'ACTUAL_365',
  ACTUAL_360: 'ACTUAL_360',
  THIRTY_360: 'THIRTY_360',
} as const;
export type InterestBasis = (typeof InterestBasis)[keyof typeof InterestBasis];

export interface InterestComputationInput {
  readonly principalMinorUnits: number;
  readonly aprPercent: number;
  readonly basis: InterestBasis;
  readonly daysAccrued: number;
  readonly periodStartDate: string;
  readonly periodEndDate: string;
}

export interface InterestComputationOutput {
  readonly computedInterestMinorUnits: number;
  readonly dailyRate: number;
  readonly daysUsed: number;
  readonly basisDenominator: number;
  readonly remainderMinorUnits: number; // fractional carry
}

/**
 * Compute interest for a given principal, rate, basis, and day count.
 * All amounts in minor units (cents).
 * Returns computed interest (floored to minor units) and remainder for carry.
 */
export function computeInterest(input: InterestComputationInput): InterestComputationOutput {
  if (input.principalMinorUnits <= 0 || input.aprPercent <= 0 || input.daysAccrued <= 0) {
    return {
      computedInterestMinorUnits: 0,
      dailyRate: 0,
      daysUsed: input.daysAccrued,
      basisDenominator: getBasisDenominator(input.basis),
      remainderMinorUnits: 0,
    };
  }

  const denominator = getBasisDenominator(input.basis);
  const dailyRate = input.aprPercent / 100 / denominator;
  const days = input.basis === InterestBasis.THIRTY_360
    ? computeThirtyThreeSixtyDays(input.periodStartDate, input.periodEndDate)
    : input.daysAccrued;

  // Compute raw interest in fractional minor units
  const rawInterest = input.principalMinorUnits * dailyRate * days;

  // Floor to minor units (cents), carry remainder
  const floored = Math.floor(rawInterest);
  const remainder = rawInterest - floored;

  return {
    computedInterestMinorUnits: floored,
    dailyRate,
    daysUsed: days,
    basisDenominator: denominator,
    remainderMinorUnits: Math.round(remainder * 1_000_000) / 1_000_000, // micro-cent precision for carry
  };
}

function getBasisDenominator(basis: InterestBasis): number {
  switch (basis) {
    case InterestBasis.ACTUAL_365: return 365;
    case InterestBasis.ACTUAL_360: return 360;
    case InterestBasis.THIRTY_360: return 360;
    default: {
      const _exhaustive: never = basis;
      throw new Error(`Unsupported basis: ${_exhaustive}`);
    }
  }
}

/**
 * 30/360 day count: each month = 30 days, year = 360 days.
 */
function computeThirtyThreeSixtyDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let d1 = start.getUTCDate();
  let m1 = start.getUTCMonth() + 1;
  const y1 = start.getUTCFullYear();

  let d2 = end.getUTCDate();
  let m2 = end.getUTCMonth() + 1;
  const y2 = end.getUTCFullYear();

  // Standard 30/360 adjustment
  if (d1 === 31) d1 = 30;
  if (d2 === 31 && d1 >= 30) d2 = 30;

  return (y2 - y1) * 360 + (m2 - m1) * 30 + (d2 - d1);
}

/**
 * Compute actual days between two dates.
 */
export function actualDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}
