import type { z } from "zod";

/** Minimal type matching Cloudflare's KV Namespace. */
export interface KVNamespace {
  get(key: string, options?: { type?: string }): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
  delete(key: string): Promise<void>;
}

/**
 * KV cache adapter with Zod schema validation on read.
 * NEVER store secrets or authoritative transactional state in KV.
 */
export class KVCacheAdapter {
  private readonly kv: KVNamespace;

  constructor(kv: KVNamespace) {
    this.kv = kv;
  }

  /** Gets a cached value, validating against the provided Zod schema. Returns null on miss or invalid data. */
  async get<T>(key: string, schema: z.ZodSchema<T>): Promise<T | null> {
    const raw = await this.kv.get(key);
    if (raw === null) {
      return null;
    }

    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      // Invalid cached data — treat as cache miss and clean up
      await this.kv.delete(key);
      return null;
    }

    return parsed.data;
  }

  /** Sets a cached value with optional TTL in seconds. */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.kv.put(key, serialized, ttlSeconds ? { expirationTtl: ttlSeconds } : undefined);
  }

  /** Deletes a cached value. */
  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}
