-- Settlement, Disputes, Exports, Projections: D1 schema migration
-- Forward-only. Extends the existing finance schema.

-- ═══════════════════════════════════════════════════════════════════════════
-- Provider Balance Transactions (normalized from provider webhooks/syncs)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS provider_balance_transactions (
  id                          TEXT    NOT NULL,
  client_id                   TEXT    NOT NULL,
  provider                    TEXT    NOT NULL,
  provider_txn_id             TEXT    NOT NULL,
  type                        TEXT    NOT NULL,
  amount                      INTEGER NOT NULL,
  currency                    TEXT    NOT NULL,
  fee_amount                  INTEGER NOT NULL DEFAULT 0,
  fee_currency                TEXT    NOT NULL,
  net_amount                  INTEGER NOT NULL,
  occurred_at                 TEXT    NOT NULL,
  available_on                TEXT,
  related_provider_payment_id TEXT,
  related_provider_charge_id  TEXT,
  raw_ref                     TEXT,
  created_at                  TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (type IN ('CHARGE','REFUND','DISPUTE','DISPUTE_FEE','PAYOUT','PAYOUT_REVERSAL','ADJUSTMENT','FEE')),
  UNIQUE (client_id, provider, provider_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_pbt_client_occurred
  ON provider_balance_transactions (client_id, occurred_at);

CREATE INDEX IF NOT EXISTS idx_pbt_client_provider_payment
  ON provider_balance_transactions (client_id, provider, related_provider_payment_id)
  WHERE related_provider_payment_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Provider Payouts (settlement deposits)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS provider_payouts (
  id                      TEXT    NOT NULL,
  client_id               TEXT    NOT NULL,
  provider                TEXT    NOT NULL,
  provider_payout_id      TEXT    NOT NULL,
  amount                  INTEGER NOT NULL,
  currency                TEXT    NOT NULL,
  arrival_date            TEXT    NOT NULL,
  destination_masked      TEXT,
  status                  TEXT    NOT NULL DEFAULT 'PENDING',
  reconciliation_status   TEXT    NOT NULL DEFAULT 'UNMATCHED',
  correlation_id          TEXT    NOT NULL,
  created_at              TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('PENDING','PAID','FAILED','CANCELED')),
  CHECK (reconciliation_status IN ('UNMATCHED','PARTIALLY_MATCHED','MATCHED')),
  UNIQUE (client_id, provider, provider_payout_id)
);

CREATE INDEX IF NOT EXISTS idx_payouts_client_arrival
  ON provider_payouts (client_id, arrival_date);

-- ═══════════════════════════════════════════════════════════════════════════
-- Reconciliation Matches (links provider txns ↔ internal payments ↔ ledger)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id                  TEXT    NOT NULL,
  client_id           TEXT    NOT NULL,
  provider            TEXT    NOT NULL,
  provider_txn_id     TEXT    NOT NULL,
  payment_id          TEXT,
  ledger_entry_id     TEXT,
  status              TEXT    NOT NULL,
  mismatch_reasons    TEXT    NOT NULL DEFAULT '[]',
  provider_amount     INTEGER NOT NULL,
  provider_currency   TEXT    NOT NULL,
  internal_amount     INTEGER,
  internal_currency   TEXT,
  matched_at          TEXT    NOT NULL,
  notes               TEXT,
  correlation_id      TEXT    NOT NULL,
  created_at          TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('MATCHED','MISMATCH','NEEDS_REVIEW')),
  UNIQUE (client_id, provider, provider_txn_id)
);

CREATE INDEX IF NOT EXISTS idx_recon_client_status
  ON reconciliation_matches (client_id, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- Disputes
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS disputes (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  payment_id            TEXT    NOT NULL,
  provider              TEXT    NOT NULL,
  provider_dispute_id   TEXT    NOT NULL,
  status                TEXT    NOT NULL DEFAULT 'OPEN',
  reason                TEXT    NOT NULL,
  amount                INTEGER NOT NULL,
  currency              TEXT    NOT NULL,
  fee_amount            INTEGER,
  fee_currency          TEXT,
  opened_at             TEXT    NOT NULL,
  evidence_due_by       TEXT,
  closed_at             TEXT,
  pause_reminders       INTEGER NOT NULL DEFAULT 1,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('OPEN','EVIDENCE_SUBMITTED','WON','LOST','CLOSED')),
  UNIQUE (client_id, provider, provider_dispute_id)
);

