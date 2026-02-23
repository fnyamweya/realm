import { z } from "zod";

export const CreatePaymentIntentRequest = z.object({
  amount: z.number(),
  currency: z.string(),
  clientId: z.string(),
  tenantId: z.string(),
  leaseId: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type CreatePaymentIntentRequest = z.infer<
  typeof CreatePaymentIntentRequest
>;

export interface CreatePaymentIntentResponse {
  paymentIntentId: string;
  status: string;
  clientSecret: string;
}

export interface PaymentProvider {
  createPaymentIntent(
    request: CreatePaymentIntentRequest,
  ): Promise<CreatePaymentIntentResponse>;
}
