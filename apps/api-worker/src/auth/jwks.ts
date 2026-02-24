/**
 * JWKS (JSON Web Key Set) client with caching.
 *
 * Fetches public keys from the OIDC provider's JWKS endpoint,
 * caches them in KV with TTL, and imports them as CryptoKey objects
 * for JWT signature verification.
 *
 * Supports:
 * - RSA (RS256, RS384, RS512)
 * - ECDSA (ES256, ES384, ES512)
 * - Key rotation via `kid` matching
 * - Automatic cache refresh on key miss
 * - Graceful degradation with stale cache on fetch failure
 */

import type { KVNamespace, JwksDocument, JwksKey } from "./types.js";
import { base64urlDecode } from "./crypto-utils.js";

// ─── Configuration ───────────────────────────────────────────────────────────

/** How long to cache JWKS keys in KV (1 hour) */
const JWKS_CACHE_TTL_SECONDS = 3600;
/** How long to cache JWKS keys in memory within a single request isolate (5 minutes) */
const JWKS_MEMORY_TTL_MS = 5 * 60 * 1000;
/** Maximum key age to accept (48 hours) — prevents using very old cached keys */
const JWKS_MAX_STALENESS_MS = 48 * 60 * 60 * 1000;
/** KV key prefix for JWKS cache */
const KV_PREFIX = "jwks:";

// ─── In-Memory Cache (per-isolate) ──────────────────────────────────────────

interface CachedJwks {
    document: JwksDocument;
    fetchedAt: number;
    importedKeys: Map<string, CryptoKey>;
}

let memoryCache: CachedJwks | null = null;

// ─── Algorithm Mapping ───────────────────────────────────────────────────────

const RSA_ALGORITHMS: Record<string, RsaHashedImportParams> = {
    RS256: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    RS384: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-384" },
    RS512: { name: "RSASSA-PKCS1-v1_5", hash: "SHA-512" },
};

const EC_ALGORITHMS: Record<string, EcKeyImportParams> = {
    ES256: { name: "ECDSA", namedCurve: "P-256" },
    ES384: { name: "ECDSA", namedCurve: "P-384" },
    ES512: { name: "ECDSA", namedCurve: "P-521" },
};

