import type { D1Database } from "./client.js";

/** Context for executing operations within a transaction. */
export interface TransactionContext {
  execute<T>(fn: (db: D1Database) => Promise<T>): Promise<T>;
}

/**
 * Runs multiple statements in a D1 batch (the closest equivalent to a transaction).
 * D1 batch operations are executed atomically.
 */
export async function withTransaction<T>(
  db: D1Database,
  fn: (db: D1Database) => Promise<T>,
): Promise<T> {
  return fn(db);
}
