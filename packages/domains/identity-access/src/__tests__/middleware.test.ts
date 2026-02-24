import { describe, it, expect } from "vitest";
import {
  ActorContextSchema,
  hasClientSelected,
  meetsRequiredMfaLevel,
} from "../domain/actor-context.js";
import { enforceAudience, enforceClientSelection, mapPolicyObligations } from "../domain/middleware.js";
import type { ActorContext } from "../domain/actor-context.js";
import type { Audience } from "../domain/value-objects.js";

function makeActorContext(overrides: Partial<ActorContext> = {}): ActorContext {
  return {
    actorType: "USER",
    userId: "usr_01TESTUSER0000000000000000",
    membershipId: "mem_01TESTMEMBER000000000000000",
    clientId: "cli_01TESTCLIENT000000000000000",
    roles: ["RESIDENT"],
    scopes: [],
    auth: {
      audience: "resident",
      authMethod: "password_phone",
      mfaLevel: "NONE",
      mfaLevelExpiresAt: null,
      authTime: "2025-01-01T00:00:00Z",
      sessionId: "ses_01TESTSESSION00000000000000",
    },
    risk: {
      ipHash: "abc123",
      deviceId: null,
      userAgentHash: "ua123",
      riskScore: null,
    },
    correlationId: "cor_01TESTCORRELATION000000000",
    ...overrides,
  };
}

// ─── ActorContext Schema Tests ────────────────────────────────────────────────

describe("ActorContextSchema", () => {
  it("accepts a valid actor context", () => {
    const ctx = makeActorContext();
    const result = ActorContextSchema.safeParse(ctx);
    expect(result.success).toBe(true);
  });

  it("rejects context with invalid audience", () => {
    const ctx = makeActorContext();
    (ctx.auth as Record<string, unknown>).audience = "invalid";
    const result = ActorContextSchema.safeParse(ctx);
    expect(result.success).toBe(false);
  });

  it("rejects context with invalid actor type", () => {
    const ctx = makeActorContext();
    (ctx as Record<string, unknown>).actorType = "HACKER";
    const result = ActorContextSchema.safeParse(ctx);
    expect(result.success).toBe(false);
  });
});

// ─── Audience Enforcement Tests ──────────────────────────────────────────────

describe("enforceAudience", () => {
  it("allows matching audience", () => {
    const result = enforceAudience("console", ["console", "command"]);
    expect(result).toBeNull();
  });

  it("rejects mismatched audience", () => {
    const result = enforceAudience("resident", ["console"]);
    expect(result).toBe("AUTH_AUDIENCE_MISMATCH");
  });

  it("rejects portal token for console routes", () => {
    const result = enforceAudience("resident", ["console"]);
    expect(result).toBe("AUTH_AUDIENCE_MISMATCH");
  });

  it("rejects console token for command routes", () => {
    const result = enforceAudience("console", ["command"]);
    expect(result).toBe("AUTH_AUDIENCE_MISMATCH");
  });

  it("rejects console token for resident routes", () => {
    const result = enforceAudience("console", ["resident"]);
    expect(result).toBe("AUTH_AUDIENCE_MISMATCH");
  });

  it("allows service audience for service routes", () => {
    const result = enforceAudience("service", ["service"]);
    expect(result).toBeNull();
  });
});

// ─── Cross-Audience Rejection Tests ──────────────────────────────────────────

describe("cross-audience token rejection", () => {
  const audiences: Audience[] = ["console", "resident", "command", "service"];

  for (const tokenAudience of audiences) {
    for (const routeAudience of audiences) {
      if (tokenAudience !== routeAudience) {
        it(`rejects ${tokenAudience} token on ${routeAudience} route`, () => {
          const result = enforceAudience(tokenAudience, [routeAudience]);
          expect(result).toBe("AUTH_AUDIENCE_MISMATCH");
        });
      }
    }
  }
});

// ─── Client Selection Tests ──────────────────────────────────────────────────

