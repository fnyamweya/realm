import { describe, it, expect } from "vitest";
import {
  createMfaChallenge,
  verifyMfaChallenge,
} from "../application/step-up-mfa.js";
import { AuthError } from "../application/resident-login.js";
import type {
  MfaFactorRepository,
  MfaChallengeRepository,
  SessionRepository,
  AuditEventRepository,
  OtpGenerator,
} from "../ports/repositories.js";
import type { MfaFactor, MfaChallengeEntity, SessionEntity, AuditEvent } from "../domain/entities.js";

// ─── Stubs ───────────────────────────────────────────────────────────────────

function makeFactorRepo(factors: MfaFactor[] = []): MfaFactorRepository {
  return {
    findById: async (id) => factors.find((f) => f.id === id) ?? null,
    findActiveByUserId: async (userId) =>
      factors.filter((f) => f.userId === userId && f.status === "ACTIVE"),
    create: async () => {},
    updateStatus: async () => {},
    updateLastUsed: async () => {},
  };
}

function makeChallengeRepo(): MfaChallengeRepository & { challenges: MfaChallengeEntity[] } {
  const challenges: MfaChallengeEntity[] = [];
  return {
    challenges,
    findById: async (id) => challenges.find((c) => c.id === id) ?? null,
    findPendingByUserId: async (userId) =>
      challenges.filter((c) => c.userId === userId && c.status === "PENDING"),
    create: async (c) => { challenges.push(c); },
    updateStatus: async (id, status) => {
      const c = challenges.find((ch) => ch.id === id);
      if (c) (c as Record<string, unknown>).status = status;
    },
    incrementAttempts: async (id) => {
      const c = challenges.find((ch) => ch.id === id);
      if (c) (c as Record<string, unknown>).attempts = c.attempts + 1;
    },
  };
}

function makeSessionRepo(sessions: SessionEntity[] = []): SessionRepository {
  return {
    findById: async (id) => sessions.find((s) => s.id === id) ?? null,
    findActiveByUserId: async () => [],
    create: async () => {},
    updateLastSeen: async () => {},
    updateActiveClient: async () => {},
    updateMfaLevel: async (id, level, expiresAt) => {
      const s = sessions.find((s) => s.id === id);
      if (s) {
        (s as Record<string, unknown>).mfaLevel = level;
        (s as Record<string, unknown>).mfaLevelExpiresAt = expiresAt;
      }
    },
    revoke: async () => {},
    revokeAllForUser: async () => {},
  };
}

function makeAuditRepo(): AuditEventRepository & { events: AuditEvent[] } {
  const events: AuditEvent[] = [];
  return {
    events,
    create: async (e) => { events.push(e); },
    findByClientId: async () => [],
    findByEventType: async () => [],
  };
}

