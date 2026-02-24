import { LedgerEntry, LedgerEntryType } from '../domain/ledger-entry.js';
import { Money } from '../domain/money.js';
import type { LedgerRepository } from '../ports/ledger-repository.js';

export interface ApplyAdjustmentInput {
  readonly id: string;
  readonly clientId: string;
  readonly linkedEntryId: string;
  readonly adjustmentAmount: number;
  readonly currency: string;
  readonly description: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export async function applyAdjustment(
  input: ApplyAdjustmentInput,
  ledgerRepo: LedgerRepository,
): Promise<LedgerEntry> {
  const linkedEntry = await ledgerRepo.findById(input.clientId, input.linkedEntryId);
  if (!linkedEntry) throw new Error(`Linked entry not found: ${input.linkedEntryId}`);

  const entry = LedgerEntry.create({
    id: input.id,
    clientId: input.clientId,
    entryType: LedgerEntryType.ADJUSTMENT,
    propertyId: linkedEntry.data.propertyId,
    unitId: linkedEntry.data.unitId,
    leaseId: linkedEntry.data.leaseId,
    residentId: linkedEntry.data.residentId,
    amount: Money.of(input.adjustmentAmount, input.currency),
    dueDate: linkedEntry.data.dueDate,
    postedAt: new Date().toISOString(),
    chargeDefinitionId: linkedEntry.data.chargeDefinitionId,
    chargePlanId: linkedEntry.data.chargePlanId,
    chargeAssignmentId: linkedEntry.data.chargeAssignmentId,
    occurrenceId: undefined,
    allocationGroupId: undefined,
    linkedEntryId: input.linkedEntryId,
    description: input.description,
    idempotencyKey: undefined,
    createdByActorId: input.actorId,
    correlationId: input.correlationId,
    createdAt: new Date().toISOString(),
  });

  await ledgerRepo.save(entry);
  return entry;
}
