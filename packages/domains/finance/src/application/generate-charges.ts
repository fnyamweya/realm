import { LedgerEntry, LedgerEntryType } from '../domain/ledger-entry.js';
import { Money } from '../domain/money.js';
import { generatePeriods, computeProration } from '../domain/recurrence.js';
import { resolveAssignments, type ChargeAssignment } from '../domain/charge-assignment.js';
import type { ChargePlan } from '../domain/charge-plan.js';
import type { LedgerRepository } from '../ports/ledger-repository.js';
import type { ChargeAssignmentRepository } from '../ports/charge-assignment-repository.js';
import type { ChargePlanRepository } from '../ports/charge-plan-repository.js';

export interface GenerateChargesInput {
  readonly clientId: string;
  readonly propertyId: string;
  readonly leaseId: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly actorId: string;
  readonly correlationId: string;
  readonly idGenerator: () => string;
}

export async function generateCharges(
  input: GenerateChargesInput,
  ledgerRepo: LedgerRepository,
  assignmentRepo: ChargeAssignmentRepository,
  planRepo: ChargePlanRepository,
): Promise<LedgerEntry[]> {
  const assignments = await assignmentRepo.findByLeaseId(input.clientId, input.leaseId);
  const resolved = resolveAssignments(assignments, input.windowStart);

  const entries: LedgerEntry[] = [];

  for (const assignment of resolved) {
    const plan = await planRepo.findById(input.clientId, assignment.data.chargePlanId);
    if (!plan) continue;

    const recurrence = assignment.data.overrideRecurrence ?? plan.data.recurrence;
    const amount = assignment.data.overrideAmount ?? plan.data.baseAmount;
    const anchorDate = assignment.data.effectiveFrom;

    const periods = generatePeriods(
      recurrence,
      plan.data.dueRule,
      input.windowStart,
      input.windowEnd,
      anchorDate,
    );

    for (const period of periods) {
      const idempotencyKey = `${assignment.data.id}:${period.start}`;

      const existing = await ledgerRepo.findByIdempotencyKey(input.clientId, idempotencyKey);
      if (existing) continue;

      const effectiveEnd = assignment.data.effectiveTo ?? input.windowEnd;
      const chargeAmount = computeProration(
        amount.amount,
        period.start,
        period.end,
        assignment.data.effectiveFrom,
        effectiveEnd,
        plan.data.prorationPolicy,
      );

      if (chargeAmount === 0) continue;

      const entryAmount = Money.of(chargeAmount, amount.currency);

      const entry = LedgerEntry.create({
        id: input.idGenerator(),
        clientId: input.clientId,
        entryType: LedgerEntryType.CHARGE,
        propertyId: input.propertyId,
        unitId: undefined,
        leaseId: input.leaseId,
        residentId: undefined,
        amount: entryAmount,
        dueDate: period.dueDate,
        postedAt: new Date().toISOString(),
        chargeDefinitionId: plan.data.chargeDefinitionId,
        chargePlanId: plan.data.id,
        chargeAssignmentId: assignment.data.id,
        occurrenceId: `${assignment.data.id}:${period.start}`,
        allocationGroupId: undefined,
        linkedEntryId: undefined,
        description: plan.data.name,
        idempotencyKey,
        createdByActorId: input.actorId,
        correlationId: input.correlationId,
        createdAt: new Date().toISOString(),
      });

      await ledgerRepo.save(entry);
      entries.push(entry);
    }
  }

  return entries;
}
