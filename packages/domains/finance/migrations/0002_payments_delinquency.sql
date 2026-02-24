-- Payments + Delinquency subsystem: D1 schema migration
-- Forward-only. Extends the existing finance schema.

-- ═══════════════════════════════════════════════════════════════════════════
-- Payments (operational record)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payments (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  lease_id              TEXT,
  resident_id           TEXT,
  payer_user_id         TEXT,
  status                TEXT    NOT NULL DEFAULT 'INITIATED',
  payment_method_type   TEXT    NOT NULL,
  provider              TEXT    NOT NULL,
  provider_payment_id   TEXT,
  provider_customer_id  TEXT,
  amount_received       INTEGER NOT NULL,
  received_currency     TEXT    NOT NULL,
  amount_ledger         INTEGER NOT NULL,
  ledger_currency       TEXT    NOT NULL,
  fx_rate               REAL,
  initiated_at          TEXT    NOT NULL,
  settled_at            TEXT,
  metadata_json         TEXT,
  idempotency_key       TEXT,
  created_by_actor_id   TEXT    NOT NULL,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('INITIATED','AUTHORIZED','SUCCEEDED','FAILED','CANCELED','REFUNDED','CHARGEBACK')),
  CHECK (payment_method_type IN ('CARD','ACH','BANK_TRANSFER','CASH','CHECK','MOBILE_MONEY','OTHER')),
  CHECK (provider IN ('STRIPE','MANUAL'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_id
  ON payments (client_id, provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_idempotency
  ON payments (client_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_client_lease
  ON payments (client_id, lease_id, created_at);

CREATE INDEX IF NOT EXISTS idx_payments_client_status
  ON payments (client_id, status, created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- Payment Allocations (map payments → charges)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS payment_allocations (
  id                              TEXT    NOT NULL,
  client_id                       TEXT    NOT NULL,
  payment_id                      TEXT    NOT NULL,
  target_ledger_charge_entry_id   TEXT    NOT NULL,
  allocated_amount                INTEGER NOT NULL,
  currency                        TEXT    NOT NULL,
  allocation_order                INTEGER NOT NULL,
  allocation_rule_applied         TEXT    NOT NULL,
  allocated_at                    TEXT    NOT NULL,
  actor_id                        TEXT    NOT NULL,
  correlation_id                  TEXT    NOT NULL,
  PRIMARY KEY (id),
  UNIQUE (client_id, payment_id, target_ledger_charge_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment
  ON payment_allocations (client_id, payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_charge
  ON payment_allocations (client_id, target_ledger_charge_entry_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Policy Versions (versioned finance policies)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS policy_versions (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  kind                  TEXT    NOT NULL,
  policy_id             TEXT    NOT NULL,
  schema_version        INTEGER NOT NULL,
  policy_version        INTEGER NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'DRAFT',
  scope_type            TEXT    NOT NULL DEFAULT 'CLIENT',
  scope_id              TEXT,
  json_payload          TEXT    NOT NULL,
  checksum              TEXT    NOT NULL,
  published_at          TEXT,
  published_by_actor_id TEXT,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (kind IN ('INTEREST','LATE_FEE','ALLOCATION','REMINDER')),
  CHECK (status IN ('DRAFT','PUBLISHED','DEPRECATED')),
  CHECK (scope_type IN ('CLIENT','PROPERTY','LEASE','GEO')),
  UNIQUE (client_id, kind, policy_id, policy_version)
);

CREATE INDEX IF NOT EXISTS idx_policy_versions_client_kind
  ON policy_versions (client_id, kind, status);

CREATE INDEX IF NOT EXISTS idx_policy_versions_scope
  ON policy_versions (client_id, kind, scope_type, scope_id, published_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- Interest Runs (accrual execution records for idempotency + audit)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS interest_runs (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  run_key               TEXT    NOT NULL,
  policy_id             TEXT    NOT NULL,
  policy_version        INTEGER NOT NULL,
  period_start          TEXT    NOT NULL,
  period_end            TEXT    NOT NULL,
  executed_at           TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'STARTED',
  principal_considered  INTEGER NOT NULL DEFAULT 0,
  interest_posted       INTEGER NOT NULL DEFAULT 0,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('STARTED','COMPLETED','FAILED')),
  UNIQUE (client_id, run_key)
);

CREATE INDEX IF NOT EXISTS idx_interest_runs_client_exec
  ON interest_runs (client_id, executed_at);

CREATE INDEX IF NOT EXISTS idx_interest_runs_client_status
  ON interest_runs (client_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- Interest Run Basis (audit detail per charge)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS interest_run_basis (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  interest_run_id       TEXT    NOT NULL,
  lease_id              TEXT    NOT NULL,
  charge_entry_id       TEXT    NOT NULL,
  principal_outstanding INTEGER NOT NULL,
  days_accrued          INTEGER NOT NULL,
  apr_percent_used      REAL    NOT NULL,
  basis_method          TEXT    NOT NULL,
  computed_interest     INTEGER NOT NULL,
  remainder_carried     REAL    NOT NULL DEFAULT 0,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_interest_run_basis_run
  ON interest_run_basis (client_id, interest_run_id);

CREATE INDEX IF NOT EXISTS idx_interest_run_basis_lease
  ON interest_run_basis (client_id, lease_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Late Fee Runs (execution records)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS late_fee_runs (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  run_key               TEXT    NOT NULL,
  policy_id             TEXT    NOT NULL,
  policy_version        INTEGER NOT NULL,
  as_of_date            TEXT    NOT NULL,
  executed_at           TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'STARTED',
  charges_considered    INTEGER NOT NULL DEFAULT 0,
  fees_posted           INTEGER NOT NULL DEFAULT 0,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('STARTED','COMPLETED','FAILED')),
  UNIQUE (client_id, run_key)
);

CREATE INDEX IF NOT EXISTS idx_late_fee_runs_client_exec
  ON late_fee_runs (client_id, executed_at);

CREATE INDEX IF NOT EXISTS idx_late_fee_runs_client_status
  ON late_fee_runs (client_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- Late Fee Run Items (per-charge detail)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS late_fee_run_items (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  late_fee_run_id       TEXT    NOT NULL,
  lease_id              TEXT    NOT NULL,
  charge_entry_id       TEXT    NOT NULL,
  outstanding_at_run    INTEGER NOT NULL,
  fee_amount_posted     INTEGER NOT NULL,
  occurrence_number     INTEGER NOT NULL,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_late_fee_run_items_run
  ON late_fee_run_items (client_id, late_fee_run_id);

CREATE INDEX IF NOT EXISTS idx_late_fee_run_items_charge
  ON late_fee_run_items (client_id, charge_entry_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Reminder Tasks (scheduled reminders with idempotency)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reminder_tasks (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  run_key               TEXT    NOT NULL,
  trigger_id            TEXT    NOT NULL,
  target_type           TEXT    NOT NULL,
  target_id             TEXT    NOT NULL,
  scheduled_for         TEXT    NOT NULL,
  channels_json         TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'PENDING',
  attempts              INTEGER NOT NULL DEFAULT 0,
  last_attempt_at       TEXT,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('PENDING','SENT','FAILED','CANCELED')),
  CHECK (target_type IN ('LEASE','CHARGE')),
  UNIQUE (client_id, run_key)
);

CREATE INDEX IF NOT EXISTS idx_reminder_tasks_scheduled
  ON reminder_tasks (client_id, scheduled_for, status);

CREATE INDEX IF NOT EXISTS idx_reminder_tasks_target
  ON reminder_tasks (client_id, target_type, target_id);