function makeOtpGenerator(): OtpGenerator {
  return {
    generate: () => "123456",
    hash: (code) => `hashed:${code}`,
    verify: (code, hash) => `hashed:${code}` === hash,
  };
}

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_test${String(++idCounter).padStart(4, "0")}`;
}

function now(): string {
  return "2025-06-01T12:00:00.000Z";
}

// ─── Create MFA Challenge Tests ──────────────────────────────────────────────

describe("createMfaChallenge", () => {
  it("creates a challenge for an active TOTP factor", async () => {
    idCounter = 0;
    const factor: MfaFactor = {
      id: "mfa_01",
      userId: "usr_01",
      factorType: "TOTP",
      encryptedSecret: "enc:secret",
      publicKeyJson: null,
      phoneNumberRef: null,
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    };

    const challengeRepo = makeChallengeRepo();
    const auditRepo = makeAuditRepo();

    const result = await createMfaChallenge(
      {
        userId: "usr_01",
        sessionId: "ses_01",
        factorId: "mfa_01",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        factorRepo: makeFactorRepo([factor]),
        challengeRepo,
        auditRepo,
        otpGenerator: makeOtpGenerator(),
        generateId,
        now,
        challengeTtlSeconds: 300,
      },
    );

    expect(result.challengeId).toBeTruthy();
    expect(result.deliveryChannel).toBe("APP");
    expect(challengeRepo.challenges).toHaveLength(1);
    expect(challengeRepo.challenges[0]!.status).toBe("PENDING");
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]!.eventType).toBe("MFA_CHALLENGE_CREATED");
  });

  it("uses SMS delivery for SMS_OTP factor", async () => {
    idCounter = 0;
    const factor: MfaFactor = {
      id: "mfa_sms",
      userId: "usr_01",
      factorType: "SMS_OTP",
      encryptedSecret: null,
      publicKeyJson: null,
      phoneNumberRef: "+1234567890",
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    };

    const result = await createMfaChallenge(
      {
        userId: "usr_01",
        sessionId: "ses_01",
        factorId: "mfa_sms",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        factorRepo: makeFactorRepo([factor]),
        challengeRepo: makeChallengeRepo(),
        auditRepo: makeAuditRepo(),
        otpGenerator: makeOtpGenerator(),
        generateId,
        now,
        challengeTtlSeconds: 300,
      },
    );

    expect(result.deliveryChannel).toBe("SMS");
  });

  it("rejects challenge for disabled factor", async () => {
    idCounter = 0;
    const factor: MfaFactor = {
      id: "mfa_dis",
      userId: "usr_01",
      factorType: "TOTP",
      encryptedSecret: "enc:secret",
      publicKeyJson: null,
      phoneNumberRef: null,
      status: "DISABLED",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    };

    await expect(
      createMfaChallenge(
        {
          userId: "usr_01",
          sessionId: "ses_01",
          factorId: "mfa_dis",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          factorRepo: makeFactorRepo([factor]),
          challengeRepo: makeChallengeRepo(),
          auditRepo: makeAuditRepo(),
          otpGenerator: makeOtpGenerator(),
          generateId,
          now,
          challengeTtlSeconds: 300,
        },
      ),
    ).rejects.toThrow("MFA factor not found or disabled");
  });

  it("rejects challenge for wrong user's factor", async () => {
    idCounter = 0;
    const factor: MfaFactor = {
      id: "mfa_other",
      userId: "usr_other",
      factorType: "TOTP",
      encryptedSecret: "enc:secret",
      publicKeyJson: null,
      phoneNumberRef: null,
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00Z",
      lastUsedAt: null,
    };

    await expect(
      createMfaChallenge(
        {
          userId: "usr_01",
          sessionId: "ses_01",
          factorId: "mfa_other",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          factorRepo: makeFactorRepo([factor]),
          challengeRepo: makeChallengeRepo(),
          auditRepo: makeAuditRepo(),
          otpGenerator: makeOtpGenerator(),
          generateId,
          now,
          challengeTtlSeconds: 300,
        },
      ),
    ).rejects.toThrow("Factor does not belong to user");
  });
});

// ─── Verify MFA Challenge Tests ──────────────────────────────────────────────

describe("verifyMfaChallenge", () => {
  function makePendingChallenge(): MfaChallengeEntity {
    return {
      id: "mch_01",
      userId: "usr_01",
      sessionId: "ses_01",
      challengeType: "STEP_UP",
      deliveryChannel: "APP",
      codeHash: "hashed:123456",
      expiresAt: "2099-01-01T00:00:00Z",
      attempts: 0,
      status: "PENDING",
    };
  }

  function makeSession(): SessionEntity {
    return {
      id: "ses_01",
      userId: "usr_01",
      activeClientId: "cli_01",
      audience: "resident",
      authMethod: "password_phone",
      mfaLevel: "NONE",
      mfaLevelExpiresAt: null,
      createdAt: "2025-01-01T00:00:00Z",
      lastSeenAt: "2025-01-01T00:00:00Z",
      expiresAt: "2099-01-01T00:00:00Z",
      revokedAt: null,
      ipHash: "ip_01",
      deviceHash: null,
      userAgentHash: "ua_01",
      refreshTokenHash: null,
    };
  }

  it("verifies correct code and upgrades session MFA level", async () => {
    idCounter = 0;
    const challenge = makePendingChallenge();
    const challengeRepo = makeChallengeRepo();
    challengeRepo.challenges.push(challenge);
    const session = makeSession();
    const auditRepo = makeAuditRepo();

    const result = await verifyMfaChallenge(
      {
        userId: "usr_01",
        sessionId: "ses_01",
        challengeId: "mch_01",
        code: "123456",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        challengeRepo,
        sessionRepo: makeSessionRepo([session]),
        factorRepo: makeFactorRepo(),
        auditRepo,
        otpGenerator: makeOtpGenerator(),
        generateId,
        now,
      },
    );

    expect(result.verified).toBe(true);
    expect(result.mfaLevel).toBe("STRONG");
    expect(result.mfaLevelExpiresAt).toBeTruthy();
    expect(challenge.status).toBe("VERIFIED");
    expect(session.mfaLevel).toBe("STRONG");
    expect(auditRepo.events.some((e) => e.eventType === "MFA_STEP_UP_SUCCESS")).toBe(true);
  });

  it("returns false for wrong code", async () => {
    idCounter = 0;
    const challenge = makePendingChallenge();
    const challengeRepo = makeChallengeRepo();
    challengeRepo.challenges.push(challenge);
    const auditRepo = makeAuditRepo();

    const result = await verifyMfaChallenge(
      {
        userId: "usr_01",
        sessionId: "ses_01",
        challengeId: "mch_01",
        code: "000000",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        challengeRepo,
        sessionRepo: makeSessionRepo([makeSession()]),
        factorRepo: makeFactorRepo(),
        auditRepo,
        otpGenerator: makeOtpGenerator(),
        generateId,
        now,
      },
    );

    expect(result.verified).toBe(false);
    expect(result.mfaLevel).toBe("NONE");
    expect(auditRepo.events.some((e) => e.eventType === "MFA_STEP_UP_FAIL")).toBe(true);
  });

  it("rejects expired challenge", async () => {
    idCounter = 0;
    const challenge: MfaChallengeEntity = {
      ...makePendingChallenge(),
      expiresAt: "2020-01-01T00:00:00Z", // past
    };
    const challengeRepo = makeChallengeRepo();
    challengeRepo.challenges.push(challenge);

    await expect(
      verifyMfaChallenge(
        {
          userId: "usr_01",
          sessionId: "ses_01",
          challengeId: "mch_01",
          code: "123456",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          challengeRepo,
          sessionRepo: makeSessionRepo([makeSession()]),
          factorRepo: makeFactorRepo(),
          auditRepo: makeAuditRepo(),
          otpGenerator: makeOtpGenerator(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Challenge has expired");
  });

  it("rejects challenge with max attempts exceeded", async () => {
    idCounter = 0;
    const challenge: MfaChallengeEntity = {
      ...makePendingChallenge(),
      attempts: 5,
    };
    const challengeRepo = makeChallengeRepo();
    challengeRepo.challenges.push(challenge);

    await expect(
      verifyMfaChallenge(
        {
          userId: "usr_01",
          sessionId: "ses_01",
          challengeId: "mch_01",
          code: "123456",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          challengeRepo,
          sessionRepo: makeSessionRepo([makeSession()]),
          factorRepo: makeFactorRepo(),
          auditRepo: makeAuditRepo(),
          otpGenerator: makeOtpGenerator(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Too many verification attempts");
  });

  it("rejects challenge belonging to different user", async () => {
    idCounter = 0;
    const challenge: MfaChallengeEntity = {
      ...makePendingChallenge(),
      userId: "usr_other",
    };
    const challengeRepo = makeChallengeRepo();
    challengeRepo.challenges.push(challenge);

    await expect(
      verifyMfaChallenge(
        {
          userId: "usr_01",
          sessionId: "ses_01",
          challengeId: "mch_01",
          code: "123456",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          challengeRepo,
          sessionRepo: makeSessionRepo([makeSession()]),
          factorRepo: makeFactorRepo(),
          auditRepo: makeAuditRepo(),
          otpGenerator: makeOtpGenerator(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Challenge does not belong to user");
  });
});
