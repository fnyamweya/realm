import { z } from "zod";
import type { ActorContext } from "./actor-context.js";
import type { Audience } from "./value-objects.js";

// ─── Auth Error Codes ────────────────────────────────────────────────────────

export const AuthErrorCode = z.enum([
  "AUTH_AUDIENCE_MISMATCH",
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_SESSION_REVOKED",
  "AUTH_SESSION_EXPIRED",
  "AUTH_CLIENT_NOT_SELECTED",
  "AUTH_MFA_STEP_UP_REQUIRED",
  "AUTH_MAKER_CHECKER_REQUIRED",
  "AUTH_REASON_REQUIRED",
  "AUTH_RATE_LIMITED",
  "AUTH_ACCOUNT_LOCKED",
  "AUTH_CREDENTIALS_INVALID",
  "AUTH_FORBIDDEN",
]);
export type AuthErrorCode = z.infer<typeof AuthErrorCode>;

// ─── Auth Obligation ─────────────────────────────────────────────────────────

export const AuthObligationSchema = z.object({
  type: z.enum([
    "MFA_STEP_UP_REQUIRED",
    "SELECT_CLIENT",
    "MAKER_CHECKER_REQUIRED",
    "REASON_REQUIRED",
  ]),
  level: z.string().nullable(),
  expiresInSeconds: z.number().nullable(),
  allowedFactors: z.array(z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type AuthObligation = z.infer<typeof AuthObligationSchema>;

// ─── Route Declaration ───────────────────────────────────────────────────────

export interface RouteAuthRequirement {
  allowedAudiences: Audience[];
  requireClientId: boolean;
  policyAction: string;
}

// ─── Audience Enforcement ────────────────────────────────────────────────────

/**
 * Validates that the actor's session audience matches the declared
 * route audiences. Returns an error code if mismatched, null if valid.
 */
export function enforceAudience(
  actorAudience: Audience,
  allowedAudiences: Audience[],
): AuthErrorCode | null {
  if (!allowedAudiences.includes(actorAudience)) {
    return "AUTH_AUDIENCE_MISMATCH";
  }
  return null;
}

/**
 * Validates that the actor has a client selected when the route requires it.
 * Returns an obligation if selection is needed, null if valid.
 */
export function enforceClientSelection(
  ctx: ActorContext,
  requireClientId: boolean,
): AuthObligation | null {
  if (requireClientId && ctx.clientId === null) {
    return {
      type: "SELECT_CLIENT",
      level: null,
      expiresInSeconds: null,
      allowedFactors: null,
      metadata: null,
    };
  }
  return null;
}

/**
 * Evaluates policy engine obligations and maps them to auth obligations.
 * Returns obligations that the client must fulfill before proceeding.
 */
export function mapPolicyObligations(
  obligations: Array<{ type: string; params?: Record<string, unknown> }>,
): AuthObligation[] {
  const result: AuthObligation[] = [];

  for (const ob of obligations) {
    switch (ob.type) {
      case "mfaRequired":
        result.push({
          type: "MFA_STEP_UP_REQUIRED",
          level: (ob.params?.["level"] as string | undefined) ?? "STRONG",
          expiresInSeconds:
            (ob.params?.["expiresInSeconds"] as number | undefined) ?? 300,
          allowedFactors:
            (ob.params?.["allowedFactors"] as string[] | undefined) ?? null,
          metadata: null,
        });
        break;
      case "makerCheckerRequired":
        result.push({
          type: "MAKER_CHECKER_REQUIRED",
          level: null,
          expiresInSeconds: null,
          allowedFactors: null,
          metadata: ob.params ?? null,
        });
        break;
      case "reasonRequired":
        result.push({
          type: "REASON_REQUIRED",
          level: null,
          expiresInSeconds: null,
          allowedFactors: null,
          metadata: null,
        });
        break;
    }
  }

  return result;
}
