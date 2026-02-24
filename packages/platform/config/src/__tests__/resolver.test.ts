import { describe, it, expect } from "vitest";
import { mergeConfigs, LOCKED_KEYS } from "../resolver.js";

describe("mergeConfigs", () => {
  it("merges flat objects with override taking precedence", () => {
    const base = { a: 1, b: 2 };
    const override = { b: 3, c: 4 };
    const result = mergeConfigs(base, override);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("deep-merges nested objects", () => {
    const base = { branding: { primaryColor: "#000", logoUrl: "old.png" }, name: "x" };
    const override = { branding: { primaryColor: "#fff" } };
    const result = mergeConfigs(base, override);
    expect(result).toEqual({
      branding: { primaryColor: "#fff", logoUrl: "old.png" },
      name: "x",
    });
  });

  it("applies multiple override layers in order", () => {
    const base = { a: 1 };
    const first = { a: 2, b: 10 };
    const second = { a: 3, c: 20 };
    const result = mergeConfigs(base, first, second);
    expect(result).toEqual({ a: 3, b: 10, c: 20 });
  });

  it("does not mutate the original base object", () => {
    const base = { nested: { x: 1 } };
    const override = { nested: { y: 2 } };
    mergeConfigs(base, override);
    expect(base).toEqual({ nested: { x: 1 } });
  });
});

describe("locked keys", () => {
  it("prevents overriding mfaRequired", () => {
    const base = { mfaRequired: true, other: "a" };
    const override = { mfaRequired: false, other: "b" };
    const result = mergeConfigs(base, override);
    expect(result.mfaRequired).toBe(true);
    expect(result.other).toBe("b");
  });

  it("prevents overriding passwordMinLength", () => {
    const base = { passwordMinLength: 12 };
    const override = { passwordMinLength: 4 };
    const result = mergeConfigs(base, override);
    expect(result.passwordMinLength).toBe(12);
  });

  it("prevents overriding sessionDurationMinutes", () => {
    const base = { sessionDurationMinutes: 30 };
    const override = { sessionDurationMinutes: 9999 };
    const result = mergeConfigs(base, override);
    expect(result.sessionDurationMinutes).toBe(30);
  });

  it("has the expected set of locked keys", () => {
    expect(LOCKED_KEYS).toContain("mfaRequired");
    expect(LOCKED_KEYS).toContain("passwordMinLength");
    expect(LOCKED_KEYS).toContain("sessionDurationMinutes");
  });
});
