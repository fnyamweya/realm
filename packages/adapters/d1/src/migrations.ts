import type { D1Database } from "./client.js";

/** Forward-only migration definition. No down migrations. */
export interface Migration {
  version: number;
  name: string;
  up: string;
}

/** Runs forward-only migrations against a D1 database. */
export class MigrationRunner {
  private readonly db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /** Runs all pending migrations in order. */
  async run(migrations: Migration[]): Promise<void> {
    await this.db.exec(
      `CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
    );

    const applied = await this.db
      .prepare("SELECT version FROM _migrations ORDER BY version ASC")
      .all<{ version: number }>();

    const appliedVersions = new Set(
      applied.results.map((r) => r.version),
    );

    const sorted = [...migrations].sort((a, b) => a.version - b.version);

    for (const migration of sorted) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      await this.db.exec(migration.up);
      await this.db
        .prepare("INSERT INTO _migrations (version, name) VALUES (?, ?)")
        .bind(migration.version, migration.name)
        .run();
    }
  }
}
