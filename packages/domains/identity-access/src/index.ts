// ─── Domain: Value Objects ───────────────────────────────────────────────────
export {
  Audience,
  AuthMethod,
  AuthStrategy,
  MfaLevel,
  ActorType,
  IdentityType,
  UserStatus,
  MembershipStatus,
  SessionStatus,
  MfaFactorType,
  MfaFactorStatus,
  MfaChallengeType,
  MfaDeliveryChannel,
  MfaChallengeStatus,
  ServiceAccountStatus,
  ApiKeyStatus,
  AuditSeverity,
  AuditEventType,
} from "./domain/value-objects.js";

// ─── Domain: Entities ────────────────────────────────────────────────────────
export {
  UserSchema,
  type User,
  UserIdentitySchema,
  type UserIdentity,
  MembershipSchema,
  type Membership,
  SessionEntitySchema,
  type SessionEntity,
  PasswordCredentialSchema,
  type PasswordCredential,
  MfaFactorSchema,
  type MfaFactor,
  MfaChallengeEntitySchema,
  type MfaChallengeEntity,
  ServiceAccountSchema,
  type ServiceAccount,
  ApiKeyEntitySchema,
  type ApiKeyEntity,
  AuditEventSchema,
  type AuditEvent,
  AuthRateLimitSchema,
  type AuthRateLimit,
} from "./domain/entities.js";

// ─── Domain: ActorContext ────────────────────────────────────────────────────
export {
  ActorContextSchema,
  type ActorContext,
  hasClientSelected,
  meetsRequiredMfaLevel,
} from "./domain/actor-context.js";

// ─── Domain: Auth Config ─────────────────────────────────────────────────────
export {
  PasswordPolicySchema,
  type PasswordPolicy,
  RateLimitPolicySchema,
  type RateLimitPolicy,
  LockoutPolicySchema,
  type LockoutPolicy,
  MfaPolicySchema,
  type MfaPolicy,
  RiskControlsSchema,
  type RiskControls,
  ConsoleAuthConfigSchema,
  type ConsoleAuthConfig,
  CommandAuthConfigSchema,
  type CommandAuthConfig,
  ResidentAuthConfigSchema,
  type ResidentAuthConfig,
  AudienceAuthConfigSchema,
  type AudienceAuthConfig,
} from "./domain/auth-config.js";

// ─── Domain: Middleware ──────────────────────────────────────────────────────
export {
  AuthErrorCode,
  AuthObligationSchema,
  type AuthObligation,
  type RouteAuthRequirement,
  enforceAudience,
  enforceClientSelection,
  mapPolicyObligations,
} from "./domain/middleware.js";

// ─── Domain: DTOs ────────────────────────────────────────────────────────────
export {
  OidcLoginRequestSchema,
  type OidcLoginRequest,
  OidcCallbackRequestSchema,
  type OidcCallbackRequest,
  ResidentLoginRequestSchema,
  type ResidentLoginRequest,
  ResidentLoginResponseSchema,
  type ResidentLoginResponse,
  PasswordResetRequestSchema,
  type PasswordResetRequest,
  PasswordResetVerifySchema,
  type PasswordResetVerify,
  PasswordResetCompleteSchema,
  type PasswordResetComplete,
  SelectClientRequestSchema,
  type SelectClientRequest,
  MfaEnrollRequestSchema,
  type MfaEnrollRequest,
  MfaEnrollResponseSchema,
  type MfaEnrollResponse,
  MfaChallengeRequestSchema,
  type MfaChallengeRequest,
  MfaChallengeResponseSchema,
  type MfaChallengeResponse,
  MfaVerifyRequestSchema,
  type MfaVerifyRequest,
  MfaVerifyResponseSchema,
  type MfaVerifyResponse,
  MfaFactorResponseSchema,
  type MfaFactorResponse,
  CreateApiKeyRequestSchema,
  type CreateApiKeyRequest,
  CreateApiKeyResponseSchema,
  type CreateApiKeyResponse,
  ApiKeyListItemSchema,
  type ApiKeyListItem,
  SessionInfoSchema,
  type SessionInfo,
  AuditEventEnvelopeSchema,
  type AuditEventEnvelope,
  WhoamiResponseSchema,
  type WhoamiResponse,
} from "./domain/dtos.js";

// ─── Ports ───────────────────────────────────────────────────────────────────
export type {
  UserRepository,
  UserIdentityRepository,
  MembershipRepository,
  SessionRepository,
  PasswordCredentialRepository,
  MfaFactorRepository,
  MfaChallengeRepository,
  ServiceAccountRepository,
  ApiKeyRepository,
  AuditEventRepository,
  RateLimitRepository,
  PasswordHasher,
  OtpGenerator,
} from "./ports/repositories.js";

// ─── Application Use Cases ───────────────────────────────────────────────────
export {
  residentLogin,
  AuthError,
  type ResidentLoginInput,
  type ResidentLoginOutput,
} from "./application/resident-login.js";

export {
  selectClient,
  type SelectClientInput,
} from "./application/select-client.js";

export {
  createMfaChallenge,
  verifyMfaChallenge,
  type CreateMfaChallengeInput,
  type CreateMfaChallengeOutput,
  type VerifyMfaChallengeInput,
  type VerifyMfaChallengeOutput,
} from "./application/step-up-mfa.js";
