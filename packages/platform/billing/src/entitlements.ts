import { z } from "zod";

export const EntitlementSchema = z.object({
  clientId: z.string(),
  module: z.string(),
  enabled: z.boolean(),
  limit: z.number().optional(),
  usedCount: z.number().optional(),
});

export type Entitlement = z.infer<typeof EntitlementSchema>;

export interface EntitlementCheckResult {
  allowed: boolean;
  remaining?: number;
}

export function checkEntitlement(
  entitlements: Entitlement[],
  module: string,
): EntitlementCheckResult {
  const entitlement = entitlements.find((e) => e.module === module);

  if (!entitlement || !entitlement.enabled) {
    return { allowed: false };
  }

  if (entitlement.limit !== undefined) {
    const used = entitlement.usedCount ?? 0;
    const remaining = entitlement.limit - used;
    return { allowed: remaining > 0, remaining };
  }

  return { allowed: true };
}
