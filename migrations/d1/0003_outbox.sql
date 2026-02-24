-- Outbox events (transactional outbox pattern)
CREATE TABLE IF NOT EXISTS outbox_events (
  id TEXT PRIMARY KEY,
  eventType TEXT NOT NULL,
  schemaVersion INTEGER NOT NULL DEFAULT 1,
  clientId TEXT,
  actorId TEXT,
  correlationId TEXT,
  payloadJson TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','DISPATCHED','FAILED')),
  retryCount INTEGER NOT NULL DEFAULT 0,
  maxRetries INTEGER NOT NULL DEFAULT 5,
  lastError TEXT,
  occurredAt TEXT NOT NULL DEFAULT (datetime('now')),
  publishedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_outbox_events_status ON outbox_events(status);
CREATE INDEX idx_outbox_events_clientId ON outbox_events(clientId);
CREATE INDEX idx_outbox_events_occurredAt ON outbox_events(occurredAt);

-- Processed event markers (idempotency)
CREATE TABLE IF NOT EXISTS processed_markers (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  handlerName TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL,
  processedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_processed_markers_unique ON processed_markers(clientId, handlerName, idempotencyKey);

-- Idempotency keys for API requests
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  idempotencyKey TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  responseStatus INTEGER,
  responseBody TEXT,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_idempotency_keys_unique ON idempotency_keys(clientId, idempotencyKey, endpoint);
CREATE INDEX idx_idempotency_keys_expiresAt ON idempotency_keys(expiresAt);
