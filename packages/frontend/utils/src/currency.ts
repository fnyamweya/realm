/**
 * Format a numeric amount as a currency string.
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Parse a currency-formatted string into a number.
 * Handles optional leading minus, digits, and a single decimal point.
 */
export function parseCurrencyString(value: string): number {
  const stripped = value.replace(/[^0-9.\-]/g, '');
  const match = /^-?\d+(?:\.\d+)?/.exec(stripped);
  if (!match) {
    return 0;
  }
  return Number(match[0]);
}
