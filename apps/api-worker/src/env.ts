export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  CACHE: KVNamespace;
  EVENTS_QUEUE: Queue;
  ENVIRONMENT: string;
  ENCRYPTION_KEY: string;
  SESSION_SECRET: string;
}
