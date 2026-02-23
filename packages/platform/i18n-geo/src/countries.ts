import { z } from "zod";

export const CountrySchema = z.object({
  code: z.string().length(2),
  name: z.string(),
  currency: z.string(),
  timezone: z.string(),
  addressFormat: z.string(),
});

export type Country = z.infer<typeof CountrySchema>;

const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    timezone: "America/New_York",
    addressFormat: "{street}\n{city}, {state} {zip}\n{country}",
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    timezone: "Europe/London",
    addressFormat: "{street}\n{city}\n{postcode}\n{country}",
  },
  {
    code: "KE",
    name: "Kenya",
    currency: "KES",
    timezone: "Africa/Nairobi",
    addressFormat: "{street}\n{city} {postcode}\n{country}",
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    timezone: "Australia/Sydney",
    addressFormat: "{street}\n{city} {state} {postcode}\n{country}",
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    timezone: "America/Toronto",
    addressFormat: "{street}\n{city} {province} {postalCode}\n{country}",
  },
];

export function getCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code.toUpperCase());
}

export function getAllCountries(): readonly Country[] {
  return COUNTRIES;
}
