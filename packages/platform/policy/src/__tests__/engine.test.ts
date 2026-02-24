import { describe, it, expect } from "vitest";
import { evaluate, matchActionPattern } from "../index.js";
import type { Actor, PolicyContext, PolicySet, Resource } from "../index.js";
import { Role } from "../index.js";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseContext: PolicyContext = {
  environment: "production",
  isSandbox: false,
  timestamp: new Date().toISOString(),
};

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    actorId: "actor-1",
    membershipId: "mem-1",
    clientId: "client-1",
    roles: [Role.OWNER],
    attributes: {},
    ...overrides,
  };
}

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    resourceType: "property",
    resourceId: "prop-1",
    clientId: "client-1",
    attributes: {},
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Policy Engine", () => {
  describe("RBAC: owner can do anything", () => {
    it("allows owner with a wildcard allow policy", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-owner-all",
            version: 1,
            actionPattern: "*.*",
            roles: [Role.OWNER],
            effect: "allow",
            priority: 10,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor({ roles: [Role.OWNER] }),
        "property.create",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(true);
      expect(decision.matchedPolicies).toContain("allow-owner-all");
    });
  });

  describe("RBAC: resident can only read own resources", () => {
    it("denies resident when no matching allow policy exists", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-owner-all",
            version: 1,
            actionPattern: "*.*",
            roles: [Role.OWNER],
            effect: "allow",
            priority: 10,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor({ roles: [Role.RESIDENT] }),
        "property.create",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(false);
    });

    it("allows resident to read own resources", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-resident-read",
            version: 1,
            actionPattern: "*.read",
            roles: [Role.RESIDENT],
            effect: "allow",
            priority: 20,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor({ roles: [Role.RESIDENT] }),
        "property.read",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(true);
    });
  });

  describe("deny overrides allow", () => {
    it("denies when deny has higher priority than allow", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-all",
            version: 1,
            actionPattern: "*.*",
            effect: "allow",
            priority: 20,
            isBaseline: false,
          },
          {
            policyId: "deny-delete",
            version: 1,
            actionPattern: "*.delete",
            effect: "deny",
            priority: 5,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor(),
        "property.delete",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(false);
      expect(decision.deniedReason).toContain("deny-delete");
    });
  });

  describe("baseline policies cannot be overridden by client policies", () => {
    it("baseline deny cannot be overridden by a client allow", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "baseline-deny-pii-export",
            version: 1,
            actionPattern: "pii.export",
            effect: "deny",
            priority: 100,
            isBaseline: true,
          },
          {
            policyId: "client-allow-pii-export",
            version: 1,
            actionPattern: "pii.export",
            effect: "allow",
            priority: 1,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor(),
        "pii.export",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(false);
      expect(decision.deniedReason).toContain("baseline");
      expect(decision.matchedPolicies).toContain("baseline-deny-pii-export");
    });
  });

  describe("obligations are collected from matching policies", () => {
    it("collects obligations from all matching allow policies", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-with-mfa",
            version: 1,
            actionPattern: "payment.*",
            effect: "allow",
            priority: 10,
            isBaseline: false,
            obligations: [{ type: "mfaRequired" }],
          },
          {
            policyId: "allow-with-audit",
            version: 1,
            actionPattern: "*.create",
            effect: "allow",
            priority: 20,
            isBaseline: false,
            obligations: [{ type: "auditLevel", params: { level: "high" } }],
          },
        ],
      };

      const decision = evaluate(
        makeActor(),
        "payment.create",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(true);
      expect(decision.obligations).toHaveLength(2);
      expect(decision.obligations.map((o) => o.type)).toContain("mfaRequired");
      expect(decision.obligations.map((o) => o.type)).toContain("auditLevel");
    });
  });

  describe("default deny when no matching policies", () => {
    it("denies when no policies match", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [],
      };

      const decision = evaluate(
        makeActor(),
        "property.create",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(false);
      expect(decision.deniedReason).toBeDefined();
    });

    it("denies when policies exist but none match the action", () => {
      const policySet: PolicySet = {
        clientId: "client-1",
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        policies: [
          {
            policyId: "allow-lease",
            version: 1,
            actionPattern: "lease.*",
            effect: "allow",
            priority: 10,
            isBaseline: false,
          },
        ],
      };

      const decision = evaluate(
        makeActor(),
        "property.create",
        makeResource(),
        baseContext,
        policySet,
      );

      expect(decision.allowed).toBe(false);
    });
  });

  describe("action pattern matching", () => {
    it("matches exact patterns", () => {
      expect(matchActionPattern("property.create", "property.create")).toBe(true);
    });

    it("matches wildcard in first segment", () => {
      expect(matchActionPattern("*.create", "property.create")).toBe(true);
      expect(matchActionPattern("*.create", "lease.create")).toBe(true);
    });

    it("matches wildcard in second segment", () => {
      expect(matchActionPattern("property.*", "property.create")).toBe(true);
      expect(matchActionPattern("property.*", "property.delete")).toBe(true);
    });

    it("matches full wildcard", () => {
      expect(matchActionPattern("*.*", "property.create")).toBe(true);
    });

    it("does not match different segment counts", () => {
      expect(matchActionPattern("*.create", "a.b.create")).toBe(false);
      expect(matchActionPattern("a.b.c", "a.b")).toBe(false);
    });

    it("does not match non-matching segments", () => {
      expect(matchActionPattern("property.create", "lease.create")).toBe(false);
    });
  });
});
