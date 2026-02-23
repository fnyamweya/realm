import { describe, it, expect } from 'vitest';
import { Money } from '../money.js';

describe('Money', () => {
  it('Money.of() creates money with correct amount (rounds to cents)', () => {
    const m = Money.of(10.126, 'USD');
    expect(m.amount).toBe(10.13);
    expect(m.currency).toBe('USD');
  });

  it('Money.zero() creates zero money', () => {
    const m = Money.zero('USD');
    expect(m.amount).toBe(0);
    expect(m.currency).toBe('USD');
    expect(m.isZero()).toBe(true);
  });

  it('Money.add() adds correctly with same currency', () => {
    const a = Money.of(10.5, 'USD');
    const b = Money.of(3.25, 'USD');
    const result = a.add(b);
    expect(result.amount).toBe(13.75);
    expect(result.currency).toBe('USD');
  });

  it('Money.add() throws on currency mismatch', () => {
    const a = Money.of(10, 'USD');
    const b = Money.of(5, 'EUR');
    expect(() => a.add(b)).toThrow('Currency mismatch');
  });

  it('Money.subtract() works correctly', () => {
    const a = Money.of(10, 'USD');
    const b = Money.of(3.5, 'USD');
    const result = a.subtract(b);
    expect(result.amount).toBe(6.5);
  });

  it('Money.multiply() applies factor and rounds', () => {
    const m = Money.of(10, 'USD');
    const result = m.multiply(0.333);
    expect(result.amount).toBe(3.33);
  });

  it('Money.negate() negates amount', () => {
    const m = Money.of(5.5, 'USD');
    const neg = m.negate();
    expect(neg.amount).toBe(-5.5);
    expect(neg.currency).toBe('USD');
  });

  it('Money.isZero/isPositive/isNegative', () => {
    expect(Money.of(0, 'USD').isZero()).toBe(true);
    expect(Money.of(0, 'USD').isPositive()).toBe(false);
    expect(Money.of(0, 'USD').isNegative()).toBe(false);

    expect(Money.of(1, 'USD').isPositive()).toBe(true);
    expect(Money.of(1, 'USD').isNegative()).toBe(false);
    expect(Money.of(1, 'USD').isZero()).toBe(false);

    expect(Money.of(-1, 'USD').isNegative()).toBe(true);
    expect(Money.of(-1, 'USD').isPositive()).toBe(false);
  });

  it('Money.equals() comparisons', () => {
    const a = Money.of(10, 'USD');
    const b = Money.of(10, 'USD');
    const c = Money.of(10, 'EUR');
    const d = Money.of(5, 'USD');

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
    expect(a.equals(d)).toBe(false);
  });

  it('Money.fromData() and toData() round-trip', () => {
    const original = Money.of(42.99, 'USD');
    const data = original.toData();
    expect(data).toEqual({ amount: 42.99, currency: 'USD' });

    const restored = Money.fromData(data);
    expect(restored.equals(original)).toBe(true);
  });
});
