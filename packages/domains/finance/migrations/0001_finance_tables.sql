-- Finance bounded context: D1 schema migration
-- Forward-only. Never edit posted ledger entries; use voids/adjustments.

-- ─── Charge Definitions (catalog) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS charge_definitions (
  id             TEXT    NOT NULL,
  client_id      TEXT    NOT NULL,
  name           TEXT    NOT NULL,
  category       TEXT    NOT NULL,
  description    TEXT,
  gl_code        TEXT,
  taxable        INTEGER NOT NULL DEFAULT 0,
  status         TEXT    NOT NULL DEFAULT 'ACTIVE',
  metadata_schema TEXT,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  CHECK (category IN ('RENT','PARKING','UTILITY','FEE','DEPOSIT','PET','AMENITY','LATE_FEE','INSURANCE','TAX','OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_charge_definitions_client
  ON charge_definitions (client_id, status);

-- ─── Charge Plans (calculation + schedule templates) ───────────────────────

CREATE TABLE IF NOT EXISTS charge_plans (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  charge_definition_id  TEXT    NOT NULL,
  name                  TEXT    NOT NULL,
  base_amount           REAL    NOT NULL,
  base_currency         TEXT    NOT NULL,
  recurrence_json       TEXT    NOT NULL,
  due_rule_json         TEXT    NOT NULL,
  proration_policy      TEXT    NOT NULL DEFAULT 'NONE',
  status                TEXT    NOT NULL DEFAULT 'ACTIVE',
  metadata              TEXT,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  CHECK (proration_policy IN ('NONE','DAILY_ACTUAL','DAILY_30','HOURLY'))
);

CREATE INDEX IF NOT EXISTS idx_charge_plans_client
  ON charge_plans (client_id, status);

CREATE INDEX IF NOT EXISTS idx_charge_plans_definition
  ON charge_plans (client_id, charge_definition_id);

-- ─── Charge Assignments (binding plan to scope with overrides) ─────────────

CREATE TABLE IF NOT EXISTS charge_assignments (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  charge_plan_id        TEXT    NOT NULL,
  scope_type            TEXT    NOT NULL,
  scope_id              TEXT    NOT NULL,
  lease_id              TEXT,
  override_amount       REAL,
  override_currency     TEXT,
  override_recurrence   TEXT,
  allocation_rule_json  TEXT,
  effective_from        TEXT    NOT NULL,
  effective_to          TEXT,
  status                TEXT    NOT NULL DEFAULT 'ACTIVE',
  metadata              TEXT,
  created_at            TEXT    NOT NULL,
  updated_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (scope_type IN ('PROPERTY', 'UNIT', 'LEASE', 'RESIDENT')),
  CHECK (status IN ('ACTIVE', 'ENDED', 'SUSPENDED'))
);

CREATE INDEX IF NOT EXISTS idx_charge_assignments_client_scope
  ON charge_assignments (client_id, scope_type, scope_id, status);

CREATE INDEX IF NOT EXISTS idx_charge_assignments_client_lease
  ON charge_assignments (client_id, lease_id, status);

CREATE INDEX IF NOT EXISTS idx_charge_assignments_active_window
  ON charge_assignments (client_id, status, effective_from, effective_to);

-- ─── Charge Occurrences (generated periods, idempotency tracking) ──────────

CREATE TABLE IF NOT EXISTS charge_occurrences (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  charge_assignment_id  TEXT    NOT NULL,
  lease_id              TEXT,
  period_start          TEXT    NOT NULL,
  period_end            TEXT    NOT NULL,
  due_date              TEXT    NOT NULL,
  amount                REAL    NOT NULL,
  currency              TEXT    NOT NULL,
  proration_applied     INTEGER NOT NULL DEFAULT 0,
  status                TEXT    NOT NULL DEFAULT 'GENERATED',
  generated_at          TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (status IN ('GENERATED', 'POSTED', 'VOIDED')),
  UNIQUE (client_id, lease_id, charge_assignment_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_charge_occurrences_assignment
  ON charge_occurrences (client_id, charge_assignment_id, period_start);

-- ─── Immutable Ledger ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ledger_entries (
  id                    TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  entry_type            TEXT    NOT NULL,
  property_id           TEXT    NOT NULL,
  unit_id               TEXT,
  lease_id              TEXT,
  resident_id           TEXT,
  amount                REAL    NOT NULL,
  currency              TEXT    NOT NULL,
  due_date              TEXT,
  posted_at             TEXT    NOT NULL,
  charge_definition_id  TEXT,
  charge_plan_id        TEXT,
  charge_assignment_id  TEXT,
  occurrence_id         TEXT,
  allocation_group_id   TEXT,
  linked_entry_id       TEXT,
  description           TEXT    NOT NULL,
  idempotency_key       TEXT,
  created_by_actor_id   TEXT    NOT NULL,
  correlation_id        TEXT    NOT NULL,
  created_at            TEXT    NOT NULL,
  PRIMARY KEY (id),
  CHECK (entry_type IN ('CHARGE','PAYMENT','CREDIT','WAIVER','ADJUSTMENT','REFUND','VOID'))
);

-- No UPDATE trigger needed since the app layer enforces immutability.
-- Corrections are via VOID/ADJUSTMENT/CREDIT/WAIVER entries.

CREATE INDEX IF NOT EXISTS idx_ledger_client_lease_due
  ON ledger_entries (client_id, lease_id, due_date);

CREATE INDEX IF NOT EXISTS idx_ledger_client_property
  ON ledger_entries (client_id, property_id, posted_at);

CREATE INDEX IF NOT EXISTS idx_ledger_client_resident
  ON ledger_entries (client_id, resident_id, posted_at);

CREATE INDEX IF NOT EXISTS idx_ledger_idempotency
  ON ledger_entries (client_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_ledger_linked
  ON ledger_entries (client_id, linked_entry_id);

CREATE INDEX IF NOT EXISTS idx_ledger_occurrence
  ON ledger_entries (client_id, occurrence_id);

CREATE INDEX IF NOT EXISTS idx_ledger_allocation_group
  ON ledger_entries (client_id, allocation_group_id);

-- ─── Outbox (domain events for finance context) ───────────────────────────

CREATE TABLE IF NOT EXISTS finance_outbox (
  id            TEXT    NOT NULL,
  client_id     TEXT    NOT NULL,
  event_type    TEXT    NOT NULL,
  payload       TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'pending',
  retry_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL,
  published_at  TEXT,
  failed_at     TEXT,
  error_message TEXT,
  PRIMARY KEY (id),
  CHECK (status IN ('pending', 'published', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_finance_outbox_pending
  ON finance_outbox (status, created_at);

-- ─── Processed Events (idempotency for consumers) ─────────────────────────

CREATE TABLE IF NOT EXISTS finance_processed_events (
  client_id     TEXT    NOT NULL,
  event_id      TEXT    NOT NULL,
  handler_name  TEXT    NOT NULL,
  processed_at  TEXT    NOT NULL,
  PRIMARY KEY (client_id, event_id, handler_name)
);
