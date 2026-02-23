import { z } from "zod";

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export const SensitiveActionSchema = z
  .object({
    actionType: z.string().min(1),
    riskLevel: z.nativeEnum(RiskLevel),
    requiresMfa: z.boolean(),
    requiresMakerChecker: z.boolean(),
    requiresReason: z.boolean(),
    auditLevel: z.enum(["standard", "enhanced", "tamper_resistant"]),
  })
  .readonly();

export type SensitiveAction = z.infer<typeof SensitiveActionSchema>;

export function assessRisk(
  action: string,
  context: { role: string; clientSandbox: boolean },
): RiskLevel {
  if (context.clientSandbox) {
    return RiskLevel.LOW;
  }

  const criticalActions = [
    "delete_tenant",
    "rotate_master_key",
    "export_all_data",
  ];
  if (criticalActions.includes(action)) {
    return RiskLevel.CRITICAL;
  }

  const highActions = [
    "modify_permissions",
    "create_api_key",
    "change_billing",
  ];
  if (highActions.includes(action)) {
    return RiskLevel.HIGH;
  }

  const mediumActions = ["update_config", "invite_user", "enable_feature"];
  if (mediumActions.includes(action)) {
    return RiskLevel.MEDIUM;
  }

  if (context.role === "admin") {
    return RiskLevel.MEDIUM;
  }

  return RiskLevel.LOW;
}
