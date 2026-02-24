import { z } from "zod";
import {
  Audience,
  AuthMethod,
  MfaLevel,
  ActorType,
  IdentityType,
  UserStatus,
  MembershipStatus,
  MfaFactorType,
  MfaFactorStatus,
  MfaChallengeType,
  MfaDeliveryChannel,
  MfaChallengeStatus,
  ServiceAccountStatus,
  ApiKeyStatus,
  AuditSeverity,
  AuditEventType,
} from "./value-objects.js";

// ─── User ────────────────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  status: UserStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

// ─── User Identity ───────────────────────────────────────────────────────────

export const UserIdentitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  identityType: IdentityType,
  normalizedValue: z.string(),
  provider: z.string().nullable(),
  verifiedAt: z.string().nullable(),
});
export type UserIdentity = z.infer<typeof UserIdentitySchema>;

// ─── Membership ──────────────────────────────────────────────────────────────

export const MembershipSchema = z.object({
  id: z.string(),
  userId: z.string(),
  clientId: z.string(),
  status: MembershipStatus,
  rolesJson: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Membership = z.infer<typeof MembershipSchema>;

// ─── Session ─────────────────────────────────────────────────────────────────

export const SessionEntitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  activeClientId: z.string().nullable(),
  audience: Audience,
  authMethod: AuthMethod,
  mfaLevel: MfaLevel,
  mfaLevelExpiresAt: z.string().nullable(),
  createdAt: z.string(),
  lastSeenAt: z.string(),
  expiresAt: z.string(),
  revokedAt: z.string().nullable(),
  ipHash: z.string().nullable(),
  deviceHash: z.string().nullable(),
  userAgentHash: z.string().nullable(),
  refreshTokenHash: z.string().nullable(),
});
export type SessionEntity = z.infer<typeof SessionEntitySchema>;

// ─── Password Credential ────────────────────────────────────────────────────

export const PasswordCredentialSchema = z.object({
  userId: z.string(),
  passwordHash: z.string(),
  passwordUpdatedAt: z.string(),
  failedAttempts: z.number().int(),
  lockoutUntil: z.string().nullable(),
  lastFailedAt: z.string().nullable(),
  breachCheckedAt: z.string().nullable(),
});
export type PasswordCredential = z.infer<typeof PasswordCredentialSchema>;

// ─── MFA Factor ──────────────────────────────────────────────────────────────

export const MfaFactorSchema = z.object({
  id: z.string(),
  userId: z.string(),
  factorType: MfaFactorType,
  encryptedSecret: z.string().nullable(),
  publicKeyJson: z.string().nullable(),
  phoneNumberRef: z.string().nullable(),
  status: MfaFactorStatus,
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});
export type MfaFactor = z.infer<typeof MfaFactorSchema>;

// ─── MFA Challenge ───────────────────────────────────────────────────────────

export const MfaChallengeEntitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().nullable(),
  challengeType: MfaChallengeType,
  deliveryChannel: MfaDeliveryChannel,
  codeHash: z.string().nullable(),
  expiresAt: z.string(),
  attempts: z.number().int(),
  status: MfaChallengeStatus,
});
export type MfaChallengeEntity = z.infer<typeof MfaChallengeEntitySchema>;

// ─── Service Account ─────────────────────────────────────────────────────────

export const ServiceAccountSchema = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  status: ServiceAccountStatus,
  createdAt: z.string(),
});
export type ServiceAccount = z.infer<typeof ServiceAccountSchema>;

// ─── API Key ─────────────────────────────────────────────────────────────────

export const ApiKeyEntitySchema = z.object({
  id: z.string(),
  clientId: z.string(),
  serviceAccountId: z.string(),
  keyPrefix: z.string(),
  keyHash: z.string(),
  scopesJson: z.string(),
  allowedIpsJson: z.string().nullable(),
  status: ApiKeyStatus,
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
  revokedAt: z.string().nullable(),
});
export type ApiKeyEntity = z.infer<typeof ApiKeyEntitySchema>;

// ─── Audit Event ─────────────────────────────────────────────────────────────

export const AuditEventSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  actorType: ActorType,
  actorId: z.string(),
  membershipId: z.string().nullable(),
  eventType: AuditEventType,
  occurredAt: z.string(),
  correlationId: z.string(),
  ipHash: z.string().nullable(),
  deviceHash: z.string().nullable(),
  metadataJson: z.string().nullable(),
  severity: AuditSeverity,
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ─── Auth Rate Limit ─────────────────────────────────────────────────────────

export const AuthRateLimitSchema = z.object({
  key: z.string(),
  windowStart: z.string(),
  count: z.number().int(),
  blockedUntil: z.string().nullable(),
});
export type AuthRateLimit = z.infer<typeof AuthRateLimitSchema>;
