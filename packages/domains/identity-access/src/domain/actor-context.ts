import { z } from "zod";
import { Audience, AuthMethod, MfaLevel, ActorType } from "./value-objects.js";

// ─── ActorContext ────────────────────────────────────────────────────────────
// Unified context produced for every authenticated request by the Auth Gateway.

export const ActorContextSchema = z.object({
  actorType: ActorType,
  userId: z.string().nullable(),
  membershipId: z.string().nullable(),
  clientId: z.string().nullable(),
  roles: z.array(z.string()),
  scopes: z.array(z.string()),

  auth: z.object({
    audience: Audience,
    authMethod: AuthMethod,
    mfaLevel: MfaLevel,
    mfaLevelExpiresAt: z.string().nullable(),
    authTime: z.string(),
    sessionId: z.string(),
  }),

  risk: z.object({
    ipHash: z.string().nullable(),
    deviceId: z.string().nullable(),
    userAgentHash: z.string().nullable(),
    riskScore: z.number().nullable(),
  }),

  correlationId: z.string(),
});

export type ActorContext = z.infer<typeof ActorContextSchema>;

/**
 * Checks whether the actor has selected a client.
 * Client-scoped endpoints must reject requests where clientId is null.
 */
export function hasClientSelected(ctx: ActorContext): boolean {
  return ctx.clientId !== null;
}

/**
 * Returns true if the session's MFA level meets or exceeds the required level.
 */
export function meetsRequiredMfaLevel(
  actual: MfaLevel,
  required: MfaLevel,
  mfaLevelExpiresAt: string | null,
): boolean {
  const LEVEL_ORDER: Record<MfaLevel, number> = {
    NONE: 0,
    STEP_UP: 1,
    STRONG: 2,
  };

  if (LEVEL_ORDER[actual] < LEVEL_ORDER[required]) {
    return false;
  }

  // Check if step-up/strong MFA has expired
  if (actual !== "NONE" && mfaLevelExpiresAt !== null) {
    if (new Date(mfaLevelExpiresAt).getTime() < Date.now()) {
      return false;
    }
  }

  return true;
}