CREATE INDEX IF NOT EXISTS idx_disputes_client_status
  ON disputes (client_id, status, opened_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- Refunds
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS refunds (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  payment_id            TEXT    NOT NULL,
  provider              TEXT    NOT NULL,
  provider_refund_id    TEXT,
  status                TEXT    NOT NULL DEFAULT 'INITIATED',
  amount                INTEGER NOT NULL,
  currency              TEXT    NOT NULL,
  reason                TEXT    NOT NULL,
  reversal_map_id       TEXT,
  idempotency_key       TEXT,
  created_by_actor_id   TEXT    NOT NULL,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('INITIATED','SUCCEEDED','FAILED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_provider_id
  ON refunds (client_id, provider, provider_refund_id)
  WHERE provider_refund_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_idempotency
  ON refunds (client_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refunds_client_payment
  ON refunds (client_id, payment_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Allocation Reversal Maps (deterministic reversal tracking for refunds/chargebacks)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS allocation_reversal_maps (
  id                              TEXT    NOT NULL,
  client_id                       TEXT    NOT NULL,
  source_type                     TEXT    NOT NULL,
  source_id                       TEXT    NOT NULL,
  original_allocation_id          TEXT    NOT NULL,
  reversed_amount                 INTEGER NOT NULL,
  currency                        TEXT    NOT NULL,
  correlation_id                  TEXT    NOT NULL,
  created_at                      TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (source_type IN ('REFUND','CHARGEBACK'))
);

CREATE INDEX IF NOT EXISTS idx_reversal_maps_source
  ON allocation_reversal_maps (client_id, source_type, source_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Export Jobs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS export_jobs (
  id                        TEXT    NOT NULL,
  client_id                 TEXT    NOT NULL,
  kind                      TEXT    NOT NULL,
  status                    TEXT    NOT NULL DEFAULT 'QUEUED',
  parameters_json           TEXT    NOT NULL,
  result_ref                TEXT,
  is_sandbox_watermarked    INTEGER NOT NULL DEFAULT 0,
  created_by_actor_id       TEXT    NOT NULL,
  correlation_id            TEXT    NOT NULL,
  created_at                TEXT    NOT NULL,
  completed_at              TEXT,
  failure_reason            TEXT,
  PRIMARY KEY (id),
  CHECK (kind IN ('LEDGER_EXPORT','STATEMENT','RECON_REPORT','DISPUTE_REPORT')),
  CHECK (status IN ('QUEUED','RUNNING','COMPLETED','FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_client_status
  ON export_jobs (client_id, status, created_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- Compliance Profiles (geo-based regulatory caps)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS compliance_profiles (
  id                          TEXT    NOT NULL,
  geo_key                     TEXT    NOT NULL,
  client_id                   TEXT,
  max_apr_percent             REAL    NOT NULL,
  late_fee_allowed            INTEGER NOT NULL DEFAULT 1,
  recurring_late_fee_allowed  INTEGER NOT NULL DEFAULT 0,
  compounding_allowed         INTEGER NOT NULL DEFAULT 0,
  retention_years             INTEGER NOT NULL DEFAULT 7,
  created_at                  TEXT    NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_geo
  ON compliance_profiles (geo_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- Projection / Read Model tables
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS lease_balance_summary (
  client_id       TEXT    NOT NULL,
  lease_id        TEXT    NOT NULL,
  property_id     TEXT    NOT NULL,
  total_charges   INTEGER NOT NULL DEFAULT 0,
  total_payments  INTEGER NOT NULL DEFAULT 0,
  total_credits   INTEGER NOT NULL DEFAULT 0,
  total_waivers   INTEGER NOT NULL DEFAULT 0,
  total_refunds   INTEGER NOT NULL DEFAULT 0,
  current_balance INTEGER NOT NULL DEFAULT 0,
  currency        TEXT    NOT NULL,
  last_updated_at TEXT    NOT NULL,
  PRIMARY KEY (client_id, lease_id)
);

CREATE INDEX IF NOT EXISTS idx_lease_bal_property
  ON lease_balance_summary (client_id, property_id);

CREATE TABLE IF NOT EXISTS resident_balance_summary (
  client_id       TEXT    NOT NULL,
  resident_id     TEXT    NOT NULL,
  total_balance   INTEGER NOT NULL DEFAULT 0,
  currency        TEXT    NOT NULL,
  lease_count     INTEGER NOT NULL DEFAULT 0,
  last_updated_at TEXT    NOT NULL,
  PRIMARY KEY (client_id, resident_id)
);

CREATE TABLE IF NOT EXISTS aging_bucket_summary (
  client_id       TEXT    NOT NULL,
  lease_id        TEXT    NOT NULL,
  property_id     TEXT    NOT NULL,
  current_amount  INTEGER NOT NULL DEFAULT 0,
  days_1_to_30    INTEGER NOT NULL DEFAULT 0,
  days_31_to_60   INTEGER NOT NULL DEFAULT 0,
  days_61_to_90   INTEGER NOT NULL DEFAULT 0,
  days_90_plus    INTEGER NOT NULL DEFAULT 0,
  currency        TEXT    NOT NULL,
  last_updated_at TEXT    NOT NULL,
  PRIMARY KEY (client_id, lease_id)
);

CREATE INDEX IF NOT EXISTS idx_aging_property
  ON aging_bucket_summary (client_id, property_id);

CREATE TABLE IF NOT EXISTS next_due_summary (
  client_id       TEXT    NOT NULL,
  lease_id        TEXT    NOT NULL,
  next_due_date   TEXT,
  next_due_amount INTEGER,
  currency        TEXT,
  last_updated_at TEXT    NOT NULL,
  PRIMARY KEY (client_id, lease_id)
);

CREATE TABLE IF NOT EXISTS delinquency_status_summary (
  client_id         TEXT    NOT NULL,
  lease_id          TEXT    NOT NULL,
  property_id       TEXT    NOT NULL,
  status            TEXT    NOT NULL DEFAULT 'CURRENT',
  days_overdue      INTEGER NOT NULL DEFAULT 0,
  total_overdue     INTEGER NOT NULL DEFAULT 0,
  currency          TEXT    NOT NULL,
  has_open_dispute  INTEGER NOT NULL DEFAULT 0,
  last_updated_at   TEXT    NOT NULL,
  PRIMARY KEY (client_id, lease_id),
  CHECK (status IN ('CURRENT','AT_RISK','DELINQUENT','IN_DISPUTE'))
);

CREATE INDEX IF NOT EXISTS idx_delinquency_property
  ON delinquency_status_summary (client_id, property_id);

CREATE INDEX IF NOT EXISTS idx_delinquency_status
  ON delinquency_status_summary (client_id, status);

CREATE TABLE IF NOT EXISTS open_charges_view (
  client_id               TEXT    NOT NULL,
  ledger_entry_id         TEXT    NOT NULL,
  lease_id                TEXT    NOT NULL,
  property_id             TEXT    NOT NULL,
  category                TEXT    NOT NULL,
  outstanding_amount      INTEGER NOT NULL,
  currency                TEXT    NOT NULL,
  due_date                TEXT    NOT NULL,
  is_disputed             INTEGER NOT NULL DEFAULT 0,
  charge_definition_id    TEXT,
  PRIMARY KEY (client_id, ledger_entry_id)
);

CREATE INDEX IF NOT EXISTS idx_open_charges_lease
  ON open_charges_view (client_id, lease_id, due_date);

CREATE INDEX IF NOT EXISTS idx_open_charges_property
  ON open_charges_view (client_id, property_id, due_date);
