import { LedgerEntry, LedgerEntryType } from '../domain/ledger-entry.js';
import { Money } from '../domain/money.js';
import type { LedgerRepository } from '../ports/ledger-repository.js';

export interface PostManualChargeInput {
  readonly id: string;
  readonly clientId: string;
  readonly propertyId: string;
  readonly unitId: string | undefined;
  readonly leaseId: string | undefined;
  readonly residentId: string | undefined;
  readonly amount: number;
  readonly currency: string;
  readonly dueDate: string | undefined;
  readonly description: string;
  readonly chargeDefinitionId: string | undefined;
  readonly actorId: string;
  readonly correlationId: string;
  readonly idempotencyKey: string | undefined;
}

export async function postManualCharge(
  input: PostManualChargeInput,
  ledgerRepo: LedgerRepository,
): Promise<LedgerEntry> {
  if (input.idempotencyKey) {
    const existing = await ledgerRepo.findByIdempotencyKey(input.clientId, input.idempotencyKey);
    if (existing) return existing;
  }

  const entry = LedgerEntry.create({
    id: input.id,
    clientId: input.clientId,
    entryType: LedgerEntryType.CHARGE,
    propertyId: input.propertyId,
    unitId: input.unitId,
    leaseId: input.leaseId,
    residentId: input.residentId,
    amount: Money.of(input.amount, input.currency),
    dueDate: input.dueDate,
    postedAt: new Date().toISOString(),
    chargeDefinitionId: input.chargeDefinitionId,
    chargePlanId: undefined,
    chargeAssignmentId: undefined,
    occurrenceId: undefined,
    allocationGroupId: undefined,
    linkedEntryId: undefined,
    description: input.description,
    idempotencyKey: input.idempotencyKey,
    createdByActorId: input.actorId,
    correlationId: input.correlationId,
    createdAt: new Date().toISOString(),
  });

  await ledgerRepo.save(entry);
  return entry;
}
