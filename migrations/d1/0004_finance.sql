-- Charge definitions
CREATE TABLE IF NOT EXISTS charge_definitions (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  chargeType TEXT NOT NULL,
  defaultAmount TEXT,
  defaultCurrency TEXT NOT NULL DEFAULT 'USD',
  glCode TEXT,
  taxable INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_charge_definitions_clientId ON charge_definitions(clientId);

-- Charge plans (recurring billing)
CREATE TABLE IF NOT EXISTS charge_plans (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  chargeDefinitionId TEXT NOT NULL REFERENCES charge_definitions(id),
  name TEXT NOT NULL,
  recurrenceType TEXT NOT NULL DEFAULT 'monthly',
  recurrenceDay INTEGER,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  startDate TEXT NOT NULL,
  endDate TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','cancelled')),
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_charge_plans_clientId ON charge_plans(clientId);
CREATE INDEX idx_charge_plans_chargeDefinitionId ON charge_plans(chargeDefinitionId);

-- Charge assignments (binding plans to entities)
CREATE TABLE IF NOT EXISTS charge_assignments (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  chargePlanId TEXT NOT NULL REFERENCES charge_plans(id),
  scopeType TEXT NOT NULL CHECK(scopeType IN ('property','unit','lease','resident')),
  scopeId TEXT NOT NULL,
  overrideAmount TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','paused','cancelled')),
  effectiveFrom TEXT NOT NULL,
  effectiveTo TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_charge_assignments_clientId ON charge_assignments(clientId);
CREATE INDEX idx_charge_assignments_scopeType_scopeId ON charge_assignments(scopeType, scopeId);

-- Ledger entries (append-only / immutable)
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  leaseId TEXT,
  unitId TEXT,
  entryType TEXT NOT NULL CHECK(entryType IN ('charge','payment','credit','waiver','adjustment','refund','write_off')),
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  chargeDefinitionId TEXT,
  referenceType TEXT,
  referenceId TEXT,
  effectiveDate TEXT NOT NULL,
  postedAt TEXT NOT NULL DEFAULT (datetime('now')),
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_ledger_entries_clientId ON ledger_entries(clientId);
CREATE INDEX idx_ledger_entries_leaseId ON ledger_entries(leaseId);
CREATE INDEX idx_ledger_entries_effectiveDate ON ledger_entries(effectiveDate);
CREATE INDEX idx_ledger_entries_entryType ON ledger_entries(entryType);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  leaseId TEXT,
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  paymentMethod TEXT NOT NULL,
  externalReference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','reversed','refunded')),
  allocatedAmount TEXT NOT NULL DEFAULT '0',
  unallocatedAmount TEXT NOT NULL DEFAULT '0',
  paidAt TEXT,
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_payments_clientId ON payments(clientId);
CREATE INDEX idx_payments_leaseId ON payments(leaseId);
CREATE INDEX idx_payments_status ON payments(status);

-- Payment allocations
CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  paymentId TEXT NOT NULL REFERENCES payments(id),
  ledgerEntryId TEXT NOT NULL REFERENCES ledger_entries(id),
  amount TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  allocatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_payment_allocations_clientId ON payment_allocations(clientId);
CREATE INDEX idx_payment_allocations_paymentId ON payment_allocations(paymentId);
CREATE INDEX idx_payment_allocations_ledgerEntryId ON payment_allocations(ledgerEntryId);

-- Policy versions (stores all policy configs)
CREATE TABLE IF NOT EXISTS policy_versions (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  policyKind TEXT NOT NULL CHECK(policyKind IN ('interest','late_fee','allocation','reminder')),
  version INTEGER NOT NULL,
  configJson TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  publishedAt TEXT,
  publishedBy TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_policy_versions_clientId_kind ON policy_versions(clientId, policyKind);
CREATE UNIQUE INDEX idx_policy_versions_unique ON policy_versions(clientId, policyKind, version);

-- Reminder tasks
CREATE TABLE IF NOT EXISTS reminder_tasks (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  leaseId TEXT,
  residentUserId TEXT,
  reminderType TEXT NOT NULL,
  channel TEXT NOT NULL CHECK(channel IN ('email','sms','push')),
  scheduledAt TEXT NOT NULL,
  sentAt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sent','failed','cancelled')),
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reminder_tasks_clientId ON reminder_tasks(clientId);
CREATE INDEX idx_reminder_tasks_scheduledAt ON reminder_tasks(scheduledAt);
CREATE INDEX idx_reminder_tasks_status ON reminder_tasks(status);

-- Finance runs (delinquency, interest, late fee)
CREATE TABLE IF NOT EXISTS finance_runs (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  runType TEXT NOT NULL CHECK(runType IN ('late_fee','interest_accrual','charge_generation','reminder')),
  runKey TEXT NOT NULL,
  policyVersionId TEXT,
  status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed')),
  itemsProcessed INTEGER NOT NULL DEFAULT 0,
  errors TEXT DEFAULT '[]',
  startedAt TEXT NOT NULL DEFAULT (datetime('now')),
  completedAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_finance_runs_clientId ON finance_runs(clientId);
CREATE UNIQUE INDEX idx_finance_runs_unique ON finance_runs(clientId, runType, runKey);
