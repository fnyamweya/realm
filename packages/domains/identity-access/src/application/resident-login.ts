import type {
  UserIdentityRepository,
  PasswordCredentialRepository,
  SessionRepository,
  MembershipRepository,
  AuditEventRepository,
  RateLimitRepository,
  PasswordHasher,
} from "../ports/repositories.js";
import type { ResidentAuthConfig } from "../domain/auth-config.js";
import type { AuditEvent } from "../domain/entities.js";

export interface ResidentLoginInput {
  phone: string;
  password: string;
  deviceId: string | null;
  ipHash: string;
  userAgentHash: string;
  correlationId: string;
}

export interface ResidentLoginOutput {
  sessionId: string;
  expiresAt: string;
  mfaRequired: boolean;
  challengeId: string | null;
}

/** Safe error message: never reveals whether phone exists. */
const GENERIC_AUTH_ERROR = "Invalid phone number or password";

/**
 * Resident login via phone + password.
 * Enforces rate limiting, lockout, and audit logging.
 * Never leaks whether the phone number is registered.
 */
export async function residentLogin(
  input: ResidentLoginInput,
  deps: {
    identityRepo: UserIdentityRepository;
    passwordRepo: PasswordCredentialRepository;
    sessionRepo: SessionRepository;
    membershipRepo: MembershipRepository;
    auditRepo: AuditEventRepository;
    rateLimitRepo: RateLimitRepository;
    passwordHasher: PasswordHasher;
    config: ResidentAuthConfig;
    generateId: (prefix: string) => string;
    now: () => string;
  },
): Promise<ResidentLoginOutput> {
  const { rateLimitPolicy, lockoutPolicy } = deps.config;
  const now = deps.now();

  // 1. Rate-limit check (per IP)
  const ipBlocked = await deps.rateLimitRepo.isBlocked(`ip:${input.ipHash}`);
  if (ipBlocked) {
    await emitLoginFail(deps, input, "RATE_LIMITED");
    throw new AuthError("AUTH_RATE_LIMITED", "Too many attempts. Try later.");
  }

  // 2. Rate-limit check (per phone)
  const phoneKey = `phone:${hashKey(input.phone)}`;
  const phoneBlocked = await deps.rateLimitRepo.isBlocked(phoneKey);
  if (phoneBlocked) {
    await emitLoginFail(deps, input, "RATE_LIMITED");
    throw new AuthError("AUTH_RATE_LIMITED", "Too many attempts. Try later.");
  }

  // 3. Increment rate limit counters
  const ipCount = await deps.rateLimitRepo.increment(`ip:${input.ipHash}`, now);
  if (ipCount > rateLimitPolicy.maxAttemptsPerIp) {
    const blockUntil = addMinutes(now, rateLimitPolicy.windowMinutes);
    await deps.rateLimitRepo.setBlocked(`ip:${input.ipHash}`, blockUntil);
    await emitLoginFail(deps, input, "RATE_LIMITED");
    throw new AuthError("AUTH_RATE_LIMITED", "Too many attempts. Try later.");
  }

  // 4. Find identity (phone)
  const identity = await deps.identityRepo.findByNormalizedValue(
    "PHONE",
    normalizePhone(input.phone),
    null,
  );

  if (identity === null) {
    // Do not reveal that the phone is not registered
    const phoneCount = await deps.rateLimitRepo.increment(phoneKey, now);
    if (phoneCount > rateLimitPolicy.maxAttemptsPerPhone) {
      await deps.rateLimitRepo.setBlocked(
        phoneKey,
        addMinutes(now, rateLimitPolicy.windowMinutes),
      );
    }
    await emitLoginFail(deps, input, "IDENTITY_NOT_FOUND");
    throw new AuthError("AUTH_CREDENTIALS_INVALID", GENERIC_AUTH_ERROR);
  }

  // 5. Load password credential
  const credential = await deps.passwordRepo.findByUserId(identity.userId);
  if (credential === null) {
    await emitLoginFail(deps, input, "NO_CREDENTIAL");
    throw new AuthError("AUTH_CREDENTIALS_INVALID", GENERIC_AUTH_ERROR);
  }

  // 6. Check lockout
  if (
    credential.lockoutUntil !== null &&
    new Date(credential.lockoutUntil).getTime() > Date.now()
  ) {
    await emitLoginFail(deps, input, "ACCOUNT_LOCKED");
    throw new AuthError("AUTH_ACCOUNT_LOCKED", "Account is temporarily locked.");
  }

  // 7. Verify password
  const passwordValid = await deps.passwordHasher.verify(
    input.password,
    credential.passwordHash,
  );

  if (!passwordValid) {
    await deps.passwordRepo.incrementFailedAttempts(identity.userId, now);
    const newAttempts = credential.failedAttempts + 1;

    if (newAttempts >= lockoutPolicy.maxFailedAttempts) {
      const lockMinutes =
        lockoutPolicy.lockoutDurationMinutes *
        Math.pow(lockoutPolicy.progressiveMultiplier, Math.floor(newAttempts / lockoutPolicy.maxFailedAttempts) - 1);
      await deps.passwordRepo.setLockout(
        identity.userId,
        addMinutes(now, lockMinutes),
      );
      await emitAuditEvent(deps, {
        eventType: "ACCOUNT_LOCKED",
        actorId: identity.userId,
        correlationId: input.correlationId,
        ipHash: input.ipHash,
      });
    }

    await emitLoginFail(deps, input, "INVALID_PASSWORD");
    throw new AuthError("AUTH_CREDENTIALS_INVALID", GENERIC_AUTH_ERROR);
  }

  // 8. Reset failed attempts on success
  await deps.passwordRepo.resetFailedAttempts(identity.userId);

  // 9. Find memberships to determine MFA policy
  const memberships = await deps.membershipRepo.findAllByUserId(identity.userId);
  const activeMembership = memberships.find((m) => m.status === "ACTIVE");

  // 10. Create session
  const sessionId = deps.generateId("ses");
  const expiresAt = addMinutes(now, deps.config.sessionDurationMinutes);

  await deps.sessionRepo.create({
    id: sessionId,
    userId: identity.userId,
    activeClientId: activeMembership !== undefined ? activeMembership.clientId : null,
    audience: "resident",
    authMethod: "password_phone",
    mfaLevel: "NONE",
    mfaLevelExpiresAt: null,
    createdAt: now,
    lastSeenAt: now,
    expiresAt,
    revokedAt: null,
    ipHash: input.ipHash,
    deviceHash: input.deviceId,
    userAgentHash: input.userAgentHash,
    refreshTokenHash: null,
  });

  // 11. Determine MFA requirement
  const mfaRequired =
    deps.config.mfaPolicy.required === "ALWAYS" ||
    (deps.config.mfaPolicy.required === "CONDITIONAL" &&
      deps.config.mfaPolicy.stepUpOnNewDevice &&
      input.deviceId !== null);

  // 12. Emit success audit
  const clientIdForAudit = activeMembership !== undefined ? activeMembership.clientId : null;
  const membershipIdForAudit = activeMembership !== undefined ? activeMembership.id : null;

  await deps.auditRepo.create({
    id: deps.generateId("evt"),
    clientId: clientIdForAudit,
    actorType: "USER",
    actorId: identity.userId,
    membershipId: membershipIdForAudit,
    eventType: "AUTH_LOGIN_SUCCESS",
    occurredAt: deps.now(),
    correlationId: input.correlationId,
    ipHash: input.ipHash,
    deviceHash: null,
    metadataJson: null,
    severity: "INFO",
  });

  return {
    sessionId,
    expiresAt,
    mfaRequired,
    challengeId: null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

function hashKey(value: string): string {
  // Simple deterministic hash for rate limit keys. In production use crypto.
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const chr = value.charCodeAt(i);
    hash = ((hash << 5) - hash + chr) | 0;
  }
  return Math.abs(hash).toString(36);
}

function addMinutes(iso: string, minutes: number): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

async function emitLoginFail(
  deps: { auditRepo: AuditEventRepository; generateId: (prefix: string) => string; now: () => string },
  input: { correlationId: string; ipHash: string; phone: string },
  reason: string,
): Promise<void> {
  await emitAuditEvent(deps, {
    eventType: "AUTH_LOGIN_FAIL",
    actorId: "unknown",
    correlationId: input.correlationId,
    ipHash: input.ipHash,
    metadata: { reason },
  });
}

async function emitAuditEvent(
  deps: { auditRepo: AuditEventRepository; generateId: (prefix: string) => string; now: () => string },
  params: {
    eventType: AuditEvent["eventType"];
    actorId: string;
    correlationId: string;
    ipHash: string;
    clientId?: string;
    membershipId?: string;
    metadata?: Record<string, string>;
  },
): Promise<void> {
  await deps.auditRepo.create({
    id: deps.generateId("evt"),
    clientId: params.clientId ?? null,
    actorType: "USER",
    actorId: params.actorId,
    membershipId: params.membershipId ?? null,
    eventType: params.eventType,
    occurredAt: deps.now(),
    correlationId: params.correlationId,
    ipHash: params.ipHash,
    deviceHash: null,
    metadataJson: params.metadata !== undefined ? JSON.stringify(params.metadata) : null,
    severity: params.eventType === "AUTH_LOGIN_FAIL" ? "WARNING" : "INFO",
  });
}
