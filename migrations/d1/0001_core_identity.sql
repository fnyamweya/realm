-- Core Identity & Access tables
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  displayName TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deactivated')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);

-- User identities (OIDC, phone, email)
CREATE TABLE IF NOT EXISTS user_identities (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  identityType TEXT NOT NULL CHECK(identityType IN ('oidc','phone','email')),
  identifier TEXT NOT NULL,
  providerName TEXT,
  providerSubject TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_user_identities_type_identifier ON user_identities(identityType, identifier);
CREATE INDEX idx_user_identities_userId ON user_identities(userId);

-- Memberships (client-scoped roles)
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  clientId TEXT NOT NULL,
  roles TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_memberships_clientId ON memberships(clientId);
CREATE INDEX idx_memberships_userId ON memberships(userId);
CREATE UNIQUE INDEX idx_memberships_userId_clientId ON memberships(userId, clientId);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  audience TEXT NOT NULL CHECK(audience IN ('console','resident','command','service')),
  authMethod TEXT NOT NULL,
  activeClientId TEXT,
  mfaLevel TEXT NOT NULL DEFAULT 'NONE',
  mfaVerifiedAt TEXT,
  ipHash TEXT,
  deviceId TEXT,
  expiresAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked','expired')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_userId ON sessions(userId);
CREATE INDEX idx_sessions_expiresAt ON sessions(expiresAt);

-- Password credentials
CREATE TABLE IF NOT EXISTS password_credentials (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  passwordHash TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'scrypt',
  failedAttempts INTEGER NOT NULL DEFAULT 0,
  lockedUntil TEXT,
  lastFailedAt TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_password_credentials_userId ON password_credentials(userId);

-- MFA factors
CREATE TABLE IF NOT EXISTS mfa_factors (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  factorType TEXT NOT NULL CHECK(factorType IN ('totp','webauthn','sms','email')),
  secret TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','disabled')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mfa_factors_userId ON mfa_factors(userId);

-- MFA challenges
CREATE TABLE IF NOT EXISTS mfa_challenges (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id),
  factorId TEXT NOT NULL REFERENCES mfa_factors(id),
  challengeType TEXT NOT NULL,
  codeHash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  maxAttempts INTEGER NOT NULL DEFAULT 5,
  expiresAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','verified','failed','expired')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_mfa_challenges_userId ON mfa_challenges(userId);

-- Service accounts
CREATE TABLE IF NOT EXISTS service_accounts (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','revoked')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_service_accounts_clientId ON service_accounts(clientId);

-- API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  serviceAccountId TEXT NOT NULL REFERENCES service_accounts(id),
  clientId TEXT NOT NULL,
  keyHash TEXT NOT NULL,
  keyPrefix TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT '[]',
  allowedIps TEXT,
  expiresAt TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked','expired')),
  lastUsedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_api_keys_clientId ON api_keys(clientId);
CREATE INDEX idx_api_keys_keyPrefix ON api_keys(keyPrefix);

-- Audit events
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  clientId TEXT,
  actorId TEXT,
  eventType TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK(severity IN ('info','warning','critical')),
  targetType TEXT,
  targetId TEXT,
  metadata TEXT DEFAULT '{}',
  ipHash TEXT,
  correlationId TEXT,
  occurredAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_audit_events_clientId ON audit_events(clientId);
CREATE INDEX idx_audit_events_eventType ON audit_events(eventType);
CREATE INDEX idx_audit_events_occurredAt ON audit_events(occurredAt);

-- Auth rate limits
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id TEXT PRIMARY KEY,
  limitType TEXT NOT NULL,
  limitKey TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  windowStart TEXT NOT NULL,
  blockedUntil TEXT,
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_auth_rate_limits_type_key ON auth_rate_limits(limitType, limitKey);
