import { describe, it, expect } from "vitest";
import {
  ResidentLoginRequestSchema,
  PasswordResetRequestSchema,
  PasswordResetCompleteSchema,
  MfaEnrollRequestSchema,
  MfaVerifyRequestSchema,
  MfaChallengeRequestSchema,
  CreateApiKeyRequestSchema,
  SelectClientRequestSchema,
  OidcLoginRequestSchema,
  OidcCallbackRequestSchema,
  AuditEventEnvelopeSchema,
  WhoamiResponseSchema,
} from "../domain/dtos.js";

describe("ResidentLoginRequestSchema", () => {
  it("accepts valid E.164 phone with password", () => {
    const result = ResidentLoginRequestSchema.safeParse({
      phone: "+1234567890",
      password: "MySecurePassword",
      deviceId: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-E.164 phone", () => {
    const result = ResidentLoginRequestSchema.safeParse({
      phone: "1234567890",
      password: "pass",
      deviceId: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = ResidentLoginRequestSchema.safeParse({
      phone: "+1234567890",
      password: "",
      deviceId: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("PasswordResetRequestSchema", () => {
  it("accepts valid phone", () => {
    const result = PasswordResetRequestSchema.safeParse({
      phone: "+1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const result = PasswordResetRequestSchema.safeParse({
      phone: "not-a-phone",
    });
    expect(result.success).toBe(false);
  });
});

describe("PasswordResetCompleteSchema", () => {
  it("accepts valid reset with 12+ char password", () => {
    const result = PasswordResetCompleteSchema.safeParse({
      phone: "+1234567890",
      code: "123456",
      newPassword: "NewSecurePass1!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password < 12 chars", () => {
    const result = PasswordResetCompleteSchema.safeParse({
      phone: "+1234567890",
      code: "123456",
      newPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects code != 6 digits", () => {
    const result = PasswordResetCompleteSchema.safeParse({
      phone: "+1234567890",
      code: "12345",
      newPassword: "NewSecurePass1!",
    });
    expect(result.success).toBe(false);
  });
});

describe("MfaEnrollRequestSchema", () => {
  it("accepts TOTP enrollment", () => {
    const result = MfaEnrollRequestSchema.safeParse({
      factorType: "TOTP",
      phoneNumber: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts SMS_OTP with phone number", () => {
    const result = MfaEnrollRequestSchema.safeParse({
      factorType: "SMS_OTP",
      phoneNumber: "+1234567890",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid factor type", () => {
    const result = MfaEnrollRequestSchema.safeParse({
      factorType: "CARRIER_PIGEON",
      phoneNumber: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("MfaVerifyRequestSchema", () => {
  it("accepts valid verify", () => {
    const result = MfaVerifyRequestSchema.safeParse({
      challengeId: "mch_01TEST",
      code: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty code", () => {
    const result = MfaVerifyRequestSchema.safeParse({
      challengeId: "mch_01",
      code: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("MfaChallengeRequestSchema", () => {
  it("accepts valid factor id", () => {
    const result = MfaChallengeRequestSchema.safeParse({
      factorId: "mfa_01TEST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty factor id", () => {
    const result = MfaChallengeRequestSchema.safeParse({
      factorId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateApiKeyRequestSchema", () => {
  it("accepts valid api key creation", () => {
    const result = CreateApiKeyRequestSchema.safeParse({
      serviceAccountId: "svc_01TEST",
      name: "My API Key",
      scopes: ["read:properties", "write:properties"],
      allowedIps: null,
      expiresInDays: 90,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateApiKeyRequestSchema.safeParse({
      serviceAccountId: "svc_01",
      name: "",
      scopes: ["read:all"],
      allowedIps: null,
      expiresInDays: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects expiresInDays > 365", () => {
    const result = CreateApiKeyRequestSchema.safeParse({
      serviceAccountId: "svc_01",
      name: "key",
      scopes: ["read:all"],
      allowedIps: null,
      expiresInDays: 500,
    });
    expect(result.success).toBe(false);
  });
});

describe("SelectClientRequestSchema", () => {
  it("accepts valid client id", () => {
    const result = SelectClientRequestSchema.safeParse({
      clientId: "cli_01TEST",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty client id", () => {
    const result = SelectClientRequestSchema.safeParse({
      clientId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("OidcLoginRequestSchema", () => {
  it("accepts valid OIDC login request", () => {
    const result = OidcLoginRequestSchema.safeParse({
      audience: "console",
      redirectUri: "https://app.realtyos.com/callback",
      state: "random-state-123",
      codeChallenge: "challenge-value",
      codeChallengeMethod: "S256",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-S256 code challenge method", () => {
    const result = OidcLoginRequestSchema.safeParse({
      audience: "console",
      redirectUri: "https://app.realtyos.com/callback",
      state: "state",
      codeChallenge: "challenge",
      codeChallengeMethod: "plain",
    });
    expect(result.success).toBe(false);
  });
});

describe("OidcCallbackRequestSchema", () => {
  it("accepts valid callback request", () => {
    const result = OidcCallbackRequestSchema.safeParse({
      audience: "command",
      code: "auth-code-123",
      state: "state-123",
      codeVerifier: "verifier-123",
    });
    expect(result.success).toBe(true);
  });
});

describe("AuditEventEnvelopeSchema", () => {
  it("accepts valid audit envelope", () => {
    const result = AuditEventEnvelopeSchema.safeParse({
      id: "evt_01",
      clientId: "cli_01",
      actorType: "USER",
      actorId: "usr_01",
      membershipId: "mem_01",
      eventType: "AUTH_LOGIN_SUCCESS",
      occurredAt: "2025-01-01T00:00:00Z",
      correlationId: "cor_01",
      ipHash: "abc",
      deviceHash: null,
      severity: "INFO",
      metadataJson: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("WhoamiResponseSchema", () => {
  it("accepts valid whoami response", () => {
    const result = WhoamiResponseSchema.safeParse({
      actorType: "USER",
      userId: "usr_01",
      clientId: "cli_01",
      membershipId: "mem_01",
      roles: ["RESIDENT"],
      audience: "resident",
      authMethod: "password_phone",
      mfaLevel: "NONE",
    });
    expect(result.success).toBe(true);
  });
});
