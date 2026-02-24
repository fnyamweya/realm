import { describe, it, expect } from "vitest";
import { residentLogin, AuthError } from "../application/resident-login.js";
import type { ResidentAuthConfig } from "../domain/auth-config.js";
import type {
  UserIdentityRepository,
  PasswordCredentialRepository,
  SessionRepository,
  MembershipRepository,
  AuditEventRepository,
  RateLimitRepository,
  PasswordHasher,
} from "../ports/repositories.js";
import type { UserIdentity, PasswordCredential, Membership, SessionEntity, AuditEvent, AuthRateLimit } from "../domain/entities.js";

// ─── In-Memory Stubs ─────────────────────────────────────────────────────────

function makeIdentityRepo(
  identities: UserIdentity[] = [],
): UserIdentityRepository {
  return {
    findByNormalizedValue: async (type, value, _provider) =>
      identities.find(
        (i) => i.identityType === type && i.normalizedValue === value,
      ) ?? null,
    findAllByUserId: async (userId) =>
      identities.filter((i) => i.userId === userId),
    create: async () => {},
    markVerified: async () => {},
  };
}

function makePasswordRepo(
  creds: Map<string, PasswordCredential> = new Map(),
): PasswordCredentialRepository {
  return {
    findByUserId: async (userId) => creds.get(userId) ?? null,
    create: async () => {},
    updatePasswordHash: async () => {},
    incrementFailedAttempts: async (userId) => {
      const c = creds.get(userId);
      if (c) c.failedAttempts++;
    },
    setLockout: async (userId, lockoutUntil) => {
      const c = creds.get(userId);
      if (c) c.lockoutUntil = lockoutUntil;
    },
    resetFailedAttempts: async (userId) => {
      const c = creds.get(userId);
      if (c) c.failedAttempts = 0;
    },
  };
}

function makeSessionRepo(): SessionRepository & { sessions: SessionEntity[] } {
  const sessions: SessionEntity[] = [];
  return {
    sessions,
    findById: async (id) => sessions.find((s) => s.id === id) ?? null,
    findActiveByUserId: async () => [],
    create: async (s) => { sessions.push(s); },
    updateLastSeen: async () => {},
    updateActiveClient: async () => {},
    updateMfaLevel: async () => {},
    revoke: async () => {},
    revokeAllForUser: async () => {},
  };
}

