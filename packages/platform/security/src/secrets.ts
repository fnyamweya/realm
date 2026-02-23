import { z } from "zod";

/** Policy for secret lifecycle management. Never store raw secret values — only references. */
export const SecretsPolicySchema = z
  .object({
    /** Maximum age in days before a secret must be rotated */
    maxAge: z.number().int().positive(),
    /** Days before expiry to send a rotation reminder */
    rotationReminder: z.number().int().positive(),
    /** Whether changes require maker-checker approval */
    requireMakerChecker: z.boolean(),
  })
  .readonly();

export type SecretsPolicy = z.infer<typeof SecretsPolicySchema>;

/** A reference to a secret stored in an external provider. Never contains the raw value. */
export interface SecretReference {
  readonly secretId: string;
  readonly provider: string;
  readonly keyName: string;
  readonly version: number;
  readonly expiresAt?: string;
}
