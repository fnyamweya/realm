'use client';
import { useCallback } from 'react';
import { safeLog, type LogLevel } from './telemetry';

export function useTelemetry() {
  const log = useCallback((level: LogLevel, message: string, data?: Record<string, unknown>) => {
    return safeLog(level, message, data);
  }, []);

  return { log };
}
