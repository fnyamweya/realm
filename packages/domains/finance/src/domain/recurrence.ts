export const Frequency = {
  HOUR: 'HOUR',
  DAY: 'DAY',
  WEEK: 'WEEK',
  MONTH: 'MONTH',
  YEAR: 'YEAR',
} as const;
export type Frequency = (typeof Frequency)[keyof typeof Frequency];

export const EndOfMonthPolicy = {
  LAST_DAY: 'LAST_DAY',
  EXACT: 'EXACT',
  NEXT_MONTH_1ST: 'NEXT_MONTH_1ST',
} as const;
export type EndOfMonthPolicy = (typeof EndOfMonthPolicy)[keyof typeof EndOfMonthPolicy];

export const BillingMode = {
  IN_ADVANCE: 'IN_ADVANCE',
  IN_ARREARS: 'IN_ARREARS',
} as const;
export type BillingMode = (typeof BillingMode)[keyof typeof BillingMode];

export interface RecurrenceSpec {
  readonly frequency: Frequency;
  readonly interval: number;
  readonly dayOfMonth: number | undefined;
  readonly endOfMonthPolicy: EndOfMonthPolicy | undefined;
  readonly dayOfWeek: number | undefined;
  readonly hour: number | undefined;
  readonly minute: number | undefined;
  readonly billingMode: BillingMode;
  readonly timezone: string;
}

export interface DueRuleSpec {
  readonly dueAtPeriodStart: boolean;
  readonly dueAtPeriodEnd: boolean;
  readonly dueOffsetDays: number;
  readonly graceDays: number;
}

export interface Period {
  readonly start: string; // ISO8601
  readonly end: string;   // ISO8601
  readonly dueDate: string; // ISO8601
}

/**
 * Returns the number of days in a given month.
 */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps a day-of-month to the actual last day of the target month.
 */
