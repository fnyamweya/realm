import { describe, it, expect } from 'vitest';
import { computeLateFee, LateFeeType } from '../late-fee-computation.js';

describe('LateFeeComputation', () => {
  describe('computeLateFee', () => {
    it('computes fixed late fee', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 5,
        daysOverdue: 10,
      });
      expect(result.feeAmountMinorUnits).toBe(5000);
      expect(result.occurrenceNumber).toBe(1);
      expect(result.skipped).toBe(false);
    });

    it('computes percentage late fee', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.PERCENTAGE,
        fixedAmountMinorUnits: undefined,
        percent: 5,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 0,
        daysOverdue: 1,
      });
      expect(result.feeAmountMinorUnits).toBe(5000);
    });

    it('skips if within grace period', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 10,
        daysOverdue: 5,
      });
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('within_grace_period');
      expect(result.feeAmountMinorUnits).toBe(0);
    });

    it('skips if below minimum outstanding threshold', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 500,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: 1000,
        graceDays: 0,
        daysOverdue: 1,
      });
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('below_threshold');
    });

    it('skips if max occurrences reached', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 3,
        maxOccurrencesPerCharge: 3,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 0,
        daysOverdue: 1,
      });
      expect(result.skipped).toBe(true);
      expect(result.skipReason).toBe('max_occurrences_reached');
    });

    it('applies cap on percentage fee', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 1000000,
        feeType: LateFeeType.PERCENTAGE,
        fixedAmountMinorUnits: undefined,
        percent: 10,
        capAmountMinorUnits: 50000,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 0,
        daysOverdue: 1,
      });
      // 10% of 1000000 = 100000, but cap is 50000
      expect(result.feeAmountMinorUnits).toBe(50000);
    });

    it('increments occurrence number', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 2,
        maxOccurrencesPerCharge: 5,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 0,
        daysOverdue: 1,
      });
      expect(result.occurrenceNumber).toBe(3);
      expect(result.skipped).toBe(false);
    });

    it('handles edge case: daysOverdue equals graceDays', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 5,
        daysOverdue: 5,
      });
      // daysOverdue <= graceDays → skipped
      expect(result.skipped).toBe(true);
    });

    it('applies fee when daysOverdue is one more than graceDays', () => {
      const result = computeLateFee({
        outstandingMinorUnits: 100000,
        feeType: LateFeeType.FIXED,
        fixedAmountMinorUnits: 5000,
        percent: undefined,
        capAmountMinorUnits: undefined,
        previousOccurrences: 0,
        maxOccurrencesPerCharge: undefined,
        minOutstandingThresholdMinorUnits: undefined,
        graceDays: 5,
        daysOverdue: 6,
      });
      expect(result.skipped).toBe(false);
      expect(result.feeAmountMinorUnits).toBe(5000);
    });
  });
});
