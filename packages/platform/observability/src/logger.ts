export interface LogContext {
  correlationId: string;
  clientId?: string;
  actorId?: string;
  membershipId?: string;
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void;
  warn(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void;
  error(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void;
  debug(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void;
}

export const PII_REDACT_KEYS = new Set([
  "email",
  "phone",
  "ssn",
  "password",
  "token",
  "secret",
  "creditCard",
  "credit_card",
  "dateOfBirth",
  "date_of_birth",
  "socialSecurity",
  "social_security",
  "accessToken",
  "access_token",
  "refreshToken",
  "refresh_token",
  "apiKey",
  "api_key",
]);

export function redactPII(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_REDACT_KEYS.has(key)) {
      result[key] = "[REDACTED]";
    } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = redactPII(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

type LogLevel = "info" | "warn" | "error" | "debug";

function formatLogEntry(
  level: LogLevel,
  message: string,
  baseContext: Partial<LogContext>,
  context?: Partial<LogContext>,
  data?: Record<string, unknown>,
): string {
  const entry: Record<string, unknown> = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...baseContext,
    ...context,
  };

  if (data) {
    entry["data"] = redactPII(data);
  }

  return JSON.stringify(entry);
}

export function createStructuredLogger(baseContext: Partial<LogContext>): Logger {
  return {
    info(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void {
      console.log(formatLogEntry("info", message, baseContext, context, data));
    },
    warn(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void {
      console.warn(formatLogEntry("warn", message, baseContext, context, data));
    },
    error(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void {
      console.error(formatLogEntry("error", message, baseContext, context, data));
    },
    debug(message: string, context?: Partial<LogContext>, data?: Record<string, unknown>): void {
      console.debug(formatLogEntry("debug", message, baseContext, context, data));
    },
  };
}
