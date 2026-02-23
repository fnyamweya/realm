import { z } from "zod";

export const Email = z.string().email();
export type Email = z.infer<typeof Email>;

export const PhoneNumber = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid E.164 phone number" });
export type PhoneNumber = z.infer<typeof PhoneNumber>;

export const ISO8601DateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/,
    { message: "Invalid ISO 8601 date-time" },
  );
export type ISO8601DateTime = z.infer<typeof ISO8601DateTime>;

export const NonEmptyString = z.string().min(1);
export type NonEmptyString = z.infer<typeof NonEmptyString>;

export const MoneyAmount = z.object({
  amount: z
    .number()
    .multipleOf(0.01, { message: "Amount must have at most 2 decimal places" }),
  currency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, { message: "Currency must be an ISO 4217 code" }),
});
export type MoneyAmount = z.infer<typeof MoneyAmount>;

export const Address = z.object({
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  countryCode: z
    .string()
    .length(2)
    .regex(/^[A-Z]{2}$/, {
      message: "Country code must be ISO 3166-1 alpha-2",
    }),
});
export type Address = z.infer<typeof Address>;
