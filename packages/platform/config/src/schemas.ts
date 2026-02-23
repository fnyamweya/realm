import { z } from "zod";

export enum ConfigKind {
  PLATFORM_CATALOG = "PLATFORM_CATALOG",
  CLIENT_CONFIG = "CLIENT_CONFIG",
  AUTH_SECURITY_PROFILE = "AUTH_SECURITY_PROFILE",
  AUTHORIZATION_POLICY = "AUTHORIZATION_POLICY",
  MAKER_CHECKER_POLICY = "MAKER_CHECKER_POLICY",
  PRICING_RULES = "PRICING_RULES",
  INTEGRATION_CONFIG = "INTEGRATION_CONFIG",
}

export const ClientConfigSchema = z.object({
  clientId: z.string(),
  clientName: z.string(),
  isSandbox: z.boolean(),
  features: z.record(z.string(), z.boolean()),
  branding: z.object({
    primaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }),
  retentionDays: z.number(),
  timezone: z.string(),
  currency: z.string(),
  countryCode: z.string(),
  schemaVersion: z.number(),
});

export type ClientConfig = z.infer<typeof ClientConfigSchema>;

export const AuthSecurityProfileSchema = z.object({
  mfaRequired: z.boolean(),
  sessionDurationMinutes: z.number(),
  passwordMinLength: z.number(),
  outboundAllowlist: z
    .object({
      emails: z.array(z.string()),
      domains: z.array(z.string()),
      webhookUrls: z.array(z.string()),
    })
    .optional(),
  schemaVersion: z.number(),
});

export type AuthSecurityProfile = z.infer<typeof AuthSecurityProfileSchema>;

export const EnvironmentConfigSchema = z.object({
  environment: z.enum(["uat", "production"]),
  workerUrl: z.string(),
  d1DatabaseId: z.string(),
  r2BucketName: z.string(),
  kvNamespaceId: z.string(),
  queueName: z.string(),
});

export type EnvironmentConfig = z.infer<typeof EnvironmentConfigSchema>;

export function validateEnvironmentConfig(
  data: unknown,
): EnvironmentConfig {
  return EnvironmentConfigSchema.parse(data);
}
