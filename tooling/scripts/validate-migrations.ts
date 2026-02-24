#!/usr/bin/env tsx
// Validate D1 migration files
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../migrations/d1');

let errors = 0;

function error(msg: string) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

// Read and sort migration files
const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  error('No migration files found');
  process.exit(1);
}

console.log(`Found ${files.length} migration file(s)\n`);

// Validate ordering
const expectedPrefix = (i: number) =>
  String(i + 1).padStart(4, '0');

for (let i = 0; i < files.length; i++) {
  const file = files[i]!;
  const prefix = file.split('_')[0];

  if (prefix !== expectedPrefix(i)) {
    error(`${file}: expected prefix ${expectedPrefix(i)}, got ${prefix}`);
  }
}

// Tables that are global (not client-scoped)
const GLOBAL_TABLES = new Set([
  'users',
  'user_identities',
  'sessions',
  'password_credentials',
  'mfa_factors',
  'mfa_challenges',
  'auth_rate_limits',
]);

// Validate each file
for (const file of files) {
  console.log(`Checking ${file}...`);
  const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

  // No DROP TABLE allowed
  if (/DROP\s+TABLE/i.test(sql)) {
    error(`${file}: contains DROP TABLE statement`);
  }

  // Must have at least one CREATE TABLE
  const tableMatches = sql.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi);
  if (!tableMatches || tableMatches.length === 0) {
    error(`${file}: no CREATE TABLE IF NOT EXISTS statements found`);
    continue;
  }

  // Extract table names
  const tableNames = tableMatches.map((m) => {
    const match = m.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/i);
    return match?.[1] ?? '';
  });

  for (const table of tableNames) {
    if (!table) continue;
    console.log(`  ✓ ${table}`);

    // Check that client-scoped tables have a clientId index
    if (!GLOBAL_TABLES.has(table)) {
      const hasClientIdColumn = new RegExp(
        `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${table}\\s*\\([^)]*clientId`,
        'is',
      ).test(sql);

      if (hasClientIdColumn) {
        const hasClientIdIndex = new RegExp(
          `CREATE\\s+(UNIQUE\\s+)?INDEX\\s+\\w+\\s+ON\\s+${table}\\s*\\(\\s*clientId`,
          'i',
        ).test(sql);

        if (!hasClientIdIndex) {
          error(`${file}: table ${table} has clientId column but no clientId index`);
        }
      }
    }
  }
}

console.log('');
if (errors > 0) {
  console.error(`${errors} migration validation error(s) found`);
  process.exit(1);
} else {
  console.log('All migrations valid ✓');
  process.exit(0);
}
