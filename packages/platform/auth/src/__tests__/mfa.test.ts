import { describe, it, expect } from "vitest";
import { requireStepUp, MfaChallengeSchema, MfaMethod } from "../mfa.js";
import type { Session } from "../session.js";

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    sessionId: "sess-001",
    userId: "user-123",
    clientId: "client-456",
    membershipId: "mem-789",
    roles: ["admin"],
    mfaVerified: false,
    createdAt: "2025-01-01T00:00:00Z",
    expiresAt: "2025-01-01T01:00:00Z",
    lastActivityAt: "2025-01-01T00:30:00Z",
    ...overrides,
  };
}

describe("requireStepUp", () => {
  it("returns true for sensitive action when MFA not verified", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "delete_account")).toBe(true);
  });

  it("returns false for sensitive action when MFA already verified", () => {
    const session = makeSession({ mfaVerified: true });
    expect(requireStepUp(session, "delete_account")).toBe(false);
  });

  it("returns false for non-sensitive action even without MFA", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "view_dashboard")).toBe(false);
  });

  it("requires step-up for change_password", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "change_password")).toBe(true);
  });

  it("requires step-up for manage_api_keys", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "manage_api_keys")).toBe(true);
  });

  it("requires step-up for update_security_profile", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "update_security_profile")).toBe(true);
  });

  it("requires step-up for export_data", () => {
    const session = makeSession({ mfaVerified: false });
    expect(requireStepUp(session, "export_data")).toBe(true);
  });
});

describe("MfaChallengeSchema", () => {
  it("accepts a valid MFA challenge", () => {
    const result = MfaChallengeSchema.safeParse({
      challengeId: "chal-001",
      userId: "user-123",
      method: MfaMethod.TOTP,
      expiresAt: "2025-01-01T01:00:00Z",
      verified: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects challenge with invalid method", () => {
    const result = MfaChallengeSchema.safeParse({
      challengeId: "chal-001",
      userId: "user-123",
      method: "CARRIER_PIGEON",
      expiresAt: "2025-01-01T01:00:00Z",
      verified: false,
    });
    expect(result.success).toBe(false);
  });
});
