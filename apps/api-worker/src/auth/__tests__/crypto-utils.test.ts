/**
 * Tests for crypto-utils.ts
 *
 * Covers: SHA-256 hashing, HMAC, constant-time comparison, base64url, ID generation
 */

import { describe, it, expect } from "vitest";
import {
    sha256Hex,
    sha256Base64url,
    hmacSha256Hex,
    constantTimeEqual,
    base64urlDecode,
    base64urlEncode,
    bufferToHex,
    bufferToBase64url,
    generateId,
    generateCorrelationId,
    hashIp,
    hashUserAgent,
} from "../crypto-utils.js";

// ─── SHA-256 ─────────────────────────────────────────────────────────────────

describe("sha256Hex", () => {
    it("produces a 64-char hex string", async () => {
        const result = await sha256Hex("hello");
        expect(result).toHaveLength(64);
        expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it("produces known hash for 'hello'", async () => {
        const result = await sha256Hex("hello");
        expect(result).toBe("2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824");
    });

    it("produces different hashes for different inputs", async () => {
        const a = await sha256Hex("hello");
        const b = await sha256Hex("world");
        expect(a).not.toBe(b);
    });

    it("is deterministic", async () => {
        const a = await sha256Hex("test123");
        const b = await sha256Hex("test123");
        expect(a).toBe(b);
    });

    it("handles empty string", async () => {
        const result = await sha256Hex("");
        expect(result).toHaveLength(64);
        expect(result).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    });

    it("handles unicode characters", async () => {
        const result = await sha256Hex("こんにちは");
        expect(result).toHaveLength(64);
    });
});

describe("sha256Base64url", () => {
    it("produces a base64url string", async () => {
        const result = await sha256Base64url("hello");
        expect(result).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("is deterministic", async () => {
        const a = await sha256Base64url("test");
        const b = await sha256Base64url("test");
        expect(a).toBe(b);
    });
});

describe("hmacSha256Hex", () => {
    it("produces a 64-char hex HMAC", async () => {
        const result = await hmacSha256Hex("secret", "message");
        expect(result).toHaveLength(64);
        expect(result).toMatch(/^[0-9a-f]{64}$/);
    });

    it("different keys produce different HMACs", async () => {
        const a = await hmacSha256Hex("key1", "message");
        const b = await hmacSha256Hex("key2", "message");
        expect(a).not.toBe(b);
    });

    it("different messages produce different HMACs", async () => {
        const a = await hmacSha256Hex("key", "msg1");
        const b = await hmacSha256Hex("key", "msg2");
        expect(a).not.toBe(b);
    });
});

// ─── Constant-Time Comparison ────────────────────────────────────────────────

describe("constantTimeEqual", () => {
    it("returns true for equal strings", () => {
        expect(constantTimeEqual("hello", "hello")).toBe(true);
    });

    it("returns false for different strings of same length", () => {
        expect(constantTimeEqual("hello", "world")).toBe(false);
    });

    it("returns false for different lengths", () => {
        expect(constantTimeEqual("hello", "hell")).toBe(false);
        expect(constantTimeEqual("he", "hello")).toBe(false);
    });

    it("returns true for empty strings", () => {
        expect(constantTimeEqual("", "")).toBe(true);
    });

    it("returns false when comparing empty to non-empty", () => {
        expect(constantTimeEqual("", "a")).toBe(false);
        expect(constantTimeEqual("a", "")).toBe(false);
    });

    it("handles long strings", () => {
        const long = "a".repeat(10000);
        expect(constantTimeEqual(long, long)).toBe(true);
        expect(constantTimeEqual(long, long.slice(0, -1) + "b")).toBe(false);
    });

    it("handles hex hash comparison", async () => {
        const hash1 = await sha256Hex("password123");
        const hash2 = await sha256Hex("password123");
        expect(constantTimeEqual(hash1, hash2)).toBe(true);

        const hash3 = await sha256Hex("different");
        expect(constantTimeEqual(hash1, hash3)).toBe(false);
    });
});

// ─── Base64url ───────────────────────────────────────────────────────────────

describe("base64urlDecode", () => {
    it("decodes standard base64url", () => {
        const decoded = base64urlDecode("aGVsbG8");
        expect(new TextDecoder().decode(decoded)).toBe("hello");
    });

    it("handles base64url characters (- and _)", () => {
        // base64url uses - instead of + and _ instead of /
        const input = "PDw_Pz4-";
        const decoded = base64urlDecode(input);
        expect(decoded).toBeInstanceOf(Uint8Array);
    });

    it("handles padding", () => {
        // "hello" in base64url with no padding
        const decoded = base64urlDecode("aGVsbG8");
        expect(new TextDecoder().decode(decoded)).toBe("hello");
    });
});

describe("base64urlEncode", () => {
    it("encodes to base64url (no padding)", () => {
        const input = new TextEncoder().encode("hello");
        const encoded = base64urlEncode(input);
        expect(encoded).toBe("aGVsbG8");
        expect(encoded).not.toContain("=");
    });

    it("roundtrips with decode", () => {
        const original = "test data with special chars: +/=";
        const input = new TextEncoder().encode(original);
        const encoded = base64urlEncode(input);
        const decoded = base64urlDecode(encoded);
        expect(new TextDecoder().decode(decoded)).toBe(original);
    });

    it("produces URL-safe characters", () => {
        const input = new Uint8Array(256);
        for (let i = 0; i < 256; i++) input[i] = i;
        const encoded = base64urlEncode(input);
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(encoded).not.toContain("+");
        expect(encoded).not.toContain("/");
        expect(encoded).not.toContain("=");
    });
});

describe("bufferToHex", () => {
    it("converts buffer to hex string", () => {
        const buffer = new Uint8Array([0, 1, 15, 16, 255]).buffer;
        expect(bufferToHex(buffer)).toBe("00010f10ff");
    });

    it("handles empty buffer", () => {
        expect(bufferToHex(new ArrayBuffer(0))).toBe("");
    });
});

describe("bufferToBase64url", () => {
    it("converts buffer to base64url string", () => {
        const buffer = new TextEncoder().encode("hello").buffer;
        expect(bufferToBase64url(buffer)).toBe("aGVsbG8");
    });
});

// ─── ID Generation ───────────────────────────────────────────────────────────

describe("generateId", () => {
    it("produces an ID with the given prefix", () => {
        const id = generateId("ses");
        expect(id).toMatch(/^ses_[0-9a-f]{32}$/);
    });

    it("produces unique IDs", () => {
        const ids = new Set<string>();
        for (let i = 0; i < 100; i++) {
            ids.add(generateId("test"));
        }
        expect(ids.size).toBe(100);
    });
});

describe("generateCorrelationId", () => {
    it("produces an ID with cor_ prefix", () => {
        const id = generateCorrelationId();
        expect(id).toMatch(/^cor_[0-9a-f]{32}$/);
    });
});

// ─── IP & User-Agent Hashing ─────────────────────────────────────────────────

describe("hashIp", () => {
    it("produces a 16-char hex string", async () => {
        const hash = await hashIp("192.168.1.1");
        expect(hash).toHaveLength(16);
        expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it("is deterministic", async () => {
        const a = await hashIp("10.0.0.1");
        const b = await hashIp("10.0.0.1");
        expect(a).toBe(b);
    });

    it("different IPs produce different hashes", async () => {
        const a = await hashIp("192.168.1.1");
        const b = await hashIp("192.168.1.2");
        expect(a).not.toBe(b);
    });
});

describe("hashUserAgent", () => {
    it("produces a 16-char hex string", async () => {
        const hash = await hashUserAgent("Mozilla/5.0 ...");
        expect(hash).toHaveLength(16);
        expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });

    it("is deterministic", async () => {
        const a = await hashUserAgent("Chrome/120");
        const b = await hashUserAgent("Chrome/120");
        expect(a).toBe(b);
    });
});
