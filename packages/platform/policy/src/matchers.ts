import type { Condition } from "./types.js";

/**
 * Matches a dot-delimited action string against a glob-like pattern.
 * Supports `*` as a single-segment wildcard and `**` is not used —
 * `*` matches any single segment (e.g. `*.create` matches `property.create`).
 */
export function matchActionPattern(pattern: string, action: string): boolean {
  const patternParts = pattern.split(".");
  const actionParts = action.split(".");

  if (patternParts.length !== actionParts.length) {
    return false;
  }

  return patternParts.every(
    (part, i) => part === "*" || part === actionParts[i],
  );
}

/**
 * Evaluates a single condition against the actor, resource, and context.
 * Field paths are resolved as `actor.<field>`, `resource.<field>`, or `context.<field>`.
 */
export function matchCondition(
  condition: Condition,
  actor: { attributes: Record<string, string | boolean | number> },
  resource: {
    resourceType: string;
    resourceId: string;
    clientId: string;
    attributes: Record<string, string | boolean | number>;
  },
  context: Record<string, unknown>,
): boolean {
  const fieldValue = resolveField(condition.field, actor, resource, context);

  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;
    case "neq":
      return fieldValue !== condition.value;
    case "in":
      if (Array.isArray(condition.value)) {
        return condition.value.includes(fieldValue);
      }
      return false;
    case "contains":
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(condition.value);
      }
      if (typeof fieldValue === "string" && typeof condition.value === "string") {
        return fieldValue.includes(condition.value);
      }
      return false;
    default:
      return false;
  }
}

function resolveField(
  field: string,
  actor: { attributes: Record<string, string | boolean | number> },
  resource: {
    resourceType: string;
    resourceId: string;
    clientId: string;
    attributes: Record<string, string | boolean | number>;
  },
  context: Record<string, unknown>,
): unknown {
  const [scope, ...rest] = field.split(".");
  const key = rest.join(".");

  switch (scope) {
    case "actor":
      return actor.attributes[key];
    case "resource": {
      const resourceMap: Record<string, unknown> = {
        resourceType: resource.resourceType,
        resourceId: resource.resourceId,
        clientId: resource.clientId,
      };
      if (key in resourceMap) {
        return resourceMap[key];
      }
      return resource.attributes[key];
    }
    case "context":
      return context[key];
    default:
      return undefined;
  }
}
