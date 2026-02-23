import { z } from 'zod';

export const MoneySchema = z.object({
  amount: z.number(),
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
});
export type MoneyData = z.infer<typeof MoneySchema>;

export const RoundingMode = {
  HALF_UP: 'HALF_UP',
  HALF_DOWN: 'HALF_DOWN',
  HALF_EVEN: 'HALF_EVEN',
  CEILING: 'CEILING',
  FLOOR: 'FLOOR',
} as const;
export type RoundingMode = (typeof RoundingMode)[keyof typeof RoundingMode];

/**
 * Immutable Money value object. All arithmetic returns new instances.
 * Uses integer cents internally to avoid floating-point errors.
 */
export class Money {
  readonly amount: number;
  readonly currency: string;

  private constructor(amount: number, currency: string) {
    this.amount = amount;
    this.currency = currency;
  }

  static of(amount: number, currency: string): Money {
    if (!currency || currency.length !== 3) {
      throw new Error(`Invalid currency: ${currency}`);
    }
    return new Money(Money.roundToCents(amount), currency);
  }

  static zero(currency: string): Money {
    return Money.of(0, currency);
  }

  static fromData(data: MoneyData): Money {
    return Money.of(data.amount, data.currency);
  }

  private static roundToCents(value: number, mode: RoundingMode = RoundingMode.HALF_UP): number {
    const factor = 100;
    const shifted = value * factor;
    let rounded: number;
    switch (mode) {
      case RoundingMode.HALF_UP:
        rounded = Math.round(shifted);
        break;
      case RoundingMode.HALF_DOWN:
        rounded = Math.sign(shifted) * Math.floor(Math.abs(shifted) + 0.5 - Number.EPSILON);
        break;
      case RoundingMode.HALF_EVEN: {
        const floored = Math.floor(shifted);
        const diff = shifted - floored;
        if (Math.abs(diff - 0.5) < Number.EPSILON) {
          rounded = floored % 2 === 0 ? floored : floored + 1;
        } else {
          rounded = Math.round(shifted);
        }
        break;
      }
      case RoundingMode.CEILING:
        rounded = Math.ceil(shifted);
        break;
      case RoundingMode.FLOOR:
        rounded = Math.floor(shifted);
        break;
    }
    return rounded / factor;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.of(this.amount - other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.of(this.amount * factor, this.currency);
  }

  negate(): Money {
    return Money.of(-this.amount, this.currency);
  }

  isZero(): boolean {
    return this.amount === 0;
  }

  isPositive(): boolean {
    return this.amount > 0;
  }

  isNegative(): boolean {
    return this.amount < 0;
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  toData(): MoneyData {
    return { amount: this.amount, currency: this.currency };
  }
}
