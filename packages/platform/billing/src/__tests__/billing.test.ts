import { describe, it, expect } from "vitest";
import { calculateQuote } from "../pricing.js";
import { checkEntitlement } from "../entitlements.js";
import type { PricingRule } from "../pricing.js";
import type { Entitlement } from "../entitlements.js";

describe("calculateQuote", () => {
  const rules: PricingRule[] = [
    {
      ruleId: "rule-1",
      module: "listings",
      dimensions: [
        { dimension: "units", unitPrice: 5, currency: "USD" },
      ],
      billingCycle: "monthly",
      schemaVersion: 1,
    },
    {
      ruleId: "rule-2",
      module: "analytics",
      geography: "US",
      dimensions: [
        { dimension: "reports", unitPrice: 10, currency: "USD" },
      ],
      billingCycle: "monthly",
      schemaVersion: 1,
    },
  ];

  it("should generate a quote with matching rules", () => {
    const quote = calculateQuote("client-1", rules, {
      units: 10,
      reports: 3,
      geography: "US",
    });

    expect(quote.clientId).toBe("client-1");
    expect(quote.lineItems).toHaveLength(2);
    expect(quote.subtotal).toBe(80); // (10*5) + (3*10)
    expect(quote.currency).toBe("USD");
  });

  it("should skip rules that do not match geography", () => {
    const quote = calculateQuote("client-2", rules, {
      units: 5,
      reports: 2,
      geography: "GB",
    });

    expect(quote.lineItems).toHaveLength(1);
    expect(quote.subtotal).toBe(25); // 5*5
  });

  it("should return empty quote when no rules match", () => {
    const quote = calculateQuote("client-3", [], {});
    expect(quote.lineItems).toHaveLength(0);
    expect(quote.subtotal).toBe(0);
  });

  it("should filter by portfolioSize range", () => {
    const sizedRules: PricingRule[] = [
      {
        ruleId: "rule-s",
        module: "maintenance",
        portfolioSizeMin: 10,
        portfolioSizeMax: 100,
        dimensions: [{ dimension: "properties", unitPrice: 2, currency: "USD" }],
        billingCycle: "annual",
        schemaVersion: 1,
      },
    ];

    const small = calculateQuote("c1", sizedRules, { portfolioSize: 5, properties: 5 });
    expect(small.lineItems).toHaveLength(0);

    const mid = calculateQuote("c2", sizedRules, { portfolioSize: 50, properties: 50 });
    expect(mid.lineItems).toHaveLength(1);
    expect(mid.subtotal).toBe(100);
  });
});

describe("checkEntitlement", () => {
  const entitlements: Entitlement[] = [
    { clientId: "c1", module: "listings", enabled: true },
    { clientId: "c1", module: "analytics", enabled: true, limit: 100, usedCount: 95 },
    { clientId: "c1", module: "reports", enabled: false },
    { clientId: "c1", module: "premium", enabled: true, limit: 10, usedCount: 10 },
  ];

  it("should allow unlimited module", () => {
    const result = checkEntitlement(entitlements, "listings");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeUndefined();
  });

  it("should allow with remaining usage", () => {
    const result = checkEntitlement(entitlements, "analytics");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it("should deny disabled module", () => {
    const result = checkEntitlement(entitlements, "reports");
    expect(result.allowed).toBe(false);
  });

  it("should deny when limit reached", () => {
    const result = checkEntitlement(entitlements, "premium");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("should deny unknown module", () => {
    const result = checkEntitlement(entitlements, "unknown");
    expect(result.allowed).toBe(false);
  });
});
