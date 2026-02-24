-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended','deactivated')),
  mode TEXT NOT NULL DEFAULT 'live' CHECK(mode IN ('live','sandbox')),
  settings TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX idx_clients_slug ON clients(slug);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  name TEXT NOT NULL,
  propertyType TEXT NOT NULL CHECK(propertyType IN ('residential','commercial','mixed','industrial')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
  address TEXT NOT NULL DEFAULT '{}',
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_properties_clientId ON properties(clientId);

-- Units
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  propertyId TEXT NOT NULL REFERENCES properties(id),
  unitNumber TEXT NOT NULL,
  unitType TEXT NOT NULL DEFAULT 'apartment',
  status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('vacant','occupied','maintenance','reserved')),
  bedrooms INTEGER,
  bathrooms REAL,
  squareFeet REAL,
  rentAmount TEXT,
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_units_clientId ON units(clientId);
CREATE INDEX idx_units_propertyId ON units(propertyId);
CREATE UNIQUE INDEX idx_units_clientId_propertyId_number ON units(clientId, propertyId, unitNumber);

-- Leases
CREATE TABLE IF NOT EXISTS leases (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  propertyId TEXT NOT NULL REFERENCES properties(id),
  unitId TEXT NOT NULL REFERENCES units(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_approval','active','expired','terminated','renewed')),
  leaseType TEXT NOT NULL DEFAULT 'fixed' CHECK(leaseType IN ('fixed','month_to_month','weekly')),
  startDate TEXT NOT NULL,
  endDate TEXT,
  rentAmount TEXT NOT NULL,
  rentCurrency TEXT NOT NULL DEFAULT 'USD',
  securityDeposit TEXT,
  parties TEXT NOT NULL DEFAULT '[]',
  terms TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_leases_clientId ON leases(clientId);
CREATE INDEX idx_leases_propertyId ON leases(propertyId);
CREATE INDEX idx_leases_unitId ON leases(unitId);
CREATE INDEX idx_leases_status ON leases(status);

-- Maintenance requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  propertyId TEXT NOT NULL,
  unitId TEXT,
  leaseId TEXT,
  residentUserId TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','emergency')),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','acknowledged','in_progress','completed','cancelled')),
  assignedTo TEXT,
  category TEXT,
  metadata TEXT DEFAULT '{}',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_maintenance_requests_clientId ON maintenance_requests(clientId);
CREATE INDEX idx_maintenance_requests_propertyId ON maintenance_requests(propertyId);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);

-- Files
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  clientId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  sizeBytes INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','uploaded','confirmed','deleted')),
  uploadedBy TEXT,
  entityType TEXT,
  entityId TEXT,
  r2Key TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_files_clientId ON files(clientId);
CREATE INDEX idx_files_entityType_entityId ON files(entityType, entityId);
