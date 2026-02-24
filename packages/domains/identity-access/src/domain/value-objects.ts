import { z } from "zod";

// ─── Audience ────────────────────────────────────────────────────────────────

export const Audience = z.enum(["console", "resident", "command", "service"]);
export type Audience = z.infer<typeof Audience>;

// ─── Auth Method ─────────────────────────────────────────────────────────────

export const AuthMethod = z.enum([
  "oidc",
  "password_phone",
  "api_key",
  "magic_link",
]);
export type AuthMethod = z.infer<typeof AuthMethod>;

// ─── Auth Strategy ───────────────────────────────────────────────────────────

export const AuthStrategy = z.enum([
  "OIDC",
  "PHONE_PASSWORD",
  "MAGIC_LINK",
  "PASSKEY",
  "API_KEY",
]);
export type AuthStrategy = z.infer<typeof AuthStrategy>;

// ─── MFA Level ───────────────────────────────────────────────────────────────

export const MfaLevel = z.enum(["NONE", "STEP_UP", "STRONG"]);
export type MfaLevel = z.infer<typeof MfaLevel>;

// ─── Actor Type ──────────────────────────────────────────────────────────────

export const ActorType = z.enum([
  "USER",
  "SERVICE_ACCOUNT",
  "INTEGRATION",
  "SYSTEM",
]);
export type ActorType = z.infer<typeof ActorType>;

// ─── Identity Type ───────────────────────────────────────────────────────────

export const IdentityType = z.enum(["EMAIL", "PHONE", "OIDC_SUB"]);
export type IdentityType = z.infer<typeof IdentityType>;

// ─── User Status ─────────────────────────────────────────────────────────────

export const UserStatus = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);
export type UserStatus = z.infer<typeof UserStatus>;

// ─── Membership Status ───────────────────────────────────────────────────────

export const MembershipStatus = z.enum(["INVITED", "ACTIVE", "SUSPENDED"]);
export type MembershipStatus = z.infer<typeof MembershipStatus>;

// ─── Session Status helpers ──────────────────────────────────────────────────

export const SessionStatus = z.enum(["ACTIVE", "REVOKED", "EXPIRED"]);
export type SessionStatus = z.infer<typeof SessionStatus>;

// ─── MFA Factor Type ─────────────────────────────────────────────────────────

export const MfaFactorType = z.enum(["TOTP", "WEBAUTHN", "SMS_OTP"]);
export type MfaFactorType = z.infer<typeof MfaFactorType>;

// ─── MFA Factor Status ───────────────────────────────────────────────────────

export const MfaFactorStatus = z.enum(["ACTIVE", "DISABLED"]);
export type MfaFactorStatus = z.infer<typeof MfaFactorStatus>;

// ─── MFA Challenge Type ──────────────────────────────────────────────────────

export const MfaChallengeType = z.enum(["STEP_UP", "LOGIN"]);
export type MfaChallengeType = z.infer<typeof MfaChallengeType>;

// ─── MFA Delivery Channel ────────────────────────────────────────────────────

export const MfaDeliveryChannel = z.enum(["SMS", "APP", "WEBAUTHN"]);
export type MfaDeliveryChannel = z.infer<typeof MfaDeliveryChannel>;

// ─── MFA Challenge Status ────────────────────────────────────────────────────

export const MfaChallengeStatus = z.enum([
  "PENDING",
  "VERIFIED",
  "EXPIRED",
  "FAILED",
]);
export type MfaChallengeStatus = z.infer<typeof MfaChallengeStatus>;

// ─── Service Account Status ──────────────────────────────────────────────────

export const ServiceAccountStatus = z.enum(["ACTIVE", "SUSPENDED", "DELETED"]);
export type ServiceAccountStatus = z.infer<typeof ServiceAccountStatus>;

// ─── API Key Status ──────────────────────────────────────────────────────────

export const ApiKeyStatus = z.enum(["ACTIVE", "REVOKED", "EXPIRED"]);
export type ApiKeyStatus = z.infer<typeof ApiKeyStatus>;

// ─── Audit Event Severity ────────────────────────────────────────────────────

export const AuditSeverity = z.enum(["INFO", "WARNING", "CRITICAL"]);
export type AuditSeverity = z.infer<typeof AuditSeverity>;

// ─── Audit Event Types ───────────────────────────────────────────────────────

export const AuditEventType = z.enum([
  "AUTH_LOGIN_SUCCESS",
  "AUTH_LOGIN_FAIL",
  "AUTH_LOGOUT",
  "AUTH_SESSION_CREATED",
  "AUTH_SESSION_REVOKED",
  "AUTH_CLIENT_SELECTED",
  "MFA_ENROLL_SUCCESS",
  "MFA_ENROLL_FAIL",
  "MFA_CHALLENGE_CREATED",
  "MFA_STEP_UP_SUCCESS",
  "MFA_STEP_UP_FAIL",
  "MFA_FACTOR_DISABLED",
  "APIKEY_CREATED",
  "APIKEY_REVOKED",
  "APIKEY_USED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "ACCOUNT_LOCKED",
  "ACCOUNT_UNLOCKED",
  "POLICY_DENIED",
  "AUDIENCE_MISMATCH",
]);
export type AuditEventType = z.infer<typeof AuditEventType>;
