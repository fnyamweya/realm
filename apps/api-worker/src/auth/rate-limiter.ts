/**
 * Rate limiter using KV storage.
 *
 * Implements a sliding window counter with the following strategies:
 * 1. Per-IP rate limiting (all requests)
 * 2. Per-API-key rate limiting (service requests)
 * 3. Per-user rate limiting (authenticated requests)
 * 4. Per-endpoint rate limiting (sensitive endpoints)
 *
 * Uses KV with TTL for automatic cleanup of expired windows.
 *
 * Note on consistency: KV is eventually consistent. In a distributed
 * Worker environment, the actual rate may briefly exceed the limit by
 * a small factor. This is acceptable for our use case — we're protecting
 * against abuse, not implementing a metered billing system.
 */

import type { KVNamespace } from "./types.js";

// ─── Configuration ───────────────────────────────────────────────────────────

const KV_PREFIX = "rl:";
const DEFAULT_WINDOW_SECONDS = 60;
const DEFAULT_MAX_REQUESTS = 60;
const DEFAULT_API_KEY_MAX_REQUESTS = 120;
const BURST_MULTIPLIER = 2; // Allow 2x burst in first 10 seconds

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
    /** Maximum requests per window */
    maxRequests: number;
    /** Window duration in seconds */
    windowSeconds: number;
    /** Whether to allow short bursts */
    allowBurst?: boolean;
}

export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;
    /** Current request count in the window */
    current: number;
    /** Maximum requests allowed */
    limit: number;
    /** When the current window resets (Unix timestamp) */
    resetAt: number;
    /** Remaining requests in the window */
    remaining: number;
    /** Retry after (seconds) — only set when rate limited */
    retryAfter?: number;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check and increment the rate limit counter for a given key.
 *
 * @param key - Rate limit key (e.g., "ip:1a2b3c", "apikey:abc123")
 * @param kv - KV namespace for storage
 * @param config - Rate limit configuration
 * @returns Rate limit result with headers info
 */
export async function checkRateLimit(
    key: string,
    kv: KVNamespace,
    config?: Partial<RateLimitConfig>,
): Promise<RateLimitResult> {
    const maxRequests = config?.maxRequests ?? DEFAULT_MAX_REQUESTS;
    const windowSeconds = config?.windowSeconds ?? DEFAULT_WINDOW_SECONDS;
    const allowBurst = config?.allowBurst ?? false;

    const kvKey = `${KV_PREFIX}${key}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const resetAt = windowStart + windowSeconds;

    // Load current counter
    let counter: RateLimitCounter;
    try {
        const raw = await kv.get(kvKey);
        if (raw) {
            counter = JSON.parse(raw) as RateLimitCounter;

            // Check if we're in a new window
            if (counter.windowStart !== windowStart) {
                counter = { windowStart, count: 0, firstRequestAt: now };
            }
        } else {
            counter = { windowStart, count: 0, firstRequestAt: now };
        }
    } catch {
        counter = { windowStart, count: 0, firstRequestAt: now };
    }

    // Calculate effective limit
    let effectiveLimit = maxRequests;
    if (allowBurst) {
        const secondsIntoWindow = now - windowStart;
        if (secondsIntoWindow < 10) {
            effectiveLimit = Math.floor(maxRequests * BURST_MULTIPLIER);
        }
    }

    // Check if rate limited
    if (counter.count >= effectiveLimit) {
        return {
            allowed: false,
            current: counter.count,
            limit: maxRequests,
            resetAt,
            remaining: 0,
            retryAfter: resetAt - now,
        };
    }

    // Increment counter
    counter.count++;

    // Save (fire-and-forget — non-blocking)
    const ttl = windowSeconds + 10; // Small buffer beyond window end
    kv.put(kvKey, JSON.stringify(counter), { expirationTtl: ttl }).catch(() => { });

    return {
        allowed: true,
        current: counter.count,
        limit: maxRequests,
        resetAt,
        remaining: Math.max(0, maxRequests - counter.count),
    };
}

/**
 * Check rate limit for an IP address.
 */
export async function checkIpRateLimit(
    ipHash: string,
    kv: KVNamespace,
    maxPerMinute?: number,
): Promise<RateLimitResult> {
    return checkRateLimit(`ip:${ipHash}`, kv, {
        maxRequests: maxPerMinute ?? DEFAULT_MAX_REQUESTS,
        windowSeconds: 60,
        allowBurst: true,
    });
}

/**
 * Check rate limit for an API key.
 */
export async function checkApiKeyRateLimit(
    keyPrefix: string,
    kv: KVNamespace,
    maxPerMinute?: number,
): Promise<RateLimitResult> {
    return checkRateLimit(`apikey:${keyPrefix}`, kv, {
        maxRequests: maxPerMinute ?? DEFAULT_API_KEY_MAX_REQUESTS,
        windowSeconds: 60,
    });
}

/**
 * Check rate limit for a specific user.
 */
export async function checkUserRateLimit(
    userId: string,
    kv: KVNamespace,
    maxPerMinute?: number,
): Promise<RateLimitResult> {
    return checkRateLimit(`user:${userId}`, kv, {
        maxRequests: maxPerMinute ?? DEFAULT_MAX_REQUESTS * 2,
        windowSeconds: 60,
    });
}

/**
 * Check rate limit for authentication attempts (stricter).
 */
export async function checkAuthRateLimit(
    identifier: string,
    kv: KVNamespace,
): Promise<RateLimitResult> {
    return checkRateLimit(`auth:${identifier}`, kv, {
        maxRequests: 10,
        windowSeconds: 300, // 10 attempts per 5 minutes
    });
}

/**
 * Create rate limit headers for the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetAt.toString(),
    };

    if (!result.allowed && result.retryAfter !== undefined) {
        headers["Retry-After"] = result.retryAfter.toString();
    }

    return headers;
}

// ─── Internal Types ──────────────────────────────────────────────────────────

interface RateLimitCounter {
    windowStart: number;
    count: number;
    firstRequestAt: number;
}