function makeMembershipRepo(
  memberships: Membership[] = [],
): MembershipRepository {
  return {
    findById: async (id) => memberships.find((m) => m.id === id) ?? null,
    findByUserAndClient: async (userId, clientId) =>
      memberships.find((m) => m.userId === userId && m.clientId === clientId) ?? null,
    findAllByUserId: async (userId) =>
      memberships.filter((m) => m.userId === userId),
    findAllByClientId: async () => [],
    create: async () => {},
    updateStatus: async () => {},
    updateRoles: async () => {},
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

function makeRateLimitRepo(
  blockedKeys: Set<string> = new Set(),
  counts: Map<string, number> = new Map(),
): RateLimitRepository {
  return {
    get: async (key) =>
      counts.has(key)
        ? {
            key,
            windowStart: "2025-01-01T00:00:00Z",
            count: counts.get(key)!,
            blockedUntil: null,
          }
        : null,
    increment: async (key) => {
      const c = (counts.get(key) ?? 0) + 1;
      counts.set(key, c);
      return c;
    },
    setBlocked: async (key) => { blockedKeys.add(key); },
    isBlocked: async (key) => blockedKeys.has(key),
  };
}

function makePasswordHasher(validPassword: string): PasswordHasher {
  return {
    hash: async (pw) => `hashed:${pw}`,
    verify: async (pw, _hash) => pw === validPassword,
  };
}

const testConfig: ResidentAuthConfig = {
  configVersion: 1,
  audience: "resident",
  allowedStrategies: ["PHONE_PASSWORD"],
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecialChar: false,
    breachCheckEnabled: false,
  },
  mfaPolicy: {
    required: "NEVER",
    allowedFactors: ["SMS_OTP"],
    stepUpOnNewDevice: false,
    stepUpOnSuspiciousIp: false,
    stepUpOnHighRiskAction: false,
  },
  rateLimitPolicy: {
    maxAttemptsPerIp: 10,
    maxAttemptsPerPhone: 5,
    maxAttemptsPerDevice: 8,
    windowMinutes: 15,
  },
  lockoutPolicy: {
    maxFailedAttempts: 3,
    lockoutDurationMinutes: 15,
    progressiveMultiplier: 2,
  },
  sessionDurationMinutes: 720,
  riskControls: {
    suspiciousLoginDetection: false,
    geoAnomalyDetection: false,
    deviceBindingEnabled: false,
    trustedDeviceExpiryDays: 30,
  },
};

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_test${String(++idCounter).padStart(4, "0")}`;
}

function now(): string {
  return "2025-06-01T12:00:00.000Z";
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("residentLogin", () => {
  const baseInput = {
    phone: "+1234567890",
    password: "SecurePass123!",
    deviceId: null,
    ipHash: "ip_hash_test",
    userAgentHash: "ua_hash_test",
    correlationId: "cor_test0001",
  };

  it("logs in successfully with correct phone and password", async () => {
    idCounter = 0;
    const identity: UserIdentity = {
      id: "uid_01",
      userId: "usr_01",
      identityType: "PHONE",
      normalizedValue: "+1234567890",
      provider: null,
      verifiedAt: "2025-01-01T00:00:00Z",
    };
    const credential: PasswordCredential = {
      userId: "usr_01",
      passwordHash: "hashed:SecurePass123!",
      passwordUpdatedAt: "2025-01-01T00:00:00Z",
      failedAttempts: 0,
      lockoutUntil: null,
      lastFailedAt: null,
      breachCheckedAt: null,
    };
    const membership: Membership = {
      id: "mem_01",
      userId: "usr_01",
      clientId: "cli_01",
      status: "ACTIVE",
      rolesJson: '["RESIDENT"]',
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    const sessionRepo = makeSessionRepo();
    const auditRepo = makeAuditRepo();

    const result = await residentLogin(baseInput, {
      identityRepo: makeIdentityRepo([identity]),
      passwordRepo: makePasswordRepo(new Map([["usr_01", credential]])),
      sessionRepo,
      membershipRepo: makeMembershipRepo([membership]),
      auditRepo,
      rateLimitRepo: makeRateLimitRepo(),
      passwordHasher: makePasswordHasher("SecurePass123!"),
      config: testConfig,
      generateId,
      now,
    });

    expect(result.sessionId).toBeTruthy();
    expect(result.mfaRequired).toBe(false);
    expect(sessionRepo.sessions).toHaveLength(1);
    expect(sessionRepo.sessions[0]!.audience).toBe("resident");
    expect(sessionRepo.sessions[0]!.authMethod).toBe("password_phone");

    // Verify audit events emitted
    const loginSuccess = auditRepo.events.find(
      (e) => e.eventType === "AUTH_LOGIN_SUCCESS",
    );
    expect(loginSuccess).toBeDefined();
  });

  it("does not reveal phone existence on wrong phone", async () => {
    idCounter = 0;
    const auditRepo = makeAuditRepo();

    await expect(
      residentLogin(
        { ...baseInput, phone: "+9999999999" },
        {
          identityRepo: makeIdentityRepo([]),
          passwordRepo: makePasswordRepo(),
          sessionRepo: makeSessionRepo(),
          membershipRepo: makeMembershipRepo(),
          auditRepo,
          rateLimitRepo: makeRateLimitRepo(),
          passwordHasher: makePasswordHasher("anything"),
          config: testConfig,
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Invalid phone number or password");

    // Must emit AUTH_LOGIN_FAIL
    expect(auditRepo.events.some((e) => e.eventType === "AUTH_LOGIN_FAIL")).toBe(true);
  });

  it("does not reveal phone existence on wrong password", async () => {
    idCounter = 0;
    const identity: UserIdentity = {
      id: "uid_01",
      userId: "usr_01",
      identityType: "PHONE",
      normalizedValue: "+1234567890",
      provider: null,
      verifiedAt: "2025-01-01T00:00:00Z",
    };
    const credential: PasswordCredential = {
      userId: "usr_01",
      passwordHash: "hashed:correct",
      passwordUpdatedAt: "2025-01-01T00:00:00Z",
      failedAttempts: 0,
      lockoutUntil: null,
      lastFailedAt: null,
      breachCheckedAt: null,
    };

    const auditRepo = makeAuditRepo();

    await expect(
      residentLogin(
        { ...baseInput, password: "WrongPassword!!!" },
        {
          identityRepo: makeIdentityRepo([identity]),
          passwordRepo: makePasswordRepo(new Map([["usr_01", credential]])),
          sessionRepo: makeSessionRepo(),
          membershipRepo: makeMembershipRepo(),
          auditRepo,
          rateLimitRepo: makeRateLimitRepo(),
          passwordHasher: makePasswordHasher("correct"),
          config: testConfig,
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Invalid phone number or password");
  });

  it("locks account after max failed attempts", async () => {
    idCounter = 0;
    const identity: UserIdentity = {
      id: "uid_01",
      userId: "usr_01",
      identityType: "PHONE",
      normalizedValue: "+1234567890",
      provider: null,
      verifiedAt: "2025-01-01T00:00:00Z",
    };
    const credential: PasswordCredential = {
      userId: "usr_01",
      passwordHash: "hashed:correct",
      passwordUpdatedAt: "2025-01-01T00:00:00Z",
      failedAttempts: 2, // one more will trigger lockout (maxFailedAttempts=3)
      lockoutUntil: null,
      lastFailedAt: null,
      breachCheckedAt: null,
    };
    const passwordCreds = new Map([["usr_01", credential]]);
    const auditRepo = makeAuditRepo();

    await expect(
      residentLogin(
        { ...baseInput, password: "WrongPassword!!!" },
        {
          identityRepo: makeIdentityRepo([identity]),
          passwordRepo: makePasswordRepo(passwordCreds),
          sessionRepo: makeSessionRepo(),
          membershipRepo: makeMembershipRepo(),
          auditRepo,
          rateLimitRepo: makeRateLimitRepo(),
          passwordHasher: makePasswordHasher("correct"),
          config: testConfig,
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Invalid phone number or password");

    // Verify lockout was set
    expect(credential.lockoutUntil).not.toBeNull();

    // Verify ACCOUNT_LOCKED audit event
    expect(
      auditRepo.events.some((e) => e.eventType === "ACCOUNT_LOCKED"),
    ).toBe(true);
  });

  it("rejects login when account is locked", async () => {
    idCounter = 0;
    const identity: UserIdentity = {
      id: "uid_01",
      userId: "usr_01",
      identityType: "PHONE",
      normalizedValue: "+1234567890",
      provider: null,
      verifiedAt: "2025-01-01T00:00:00Z",
    };
    const credential: PasswordCredential = {
      userId: "usr_01",
      passwordHash: "hashed:SecurePass123!",
      passwordUpdatedAt: "2025-01-01T00:00:00Z",
      failedAttempts: 5,
      lockoutUntil: "2099-01-01T00:00:00Z", // far future
      lastFailedAt: null,
      breachCheckedAt: null,
    };

    await expect(
      residentLogin(baseInput, {
        identityRepo: makeIdentityRepo([identity]),
        passwordRepo: makePasswordRepo(new Map([["usr_01", credential]])),
        sessionRepo: makeSessionRepo(),
        membershipRepo: makeMembershipRepo(),
        auditRepo: makeAuditRepo(),
        rateLimitRepo: makeRateLimitRepo(),
        passwordHasher: makePasswordHasher("SecurePass123!"),
        config: testConfig,
        generateId,
        now,
      }),
    ).rejects.toThrow("Account is temporarily locked");
  });

  it("rejects when IP is rate-limited", async () => {
    idCounter = 0;
    const blockedKeys = new Set(["ip:ip_hash_test"]);

    await expect(
      residentLogin(baseInput, {
        identityRepo: makeIdentityRepo([]),
        passwordRepo: makePasswordRepo(),
        sessionRepo: makeSessionRepo(),
        membershipRepo: makeMembershipRepo(),
        auditRepo: makeAuditRepo(),
        rateLimitRepo: makeRateLimitRepo(blockedKeys),
        passwordHasher: makePasswordHasher("anything"),
        config: testConfig,
        generateId,
        now,
      }),
    ).rejects.toThrow("Too many attempts");
  });

  it("throws AuthError with correct code", async () => {
    idCounter = 0;
    try {
      await residentLogin(baseInput, {
        identityRepo: makeIdentityRepo([]),
        passwordRepo: makePasswordRepo(),
        sessionRepo: makeSessionRepo(),
        membershipRepo: makeMembershipRepo(),
        auditRepo: makeAuditRepo(),
        rateLimitRepo: makeRateLimitRepo(),
        passwordHasher: makePasswordHasher("anything"),
        config: testConfig,
        generateId,
        now,
      });
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe("AUTH_CREDENTIALS_INVALID");
    }
  });

  it("emits no PII in audit metadata", async () => {
    idCounter = 0;
    const auditRepo = makeAuditRepo();

    try {
      await residentLogin(baseInput, {
        identityRepo: makeIdentityRepo([]),
        passwordRepo: makePasswordRepo(),
        sessionRepo: makeSessionRepo(),
        membershipRepo: makeMembershipRepo(),
        auditRepo,
        rateLimitRepo: makeRateLimitRepo(),
        passwordHasher: makePasswordHasher("anything"),
        config: testConfig,
        generateId,
        now,
      });
    } catch {
      // expected
    }

    for (const evt of auditRepo.events) {
      if (evt.metadataJson !== null) {
        // Ensure no phone number or password appears in metadata
        expect(evt.metadataJson).not.toContain("+1234567890");
        expect(evt.metadataJson).not.toContain("SecurePass123!");
      }
    }
  });
});
