import { describe, expect, it } from "vitest";
import { RiskLevel, SensitiveActionSchema, assessRisk } from "../risk.js";

describe("assessRisk", () => {
  it("returns LOW for sandbox clients regardless of action", () => {
    expect(
      assessRisk("delete_tenant", { role: "admin", clientSandbox: true }),
    ).toBe(RiskLevel.LOW);
  });

  it("returns CRITICAL for critical actions", () => {
    expect(
      assessRisk("delete_tenant", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.CRITICAL);
    expect(
      assessRisk("rotate_master_key", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.CRITICAL);
    expect(
      assessRisk("export_all_data", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.CRITICAL);
  });

  it("returns HIGH for high-risk actions", () => {
    expect(
      assessRisk("modify_permissions", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.HIGH);
    expect(
      assessRisk("create_api_key", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.HIGH);
  });

  it("returns MEDIUM for medium-risk actions", () => {
    expect(
      assessRisk("update_config", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.MEDIUM);
    expect(
      assessRisk("invite_user", { role: "user", clientSandbox: false }),
    ).toBe(RiskLevel.MEDIUM);
  });

  it("returns MEDIUM for admin role with unknown actions", () => {
    expect(
      assessRisk("some_unknown_action", { role: "admin", clientSandbox: false }),
    ).toBe(RiskLevel.MEDIUM);
  });

  it("returns LOW for non-admin with unknown actions", () => {
    expect(
      assessRisk("read_dashboard", { role: "viewer", clientSandbox: false }),
    ).toBe(RiskLevel.LOW);
  });
});

describe("SensitiveActionSchema", () => {
  it("accepts a valid sensitive action", () => {
    const result = SensitiveActionSchema.safeParse({
      actionType: "delete_tenant",
      riskLevel: RiskLevel.CRITICAL,
      requiresMfa: true,
      requiresMakerChecker: true,
      requiresReason: true,
      auditLevel: "tamper_resistant",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid risk level", () => {
    const result = SensitiveActionSchema.safeParse({
      actionType: "test",
      riskLevel: "INVALID",
      requiresMfa: false,
      requiresMakerChecker: false,
      requiresReason: false,
      auditLevel: "standard",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid audit level", () => {
    const result = SensitiveActionSchema.safeParse({
      actionType: "test",
      riskLevel: RiskLevel.LOW,
      requiresMfa: false,
      requiresMakerChecker: false,
      requiresReason: false,
      auditLevel: "none",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty actionType", () => {
    const result = SensitiveActionSchema.safeParse({
      actionType: "",
      riskLevel: RiskLevel.LOW,
      requiresMfa: false,
      requiresMakerChecker: false,
      requiresReason: false,
      auditLevel: "standard",
    });
    expect(result.success).toBe(false);
  });
});
