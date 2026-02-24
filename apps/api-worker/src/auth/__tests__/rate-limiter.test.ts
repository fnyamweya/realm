/**
 * Tests for rate-limiter.ts
 *
 * Covers: Sliding window counters, IP/API key/user/auth rate limiting,
 * burst handling, header generation, window transitions
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    checkRateLimit,
    checkIpRateLimit,
    checkApiKeyRateLimit,
    checkUserRateLimit,
    checkAuthRateLimit,
    rateLimitHeaders,
} from "../rate-limiter.js";
import type { KVNamespace } from "../types.js";

// ─── Mock KV ─────────────────────────────────────────────────────────────────

function mockKv(): KVNamespace & { store: Map<string, string> } {
    const store = new Map<string, string>();
    return {
        store,
        async get(key: string) {
            return store.get(key) ?? null;
        },
        async put(key: string, value: string) {
            store.set(key, value);
        },
        async delete(key: string) {
            store.delete(key);
        },
    };
}

// ─── checkRateLimit ──────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
    let kv: ReturnType<typeof mockKv>;

    beforeEach(() => {
        kv = mockKv();
    });

    it("allows first request", async () => {
        const result = await checkRateLimit("test:key", kv, { maxRequests: 10 });
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(1);
        expect(result.limit).toBe(10);
        expect(result.remaining).toBe(9);
    });

    it("counts requests within a window", async () => {
        for (let i = 0; i < 5; i++) {
            await checkRateLimit("test:key", kv, { maxRequests: 10 });
        }
        const result = await checkRateLimit("test:key", kv, { maxRequests: 10 });
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(6);
        expect(result.remaining).toBe(4);
    });

    it("blocks requests at the limit", async () => {
        for (let i = 0; i < 10; i++) {
            await checkRateLimit("test:key", kv, { maxRequests: 10 });
        }
        const result = await checkRateLimit("test:key", kv, { maxRequests: 10 });
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeDefined();
        expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("different keys have independent counters", async () => {
        for (let i = 0; i < 5; i++) {
            await checkRateLimit("key:a", kv, { maxRequests: 10 });
        }
        const result = await checkRateLimit("key:b", kv, { maxRequests: 10 });
        expect(result.current).toBe(1);
    });

    it("includes resetAt timestamp", async () => {
        const result = await checkRateLimit("test:key", kv, { maxRequests: 10 });
        expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000) - 120);
    });

    it("handles corrupted KV data gracefully", async () => {
        kv.store.set("rl:test:broken", "not-json");
        const result = await checkRateLimit("test:broken", kv, { maxRequests: 10 });
        expect(result.allowed).toBe(true);
        expect(result.current).toBe(1);
    });
});

// ─── Convenience wrappers ────────────────────────────────────────────────────

describe("checkIpRateLimit", () => {
    it("uses IP hash as key with default limits", async () => {
        const kv = mockKv();
        const result = await checkIpRateLimit("abc123ip", kv);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(60); // default
    });

    it("accepts custom max per minute", async () => {
        const kv = mockKv();
        const result = await checkIpRateLimit("abc123ip", kv, 30);
        expect(result.limit).toBe(30);
    });
});

describe("checkApiKeyRateLimit", () => {
    it("uses key prefix with default limits", async () => {
        const kv = mockKv();
        const result = await checkApiKeyRateLimit("abcd1234", kv);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(120); // default for API keys
    });
});

describe("checkUserRateLimit", () => {
    it("uses user ID with default limits", async () => {
        const kv = mockKv();
        const result = await checkUserRateLimit("user_123", kv);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(120); // 2x default
    });
});

describe("checkAuthRateLimit", () => {
    it("uses stricter limits for auth attempts", async () => {
        const kv = mockKv();
        const result = await checkAuthRateLimit("user@test.com", kv);
        expect(result.allowed).toBe(true);
        expect(result.limit).toBe(10); // 10 per 5 min
    });

    it("blocks after 10 attempts", async () => {
        const kv = mockKv();
        for (let i = 0; i < 10; i++) {
            await checkAuthRateLimit("user@test.com", kv);
        }
        const result = await checkAuthRateLimit("user@test.com", kv);
        expect(result.allowed).toBe(false);
    });
});

// ─── rateLimitHeaders ────────────────────────────────────────────────────────

describe("rateLimitHeaders", () => {
    it("returns standard rate limit headers", () => {
        const headers = rateLimitHeaders({
            allowed: true,
            current: 5,
            limit: 60,
            remaining: 55,
            resetAt: 1700000060,
        });
        expect(headers["X-RateLimit-Limit"]).toBe("60");
        expect(headers["X-RateLimit-Remaining"]).toBe("55");
        expect(headers["X-RateLimit-Reset"]).toBe("1700000060");
        expect(headers["Retry-After"]).toBeUndefined();
    });

    it("includes Retry-After when rate limited", () => {
        const headers = rateLimitHeaders({
            allowed: false,
            current: 60,
            limit: 60,
            remaining: 0,
            resetAt: 1700000060,
            retryAfter: 30,
        });
        expect(headers["Retry-After"]).toBe("30");
    });
});
