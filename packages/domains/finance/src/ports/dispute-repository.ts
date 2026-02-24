import type { DisputeData } from '../domain/dispute.js';
import type { RefundData } from '../domain/refund.js';

/**
 * Dispute repository port. All methods require clientId for multi-client scoping.
 */
export interface DisputeRepository {
  findByIdScoped(clientId: string, disputeId: string): Promise<DisputeData | undefined>;
  findByProviderDisputeId(clientId: string, provider: string, providerDisputeId: string): Promise<DisputeData | undefined>;
  findByPaymentId(clientId: string, paymentId: string): Promise<DisputeData[]>;
  findOpen(clientId: string, cursor: string | undefined, limit: number): Promise<{ items: DisputeData[]; nextCursor: string | undefined }>;
  insert(data: DisputeData): Promise<void>;
  update(data: DisputeData): Promise<void>;
}

/**
 * Refund repository port. All methods require clientId for multi-client scoping.
 */
export interface RefundRepository {
  findByIdScoped(clientId: string, refundId: string): Promise<RefundData | undefined>;
  findByProviderRefundId(clientId: string, provider: string, providerRefundId: string): Promise<RefundData | undefined>;
  findByPaymentId(clientId: string, paymentId: string): Promise<RefundData[]>;
  findByIdempotencyKey(clientId: string, idempotencyKey: string): Promise<RefundData | undefined>;
  insert(data: RefundData): Promise<void>;
  update(data: RefundData): Promise<void>;
}
