import type {
  Actor,
  Obligation,
  PolicyContext,
  PolicyDecision,
  PolicyRule,
  PolicySet,
  Resource,
} from "./types.js";
import { matchActionPattern, matchCondition } from "./matchers.js";

/**
 * Evaluates an access request against a policy set and returns a decision.
 *
 * Algorithm:
 * 1. Sort policies by priority (lower number = higher priority).
 * 2. Filter to policies whose action pattern matches the requested action.
 * 3. Filter to policies whose role constraint (if any) includes the actor.
 * 4. Evaluate attribute conditions.
 * 5. Baseline deny policies (isBaseline: true) cannot be overridden by client allow policies.
 * 6. Collect obligations from all matching allow policies.
 * 7. Default deny when no matching allow policy is found.
 */
export function evaluate(
  actor: Actor,
  action: string,
  resource: Resource,
  context: PolicyContext,
  policySet: PolicySet,
): PolicyDecision {
  const sorted = [...policySet.policies].sort(
    (a, b) => a.priority - b.priority,
  );

  const matched = sorted.filter((rule) => matches(rule, actor, action, resource, context));

  if (matched.length === 0) {
    return {
      allowed: false,
      obligations: [],
      deniedReason: "No matching policy found",
      matchedPolicies: [],
    };
  }

  // Baseline deny policies cannot be overridden
  const baselineDeny = matched.find(
    (r) => r.effect === "deny" && r.isBaseline,
  );
  if (baselineDeny) {
    return {
      allowed: false,
      obligations: [],
      deniedReason: `Denied by baseline policy: ${baselineDeny.policyId}`,
      matchedPolicies: [baselineDeny.policyId],
    };
  }

  // Non-baseline deny with highest priority wins over allow at same or lower priority
  const highestDeny = matched.find((r) => r.effect === "deny");
  const highestAllow = matched.find((r) => r.effect === "allow");

  if (highestDeny && (!highestAllow || highestDeny.priority <= highestAllow.priority)) {
    return {
      allowed: false,
      obligations: [],
      deniedReason: `Denied by policy: ${highestDeny.policyId}`,
      matchedPolicies: [highestDeny.policyId],
    };
  }

  if (!highestAllow) {
    return {
      allowed: false,
      obligations: [],
      deniedReason: "No matching allow policy found",
      matchedPolicies: matched.map((r) => r.policyId),
    };
  }

  // Collect obligations from all matching allow policies
  const obligations: Obligation[] = [];
  const matchedPolicyIds: string[] = [];

  for (const rule of matched) {
    if (rule.effect === "allow") {
      matchedPolicyIds.push(rule.policyId);
      if (rule.obligations) {
        obligations.push(...(rule.obligations as Obligation[]));
      }
    }
  }

  return {
    allowed: true,
    obligations,
    matchedPolicies: matchedPolicyIds,
  };
}

function matches(
  rule: PolicyRule,
  actor: Actor,
  action: string,
  resource: Resource,
  context: PolicyContext,
): boolean {
  if (!matchActionPattern(rule.actionPattern, action)) {
    return false;
  }

  if (rule.roles && rule.roles.length > 0) {
    const hasRole = rule.roles.some((role) => actor.roles.includes(role));
    if (!hasRole) {
      return false;
    }
  }

  if (rule.conditions && rule.conditions.length > 0) {
    const allConditionsMet = rule.conditions.every((condition) =>
      matchCondition(condition, actor, resource, context as unknown as Record<string, unknown>),
    );
    if (!allConditionsMet) {
      return false;
    }
  }

  return true;
}
