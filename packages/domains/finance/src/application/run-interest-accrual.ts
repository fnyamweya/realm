import type { InterestRunRepository, InterestRunData, InterestRunBasisData } from '../ports/delinquency-repository.js';
import { computeInterest, actualDaysBetween, type InterestBasis } from '../domain/interest-computation.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface OverdueCharge {
  readonly chargeEntryId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly outstandingMinorUnits: number;
  readonly category: string;
  readonly dueDate: string;
}

export interface RunInterestAccrualInput {
  readonly runId: string;
  readonly clientId: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly aprPercent: number;
  readonly basis: InterestBasis;
  readonly graceDays: number;
  readonly minimumPrincipalThreshold: number;
  readonly currency: string;
  readonly overdueCharges: readonly OverdueCharge[];
  readonly correlationId: string;
  readonly basisIdGenerator: () => string;
}

export interface RunInterestAccrualOutput {
  readonly run: InterestRunData;
  readonly basisRows: readonly InterestRunBasisData[];
  readonly totalInterestPosted: number;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Runs interest accrual for a set of overdue charges.
 * Idempotent by runKey.
 */
export async function runInterestAccrual(
  input: RunInterestAccrualInput,
  runRepo: InterestRunRepository,
): Promise<RunInterestAccrualOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  const runKey = `${input.clientId}:interest:${input.periodStart}:${input.periodEnd}:${input.policyVersion}`;

  // Idempotency check
  const existingRun = await runRepo.findByRunKey(input.clientId, runKey);
  if (existingRun) {
    return { run: existingRun, basisRows: [], totalInterestPosted: 0, events: [] };
  }

  const now = new Date().toISOString();
  const basisRows: InterestRunBasisData[] = [];
  let totalInterest = 0;
  let totalPrincipal = 0;

  for (const charge of input.overdueCharges) {
    if (charge.outstandingMinorUnits < input.minimumPrincipalThreshold) continue;

    // Compute days overdue past grace period
    const daysOverdue = actualDaysBetween(charge.dueDate, input.periodEnd);
    const effectiveDays = Math.max(0, daysOverdue - input.graceDays);
    if (effectiveDays <= 0) continue;

    const result = computeInterest({
      principalMinorUnits: charge.outstandingMinorUnits,
      aprPercent: input.aprPercent,
      basis: input.basis,
      daysAccrued: effectiveDays,
      periodStartDate: input.periodStart,
      periodEndDate: input.periodEnd,
    });

    if (result.computedInterestMinorUnits > 0) {
      basisRows.push({
        id: input.basisIdGenerator(),
        clientId: input.clientId,
        interestRunId: input.runId,
        leaseId: charge.leaseId,
        chargeEntryId: charge.chargeEntryId,
        principalOutstanding: charge.outstandingMinorUnits,
        daysAccrued: result.daysUsed,
        aprPercentUsed: input.aprPercent,
        basisMethod: input.basis,
        computedInterest: result.computedInterestMinorUnits,
        remainderCarried: result.remainderMinorUnits,
        createdAt: now,
      });

      totalInterest += result.computedInterestMinorUnits;
      totalPrincipal += charge.outstandingMinorUnits;
    }
  }

  const run: InterestRunData = {
    id: input.runId,
    clientId: input.clientId,
    runKey,
    policyId: input.policyId,
    policyVersion: input.policyVersion,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    executedAt: now,
    status: 'COMPLETED',
    principalConsidered: totalPrincipal,
    interestPosted: totalInterest,
    correlationId: input.correlationId,
    createdAt: now,
  };

  await runRepo.insert(run);
  if (basisRows.length > 0) {
    await runRepo.insertBasisMany(basisRows);
  }

  const events: DomainEvent[] = [{
    eventType: 'finance.interest.charged',
    payload: {
      interestRunId: input.runId,
      clientId: input.clientId,
      totalInterestPosted: totalInterest,
      currency: input.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      entriesCount: basisRows.length,
    },
  }];

  return { run, basisRows, totalInterestPosted: totalInterest, events };
}
