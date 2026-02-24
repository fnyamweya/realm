import type {
  User,
  UserIdentity,
  Membership,
  SessionEntity,
  PasswordCredential,
  MfaFactor,
  MfaChallengeEntity,
  ServiceAccount,
  ApiKeyEntity,
  AuditEvent,
  AuthRateLimit,
} from "../domain/entities.js";

// ─── User Repository ─────────────────────────────────────────────────────────

export interface UserRepository {
  findById(userId: string): Promise<User | null>;
  create(user: User): Promise<void>;
  updateStatus(userId: string, status: User["status"]): Promise<void>;
}

// ─── User Identity Repository ────────────────────────────────────────────────

export interface UserIdentityRepository {
  findByNormalizedValue(
    identityType: UserIdentity["identityType"],
    normalizedValue: string,
    provider: string | null,
  ): Promise<UserIdentity | null>;
  findAllByUserId(userId: string): Promise<UserIdentity[]>;
  create(identity: UserIdentity): Promise<void>;
  markVerified(identityId: string, verifiedAt: string): Promise<void>;
}

// ─── Membership Repository ───────────────────────────────────────────────────

export interface MembershipRepository {
  findById(membershipId: string): Promise<Membership | null>;
  findByUserAndClient(
    userId: string,
    clientId: string,
  ): Promise<Membership | null>;
  findAllByUserId(userId: string): Promise<Membership[]>;
  findAllByClientId(clientId: string): Promise<Membership[]>;
  create(membership: Membership): Promise<void>;
  updateStatus(
    membershipId: string,
    status: Membership["status"],
  ): Promise<void>;
  updateRoles(membershipId: string, rolesJson: string): Promise<void>;
}

// ─── Session Repository ──────────────────────────────────────────────────────

export interface SessionRepository {
  findById(sessionId: string): Promise<SessionEntity | null>;
  findActiveByUserId(
    userId: string,
    audience: SessionEntity["audience"],
  ): Promise<SessionEntity[]>;
  create(session: SessionEntity): Promise<void>;
  updateLastSeen(sessionId: string, lastSeenAt: string): Promise<void>;
  updateActiveClient(
    sessionId: string,
    clientId: string,
    membershipId: string,
  ): Promise<void>;
  updateMfaLevel(
    sessionId: string,
    mfaLevel: SessionEntity["mfaLevel"],
    mfaLevelExpiresAt: string | null,
  ): Promise<void>;
  revoke(sessionId: string, revokedAt: string): Promise<void>;
  revokeAllForUser(
    userId: string,
    audience: SessionEntity["audience"],
  ): Promise<void>;
}

// ─── Password Credential Repository ──────────────────────────────────────────

export interface PasswordCredentialRepository {
  findByUserId(userId: string): Promise<PasswordCredential | null>;
  create(credential: PasswordCredential): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string, updatedAt: string): Promise<void>;
  incrementFailedAttempts(
    userId: string,
    lastFailedAt: string,
  ): Promise<void>;
  setLockout(userId: string, lockoutUntil: string): Promise<void>;
  resetFailedAttempts(userId: string): Promise<void>;
}

// ─── MFA Factor Repository ──────────────────────────────────────────────────

export interface MfaFactorRepository {
  findById(factorId: string): Promise<MfaFactor | null>;
  findActiveByUserId(userId: string): Promise<MfaFactor[]>;
  create(factor: MfaFactor): Promise<void>;
  updateStatus(
    factorId: string,
    status: MfaFactor["status"],
  ): Promise<void>;
  updateLastUsed(factorId: string, lastUsedAt: string): Promise<void>;
}

// ─── MFA Challenge Repository ────────────────────────────────────────────────

export interface MfaChallengeRepository {
  findById(challengeId: string): Promise<MfaChallengeEntity | null>;
  findPendingByUserId(userId: string): Promise<MfaChallengeEntity[]>;
  create(challenge: MfaChallengeEntity): Promise<void>;
  updateStatus(
    challengeId: string,
    status: MfaChallengeEntity["status"],
  ): Promise<void>;
  incrementAttempts(challengeId: string): Promise<void>;
}

// ─── Service Account Repository ──────────────────────────────────────────────

export interface ServiceAccountRepository {
  findById(serviceAccountId: string): Promise<ServiceAccount | null>;
  findByClientId(clientId: string): Promise<ServiceAccount[]>;
  create(account: ServiceAccount): Promise<void>;
  updateStatus(
    serviceAccountId: string,
    status: ServiceAccount["status"],
  ): Promise<void>;
}

// ─── API Key Repository ──────────────────────────────────────────────────────

export interface ApiKeyRepository {
  findByKeyPrefix(
    clientId: string,
    keyPrefix: string,
  ): Promise<ApiKeyEntity | null>;
  findByClientId(clientId: string): Promise<ApiKeyEntity[]>;
  create(apiKey: ApiKeyEntity): Promise<void>;
  updateLastUsed(keyId: string, lastUsedAt: string): Promise<void>;
  revoke(
    clientId: string,
    keyId: string,
    revokedAt: string,
  ): Promise<void>;
}

// ─── Audit Event Repository ──────────────────────────────────────────────────

export interface AuditEventRepository {
  create(event: AuditEvent): Promise<void>;
  findByClientId(
    clientId: string,
    from: string,
    to: string,
    limit: number,
  ): Promise<AuditEvent[]>;
  findByEventType(
    eventType: AuditEvent["eventType"],
    from: string,
    to: string,
    limit: number,
  ): Promise<AuditEvent[]>;
}

// ─── Rate Limit Repository ──────────────────────────────────────────────────

export interface RateLimitRepository {
  get(key: string): Promise<AuthRateLimit | null>;
  increment(key: string, windowStart: string): Promise<number>;
  setBlocked(key: string, blockedUntil: string): Promise<void>;
  isBlocked(key: string): Promise<boolean>;
}

// ─── Password Hasher Port ────────────────────────────────────────────────────

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

// ─── OTP Generator Port ──────────────────────────────────────────────────────

export interface OtpGenerator {
  generate(): string;
  hash(code: string): string;
  verify(code: string, hash: string): boolean;
}
