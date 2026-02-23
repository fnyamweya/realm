import { z } from "zod";
import {
  ConfigKind,
  ClientConfigSchema,
  AuthSecurityProfileSchema,
} from "@realtyos/config";

interface SchemaEntry {
  schema: z.ZodTypeAny;
  version: number;
}

export const ConfigSchemaRegistry = new Map<ConfigKind, SchemaEntry>([
  [
    ConfigKind.CLIENT_CONFIG,
    { schema: ClientConfigSchema, version: 1 },
  ],
  [
    ConfigKind.AUTH_SECURITY_PROFILE,
    { schema: AuthSecurityProfileSchema, version: 1 },
  ],
]);

export function validateConfig(
  kind: ConfigKind,
  data: unknown,
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const entry = ConfigSchemaRegistry.get(kind);
  if (!entry) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          path: ["kind"],
          message: `No schema registered for config kind: ${kind}`,
        },
      ]),
    };
  }

  const result = entry.schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as unknown };
  }
  return { success: false, error: result.error };
}

export function getSchemaVersion(kind: ConfigKind): number {
  const entry = ConfigSchemaRegistry.get(kind);
  if (!entry) {
    throw new Error(`No schema registered for config kind: ${kind}`);
  }
  return entry.version;
}
