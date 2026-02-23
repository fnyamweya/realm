import type { z } from "zod";
import type { ConfigKind } from "./schemas.js";

export enum ConfigResolutionLevel {
  PLATFORM = "PLATFORM",
  GEO = "GEO",
  PLAN = "PLAN",
  CLIENT = "CLIENT",
  WORKSPACE = "WORKSPACE",
  PROPERTY = "PROPERTY",
  USER_PREFS = "USER_PREFS",
}

export interface ConfigResolver {
  resolve<T>(
    clientId: string,
    configKind: ConfigKind,
    schema: z.ZodSchema<T>,
  ): Promise<T>;
}

/** Keys that represent platform baseline security constraints and cannot be overridden. */
export const LOCKED_KEYS = new Set<string>([
  "mfaRequired",
  "passwordMinLength",
  "sessionDurationMinutes",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep-merges a base config with one or more override layers.
 * Keys in {@link LOCKED_KEYS} are preserved from `base` and cannot be overridden.
 */
export function mergeConfigs(
  base: Record<string, unknown>,
  ...overrides: Array<Record<string, unknown>>
): Record<string, unknown> {
  let result = structuredClone(base);

  for (const override of overrides) {
    result = mergeTwoObjects(result, override, true);
  }

  return result;
}

function mergeTwoObjects(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  isRoot: boolean,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    if (isRoot && LOCKED_KEYS.has(key)) {
      continue;
    }

    const targetVal = target[key];
    const sourceVal = source[key];

    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      merged[key] = mergeTwoObjects(targetVal, sourceVal, false);
    } else {
      merged[key] = structuredClone(sourceVal);
    }
  }

  return merged;
}
