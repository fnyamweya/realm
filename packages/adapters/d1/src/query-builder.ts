import type { D1Database } from "./client.js";

/**
 * Query builder that ALWAYS requires clientId for tenant isolation.
 * NO unscoped findById method exists for client-owned entities.
 */
export class ScopedQueryBuilder<T extends Record<string, unknown>> {
  private readonly db: D1Database;
  private readonly tableName: string;

  constructor(db: D1Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  private assertClientId(clientId: string): void {
    if (!clientId) {
      throw new Error("clientId is required and must not be empty");
    }
  }

  /** Finds a single row by clientId AND id. */
  async findByIdScoped(clientId: string, id: string): Promise<T | null> {
    this.assertClientId(clientId);

    const stmt = this.db
      .prepare(
        `SELECT * FROM ${this.tableName} WHERE client_id = ? AND id = ? LIMIT 1`,
      )
      .bind(clientId, id);

    return stmt.first<T>();
  }

  /** Finds many rows scoped to clientId with optional filters and cursor pagination. */
  async findManyScoped(
    clientId: string,
    where?: Record<string, unknown>,
    pagination?: { cursor?: string; limit: number },
  ): Promise<{ items: T[]; nextCursor?: string }> {
    this.assertClientId(clientId);

    const conditions: string[] = ["client_id = ?"];
    const values: unknown[] = [clientId];

    if (where) {
      for (const [key, value] of Object.entries(where)) {
        conditions.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (pagination?.cursor) {
      conditions.push("id > ?");
      values.push(pagination.cursor);
    }

    const limit = pagination?.limit ?? 50;
    const sql = `SELECT * FROM ${this.tableName} WHERE ${conditions.join(" AND ")} ORDER BY id ASC LIMIT ?`;
    values.push(limit + 1);

    const result = await this.db
      .prepare(sql)
      .bind(...values)
      .all<T>();

    const items = result.results.slice(0, limit);

    if (result.results.length > limit) {
      const lastItem = items[items.length - 1] as Record<string, unknown>;
      return { items, nextCursor: String(lastItem["id"]) };
    }

    return { items };
  }

  /** Inserts a row scoped to clientId. */
  async insertScoped(
    clientId: string,
    data: Record<string, unknown>,
  ): Promise<T> {
    this.assertClientId(clientId);

    const row = { ...data, client_id: clientId };
    const keys = Object.keys(row);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO ${this.tableName} (${keys.join(", ")}) VALUES (${placeholders}) RETURNING *`;

    const stmt = this.db.prepare(sql).bind(...Object.values(row));
    const result = await stmt.first<T>();
    if (!result) {
      throw new Error("Insert failed: no row returned");
    }
    return result;
  }

  /** Updates a row scoped to clientId AND id. */
  async updateScoped(
    clientId: string,
    id: string,
    data: Record<string, unknown>,
  ): Promise<T | null> {
    this.assertClientId(clientId);

    const entries = Object.entries(data);
    const setClause = entries.map(([key]) => `${key} = ?`).join(", ");
    const values = entries.map(([, value]) => value);
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE client_id = ? AND id = ? RETURNING *`;

    const stmt = this.db.prepare(sql).bind(...values, clientId, id);
    return stmt.first<T>();
  }

  /** Deletes a row scoped to clientId AND id. */
  async deleteScoped(clientId: string, id: string): Promise<boolean> {
    this.assertClientId(clientId);

    const sql = `DELETE FROM ${this.tableName} WHERE client_id = ? AND id = ?`;
    const result = await this.db.prepare(sql).bind(clientId, id).run();
    return result.success;
  }
}
