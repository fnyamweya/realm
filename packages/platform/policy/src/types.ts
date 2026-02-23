import { z } from "zod";

// ─── Role Enum ───────────────────────────────────────────────────────────────

export const Role = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  TEAM_MEMBER: "TEAM_MEMBER",
  RESIDENT: "RESIDENT",
  SERVICE_PRO: "SERVICE_PRO",
  ACCOUNTANT: "ACCOUNTANT",
  SUPPORT_ADMIN: "SUPPORT_ADMIN",
  INTEGRATION: "INTEGRATION",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

// ─── Core Interfaces ─────────────────────────────────────────────────────────

export interface Actor {
  actorId: string;
  membershipId: string;
  clientId: string;
  roles: Role[];
  attributes: Record<string, string | boolean | number>;
}

export interface Resource {
  resourceType: string;
  resourceId: string;
  clientId: string;
  attributes: Record<string, string | boolean | number>;
}

/** Dot-delimited action identifier, e.g. 'property.create', 'lease.approve' */
export type Action = string;

export interface PolicyContext {
  environment: "uat" | "production";
  isSandbox: boolean;
  timestamp: string;
  ipAddress?: string;
}

// ─── Obligations & Decisions ─────────────────────────────────────────────────

export interface Obligation {
  type:
    | "mfaRequired"
    | "reasonRequired"
    | "auditLevel"
    | "makerCheckerRequired"
    | "masking";
  params?: Record<string, unknown>;
}

export interface PolicyDecision {
  allowed: boolean;
  obligations: Obligation[];
  deniedReason?: string;
  matchedPolicies: string[];
}

// ─── Policy Rule & Set (Zod Schemas) ─────────────────────────────────────────

export const ConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "neq", "in", "contains"]),
  value: z.unknown(),
});

export type Condition = z.infer<typeof ConditionSchema>;

export const ObligationSchema = z.object({
  type: z.enum([
    "mfaRequired",
    "reasonRequired",
    "auditLevel",
    "makerCheckerRequired",
    "masking",
  ]),
  params: z.record(z.unknown()).optional(),
});

export const PolicyRuleSchema = z.object({
  policyId: z.string(),
  version: z.number(),
  actionPattern: z.string(),
  roles: z
    .array(
      z.enum([
        "OWNER",
        "MANAGER",
        "TEAM_MEMBER",
        "RESIDENT",
        "SERVICE_PRO",
        "ACCOUNTANT",
        "SUPPORT_ADMIN",
        "INTEGRATION",
      ]),
    )
    .optional(),
  conditions: z.array(ConditionSchema).optional(),
  effect: z.enum(["allow", "deny"]),
  obligations: z.array(ObligationSchema).optional(),
  priority: z.number(),
  isBaseline: z.boolean(),
});

export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export const PolicySetSchema = z.object({
  clientId: z.string(),
  policies: z.array(PolicyRuleSchema),
  schemaVersion: z.number(),
  updatedAt: z.string(),
});

export type PolicySet = z.infer<typeof PolicySetSchema>;
