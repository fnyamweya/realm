import { z } from "zod";

export const UsageEventSchema = z.object({
  clientId: z.string(),
  meter: z.string(),
  quantity: z.number(),
  timestamp: z.string(),
});

export type UsageEvent = z.infer<typeof UsageEventSchema>;

export const DailyUsageSummarySchema = z.object({
  clientId: z.string(),
  meter: z.string(),
  date: z.string(),
  totalQuantity: z.number(),
});

export type DailyUsageSummary = z.infer<typeof DailyUsageSummarySchema>;