function clampDay(year: number, month: number, day: number, policy: EndOfMonthPolicy | undefined): number {
  const maxDay = daysInMonth(year, month);
  if (day > maxDay) {
    if (policy === EndOfMonthPolicy.NEXT_MONTH_1ST) {
      return -1; // signal to use 1st of next month
    }
    return maxDay; // LAST_DAY or EXACT (clamped)
  }
  return day;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function computeDueDate(periodStart: string, periodEnd: string, dueRule: DueRuleSpec): string {
  if (dueRule.dueAtPeriodEnd) {
    return addDays(periodEnd, dueRule.dueOffsetDays);
  }
  return addDays(periodStart, dueRule.dueOffsetDays);
}

/**
 * Deterministic recurrence engine. Generates periods within a window.
 * All date arithmetic uses UTC to avoid DST ambiguity.
 */
export function generatePeriods(
  spec: RecurrenceSpec,
  dueRule: DueRuleSpec,
  windowStart: string,
  windowEnd: string,
  anchorDate: string,
): Period[] {
  const periods: Period[] = [];
  const windowEndMs = new Date(windowEnd).getTime();
  let current = new Date(anchorDate);

  // Safety: max 1000 periods to prevent infinite loops
  const MAX_PERIODS = 1000;

  for (let i = 0; i < MAX_PERIODS; i++) {
    let periodStart: Date;
    let periodEnd: Date;

    switch (spec.frequency) {
      case Frequency.MONTH: {
        const year = current.getUTCFullYear();
        const month = current.getUTCMonth() + 1; // 1-indexed
        const targetDay = spec.dayOfMonth ?? current.getUTCDate();
        const clampedDay = clampDay(year, month, targetDay, spec.endOfMonthPolicy);

        if (clampedDay === -1) {
          // NEXT_MONTH_1ST: use 1st of next month
          periodStart = new Date(Date.UTC(year, month, 1));
        } else {
          periodStart = new Date(Date.UTC(year, month - 1, clampedDay));
        }

        // Period end = start of next period
        const nextMonth = periodStart.getUTCMonth() + spec.interval;
        const nextYear = periodStart.getUTCFullYear() + Math.floor(nextMonth / 12);
        const normalizedMonth = nextMonth % 12;
        const nextDay = spec.dayOfMonth ?? periodStart.getUTCDate();
        const clampedNextDay = clampDay(nextYear, normalizedMonth + 1, nextDay, spec.endOfMonthPolicy);
        if (clampedNextDay === -1) {
          periodEnd = new Date(Date.UTC(nextYear, normalizedMonth + 1, 1));
        } else {
          periodEnd = new Date(Date.UTC(nextYear, normalizedMonth, clampedNextDay));
        }
        break;
      }
      case Frequency.WEEK: {
        periodStart = new Date(current);
        periodEnd = new Date(periodStart);
        periodEnd.setUTCDate(periodEnd.getUTCDate() + 7 * spec.interval);
        break;
      }
      case Frequency.DAY: {
        periodStart = new Date(current);
        periodEnd = new Date(periodStart);
        periodEnd.setUTCDate(periodEnd.getUTCDate() + spec.interval);
        break;
      }
      case Frequency.HOUR: {
        periodStart = new Date(current);
        periodEnd = new Date(periodStart);
        periodEnd.setUTCHours(periodEnd.getUTCHours() + spec.interval);
        break;
      }
      case Frequency.YEAR: {
        periodStart = new Date(current);
        periodEnd = new Date(periodStart);
        periodEnd.setUTCFullYear(periodEnd.getUTCFullYear() + spec.interval);
        break;
      }
      default: {
        const _exhaustive: never = spec.frequency;
        throw new Error(`Unsupported frequency: ${_exhaustive}`);
      }
    }

    // If period is entirely before window, advance
    if (periodEnd.getTime() <= new Date(windowStart).getTime()) {
      current = periodEnd;
      continue;
    }

    // If period start is beyond window, stop
    if (periodStart.getTime() >= windowEndMs) {
      break;
    }

    const startStr = periodStart.toISOString();
    const endStr = periodEnd.toISOString();
    const dueDateStr = computeDueDate(startStr, endStr, dueRule);

    periods.push({
      start: startStr,
      end: endStr,
      dueDate: dueDateStr,
    });

    current = periodEnd;
  }

  return periods;
}

/**
 * Compute prorated amount for a partial period.
 */
export function computeProration(
  fullAmount: number,
  periodStart: string,
  periodEnd: string,
  effectiveStart: string,
  effectiveEnd: string,
  policy: 'NONE' | 'DAILY_ACTUAL' | 'DAILY_30' | 'HOURLY',
): number {
  if (policy === 'NONE') return fullAmount;

  const pStart = new Date(periodStart).getTime();
  const pEnd = new Date(periodEnd).getTime();
  const eStart = Math.max(new Date(effectiveStart).getTime(), pStart);
  const eEnd = Math.min(new Date(effectiveEnd).getTime(), pEnd);

  if (eEnd <= eStart) return 0;

  switch (policy) {
    case 'DAILY_ACTUAL': {
      const totalDays = (pEnd - pStart) / (1000 * 60 * 60 * 24);
      const effectiveDays = (eEnd - eStart) / (1000 * 60 * 60 * 24);
      return Math.round((fullAmount * effectiveDays / totalDays) * 100) / 100;
    }
    case 'DAILY_30': {
      // 30/360 convention
      const effectiveDays = (eEnd - eStart) / (1000 * 60 * 60 * 24);
      return Math.round((fullAmount * effectiveDays / 30) * 100) / 100;
    }
    case 'HOURLY': {
      const totalHours = (pEnd - pStart) / (1000 * 60 * 60);
      const effectiveHours = (eEnd - eStart) / (1000 * 60 * 60);
      return Math.round((fullAmount * effectiveHours / totalHours) * 100) / 100;
    }
  }
  // All non-NONE policies are handled above; NONE returns early at top
  return fullAmount;
}
