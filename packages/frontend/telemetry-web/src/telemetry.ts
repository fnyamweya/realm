import { redactPII } from '@realtyos/frontend-utils';

let correlationId: string | undefined;

export function setCorrelationId(id: string): void {
  correlationId = id;
}

export function getCorrelationId(): string {
  if (!correlationId) {
    correlationId = generateId();
  }
  return correlationId;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface TelemetryEvent {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  correlationId: string;
  timestamp: string;
}

const SENSITIVE_KEYS = ['email', 'phone', 'ssn', 'password', 'token', 'secret', 'name', 'address'];

export function safeLog(level: LogLevel, message: string, data?: Record<string, unknown>): TelemetryEvent {
  const event: TelemetryEvent = {
    level,
    message,
    data: data ? redactPII(data, SENSITIVE_KEYS) as Record<string, unknown> : undefined,
    correlationId: getCorrelationId(),
    timestamp: new Date().toISOString(),
  };

  if (typeof console !== 'undefined') {
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logFn(`[${event.level}] ${event.message}`, event.data ?? '');
  }

  return event;
}
