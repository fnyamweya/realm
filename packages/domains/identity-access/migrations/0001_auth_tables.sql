-- Identity-Access D1 Migration: Auth subsystem tables
-- Forward-only migration for Cloudflare D1

-- ─── Users (global) ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  status        TEXT NOT NULL DEFAULT 'ACTIVE'
                CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
);

-- ─── User Identities (global login identifiers) ─────────────────────────────

CREATE TABLE IF NOT EXISTS user_identities (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL REFERENCES users(id),
  identityType    TEXT NOT NULL CHECK (identityType IN ('EMAIL', 'PHONE', 'OIDC_SUB')),
  normalizedValue TEXT NOT NULL,
  provider        TEXT,
  verifiedAt      TEXT,
  UNIQUE (identityType, provider, normalizedValue)
);

CREATE INDEX IF NOT EXISTS idx_user_identities_userId
  ON user_identities(userId);

-- ─── Memberships (user ↔ client binding) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS memberships (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id),
  clientId  TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'INVITED'
            CHECK (status IN ('INVITED', 'ACTIVE', 'SUSPENDED')),
  rolesJson TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE (userId, clientId)
);

CREATE INDEX IF NOT EXISTS idx_memberships_userId ON memberships(userId);
CREATE INDEX IF NOT EXISTS idx_memberships_clientId ON memberships(clientId);

-- ─── Sessions ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id                TEXT PRIMARY KEY,
  userId            TEXT NOT NULL REFERENCES users(id),
  activeClientId    TEXT,
  audience          TEXT NOT NULL CHECK (audience IN ('console', 'resident', 'command', 'service')),
  authMethod        TEXT NOT NULL CHECK (authMethod IN ('oidc', 'password_phone', 'api_key', 'magic_link')),
  mfaLevel          TEXT NOT NULL DEFAULT 'NONE'
                    CHECK (mfaLevel IN ('NONE', 'STEP_UP', 'STRONG')),
  mfaLevelExpiresAt TEXT,
  createdAt         TEXT NOT NULL,
  lastSeenAt        TEXT NOT NULL,
  expiresAt         TEXT NOT NULL,
  revokedAt         TEXT,
  ipHash            TEXT,
  deviceHash        TEXT,
  userAgentHash     TEXT,
  refreshTokenHash  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_audience
  ON sessions(userId, audience, revokedAt, expiresAt);

CREATE INDEX IF NOT EXISTS idx_sessions_client_audience
  ON sessions(activeClientId, audience, lastSeenAt);

-- ─── Password Credentials (phone+password strategy only) ────────────────────

CREATE TABLE IF NOT EXISTS password_credentials (
  userId            TEXT PRIMARY KEY REFERENCES users(id),
  passwordHash      TEXT NOT NULL,
  passwordUpdatedAt TEXT NOT NULL,
  failedAttempts    INTEGER NOT NULL DEFAULT 0,
  lockoutUntil      TEXT,
  lastFailedAt      TEXT,
  breachCheckedAt   TEXT
);

-- ─── MFA Factors ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mfa_factors (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL REFERENCES users(id),
  factorType      TEXT NOT NULL CHECK (factorType IN ('TOTP', 'WEBAUTHN', 'SMS_OTP')),
  encryptedSecret TEXT,
  publicKeyJson   TEXT,
  phoneNumberRef  TEXT,
  status          TEXT NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'DISABLED')),
  createdAt       TEXT NOT NULL,
  lastUsedAt      TEXT
);

CREATE INDEX IF NOT EXISTS idx_mfa_factors_userId ON mfa_factors(userId);

-- ─── MFA Challenges ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS mfa_challenges (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL REFERENCES users(id),
  sessionId       TEXT,
  challengeType   TEXT NOT NULL CHECK (challengeType IN ('STEP_UP', 'LOGIN')),
  deliveryChannel TEXT NOT NULL CHECK (deliveryChannel IN ('SMS', 'APP', 'WEBAUTHN')),
  codeHash        TEXT,
  expiresAt       TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'PENDING'
                  CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_status
  ON mfa_challenges(userId, status, expiresAt);

-- ─── Service Accounts ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS service_accounts (
  id        TEXT PRIMARY KEY,
  clientId  TEXT NOT NULL,
  name      TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'ACTIVE'
            CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_service_accounts_clientId
  ON service_accounts(clientId);

-- ─── API Keys ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id               TEXT PRIMARY KEY,
  clientId         TEXT NOT NULL,
  serviceAccountId TEXT NOT NULL REFERENCES service_accounts(id),
  keyPrefix        TEXT NOT NULL,
  keyHash          TEXT NOT NULL,
  scopesJson       TEXT NOT NULL DEFAULT '[]',
  allowedIpsJson   TEXT,
  status           TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'REVOKED', 'EXPIRED')),
  createdAt        TEXT NOT NULL,
  lastUsedAt       TEXT,
  revokedAt        TEXT,
  UNIQUE (clientId, keyPrefix)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_client_status
  ON api_keys(clientId, status);

-- ─── Audit Events ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id            TEXT PRIMARY KEY,
  clientId      TEXT,
  actorType     TEXT NOT NULL CHECK (actorType IN ('USER', 'SERVICE_ACCOUNT', 'INTEGRATION', 'SYSTEM')),
  actorId       TEXT NOT NULL,
  membershipId  TEXT,
  eventType     TEXT NOT NULL,
  occurredAt    TEXT NOT NULL,
  correlationId TEXT NOT NULL,
  ipHash        TEXT,
  deviceHash    TEXT,
  metadataJson  TEXT,
  severity      TEXT NOT NULL DEFAULT 'INFO'
                CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_audit_events_client_time
  ON audit_events(clientId, occurredAt);

CREATE INDEX IF NOT EXISTS idx_audit_events_type_time
  ON audit_events(eventType, occurredAt);

-- ─── Auth Rate Limits (persistent lockout tracking) ──────────────────────────

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  key          TEXT PRIMARY KEY,
  windowStart  TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  blockedUntil TEXT
);
