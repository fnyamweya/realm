import { describe, it, expect } from 'vitest';
import { computeInterest, InterestBasis, actualDaysBetween } from '../interest-computation.js';

describe('InterestComputation', () => {
  describe('computeInterest', () => {
    it('computes ACTUAL_365 interest correctly', () => {
      // $1000 principal at 12% APR for 30 days
      const result = computeInterest({
        principalMinorUnits: 100000,
        aprPercent: 12,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 30,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-31T00:00:00.000Z',
      });
      // daily rate = 0.12 / 365 = 0.000328767...
      // interest = 100000 * 0.000328767 * 30 = 986.30 → floored to 986
      expect(result.computedInterestMinorUnits).toBe(986);
      expect(result.dailyRate).toBeCloseTo(0.12 / 365);
      expect(result.basisDenominator).toBe(365);
      expect(result.daysUsed).toBe(30);
    });

    it('computes ACTUAL_360 interest correctly', () => {
      // $1000 at 12% for 30 days on 360 basis
      const result = computeInterest({
        principalMinorUnits: 100000,
        aprPercent: 12,
        basis: InterestBasis.ACTUAL_360,
        daysAccrued: 30,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-31T00:00:00.000Z',
      });
      // daily rate = 0.12 / 360 = 0.000333...
      // interest = 100000 * 0.000333... * 30 = 1000
      expect(result.computedInterestMinorUnits).toBe(1000);
      expect(result.basisDenominator).toBe(360);
    });

    it('computes THIRTY_360 interest correctly', () => {
      // 30/360: Jan 1 to Jan 31 → 30 days by convention
      const result = computeInterest({
        principalMinorUnits: 100000,
        aprPercent: 12,
        basis: InterestBasis.THIRTY_360,
        daysAccrued: 30, // ignored for 30/360; uses date diff
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-31T00:00:00.000Z',
      });
      // 30/360: (0-0)*360 + (1-1)*30 + (31-1) = 30 days
      expect(result.daysUsed).toBe(30);
      expect(result.computedInterestMinorUnits).toBe(1000);
    });

    it('returns zero for zero principal', () => {
      const result = computeInterest({
        principalMinorUnits: 0,
        aprPercent: 12,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 30,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-31T00:00:00.000Z',
      });
      expect(result.computedInterestMinorUnits).toBe(0);
    });

    it('returns zero for zero APR', () => {
      const result = computeInterest({
        principalMinorUnits: 100000,
        aprPercent: 0,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 30,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-31T00:00:00.000Z',
      });
      expect(result.computedInterestMinorUnits).toBe(0);
    });

    it('returns zero for zero days', () => {
      const result = computeInterest({
        principalMinorUnits: 100000,
        aprPercent: 12,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 0,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-01T00:00:00.000Z',
      });
      expect(result.computedInterestMinorUnits).toBe(0);
    });

    it('floors fractional interest and carries remainder', () => {
      // Small principal to force fractional interest
      const result = computeInterest({
        principalMinorUnits: 100,
        aprPercent: 5,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 1,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-01-02T00:00:00.000Z',
      });
      // 100 * (0.05/365) * 1 = 0.01369... → floor = 0, remainder ≈ 0.01369
      expect(result.computedInterestMinorUnits).toBe(0);
      expect(result.remainderMinorUnits).toBeGreaterThan(0);
    });

    it('handles large principals correctly', () => {
      // $100,000 at 18% for 365 days
      const result = computeInterest({
        principalMinorUnits: 10_000_000,
        aprPercent: 18,
        basis: InterestBasis.ACTUAL_365,
        daysAccrued: 365,
        periodStartDate: '2024-01-01T00:00:00.000Z',
        periodEndDate: '2024-12-31T00:00:00.000Z',
      });
      // 10_000_000 * 0.18 = 1_800_000
      expect(result.computedInterestMinorUnits).toBe(1_800_000);
    });
  });

  describe('actualDaysBetween', () => {
    it('computes days between dates', () => {
      expect(actualDaysBetween('2024-01-01T00:00:00.000Z', '2024-01-31T00:00:00.000Z')).toBe(30);
      expect(actualDaysBetween('2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z')).toBe(31);
      expect(actualDaysBetween('2024-02-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z')).toBe(29); // leap year
    });

    it('returns 0 for same date', () => {
      expect(actualDaysBetween('2024-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z')).toBe(0);
    });
  });
});
