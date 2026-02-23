import { z } from "zod";

export interface SandboxConfig {
  readonly isSandbox: boolean;
  readonly outboundAllowlist: {
    readonly emails: readonly string[];
    readonly domains: readonly string[];
    readonly webhookUrls: readonly string[];
    readonly smsNumbers: readonly string[];
  };
  readonly piiMinimization: boolean;
  readonly documentWatermark: string;
  readonly retentionDays: number;
  readonly autoResetEnabled: boolean;
}

export const SandboxConfigSchema = z
  .object({
    isSandbox: z.boolean(),
    outboundAllowlist: z
      .object({
        emails: z.array(z.string()),
        domains: z.array(z.string()),
        webhookUrls: z.array(z.string().url()),
        smsNumbers: z.array(z.string()),
      })
      .strict(),
    piiMinimization: z.boolean(),
    documentWatermark: z.string(),
    retentionDays: z.number().int().positive(),
    autoResetEnabled: z.boolean(),
  })
  .strict();

export function validateOutboundTarget(
  config: SandboxConfig,
  targetType: "email" | "sms" | "webhook",
  target: string,
): { allowed: boolean; reason?: string } {
  if (!config.isSandbox) {
    return { allowed: true };
  }

  switch (targetType) {
    case "email": {
      const domain = target.split("@")[1];
      if (
        config.outboundAllowlist.emails.includes(target) ||
        (domain !== undefined &&
          config.outboundAllowlist.domains.includes(domain))
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Email "${target}" is not in the sandbox allowlist`,
      };
    }
    case "sms": {
      if (config.outboundAllowlist.smsNumbers.includes(target)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `SMS number "${target}" is not in the sandbox allowlist`,
      };
    }
    case "webhook": {
      if (config.outboundAllowlist.webhookUrls.includes(target)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: `Webhook URL "${target}" is not in the sandbox allowlist`,
      };
    }
  }
}

export function generateWatermarkText(clientId: string): string {
  return `SANDBOX/UAT • ${clientId} • ${new Date().toISOString()}`;
}

export function isSandboxClient(config: { isSandbox?: boolean }): boolean {
  return config.isSandbox === true;
}