describe("enforceClientSelection", () => {
  it("returns null when client is selected and required", () => {
    const ctx = makeActorContext({ clientId: "cli_01TESTCLIENT000000000000000" });
    const result = enforceClientSelection(ctx, true);
    expect(result).toBeNull();
  });

  it("returns SELECT_CLIENT obligation when no client and required", () => {
    const ctx = makeActorContext({ clientId: null });
    const result = enforceClientSelection(ctx, true);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("SELECT_CLIENT");
  });

  it("returns null when client not required even if null", () => {
    const ctx = makeActorContext({ clientId: null });
    const result = enforceClientSelection(ctx, false);
    expect(result).toBeNull();
  });
});

// ─── hasClientSelected Tests ─────────────────────────────────────────────────

describe("hasClientSelected", () => {
  it("returns true when clientId is set", () => {
    const ctx = makeActorContext({ clientId: "cli_01TESTCLIENT000000000000000" });
    expect(hasClientSelected(ctx)).toBe(true);
  });

  it("returns false when clientId is null", () => {
    const ctx = makeActorContext({ clientId: null });
    expect(hasClientSelected(ctx)).toBe(false);
  });
});

// ─── MFA Level Tests ─────────────────────────────────────────────────────────

describe("meetsRequiredMfaLevel", () => {
  it("STRONG meets STRONG requirement", () => {
    expect(meetsRequiredMfaLevel("STRONG", "STRONG", null)).toBe(true);
  });

  it("NONE does not meet STEP_UP requirement", () => {
    expect(meetsRequiredMfaLevel("NONE", "STEP_UP", null)).toBe(false);
  });

  it("NONE does not meet STRONG requirement", () => {
    expect(meetsRequiredMfaLevel("NONE", "STRONG", null)).toBe(false);
  });

  it("STEP_UP meets STEP_UP requirement", () => {
    expect(meetsRequiredMfaLevel("STEP_UP", "STEP_UP", null)).toBe(true);
  });

  it("STRONG meets STEP_UP requirement", () => {
    expect(meetsRequiredMfaLevel("STRONG", "STEP_UP", null)).toBe(true);
  });

  it("NONE meets NONE requirement", () => {
    expect(meetsRequiredMfaLevel("NONE", "NONE", null)).toBe(true);
  });

  it("expired STEP_UP does not meet STEP_UP requirement", () => {
    const pastDate = "2020-01-01T00:00:00Z";
    expect(meetsRequiredMfaLevel("STEP_UP", "STEP_UP", pastDate)).toBe(false);
  });

  it("non-expired STRONG meets STRONG requirement", () => {
    const futureDate = "2099-01-01T00:00:00Z";
    expect(meetsRequiredMfaLevel("STRONG", "STRONG", futureDate)).toBe(true);
  });
});

// ─── Policy Obligation Mapping Tests ─────────────────────────────────────────

describe("mapPolicyObligations", () => {
  it("maps mfaRequired obligation", () => {
    const obligations = mapPolicyObligations([
      { type: "mfaRequired", params: { level: "STRONG", expiresInSeconds: 300 } },
    ]);
    expect(obligations).toHaveLength(1);
    expect(obligations[0]!.type).toBe("MFA_STEP_UP_REQUIRED");
    expect(obligations[0]!.level).toBe("STRONG");
  });

  it("maps makerCheckerRequired obligation", () => {
    const obligations = mapPolicyObligations([
      { type: "makerCheckerRequired", params: { actionType: "api_key.create" } },
    ]);
    expect(obligations).toHaveLength(1);
    expect(obligations[0]!.type).toBe("MAKER_CHECKER_REQUIRED");
  });

  it("maps reasonRequired obligation", () => {
    const obligations = mapPolicyObligations([{ type: "reasonRequired" }]);
    expect(obligations).toHaveLength(1);
    expect(obligations[0]!.type).toBe("REASON_REQUIRED");
  });

  it("maps multiple obligations", () => {
    const obligations = mapPolicyObligations([
      { type: "mfaRequired" },
      { type: "reasonRequired" },
    ]);
    expect(obligations).toHaveLength(2);
  });

  it("ignores unknown obligation types", () => {
    const obligations = mapPolicyObligations([
      { type: "auditLevel" },
      { type: "masking" },
    ]);
    expect(obligations).toHaveLength(0);
  });
});
