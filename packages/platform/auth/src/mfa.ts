import { z } from "zod";
import type { Session } from "./session.js";

export enum MfaMethod {
  TOTP = "TOTP",
  SMS = "SMS",
  EMAIL = "EMAIL",
}

export const MfaChallengeSchema = z.object({
  challengeId: z.string(),
  userId: z.string(),
  method: z.nativeEnum(MfaMethod),
  expiresAt: z.string(),
  verified: z.boolean(),
});

export type MfaChallenge = z.infer<typeof MfaChallengeSchema>;

export interface MfaService {
  initiate(userId: string, method: MfaMethod): Promise<MfaChallenge>;
  verify(challengeId: string, code: string): Promise<boolean>;
}

/** Actions that require step-up MFA verification. */
const SENSITIVE_ACTIONS = new Set<string>([
  "delete_account",
  "change_password",
  "manage_api_keys",
  "update_security_profile",
  "export_data",
]);

/**
 * Returns `true` if the given action requires step-up MFA verification
 * and the session has not yet completed MFA.
 */
export function requireStepUp(session: Session, action: string): boolean {
  if (!SENSITIVE_ACTIONS.has(action)) {
    return false;
  }
  return !session.mfaVerified;
}
