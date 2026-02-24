import { describe, it, expect } from "vitest";
import {
  ConsoleAuthConfigSchema,
  CommandAuthConfigSchema,
  ResidentAuthConfigSchema,
  AudienceAuthConfigSchema,
} from "../domain/auth-config.js";

describe("ConsoleAuthConfigSchema", () => {
  const validConsoleConfig = {
    configVersion: 1,
    audience: "console" as const,
    allowedStrategies: ["OIDC" as const],
    mfaRequired: "ALWAYS" as const,
    sessionDurationMinutes: 60,
    refreshRotationEnabled: true,
    allowedEmailDomains: null,
    riskControls: {
      suspiciousLoginDetection: true,
      geoAnomalyDetection: false,
      deviceBindingEnabled: false,
      trustedDeviceExpiryDays: 30,
    },
  };

  it("accepts valid console config", () => {
    const result = ConsoleAuthConfigSchema.safeParse(validConsoleConfig);
    expect(result.success).toBe(true);
  });

  it("rejects console config without OIDC strategy", () => {
    const result = ConsoleAuthConfigSchema.safeParse({
      ...validConsoleConfig,
      allowedStrategies: ["PHONE_PASSWORD"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects session duration > 480 minutes", () => {
    const result = ConsoleAuthConfigSchema.safeParse({
      ...validConsoleConfig,
      sessionDurationMinutes: 999,
    });
    expect(result.success).toBe(false);
  });
});

describe("CommandAuthConfigSchema", () => {
  const validCommandConfig = {
    configVersion: 1,
    audience: "command" as const,
    allowedStrategies: ["OIDC" as const],
    mfaRequired: "ALWAYS" as const,
    sessionDurationMinutes: 30,
    ipAllowlist: null,
    stepUpRequiredForAllMutations: true as const,
  };

  it("accepts valid command config", () => {
    const result = CommandAuthConfigSchema.safeParse(validCommandConfig);
    expect(result.success).toBe(true);
  });

  it("rejects command config without mandatory MFA", () => {
    const result = CommandAuthConfigSchema.safeParse({
      ...validCommandConfig,
      mfaRequired: "CONDITIONAL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects command config without stepUpRequiredForAllMutations=true", () => {
    const result = CommandAuthConfigSchema.safeParse({
      ...validCommandConfig,
      stepUpRequiredForAllMutations: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects session duration > 60 minutes", () => {
    const result = CommandAuthConfigSchema.safeParse({
      ...validCommandConfig,
      sessionDurationMinutes: 120,
    });
    expect(result.success).toBe(false);
  });
});

describe("ResidentAuthConfigSchema", () => {
  const validResidentConfig = {
    configVersion: 1,
    audience: "resident" as const,
    allowedStrategies: ["PHONE_PASSWORD" as const],
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireDigit: true,
      requireSpecialChar: false,
      breachCheckEnabled: false,
    },
    mfaPolicy: {
      required: "CONDITIONAL" as const,
      allowedFactors: ["SMS_OTP" as const, "TOTP" as const],
      stepUpOnNewDevice: true,
      stepUpOnSuspiciousIp: true,
      stepUpOnHighRiskAction: true,
    },
    rateLimitPolicy: {
      maxAttemptsPerIp: 10,
      maxAttemptsPerPhone: 5,
      maxAttemptsPerDevice: 8,
      windowMinutes: 15,
    },
    lockoutPolicy: {
      maxFailedAttempts: 5,
      lockoutDurationMinutes: 15,
      progressiveMultiplier: 2,
    },
    sessionDurationMinutes: 720,
    riskControls: {
      suspiciousLoginDetection: true,
      geoAnomalyDetection: false,
      deviceBindingEnabled: false,
      trustedDeviceExpiryDays: 30,
    },
  };

  it("accepts valid resident config", () => {
    const result = ResidentAuthConfigSchema.safeParse(validResidentConfig);
    expect(result.success).toBe(true);
  });

  it("rejects resident config without PHONE_PASSWORD", () => {
    const result = ResidentAuthConfigSchema.safeParse({
      ...validResidentConfig,
      allowedStrategies: ["OIDC"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects password minLength < 12", () => {
    const result = ResidentAuthConfigSchema.safeParse({
      ...validResidentConfig,
      passwordPolicy: { ...validResidentConfig.passwordPolicy, minLength: 8 },
    });
    expect(result.success).toBe(false);
  });
});

describe("AudienceAuthConfigSchema (discriminated union)", () => {
  it("parses console config", () => {
    const result = AudienceAuthConfigSchema.safeParse({
      configVersion: 1,
      audience: "console",
      allowedStrategies: ["OIDC"],
      mfaRequired: "ALWAYS",
      sessionDurationMinutes: 60,
      refreshRotationEnabled: true,
      allowedEmailDomains: null,
      riskControls: {
        suspiciousLoginDetection: true,
        geoAnomalyDetection: false,
        deviceBindingEnabled: false,
        trustedDeviceExpiryDays: 30,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects config with unknown audience", () => {
    const result = AudienceAuthConfigSchema.safeParse({
      configVersion: 1,
      audience: "unknown",
    });
    expect(result.success).toBe(false);
  });
});
