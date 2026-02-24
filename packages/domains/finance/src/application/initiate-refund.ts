import type { RefundRepository } from '../ports/dispute-repository.js';
import { Refund, type RefundData } from '../domain/refund.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface InitiateRefundInput {
  readonly id: string;
  readonly clientId: string;
  readonly paymentId: string;
  readonly provider: string;
  readonly amount: number;
  readonly currency: string;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface InitiateRefundOutput {
  readonly refund: RefundData;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Initiates a refund. Idempotent by idempotencyKey.
 */
export async function initiateRefund(
  input: InitiateRefundInput,
  refundRepo: RefundRepository,
): Promise<InitiateRefundOutput> {
  if (!input.clientId) throw new Error('clientId is required');
  if (!input.actorId) throw new Error('actorId is required');

  // Idempotency check
  const existing = await refundRepo.findByIdempotencyKey(input.clientId, input.idempotencyKey);
  if (existing) {
    return { refund: existing, events: [] };
  }

  const refund = Refund.create({
    id: input.id,
    clientId: input.clientId,
    paymentId: input.paymentId,
    provider: input.provider,
    providerRefundId: undefined,
    amount: input.amount,
    currency: input.currency,
    reason: input.reason,
    reversalMapId: undefined,
    idempotencyKey: input.idempotencyKey,
    createdByActorId: input.actorId,
    correlationId: input.correlationId,
  });

  await refundRepo.insert(refund.data);
  return { refund: refund.data, events: refund.getDomainEvents() };
}
