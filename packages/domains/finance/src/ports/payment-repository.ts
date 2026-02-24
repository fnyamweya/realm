import type { PaymentData } from '../domain/payment.js';

/**
 * Payment repository port. All methods require clientId for multi-client scoping.
 */
export interface PaymentRepository {
  findByIdScoped(clientId: string, paymentId: string): Promise<PaymentData | undefined>;
  findByProviderPaymentId(clientId: string, provider: string, providerPaymentId: string): Promise<PaymentData | undefined>;
  findByIdempotencyKey(clientId: string, idempotencyKey: string): Promise<PaymentData | undefined>;
  findByLeaseId(clientId: string, leaseId: string, cursor: string | undefined, limit: number): Promise<{ items: PaymentData[]; nextCursor: string | undefined }>;
  insert(data: PaymentData): Promise<void>;
  updateStatus(clientId: string, paymentId: string, status: string, settledAt: string | undefined, providerPaymentId: string | undefined): Promise<void>;
}