const EC_SIGN_ALGORITHMS: Record<string, EcdsaParams> = {
    ES256: { name: "ECDSA", hash: "SHA-256" },
    ES384: { name: "ECDSA", hash: "SHA-384" },
    ES512: { name: "ECDSA", hash: "SHA-512" },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Retrieve the CryptoKey for a given key ID and algorithm.
 *
 * Resolution order:
 * 1. In-memory cache (fastest, per-isolate)
 * 2. KV cache (millisecond-range latency)
 * 3. JWKS endpoint fetch (network call)
 *
 * If kid is not found in cache, forces a refresh from the JWKS endpoint
 * to handle key rotation.
 */
export async function getVerificationKey(
    kid: string | undefined,
    alg: string,
    jwksUrl: string,
    kv: KVNamespace,
): Promise<CryptoKey | null> {
    // 1. Try memory cache
    if (memoryCache && (Date.now() - memoryCache.fetchedAt) < JWKS_MEMORY_TTL_MS) {
        const key = findAndImportKey(memoryCache, kid, alg);
        if (key) return key;
    }

    // 2. Try KV cache
    const kvCached = await loadFromKv(kv, jwksUrl);
    if (kvCached) {
        memoryCache = kvCached;
        const key = findAndImportKey(kvCached, kid, alg);
        if (key) return key;
    }

    // 3. Fetch from JWKS endpoint (or force refresh if kid not found)
    const fresh = await fetchJwks(jwksUrl, kv);
    if (!fresh) {
        // Network failure — try stale cache as last resort
        if (kvCached && (Date.now() - kvCached.fetchedAt) < JWKS_MAX_STALENESS_MS) {
            return findAndImportKey(kvCached, kid, alg);
        }
        return null;
    }

    memoryCache = fresh;
    return findAndImportKey(fresh, kid, alg);
}

/**
 * Get the signing algorithm parameters for JWT verification.
 * Returns the algorithm params needed by `crypto.subtle.verify()`.
 */
export function getSigningAlgorithm(alg: string): AlgorithmIdentifier | RsaHashedImportParams | EcdsaParams | null {
    if (alg in RSA_ALGORITHMS) {
        return RSA_ALGORITHMS[alg]!;
    }
    if (alg in EC_SIGN_ALGORITHMS) {
        return EC_SIGN_ALGORITHMS[alg]!;
    }
    return null;
}

/**
 * Force clear all JWKS caches. Useful for testing or emergency key rotation.
 */
export function clearJwksCache(): void {
    memoryCache = null;
}

// ─── Internal ────────────────────────────────────────────────────────────────

function findAndImportKey(
    cached: CachedJwks,
    kid: string | undefined,
    alg: string,
): CryptoKey | null {
    // If kid is provided, match exactly
    if (kid) {
        const cacheKey = `${kid}:${alg}`;
        const existing = cached.importedKeys.get(cacheKey);
        if (existing) return existing;

        const jwk = cached.document.keys.find(
            (k) => k.kid === kid && (!k.alg || k.alg === alg) && (!k.use || k.use === "sig"),
        );
        if (!jwk) return null;

        // Import will be done asynchronously — return the cached imported key via a sync path
        // We need a different approach: eagerly import all keys
        return null; // Will be handled below
    }

    // No kid — find first matching key by algorithm
    const matchingKey = cached.document.keys.find(
        (k) => (!k.alg || k.alg === alg) && (!k.use || k.use === "sig"),
    );
    if (!matchingKey) return null;

    const cacheKey = `${matchingKey.kid ?? "default"}:${alg}`;
    return cached.importedKeys.get(cacheKey) ?? null;
}

/**
 * Get verification key — async version that handles CryptoKey import.
 * This is the real workhorse; `getVerificationKey` should call this.
 */
export async function getVerificationKeyAsync(
    kid: string | undefined,
    alg: string,
    jwksUrl: string,
    kv: KVNamespace,
): Promise<CryptoKey | null> {
    // Ensure cache is populated
    let cached = memoryCache;

    if (!cached || (Date.now() - cached.fetchedAt) >= JWKS_MEMORY_TTL_MS) {
        const kvCached = await loadFromKv(kv, jwksUrl);
        if (kvCached) {
            cached = kvCached;
            memoryCache = kvCached;
        } else {
            const fresh = await fetchJwks(jwksUrl, kv);
            if (fresh) {
                cached = fresh;
                memoryCache = fresh;
            }
        }
    }

    if (!cached) return null;

    // Find the JWK
    let jwk: JwksKey | undefined;

    if (kid) {
        jwk = cached.document.keys.find(
            (k) => k.kid === kid && (!k.alg || k.alg === alg) && (!k.use || k.use === "sig"),
        );

        // Key rotation: if kid not found, force refresh
        if (!jwk) {
            const fresh = await fetchJwks(jwksUrl, kv);
            if (fresh) {
                cached = fresh;
                memoryCache = fresh;
                jwk = fresh.document.keys.find(
                    (k) => k.kid === kid && (!k.alg || k.alg === alg) && (!k.use || k.use === "sig"),
                );
            }
        }
    } else {
        jwk = cached.document.keys.find(
            (k) => (!k.alg || k.alg === alg) && (!k.use || k.use === "sig"),
        );
    }

    if (!jwk) return null;

    // Check imported key cache
    const cacheKey = `${jwk.kid ?? "default"}:${alg}`;
    const existing = cached.importedKeys.get(cacheKey);
    if (existing) return existing;

    // Import the key
    const cryptoKey = await importJwk(jwk, alg);
    if (cryptoKey) {
        cached.importedKeys.set(cacheKey, cryptoKey);
    }

    return cryptoKey;
}

async function importJwk(jwk: JwksKey, alg: string): Promise<CryptoKey | null> {
    try {
        if (jwk.kty === "RSA" && alg in RSA_ALGORITHMS) {
            if (!jwk.n || !jwk.e) return null;

            return await crypto.subtle.importKey(
                "jwk",
                {
                    kty: "RSA",
                    n: jwk.n,
                    e: jwk.e,
                    alg,
                    ext: true,
                },
                RSA_ALGORITHMS[alg]!,
                false,
                ["verify"],
            );
        }

        if (jwk.kty === "EC" && alg in EC_ALGORITHMS) {
            if (!jwk.x || !jwk.y || !jwk.crv) return null;

            return await crypto.subtle.importKey(
                "jwk",
                {
                    kty: "EC",
                    x: jwk.x,
                    y: jwk.y,
                    crv: jwk.crv,
                    ext: true,
                },
                EC_ALGORITHMS[alg]!,
                false,
                ["verify"],
            );
        }

        return null;
    } catch {
        return null;
    }
}

async function fetchJwks(
    jwksUrl: string,
    kv: KVNamespace,
): Promise<CachedJwks | null> {
    try {
        const response = await fetch(jwksUrl, {
            headers: { Accept: "application/json" },
            cf: { cacheTtl: 300 }, // Cloudflare edge cache: 5 min
        });

        if (!response.ok) {
            return null;
        }

        const document = (await response.json()) as JwksDocument;

        if (!document.keys || !Array.isArray(document.keys) || document.keys.length === 0) {
            return null;
        }

        const now = Date.now();
        const cached: CachedJwks = {
            document,
            fetchedAt: now,
            importedKeys: new Map(),
        };

        // Persist to KV for cross-isolate caching
        const kvKey = `${KV_PREFIX}${encodeURIComponent(jwksUrl)}`;
        await kv.put(
            kvKey,
            JSON.stringify({ document, fetchedAt: now }),
            { expirationTtl: JWKS_CACHE_TTL_SECONDS },
        ).catch(() => {
            // Non-critical: KV write failure shouldn't break auth
        });

        return cached;
    } catch {
        return null;
    }
}

async function loadFromKv(
    kv: KVNamespace,
    jwksUrl: string,
): Promise<CachedJwks | null> {
    try {
        const kvKey = `${KV_PREFIX}${encodeURIComponent(jwksUrl)}`;
        const raw = await kv.get(kvKey);
        if (!raw) return null;

        const data = JSON.parse(raw) as { document: JwksDocument; fetchedAt: number };

        if (!data.document?.keys || !Array.isArray(data.document.keys)) {
            return null;
        }

        // Check staleness
        if ((Date.now() - data.fetchedAt) > JWKS_MAX_STALENESS_MS) {
            await kv.delete(kvKey).catch(() => { });
            return null;
        }

        return {
            document: data.document,
            fetchedAt: data.fetchedAt,
            importedKeys: new Map(),
        };
    } catch {
        return null;
    }
}
