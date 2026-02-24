/**
 * Cryptographic utility functions for the auth subsystem.
 * Uses Web Crypto API (available in Cloudflare Workers).
 *
 * All functions are constant-time where security-relevant to prevent
 * timing-based side-channel attacks.
 */

// ─── Hashing ─────────────────────────────────────────────────────────────────

/**
 * SHA-256 hash of a string, returned as hex.
 */
export async function sha256Hex(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    return bufferToHex(hashBuffer);
}

/**
 * SHA-256 hash of a string, returned as base64url.
 */
export async function sha256Base64url(input: string): Promise<string> {
    const encoded = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
    return bufferToBase64url(hashBuffer);
}

/**
 * HMAC-SHA256 of a message with a key, returned as hex.
 */
export async function hmacSha256Hex(key: string, message: string): Promise<string> {
    const keyData = new TextEncoder().encode(key);
    const msgData = new TextEncoder().encode(message);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
    return bufferToHex(signature);
}

// ─── Constant-Time Comparison ────────────────────────────────────────────────

/**
 * Constant-time string comparison to prevent timing attacks.
 * Returns true if both strings are equal.
 *
 * This is critical for comparing:
 * - API key hashes
 * - Token signatures
 * - OTP codes
 */
export function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        // Still do a comparison to avoid leaking length info via timing
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let _result = 0;
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
            _result |= (a.charCodeAt(i % a.length) ?? 0) ^ (b.charCodeAt(i % b.length) ?? 0);
        }
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

// ─── Base64 Utilities ────────────────────────────────────────────────────────

/**
 * Decode a base64url-encoded string to a Uint8Array.
 */
export function base64urlDecode(input: string): Uint8Array {
    // Convert base64url to standard base64
    let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding
    while (base64.length % 4 !== 0) {
        base64 += "=";
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * Encode a Uint8Array to a base64url string (no padding).
 */
export function base64urlEncode(input: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < input.length; i++) {
        binary += String.fromCharCode(input[i]!);
    }
    return btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

/**
 * Convert an ArrayBuffer to a hex string.
 */
export function bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i]!.toString(16).padStart(2, "0");
    }
    return hex;
}

/**
 * Convert an ArrayBuffer to a base64url string.
 */
export function bufferToBase64url(buffer: ArrayBuffer): string {
    return base64urlEncode(new Uint8Array(buffer));
}

// ─── ID Generation ───────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random ID with a prefix.
 * Format: `prefix_<random-hex>`
 */
export function generateId(prefix: string): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return `${prefix}_${bufferToHex(bytes.buffer)}`;
}

/**
 * Generate a correlation ID for distributed tracing.
 */
export function generateCorrelationId(): string {
    return generateId("cor");
}

// ─── IP & User-Agent Hashing ─────────────────────────────────────────────────

/**
 * Hash an IP address for privacy-preserving rate limiting and audit.
 * Uses SHA-256 truncated to 16 hex chars.
 */
export async function hashIp(ip: string): Promise<string> {
    const full = await sha256Hex(ip);
    return full.substring(0, 16);
}

/**
 * Hash a User-Agent string for device fingerprinting.
 */
export async function hashUserAgent(ua: string): Promise<string> {
    const full = await sha256Hex(ua);
    return full.substring(0, 16);
}
