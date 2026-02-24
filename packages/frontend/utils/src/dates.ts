function toDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Format a date in the specified format.
 */
export function formatDate(
  date: Date | string,
  format: 'short' | 'long' | 'iso' = 'short',
): string {
  const d = toDate(date);

  switch (format) {
    case 'iso':
      return d.toISOString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'short':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Return a human-readable relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: Date | string): string {
  const d = toDate(date);
  const now = Date.now();
  const diff = now - d.getTime();
  const absDiff = Math.abs(diff);
  const suffix = diff >= 0 ? 'ago' : 'from now';

  if (absDiff < MINUTE) {
    return 'just now';
  }
  if (absDiff < HOUR) {
    const minutes = Math.floor(absDiff / MINUTE);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${suffix}`;
  }
  if (absDiff < DAY) {
    const hours = Math.floor(absDiff / HOUR);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${suffix}`;
  }

  const days = Math.floor(absDiff / DAY);
  return `${days} ${days === 1 ? 'day' : 'days'} ${suffix}`;
}

/**
 * Check whether a date is in the past.
 */
export function isOverdue(date: Date | string): boolean {
  return toDate(date).getTime() < Date.now();
}
