import type { PaymentRepository } from '../ports/payment-repository.js';
import { Payment } from '../domain/payment.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface RecordManualPaymentInput {
  readonly id: string;
  readonly clientId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly residentId: string | undefined;
  readonly amountMinorUnits: number;
  readonly currency: string;
  readonly paymentMethodType: string;
  readonly description: string;
  readonly receivedAt: string;
  readonly idempotencyKey: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface RecordManualPaymentOutput {
  readonly payment: Payment;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Records a manual (offline) payment that is already settled.
 * Idempotent by idempotencyKey.
 */
export async function recordManualPayment(
  input: RecordManualPaymentInput,
  paymentRepo: PaymentRepository,
): Promise<RecordManualPaymentOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  // Idempotency check
  const existing = await paymentRepo.findByIdempotencyKey(input.clientId, input.idempotencyKey);
  if (existing) {
    const payment = Payment.fromData(existing);
    return { payment, events: [] };
  }

  const payment = Payment.createSettled({
    id: input.id,
    clientId: input.clientId,
    leaseId: input.leaseId,
    residentId: input.residentId,
    paymentMethodType: input.paymentMethodType as 'CASH',
    provider: 'MANUAL',
    providerPaymentId: undefined,
    providerCustomerId: undefined,
    amountReceived: input.amountMinorUnits,
    receivedCurrency: input.currency,
    amountLedger: input.amountMinorUnits,
    ledgerCurrency: input.currency,
    fxRate: undefined,
    initiatedAt: input.receivedAt,
    settledAt: input.receivedAt,
    idempotencyKey: input.idempotencyKey,
    createdByActorId: input.actorId,
    correlationId: input.correlationId,
  });

  await paymentRepo.insert(payment.data);

  return {
    payment,
    events: payment.getDomainEvents(),
  };
}
