import { describe, it, expect } from 'vitest';
import { generatePeriods, computeProration, Frequency, EndOfMonthPolicy, BillingMode } from '../recurrence.js';
import type { RecurrenceSpec, DueRuleSpec } from '../recurrence.js';

function makeSpec(overrides: Partial<RecurrenceSpec> = {}): RecurrenceSpec {
  return {
    frequency: Frequency.MONTH,
    interval: 1,
    dayOfMonth: 1,
    endOfMonthPolicy: undefined,
    dayOfWeek: undefined,
    hour: undefined,
    minute: undefined,
    billingMode: BillingMode.IN_ADVANCE,
    timezone: 'UTC',
    ...overrides,
  };
}

function makeDueRule(overrides: Partial<DueRuleSpec> = {}): DueRuleSpec {
  return {
    dueAtPeriodStart: true,
    dueAtPeriodEnd: false,
    dueOffsetDays: 0,
    graceDays: 0,
    ...overrides,
  };
}

describe('Recurrence - generatePeriods', () => {
  it('monthly recurrence generates correct periods', () => {
    const spec = makeSpec({ frequency: Frequency.MONTH, dayOfMonth: 1, interval: 1 });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-04-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(3);
    expect(periods[0]!.start).toBe('2024-01-01T00:00:00.000Z');
    expect(periods[0]!.end).toBe('2024-02-01T00:00:00.000Z');
    expect(periods[1]!.start).toBe('2024-02-01T00:00:00.000Z');
    expect(periods[2]!.start).toBe('2024-03-01T00:00:00.000Z');
  });

  it('monthly with dayOfMonth=31 and LAST_DAY policy clamps correctly', () => {
    const spec = makeSpec({ frequency: Frequency.MONTH, dayOfMonth: 31, endOfMonthPolicy: EndOfMonthPolicy.LAST_DAY });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-02-01T00:00:00.000Z', '2024-04-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z');

    expect(periods.length).toBeGreaterThanOrEqual(1);
    // Feb 2024 has 29 days (leap year), so day 31 clamps to 29
    expect(periods[0]!.start).toBe('2024-02-29T00:00:00.000Z');
  });

  it('weekly recurrence generates 4 periods in a month', () => {
    const spec = makeSpec({ frequency: Frequency.WEEK, interval: 1, dayOfMonth: undefined });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-01-29T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(4);
    expect(periods[0]!.start).toBe('2024-01-01T00:00:00.000Z');
    expect(periods[0]!.end).toBe('2024-01-08T00:00:00.000Z');
  });

  it('daily recurrence generates correct periods', () => {
    const spec = makeSpec({ frequency: Frequency.DAY, interval: 1, dayOfMonth: undefined });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-01-04T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(3);
    expect(periods[0]!.start).toBe('2024-01-01T00:00:00.000Z');
    expect(periods[0]!.end).toBe('2024-01-02T00:00:00.000Z');
  });

  it('hourly recurrence generates periods', () => {
    const spec = makeSpec({ frequency: Frequency.HOUR, interval: 1, dayOfMonth: undefined });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-01-01T03:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(3);
    expect(periods[0]!.start).toBe('2024-01-01T00:00:00.000Z');
    expect(periods[0]!.end).toBe('2024-01-01T01:00:00.000Z');
  });

  it('yearly recurrence generates period', () => {
    const spec = makeSpec({ frequency: Frequency.YEAR, interval: 1, dayOfMonth: undefined });
    const dueRule = makeDueRule();
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(2);
    expect(periods[0]!.start).toBe('2024-01-01T00:00:00.000Z');
    expect(periods[0]!.end).toBe('2025-01-01T00:00:00.000Z');
  });

  it('periods outside window are not included', () => {
    const spec = makeSpec({ frequency: Frequency.MONTH, dayOfMonth: 1, interval: 1 });
    const dueRule = makeDueRule();
    // Window is Feb-Mar, anchor is Jan
    const periods = generatePeriods(spec, dueRule, '2024-02-01T00:00:00.000Z', '2024-03-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(1);
    expect(periods[0]!.start).toBe('2024-02-01T00:00:00.000Z');
  });

  it('due date computed from period start with offset', () => {
    const spec = makeSpec({ frequency: Frequency.MONTH, dayOfMonth: 1, interval: 1 });
    const dueRule = makeDueRule({ dueAtPeriodEnd: false, dueOffsetDays: 5 });
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(1);
    expect(periods[0]!.dueDate).toBe('2024-01-06T00:00:00.000Z');
  });

  it('due date computed from period end', () => {
    const spec = makeSpec({ frequency: Frequency.MONTH, dayOfMonth: 1, interval: 1 });
    const dueRule = makeDueRule({ dueAtPeriodEnd: true, dueOffsetDays: 0 });
    const periods = generatePeriods(spec, dueRule, '2024-01-01T00:00:00.000Z', '2024-02-01T00:00:00.000Z', '2024-01-01T00:00:00.000Z');

    expect(periods).toHaveLength(1);
    expect(periods[0]!.dueDate).toBe('2024-02-01T00:00:00.000Z');
  });
});

describe('Recurrence - computeProration', () => {
  it('NONE returns full amount', () => {
    const result = computeProration(
      1000,
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-01-10T00:00:00.000Z',
      '2024-01-20T00:00:00.000Z',
      'NONE',
    );
    expect(result).toBe(1000);
  });

  it('DAILY_ACTUAL prorates partial month', () => {
    // Full month Jan 1 - Feb 1 = 31 days, effective 15 days (Jan 1 - Jan 16)
    const result = computeProration(
      1000,
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
      '2024-01-16T00:00:00.000Z',
      'DAILY_ACTUAL',
    );
    // 15/31 * 1000 = 483.87 (rounded)
    expect(result).toBeCloseTo(483.87, 2);
  });

  it('DAILY_30 uses 30-day convention', () => {
    // Effective 15 days, 30-day convention
    const result = computeProration(
      1000,
      '2024-01-01T00:00:00.000Z',
      '2024-02-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
      '2024-01-16T00:00:00.000Z',
      'DAILY_30',
    );
    // 15/30 * 1000 = 500
    expect(result).toBe(500);
  });
});
