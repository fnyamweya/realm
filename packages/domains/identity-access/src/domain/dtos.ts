import { z } from "zod";
import { Audience, MfaFactorType, MfaDeliveryChannel } from "./value-objects.js";

// ─── OIDC Login/Callback DTOs ────────────────────────────────────────────────

export const OidcLoginRequestSchema = z.object({
  audience: Audience,
  redirectUri: z.string().url(),
  state: z.string().min(1),
  codeChallenge: z.string().min(1),
  codeChallengeMethod: z.literal("S256"),
});
export type OidcLoginRequest = z.infer<typeof OidcLoginRequestSchema>;

export const OidcCallbackRequestSchema = z.object({
  audience: Audience,
  code: z.string().min(1),
  state: z.string().min(1),
  codeVerifier: z.string().min(1),
});
export type OidcCallbackRequest = z.infer<typeof OidcCallbackRequestSchema>;

// ─── Resident Login DTOs ─────────────────────────────────────────────────────

export const ResidentLoginRequestSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid E.164 phone number" }),
  password: z.string().min(1),
  deviceId: z.string().nullable(),
});
export type ResidentLoginRequest = z.infer<typeof ResidentLoginRequestSchema>;

export const ResidentLoginResponseSchema = z.object({
  sessionId: z.string(),
  expiresAt: z.string(),
  mfaRequired: z.boolean(),
  challengeId: z.string().nullable(),
});
export type ResidentLoginResponse = z.infer<typeof ResidentLoginResponseSchema>;

// ─── Password Reset DTOs ─────────────────────────────────────────────────────

export const PasswordResetRequestSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid E.164 phone number" }),
});
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;

export const PasswordResetVerifySchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid E.164 phone number" }),
  code: z.string().length(6),
});
export type PasswordResetVerify = z.infer<typeof PasswordResetVerifySchema>;

export const PasswordResetCompleteSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid E.164 phone number" }),
  code: z.string().length(6),
  newPassword: z.string().min(12),
});
export type PasswordResetComplete = z.infer<typeof PasswordResetCompleteSchema>;

// ─── Select Client ───────────────────────────────────────────────────────────

export const SelectClientRequestSchema = z.object({
  clientId: z.string().min(1),
});
export type SelectClientRequest = z.infer<typeof SelectClientRequestSchema>;

// ─── MFA Enroll DTOs ─────────────────────────────────────────────────────────

export const MfaEnrollRequestSchema = z.object({
  factorType: MfaFactorType,
  phoneNumber: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/)
    .nullable(),
});
export type MfaEnrollRequest = z.infer<typeof MfaEnrollRequestSchema>;

export const MfaEnrollResponseSchema = z.object({
  factorId: z.string(),
  factorType: MfaFactorType,
  totpUri: z.string().nullable(),
  challengeId: z.string().nullable(),
});
export type MfaEnrollResponse = z.infer<typeof MfaEnrollResponseSchema>;

// ─── MFA Challenge DTOs ──────────────────────────────────────────────────────

export const MfaChallengeRequestSchema = z.object({
  factorId: z.string().min(1),
});
export type MfaChallengeRequest = z.infer<typeof MfaChallengeRequestSchema>;

export const MfaChallengeResponseSchema = z.object({
  challengeId: z.string(),
  deliveryChannel: MfaDeliveryChannel,
  expiresAt: z.string(),
});
export type MfaChallengeResponse = z.infer<typeof MfaChallengeResponseSchema>;

// ─── MFA Verify DTOs ─────────────────────────────────────────────────────────

export const MfaVerifyRequestSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().min(1),
});
export type MfaVerifyRequest = z.infer<typeof MfaVerifyRequestSchema>;

export const MfaVerifyResponseSchema = z.object({
  verified: z.boolean(),
  mfaLevel: z.string(),
  mfaLevelExpiresAt: z.string().nullable(),
});
export type MfaVerifyResponse = z.infer<typeof MfaVerifyResponseSchema>;

// ─── MFA Factors List ────────────────────────────────────────────────────────

export const MfaFactorResponseSchema = z.object({
  factorId: z.string(),
  factorType: MfaFactorType,
  status: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});
export type MfaFactorResponse = z.infer<typeof MfaFactorResponseSchema>;

// ─── API Key DTOs ────────────────────────────────────────────────────────────

export const CreateApiKeyRequestSchema = z.object({
  serviceAccountId: z.string().min(1),
  name: z.string().min(1).max(100),
  scopes: z.array(z.string().min(1)),
  allowedIps: z.array(z.string()).nullable(),
  expiresInDays: z.number().int().min(1).max(365).nullable(),
});
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;

export const CreateApiKeyResponseSchema = z.object({
  keyId: z.string(),
  keyPrefix: z.string(),
  rawKey: z.string(),
  createdAt: z.string(),
});
export type CreateApiKeyResponse = z.infer<typeof CreateApiKeyResponseSchema>;

export const ApiKeyListItemSchema = z.object({
  keyId: z.string(),
  keyPrefix: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  status: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string().nullable(),
});
export type ApiKeyListItem = z.infer<typeof ApiKeyListItemSchema>;

// ─── Session DTOs ────────────────────────────────────────────────────────────

export const SessionInfoSchema = z.object({
  sessionId: z.string(),
  audience: Audience,
  authMethod: z.string(),
  mfaLevel: z.string(),
  clientId: z.string().nullable(),
  createdAt: z.string(),
  lastSeenAt: z.string(),
  expiresAt: z.string(),
  ipHash: z.string().nullable(),
  userAgentHash: z.string().nullable(),
});
export type SessionInfo = z.infer<typeof SessionInfoSchema>;

// ─── Audit Event Envelope ────────────────────────────────────────────────────

export const AuditEventEnvelopeSchema = z.object({
  id: z.string(),
  clientId: z.string().nullable(),
  actorType: z.string(),
  actorId: z.string(),
  membershipId: z.string().nullable(),
  eventType: z.string(),
  occurredAt: z.string(),
  correlationId: z.string(),
  ipHash: z.string().nullable(),
  deviceHash: z.string().nullable(),
  severity: z.string(),
  metadataJson: z.string().nullable(),
});
export type AuditEventEnvelope = z.infer<typeof AuditEventEnvelopeSchema>;

// ─── Whoami Response ─────────────────────────────────────────────────────────

export const WhoamiResponseSchema = z.object({
  actorType: z.string(),
  userId: z.string().nullable(),
  clientId: z.string().nullable(),
  membershipId: z.string().nullable(),
  roles: z.array(z.string()),
  audience: Audience,
  authMethod: z.string(),
  mfaLevel: z.string(),
});
export type WhoamiResponse = z.infer<typeof WhoamiResponseSchema>;
