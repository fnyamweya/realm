const DEFAULT_SENSITIVE_KEYS = [
  'email',
  'phone',
  'ssn',
  'password',
  'secret',
  'token',
  'creditCard',
  'credit_card',
];

/**
 * Redact an email address for safe logging (e.g., "j***@e*****.com").
 */
export function redactEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return '***';

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.lastIndexOf('.');

  if (dotIndex < 1) return `${local.charAt(0)}***@***`;

  const domainName = domain.slice(0, dotIndex);
  const tld = domain.slice(dotIndex);

  return `${local.charAt(0)}***@${domainName.charAt(0)}*****${tld}`;
}

/**
 * Redact a phone number, keeping only the last 4 digits visible.
 */
export function redactPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***-***-${digits.slice(-4)}`;
}

/**
 * Deep-redact sensitive fields from an object for safe logging.
 */
export function redactPII(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = DEFAULT_SENSITIVE_KEYS,
): Record<string, unknown> {
  const lowerKeys = new Set(sensitiveKeys.map((k) => k.toLowerCase()));

  function redactValue(key: string, value: unknown): unknown {
    if (lowerKeys.has(key.toLowerCase())) {
      if (typeof value === 'string') {
        if (key.toLowerCase() === 'email') return redactEmail(value);
        if (key.toLowerCase() === 'phone') return redactPhone(value);
        return '[REDACTED]';
      }
      return '[REDACTED]';
    }

    if (Array.isArray(value)) {
      return value.map((item) =>
        isPlainObject(item)
          ? redactRecord(item as Record<string, unknown>)
          : item,
      );
    }

    if (isPlainObject(value)) {
      return redactRecord(value as Record<string, unknown>);
    }

    return value;
  }

  function redactRecord(
    record: Record<string, unknown>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      result[key] = redactValue(key, value);
    }
    return result;
  }

  return redactRecord(obj);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
