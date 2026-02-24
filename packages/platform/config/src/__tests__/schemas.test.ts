import { describe, it, expect } from "vitest";
import {
  ClientConfigSchema,
  AuthSecurityProfileSchema,
  EnvironmentConfigSchema,
  validateEnvironmentConfig,
} from "../schemas.js";

describe("ClientConfigSchema", () => {
  const validClientConfig = {
    clientId: "client-1",
    clientName: "Acme Realty",
    isSandbox: false,
    features: { listings: true, crm: false },
    branding: { primaryColor: "#ff0000", logoUrl: "https://example.com/logo.png" },
    retentionDays: 365,
    timezone: "America/New_York",
    currency: "USD",
    countryCode: "US",
    schemaVersion: 1,
  };

  it("accepts valid client config", () => {
    const result = ClientConfigSchema.safeParse(validClientConfig);
    expect(result.success).toBe(true);
  });

  it("accepts client config with optional branding fields omitted", () => {
    const data = { ...validClientConfig, branding: {} };
    const result = ClientConfigSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects client config missing required fields", () => {
    const { clientId: _, ...incomplete } = validClientConfig;
    const result = ClientConfigSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects client config with wrong types", () => {
    const result = ClientConfigSchema.safeParse({
      ...validClientConfig,
      isSandbox: "yes",
    });
    expect(result.success).toBe(false);
  });
});

describe("AuthSecurityProfileSchema", () => {
  const validProfile = {
    mfaRequired: true,
    sessionDurationMinutes: 30,
    passwordMinLength: 12,
    schemaVersion: 1,
  };

  it("accepts valid auth security profile", () => {
    const result = AuthSecurityProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("accepts profile with optional outboundAllowlist", () => {
    const result = AuthSecurityProfileSchema.safeParse({
      ...validProfile,
      outboundAllowlist: {
        emails: ["admin@example.com"],
        domains: ["example.com"],
        webhookUrls: ["https://hook.example.com"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects profile with missing required fields", () => {
    const result = AuthSecurityProfileSchema.safeParse({
      mfaRequired: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects profile with invalid types", () => {
    const result = AuthSecurityProfileSchema.safeParse({
      ...validProfile,
      mfaRequired: "true",
    });
    expect(result.success).toBe(false);
  });
});

describe("EnvironmentConfigSchema", () => {
  const validEnvConfig = {
    environment: "production" as const,
    workerUrl: "https://worker.example.com",
    d1DatabaseId: "db-123",
    r2BucketName: "my-bucket",
    kvNamespaceId: "kv-456",
    queueName: "task-queue",
  };

  it("accepts valid environment config", () => {
    const result = EnvironmentConfigSchema.safeParse(validEnvConfig);
    expect(result.success).toBe(true);
  });

  it("accepts uat environment", () => {
    const result = EnvironmentConfigSchema.safeParse({
      ...validEnvConfig,
      environment: "uat",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid environment value", () => {
    const result = EnvironmentConfigSchema.safeParse({
      ...validEnvConfig,
      environment: "staging",
    });
    expect(result.success).toBe(false);
  });

  it("validates env config via helper function", () => {
    const config = validateEnvironmentConfig(validEnvConfig);
    expect(config.environment).toBe("production");
  });

  it("throws on invalid data via helper function", () => {
    expect(() => validateEnvironmentConfig({ environment: "bad" })).toThrow();
  });
});
