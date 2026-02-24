import { describe, it, expect } from "vitest";
import {
  UserSchema,
  UserIdentitySchema,
  MembershipSchema,
  SessionEntitySchema,
  PasswordCredentialSchema,
  MfaFactorSchema,
  MfaChallengeEntitySchema,
  ServiceAccountSchema,
  ApiKeyEntitySchema,
  AuditEventSchema,
  AuthRateLimitSchema,
} from "../domain/entities.js";

describe("UserSchema", () => {
  it("accepts valid user", () => {
    const result = UserSchema.safeParse({
      id: "usr_01TESTUSER0000000000000000",
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = UserSchema.safeParse({
      id: "usr_01",
      status: "BANNED",
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(false);
  });
});

describe("UserIdentitySchema", () => {
  it("accepts valid phone identity", () => {
    const result = UserIdentitySchema.safeParse({
      id: "uid_01TEST",
      userId: "usr_01TEST",
      identityType: "PHONE",
      normalizedValue: "+1234567890",
      provider: null,
      verifiedAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts OIDC_SUB identity with provider", () => {
    const result = UserIdentitySchema.safeParse({
      id: "uid_02TEST",
      userId: "usr_01TEST",
      identityType: "OIDC_SUB",
      normalizedValue: "google|12345",
      provider: "google",
      verifiedAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid identity type", () => {
    const result = UserIdentitySchema.safeParse({
      id: "uid_01",
      userId: "usr_01",
      identityType: "TWITTER",
      normalizedValue: "@user",
      provider: null,
      verifiedAt: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("MembershipSchema", () => {
  it("accepts valid membership", () => {
    const result = MembershipSchema.safeParse({
      id: "mem_01TEST",
      userId: "usr_01TEST",
      clientId: "cli_01TEST",
      status: "ACTIVE",
      rolesJson: '["RESIDENT"]',
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("SessionEntitySchema", () => {
  it("accepts valid session", () => {
    const result = SessionEntitySchema.safeParse({
      id: "ses_01TEST",
      userId: "usr_01TEST",
      activeClientId: "cli_01TEST",
      audience: "resident",
      authMethod: "password_phone",
      mfaLevel: "NONE",
      mfaLevelExpiresAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      lastSeenAt: "2025-01-01T00:00:00Z",
      expiresAt: "2025-01-02T00:00:00Z",
      revokedAt: null,
      ipHash: "abc123",
      deviceHash: null,
      userAgentHash: "ua_hash",
      refreshTokenHash: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid audience", () => {
    const result = SessionEntitySchema.safeParse({
      id: "ses_01TEST",
      userId: "usr_01TEST",
      activeClientId: null,
      audience: "admin",
      authMethod: "oidc",
      mfaLevel: "NONE",
      mfaLevelExpiresAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      lastSeenAt: "2025-01-01T00:00:00Z",
      expiresAt: "2025-01-02T00:00:00Z",
      revokedAt: null,
      ipHash: null,
      deviceHash: null,
      userAgentHash: null,
      refreshTokenHash: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid auth method", () => {
    const result = SessionEntitySchema.safeParse({
      id: "ses_01TEST",
      userId: "usr_01TEST",
      activeClientId: null,
      audience: "console",
      authMethod: "basic",
      mfaLevel: "NONE",
      mfaLevelExpiresAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      lastSeenAt: "2025-01-01T00:00:00Z",
      expiresAt: "2025-01-02T00:00:00Z",
      revokedAt: null,
      ipHash: null,
      deviceHash: null,
      userAgentHash: null,
      refreshTokenHash: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("PasswordCredentialSchema", () => {
  it("accepts valid credential", () => {
    const result = PasswordCredentialSchema.safeParse({
      userId: "usr_01TEST",
      passwordHash: "$argon2id$v=19$m=65536...",
      passwordUpdatedAt: "2025-01-01T00:00:00Z",
      failedAttempts: 0,
      lockoutUntil: null,
      lastFailedAt: null,
      breachCheckedAt: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("MfaFactorSchema", () => {
  it("accepts TOTP factor", () => {
    const result = MfaFactorSchema.safeParse({
      id: "mfa_01TEST",
      userId: "usr_01TEST",
      factorType: "TOTP",
      encryptedSecret: "enc:...",
      publicKeyJson: null,
      phoneNumberRef: null,
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid factor type", () => {
    const result = MfaFactorSchema.safeParse({
      id: "mfa_01TEST",
      userId: "usr_01TEST",
      factorType: "CARRIER_PIGEON",
      encryptedSecret: null,
      publicKeyJson: null,
      phoneNumberRef: null,
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("MfaChallengeEntitySchema", () => {
  it("accepts valid challenge", () => {
    const result = MfaChallengeEntitySchema.safeParse({
      id: "mch_01TEST",
      userId: "usr_01TEST",
      sessionId: "ses_01TEST",
      challengeType: "STEP_UP",
      deliveryChannel: "APP",
      codeHash: "sha256:...",
      expiresAt: "2025-01-01T01:00:00Z",
      attempts: 0,
      status: "PENDING",
    });
    expect(result.success).toBe(true);
  });
});

describe("ServiceAccountSchema", () => {
  it("accepts valid service account", () => {
    const result = ServiceAccountSchema.safeParse({
      id: "svc_01TEST",
      clientId: "cli_01TEST",
      name: "API Integration",
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("ApiKeyEntitySchema", () => {
  it("accepts valid API key", () => {
    const result = ApiKeyEntitySchema.safeParse({
      id: "apk_01TEST",
      clientId: "cli_01TEST",
      serviceAccountId: "svc_01TEST",
      keyPrefix: "rk_live_abc",
      keyHash: "sha256:...",
      scopesJson: '["read:properties"]',
      allowedIpsJson: null,
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
      revokedAt: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid API key status", () => {
    const result = ApiKeyEntitySchema.safeParse({
      id: "apk_01",
      clientId: "cli_01",
      serviceAccountId: "svc_01",
      keyPrefix: "rk_",
      keyHash: "hash",
      scopesJson: "[]",
      allowedIpsJson: null,
      status: "DELETED",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
      revokedAt: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("AuditEventSchema", () => {
  it("accepts valid audit event", () => {
    const result = AuditEventSchema.safeParse({
      id: "evt_01TEST",
      clientId: "cli_01TEST",
      actorType: "USER",
      actorId: "usr_01TEST",
      membershipId: "mem_01TEST",
      eventType: "AUTH_LOGIN_SUCCESS",
      occurredAt: "2025-01-01T00:00:00Z",
      correlationId: "cor_01TEST",
      ipHash: "abc",
      deviceHash: null,
      metadataJson: null,
      severity: "INFO",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid severity", () => {
    const result = AuditEventSchema.safeParse({
      id: "evt_01",
      clientId: null,
      actorType: "USER",
      actorId: "usr_01",
      membershipId: null,
      eventType: "AUTH_LOGIN_SUCCESS",
      occurredAt: "2025-01-01T00:00:00Z",
      correlationId: "cor_01",
      ipHash: null,
      deviceHash: null,
      metadataJson: null,
      severity: "DEBUG",
    });
    expect(result.success).toBe(false);
  });

  it("accepts platform-level event with null clientId", () => {
    const result = AuditEventSchema.safeParse({
      id: "evt_02",
      clientId: null,
      actorType: "SYSTEM",
      actorId: "system",
      membershipId: null,
      eventType: "POLICY_DENIED",
      occurredAt: "2025-01-01T00:00:00Z",
      correlationId: "cor_02",
      ipHash: null,
      deviceHash: null,
      metadataJson: null,
      severity: "WARNING",
    });
    expect(result.success).toBe(true);
  });
});

describe("AuthRateLimitSchema", () => {
  it("accepts valid rate limit", () => {
    const result = AuthRateLimitSchema.safeParse({
      key: "ip:abc123",
      windowStart: "2025-01-01T00:00:00Z",
      count: 3,
      blockedUntil: null,
    });
    expect(result.success).toBe(true);
  });
});
