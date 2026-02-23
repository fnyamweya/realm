import { describe, expect, it } from "vitest";
import {
  validateOutboundTarget,
  generateWatermarkText,
  isSandboxClient,
  type SandboxConfig,
} from "../sandbox.js";

const sandboxConfig: SandboxConfig = {
  isSandbox: true,
  outboundAllowlist: {
    emails: ["test@example.com", "qa@acme.org"],
    domains: ["sandbox.example.com"],
    webhookUrls: ["https://hooks.sandbox.example.com/test"],
    smsNumbers: ["+15551234567"],
  },
  piiMinimization: true,
  documentWatermark: "SANDBOX",
  retentionDays: 30,
  autoResetEnabled: true,
};

const productionConfig: SandboxConfig = {
  ...sandboxConfig,
  isSandbox: false,
};

describe("validateOutboundTarget", () => {
  describe("email validation", () => {
    it("allows an email in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "email",
        "test@example.com",
      );
      expect(result.allowed).toBe(true);
    });

    it("allows an email whose domain is in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "email",
        "anyone@sandbox.example.com",
      );
      expect(result.allowed).toBe(true);
    });

    it("rejects an email not in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "email",
        "hacker@evil.com",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("webhook validation", () => {
    it("allows a webhook URL in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "webhook",
        "https://hooks.sandbox.example.com/test",
      );
      expect(result.allowed).toBe(true);
    });

    it("rejects a webhook URL not in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "webhook",
        "https://evil.com/hook",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("SMS validation", () => {
    it("allows an SMS number in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "sms",
        "+15551234567",
      );
      expect(result.allowed).toBe(true);
    });

    it("rejects an SMS number not in the allowlist", () => {
      const result = validateOutboundTarget(
        sandboxConfig,
        "sms",
        "+19999999999",
      );
      expect(result.allowed).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe("non-sandbox config", () => {
    it("allows all outbound emails", () => {
      const result = validateOutboundTarget(
        productionConfig,
        "email",
        "anyone@anywhere.com",
      );
      expect(result.allowed).toBe(true);
    });

    it("allows all outbound webhooks", () => {
      const result = validateOutboundTarget(
        productionConfig,
        "webhook",
        "https://any.url/hook",
      );
      expect(result.allowed).toBe(true);
    });

    it("allows all outbound SMS", () => {
      const result = validateOutboundTarget(
        productionConfig,
        "sms",
        "+19999999999",
      );
      expect(result.allowed).toBe(true);
    });
  });
});

describe("generateWatermarkText", () => {
  it("includes client ID in the watermark", () => {
    const text = generateWatermarkText("client-123");
    expect(text).toContain("client-123");
  });

  it("includes SANDBOX/UAT prefix", () => {
    const text = generateWatermarkText("client-123");
    expect(text).toMatch(/^SANDBOX\/UAT • /);
  });

  it("includes an ISO date string", () => {
    const text = generateWatermarkText("client-123");
    // ISO date pattern: YYYY-MM-DDTHH:mm:ss
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe("isSandboxClient", () => {
  it("returns true when isSandbox is true", () => {
    expect(isSandboxClient({ isSandbox: true })).toBe(true);
  });

  it("returns false when isSandbox is false", () => {
    expect(isSandboxClient({ isSandbox: false })).toBe(false);
  });

  it("returns false when isSandbox is undefined", () => {
    expect(isSandboxClient({})).toBe(false);
  });
});
