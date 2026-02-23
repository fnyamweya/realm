import { describe, it, expect } from "vitest";
import { getCountry, getAllCountries } from "../countries.js";
import { formatMoney, getCurrency } from "../currencies.js";

describe("countries", () => {
  it("should find US by code", () => {
    const us = getCountry("US");
    expect(us).toBeDefined();
    expect(us!.name).toBe("United States");
    expect(us!.currency).toBe("USD");
  });

  it("should find country case-insensitively", () => {
    const ke = getCountry("ke");
    expect(ke).toBeDefined();
    expect(ke!.name).toBe("Kenya");
  });

  it("should return undefined for unknown country", () => {
    expect(getCountry("XX")).toBeUndefined();
  });

  it("should return at least 5 countries", () => {
    const all = getAllCountries();
    expect(all.length).toBeGreaterThanOrEqual(5);
  });
});

describe("currencies", () => {
  it("should format USD correctly", () => {
    expect(formatMoney(1234.5, "USD")).toBe("$1234.50");
  });

  it("should format GBP correctly", () => {
    expect(formatMoney(99, "GBP")).toBe("£99.00");
  });

  it("should format KES correctly", () => {
    expect(formatMoney(1000, "KES")).toBe("KSh1000.00");
  });

  it("should throw for unknown currency", () => {
    expect(() => formatMoney(100, "ZZZ")).toThrow("Unknown currency code");
  });

  it("should find currency by code", () => {
    const usd = getCurrency("USD");
    expect(usd).toBeDefined();
    expect(usd!.decimals).toBe(2);
  });
});
