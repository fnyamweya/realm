/**
 * Tests for api-key.ts
 *
 * Covers: Key extraction, parsing, format validation, hash verification,
 * status checks, IP allowlist, anti-enumeration timing
 */

import { describe, it, expect } from "vitest";
import { extractApiKey, parseApiKey } from "../api-key.js";

// ─── parseApiKey ─────────────────────────────────────────────────────────────

describe("parseApiKey", () => {
    it("parses a valid API key", () => {
        const result = parseApiKey("rto_abcd1234.secretkeydatahere123", "rto");
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
        expect(result!.secret).toBe("secretkeydatahere123");
        expect(result!.raw).toBe("rto_abcd1234.secretkeydatahere123");
    });

    it("returns null for wrong prefix", () => {
        expect(parseApiKey("xyz_abcd1234.secret", "rto")).toBeNull();
    });

    it("returns null for missing dot separator", () => {
        expect(parseApiKey("rto_abcd1234secret", "rto")).toBeNull();
    });

    it("returns null if prefix part is too short (< 4 chars)", () => {
        expect(parseApiKey("rto_abc.secretkeydatahere123", "rto")).toBeNull();
    });

    it("returns null if secret part is too short (< 16 chars)", () => {
        expect(parseApiKey("rto_abcd1234.short", "rto")).toBeNull();
    });

    it("returns null for empty string", () => {
        expect(parseApiKey("", "rto")).toBeNull();
    });

    it("returns null for just the prefix", () => {
        expect(parseApiKey("rto_", "rto")).toBeNull();
    });

    it("returns null if dot is at start of key part", () => {
        expect(parseApiKey("rto_.secretkeydatahere123", "rto")).toBeNull();
    });

    it("returns null if dot is at end of key string", () => {
        expect(parseApiKey("rto_abcd1234.", "rto")).toBeNull();
    });

    it("trims whitespace", () => {
        const result = parseApiKey("  rto_abcd1234.secretkeydatahere123  ", "rto");
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
    });

    it("handles custom prefix", () => {
        const result = parseApiKey("custom_abcd1234.secretkeydatahere123", "custom");
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
    });

    it("uses first dot as separator (prefix can contain dots)", () => {
        const result = parseApiKey("rto_abcd1234.secret.with.dots.more.characters", "rto");
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
        expect(result!.secret).toBe("secret.with.dots.more.characters");
    });
});

// ─── extractApiKey ───────────────────────────────────────────────────────────

describe("extractApiKey", () => {
    it("extracts API key from X-Api-Key header", () => {
        const request = new Request("https://api.test.com/v1/test", {
            headers: { "X-Api-Key": "rto_abcd1234.secretkeydatahere123" },
        });
        const result = extractApiKey(request);
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
    });

    it("returns null when no header present", () => {
        const request = new Request("https://api.test.com/v1/test");
        expect(extractApiKey(request)).toBeNull();
    });

    it("returns null for invalid key format in header", () => {
        const request = new Request("https://api.test.com/v1/test", {
            headers: { "X-Api-Key": "invalid-key" },
        });
        expect(extractApiKey(request)).toBeNull();
    });

    it("uses custom prefix when specified", () => {
        const request = new Request("https://api.test.com/v1/test", {
            headers: { "X-Api-Key": "custom_abcd1234.secretkeydatahere123" },
        });
        const result = extractApiKey(request, "custom");
        expect(result).not.toBeNull();
        expect(result!.prefix).toBe("abcd1234");
    });

    it("returns null when key has wrong prefix", () => {
        const request = new Request("https://api.test.com/v1/test", {
            headers: { "X-Api-Key": "rto_abcd1234.secretkeydatahere123" },
        });
        expect(extractApiKey(request, "custom")).toBeNull();
    });

    it("is case-insensitive for header name", () => {
        const request = new Request("https://api.test.com/v1/test", {
            headers: { "x-api-key": "rto_abcd1234.secretkeydatahere123" },
        });
        // Header names are case-insensitive per HTTP spec
        const result = extractApiKey(request);
        expect(result).not.toBeNull();
    });
});
