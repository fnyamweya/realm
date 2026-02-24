import { z } from "zod";
import { AuthStrategy } from "./value-objects.js";

// ─── Password Policy ─────────────────────────────────────────────────────────

export const PasswordPolicySchema = z.object({
  minLength: z.number().int().min(12),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireDigit: z.boolean(),
  requireSpecialChar: z.boolean(),
  breachCheckEnabled: z.boolean(),
});
export type PasswordPolicy = z.infer<typeof PasswordPolicySchema>;

// ─── Rate Limit Policy ──────────────────────────────────────────────────────

export const RateLimitPolicySchema = z.object({
  maxAttemptsPerIp: z.number().int().min(1),
  maxAttemptsPerPhone: z.number().int().min(1),
  maxAttemptsPerDevice: z.number().int().min(1),
  windowMinutes: z.number().int().min(1),
});
export type RateLimitPolicy = z.infer<typeof RateLimitPolicySchema>;

// ─── Lockout Policy ──────────────────────────────────────────────────────────

export const LockoutPolicySchema = z.object({
  maxFailedAttempts: z.number().int().min(1),
  lockoutDurationMinutes: z.number().int().min(1),
  progressiveMultiplier: z.number().min(1),
});
export type LockoutPolicy = z.infer<typeof LockoutPolicySchema>;

// ─── MFA Policy ──────────────────────────────────────────────────────────────

export const MfaPolicySchema = z.object({
  required: z.enum(["ALWAYS", "CONDITIONAL", "NEVER"]),
  allowedFactors: z.array(z.enum(["TOTP", "WEBAUTHN", "SMS_OTP"])),
  stepUpOnNewDevice: z.boolean(),
  stepUpOnSuspiciousIp: z.boolean(),
  stepUpOnHighRiskAction: z.boolean(),
});
export type MfaPolicy = z.infer<typeof MfaPolicySchema>;

// ─── Risk Controls ───────────────────────────────────────────────────────────

export const RiskControlsSchema = z.object({
  suspiciousLoginDetection: z.boolean(),
  geoAnomalyDetection: z.boolean(),
  deviceBindingEnabled: z.boolean(),
  trustedDeviceExpiryDays: z.number().int().min(1),
});
export type RiskControls = z.infer<typeof RiskControlsSchema>;

// ─── Console Auth Config ─────────────────────────────────────────────────────

export const ConsoleAuthConfigSchema = z.object({
  configVersion: z.number().int(),
  audience: z.literal("console"),
  allowedStrategies: z
    .array(AuthStrategy)
    .refine((s) => s.includes("OIDC"), {
      message: "Console must include OIDC strategy",
    }),
  mfaRequired: z.enum(["ALWAYS", "CONDITIONAL"]),
  sessionDurationMinutes: z.number().int().min(5).max(480),
  refreshRotationEnabled: z.boolean(),
  allowedEmailDomains: z.array(z.string()).nullable(),
  riskControls: RiskControlsSchema,
});
export type ConsoleAuthConfig = z.infer<typeof ConsoleAuthConfigSchema>;

// ─── Command Auth Config ─────────────────────────────────────────────────────

export const CommandAuthConfigSchema = z.object({
  configVersion: z.number().int(),
  audience: z.literal("command"),
  allowedStrategies: z
    .array(AuthStrategy)
    .refine((s) => s.includes("OIDC"), {
      message: "Command must include OIDC strategy",
    }),
  mfaRequired: z.literal("ALWAYS"),
  sessionDurationMinutes: z.number().int().min(5).max(60),
  ipAllowlist: z.array(z.string()).nullable(),
  stepUpRequiredForAllMutations: z.literal(true),
});
export type CommandAuthConfig = z.infer<typeof CommandAuthConfigSchema>;

// ─── Resident Auth Config ────────────────────────────────────────────────────

export const ResidentAuthConfigSchema = z.object({
  configVersion: z.number().int(),
  audience: z.literal("resident"),
  allowedStrategies: z
    .array(AuthStrategy)
    .refine((s) => s.includes("PHONE_PASSWORD"), {
      message: "Resident must include PHONE_PASSWORD strategy",
    }),
  passwordPolicy: PasswordPolicySchema,
  mfaPolicy: MfaPolicySchema,
  rateLimitPolicy: RateLimitPolicySchema,
  lockoutPolicy: LockoutPolicySchema,
  sessionDurationMinutes: z.number().int().min(5).max(1440),
  riskControls: RiskControlsSchema,
});
export type ResidentAuthConfig = z.infer<typeof ResidentAuthConfigSchema>;

// ─── Union type for any audience config ──────────────────────────────────────

export const AudienceAuthConfigSchema = z.discriminatedUnion("audience", [
  ConsoleAuthConfigSchema,
  CommandAuthConfigSchema,
  ResidentAuthConfigSchema,
]);
export type AudienceAuthConfig = z.infer<typeof AudienceAuthConfigSchema>;
