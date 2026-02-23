import { describe, it, expect } from "vitest";
import { SessionSchema } from "../session.js";

describe("SessionSchema", () => {
  const validSession = {
    sessionId: "sess-001",
    userId: "user-123",
    clientId: "client-456",
    membershipId: "mem-789",
    roles: ["admin", "viewer"],
    mfaVerified: true,
    createdAt: "2025-01-01T00:00:00Z",
    expiresAt: "2025-01-01T01:00:00Z",
    lastActivityAt: "2025-01-01T00:30:00Z",
  };

  it("accepts a valid session", () => {
    const result = SessionSchema.safeParse(validSession);
    expect(result.success).toBe(true);
  });

  it("accepts session with empty roles", () => {
    const result = SessionSchema.safeParse({ ...validSession, roles: [] });
    expect(result.success).toBe(true);
  });

  it("rejects session missing sessionId", () => {
    const { sessionId: _, ...incomplete } = validSession;
    const result = SessionSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it("rejects session with wrong type for mfaVerified", () => {
    const result = SessionSchema.safeParse({
      ...validSession,
      mfaVerified: "yes",
    });
    expect(result.success).toBe(false);
  });

  it("rejects session with non-array roles", () => {
    const result = SessionSchema.safeParse({
      ...validSession,
      roles: "admin",
    });
    expect(result.success).toBe(false);
  });
});
