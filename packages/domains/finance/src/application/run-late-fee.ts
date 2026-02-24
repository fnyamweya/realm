import type { LateFeeRunRepository, LateFeeRunData, LateFeeRunItemData } from '../ports/delinquency-repository.js';
import { computeLateFee, type LateFeeType } from '../domain/late-fee-computation.js';
import type { DomainEvent } from '../domain/ledger-entry.js';

export interface OverdueChargeForLateFee {
  readonly chargeEntryId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly outstandingMinorUnits: number;
  readonly category: string;
  readonly dueDate: string;
  readonly daysOverdue: number;
}

export interface RunLateFeeInput {
  readonly runId: string;
  readonly clientId: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly asOfDate: string;
  readonly graceDays: number;
  readonly feeType: LateFeeType;
  readonly fixedAmountMinorUnits: number | undefined;
  readonly percent: number | undefined;
  readonly capAmountMinorUnits: number | undefined;
  readonly maxOccurrencesPerCharge: number | undefined;
  readonly minOutstandingThresholdMinorUnits: number | undefined;
  readonly overdueCharges: readonly OverdueChargeForLateFee[];
  readonly correlationId: string;
  readonly itemIdGenerator: () => string;
}

export interface RunLateFeeOutput {
  readonly run: LateFeeRunData;
  readonly items: readonly LateFeeRunItemData[];
  readonly totalFeesPosted: number;
  readonly events: ReadonlyArray<DomainEvent>;
}

/**
 * Runs late fee computation for overdue charges.
 * Idempotent by runKey.
 */
export async function runLateFee(
  input: RunLateFeeInput,
  runRepo: LateFeeRunRepository,
): Promise<RunLateFeeOutput> {
  if (!input.clientId) throw new Error('clientId is required');

  const runKey = `${input.clientId}:latefee:${input.asOfDate}:${input.policyVersion}`;

  // Idempotency check
  const existingRun = await runRepo.findByRunKey(input.clientId, runKey);
  if (existingRun) {
    return { run: existingRun, items: [], totalFeesPosted: 0, events: [] };
  }

  const now = new Date().toISOString();
  const items: LateFeeRunItemData[] = [];
  let totalFees = 0;

  for (const charge of input.overdueCharges) {
    const previousOccurrences = await runRepo.countOccurrences(input.clientId, charge.chargeEntryId);

    const result = computeLateFee({
      outstandingMinorUnits: charge.outstandingMinorUnits,
      feeType: input.feeType,
      fixedAmountMinorUnits: input.fixedAmountMinorUnits,
      percent: input.percent,
      capAmountMinorUnits: input.capAmountMinorUnits,
      previousOccurrences,
      maxOccurrencesPerCharge: input.maxOccurrencesPerCharge,
      minOutstandingThresholdMinorUnits: input.minOutstandingThresholdMinorUnits,
      graceDays: input.graceDays,
      daysOverdue: charge.daysOverdue,
    });

    if (!result.skipped && result.feeAmountMinorUnits > 0) {
      items.push({
        id: input.itemIdGenerator(),
        clientId: input.clientId,
        lateFeeRunId: input.runId,
        leaseId: charge.leaseId,
        chargeEntryId: charge.chargeEntryId,
        outstandingAtRun: charge.outstandingMinorUnits,
        feeAmountPosted: result.feeAmountMinorUnits,
        occurrenceNumber: result.occurrenceNumber,
        createdAt: now,
      });
      totalFees += result.feeAmountMinorUnits;
    }
  }

  const run: LateFeeRunData = {
    id: input.runId,
    clientId: input.clientId,
    runKey,
    policyId: input.policyId,
    policyVersion: input.policyVersion,
    asOfDate: input.asOfDate,
    executedAt: now,
    status: 'COMPLETED',
    chargesConsidered: input.overdueCharges.length,
    feesPosted: totalFees,
    correlationId: input.correlationId,
    createdAt: now,
  };

  await runRepo.insert(run);
  if (items.length > 0) {
    await runRepo.insertItemMany(items);
  }

  const events: DomainEvent[] = [];
  for (const item of items) {
    events.push({
      eventType: 'finance.late_fee.applied',
      payload: {
        ledgerEntryId: item.id,
        clientId: input.clientId,
        amount: item.feeAmountPosted,
        currency: 'USD', // Should come from policy/config
        originalChargeEntryId: item.chargeEntryId,
        leaseId: item.leaseId,
      },
    });
  }

  return { run, items, totalFeesPosted: totalFees, events };
}
