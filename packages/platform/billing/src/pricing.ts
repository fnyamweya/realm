import { z } from "zod";

export const PricingDimensionSchema = z.object({
  dimension: z.string(),
  unitPrice: z.number(),
  currency: z.string(),
});

export type PricingDimension = z.infer<typeof PricingDimensionSchema>;

export const PricingRuleSchema = z.object({
  ruleId: z.string(),
  geography: z.string().optional(),
  portfolioSizeMin: z.number().optional(),
  portfolioSizeMax: z.number().optional(),
  module: z.string(),
  dimensions: z.array(PricingDimensionSchema),
  billingCycle: z.enum(["monthly", "annual"]),
  schemaVersion: z.number(),
});

export type PricingRule = z.infer<typeof PricingRuleSchema>;

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
}

export interface Quote {
  clientId: string;
  lineItems: LineItem[];
  subtotal: number;
  currency: string;
  generatedAt: string;
}

export function calculateQuote(
  clientId: string,
  rules: PricingRule[],
  attributes: Record<string, unknown>,
): Quote {
  const lineItems: LineItem[] = [];
  let currency = "USD";

  for (const rule of rules) {
    if (
      rule.geography &&
      attributes["geography"] &&
      rule.geography !== attributes["geography"]
    ) {
      continue;
    }

    const portfolioSize =
      typeof attributes["portfolioSize"] === "number"
        ? attributes["portfolioSize"]
        : 0;

    if (rule.portfolioSizeMin !== undefined && portfolioSize < rule.portfolioSizeMin) {
      continue;
    }
    if (rule.portfolioSizeMax !== undefined && portfolioSize > rule.portfolioSizeMax) {
      continue;
    }

    for (const dim of rule.dimensions) {
      const quantity =
        typeof attributes[dim.dimension] === "number"
          ? (attributes[dim.dimension] as number)
          : 1;

      const total = quantity * dim.unitPrice;
      currency = dim.currency;

      lineItems.push({
        description: `${rule.module} — ${dim.dimension}`,
        quantity,
        unitPrice: dim.unitPrice,
        total,
        currency: dim.currency,
      });
    }
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);

  return {
    clientId,
    lineItems,
    subtotal,
    currency,
    generatedAt: new Date().toISOString(),
  };
}
