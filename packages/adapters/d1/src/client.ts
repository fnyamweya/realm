/** Minimal type matching Cloudflare's D1Database. */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<D1Result<unknown>>;
  all<T>(): Promise<D1Result<T>>;
}

export interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: { duration: number };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}
