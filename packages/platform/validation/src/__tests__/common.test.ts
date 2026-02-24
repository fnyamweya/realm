import { describe, expect, it } from "vitest";
import { Email, PhoneNumber, MoneyAmount, Address } from "../common.js";

describe("Email", () => {
  it("accepts a valid email", () => {
    expect(Email.safeParse("user@example.com").success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(Email.safeParse("not-an-email").success).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(Email.safeParse("").success).toBe(false);
  });
});

describe("PhoneNumber", () => {
  it("accepts a valid E.164 number", () => {
    expect(PhoneNumber.safeParse("+14155552671").success).toBe(true);
  });

  it("accepts a minimal E.164 number", () => {
    expect(PhoneNumber.safeParse("+11").success).toBe(true);
  });

  it("rejects a number without leading +", () => {
    expect(PhoneNumber.safeParse("14155552671").success).toBe(false);
  });

  it("rejects a number starting with +0", () => {
    expect(PhoneNumber.safeParse("+0123456789").success).toBe(false);
  });

  it("rejects a number exceeding 15 digits", () => {
    expect(PhoneNumber.safeParse("+1234567890123456").success).toBe(false);
  });
});

describe("MoneyAmount", () => {
  it("accepts a valid money amount", () => {
    const result = MoneyAmount.safeParse({ amount: 99.99, currency: "USD" });
    expect(result.success).toBe(true);
  });

  it("accepts zero amount", () => {
    const result = MoneyAmount.safeParse({ amount: 0, currency: "EUR" });
    expect(result.success).toBe(true);
  });

  it("rejects more than 2 decimal places", () => {
    const result = MoneyAmount.safeParse({ amount: 9.999, currency: "USD" });
    expect(result.success).toBe(false);
  });

  it("rejects lowercase currency code", () => {
    const result = MoneyAmount.safeParse({ amount: 10, currency: "usd" });
    expect(result.success).toBe(false);
  });

  it("rejects currency code of wrong length", () => {
    const result = MoneyAmount.safeParse({ amount: 10, currency: "US" });
    expect(result.success).toBe(false);
  });
});

describe("Address", () => {
  const validAddress = {
    line1: "123 Main St",
    city: "Springfield",
    state: "IL",
    postalCode: "62701",
    countryCode: "US",
  };

  it("accepts a valid address", () => {
    expect(Address.safeParse(validAddress).success).toBe(true);
  });

  it("accepts an address with line2", () => {
    const result = Address.safeParse({ ...validAddress, line2: "Apt 4" });
    expect(result.success).toBe(true);
  });

  it("rejects a missing line1", () => {
    const { line1: _, ...noLine1 } = validAddress;
    expect(Address.safeParse(noLine1).success).toBe(false);
  });

  it("rejects an invalid country code", () => {
    expect(
      Address.safeParse({ ...validAddress, countryCode: "usa" }).success,
    ).toBe(false);
  });

  it("rejects a lowercase country code", () => {
    expect(
      Address.safeParse({ ...validAddress, countryCode: "us" }).success,
    ).toBe(false);
  });
});
