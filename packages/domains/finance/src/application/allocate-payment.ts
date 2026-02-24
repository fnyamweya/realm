import type { PaymentAllocationRepository, PaymentAllocationData } from '../ports/payment-allocation-repository.js';
import { allocatePayment, type OutstandingCharge, type PaymentAllocationPolicy } from '../domain/payment-allocation-engine.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface AllocatePaymentInput {
  readonly paymentId: string;
  readonly clientId: string;
  readonly paymentAmountMinorUnits: number;
  readonly currency: string;
  readonly outstandingCharges: readonly OutstandingCharge[];
  readonly policy: PaymentAllocationPolicy;
  readonly actorId: string;
  readonly correlationId: string;
  readonly allocationIdGenerator: () => string;
}

export interface AllocatePaymentOutput {
  readonly allocations: readonly PaymentAllocationData[];
  readonly remainderUnapplied: number;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Allocates a settled payment to outstanding charges using the allocation policy.
 * Idempotent: if allocations already exist for this payment, returns existing.
 */
export async function allocatePaymentUseCase(
  input: AllocatePaymentInput,
  allocationRepo: PaymentAllocationRepository,
): Promise<AllocatePaymentOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  // Idempotency: check if allocations already exist for this payment
  const existing = await allocationRepo.findByPaymentId(input.clientId, input.paymentId);
  if (existing.length > 0) {
    return { allocations: existing, remainderUnapplied: 0, events: [] };
  }

  const result = allocatePayment(
    input.paymentAmountMinorUnits,
    input.outstandingCharges,
    input.policy,
  );

  const now = new Date().toISOString();
  const allocations: PaymentAllocationData[] = result.allocations.map((alloc, idx) => ({
    id: input.allocationIdGenerator(),
    clientId: input.clientId,
    paymentId: input.paymentId,
    targetLedgerChargeEntryId: alloc.chargeEntryId,
    allocatedAmount: alloc.amount,
    currency: input.currency,
    allocationOrder: idx + 1,
    allocationRuleApplied: input.policy.mode,
    allocatedAt: now,
    actorId: input.actorId,
    correlationId: input.correlationId,
  }));

  if (allocations.length > 0) {
    await allocationRepo.insertMany(allocations);
  }

  const events: DomainEvent[] = [{
    eventType: 'finance.payment.allocated',
    payload: {
      paymentId: input.paymentId,
      clientId: input.clientId,
      allocationsCount: allocations.length,
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocatedAmount, 0),
      remainderUnapplied: result.remainderUnapplied,
      currency: input.currency,
    },
  }];

  return {
    allocations,
    remainderUnapplied: result.remainderUnapplied,
    events,
  };
}
