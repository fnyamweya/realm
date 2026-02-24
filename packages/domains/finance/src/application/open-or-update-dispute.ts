import type { DisputeRepository } from '../ports/dispute-repository.js';
import { Dispute, DisputeStatus, type DisputeData, type DisputeReason } from '../domain/dispute.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface OpenOrUpdateDisputeInput {
  readonly id: string;
  readonly clientId: string;
  readonly paymentId: string;
  readonly provider: string;
  readonly providerDisputeId: string;
  readonly reason: DisputeReason;
  readonly amount: number;
  readonly currency: string;
  readonly feeAmount: number | undefined;
  readonly feeCurrency: string | undefined;
  readonly openedAt: string;
  readonly evidenceDueBy: string | undefined;
  readonly newStatus: string | undefined;
  readonly correlationId: string;
}

export interface OpenOrUpdateDisputeOutput {
  readonly dispute: DisputeData;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Opens a new dispute or updates an existing one from provider events.
 * Idempotent by providerDisputeId.
 */
export async function openOrUpdateDispute(
  input: OpenOrUpdateDisputeInput,
  disputeRepo: DisputeRepository,
): Promise<OpenOrUpdateDisputeOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  // Check if dispute already exists
  const existing = await disputeRepo.findByProviderDisputeId(
    input.clientId, input.provider, input.providerDisputeId,
  );

  if (existing) {
    // Update existing dispute
    const dispute = Dispute.fromData(existing);

    if (input.newStatus === DisputeStatus.EVIDENCE_SUBMITTED && existing.status === DisputeStatus.OPEN) {
      dispute.submitEvidence();
    } else if (input.newStatus === DisputeStatus.WON) {
      dispute.markWon();
    } else if (input.newStatus === DisputeStatus.LOST) {
      dispute.markLost();
    } else if (input.newStatus === DisputeStatus.CLOSED) {
      dispute.close();
    }

    await disputeRepo.update(dispute.data);
    return { dispute: dispute.data, events: dispute.getDomainEvents() };
  }

  // Create new dispute
  const dispute = Dispute.create({
    id: input.id,
    clientId: input.clientId,
    paymentId: input.paymentId,
    provider: input.provider,
    providerDisputeId: input.providerDisputeId,
    reason: input.reason,
    amount: input.amount,
    currency: input.currency,
    feeAmount: input.feeAmount,
    feeCurrency: input.feeCurrency,
    openedAt: input.openedAt,
    evidenceDueBy: input.evidenceDueBy,
    pauseReminders: true,
    correlationId: input.correlationId,
  });

  await disputeRepo.insert(dispute.data);
  return { dispute: dispute.data, events: dispute.getDomainEvents() };
}
