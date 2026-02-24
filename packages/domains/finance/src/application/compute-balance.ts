import { Money } from '../domain/money.js';
import type { LedgerRepository } from '../ports/ledger-repository.js';

export interface BalanceSummary {
  readonly totalCharges: Money;
  readonly totalPayments: Money;
  readonly totalCredits: Money;
  readonly totalAdjustments: Money;
  readonly balance: Money;
}

export async function computeBalance(
  clientId: string,
  leaseId: string,
  currency: string,
  ledgerRepo: LedgerRepository,
): Promise<BalanceSummary> {
  const entries = await ledgerRepo.findByLeaseId(clientId, leaseId);

  let totalCharges = Money.zero(currency);
  let totalPayments = Money.zero(currency);
  let totalCredits = Money.zero(currency);
  let totalAdjustments = Money.zero(currency);

  for (const entry of entries) {
    switch (entry.data.entryType) {
      case 'CHARGE':
        totalCharges = totalCharges.add(entry.data.amount);
        break;
      case 'PAYMENT':
        totalPayments = totalPayments.add(entry.data.amount);
        break;
      case 'CREDIT':
      case 'WAIVER':
        totalCredits = totalCredits.add(entry.data.amount);
        break;
      case 'ADJUSTMENT':
        totalAdjustments = totalAdjustments.add(entry.data.amount);
        break;
      case 'REFUND':
        totalCharges = totalCharges.add(entry.data.amount);
        break;
      case 'VOID':
        // VOID entries negate the original, already have negated amounts
        totalAdjustments = totalAdjustments.add(entry.data.amount);
        break;
    }
  }

  const balance = totalCharges
    .add(totalPayments)
    .add(totalCredits)
    .add(totalAdjustments);

  return {
    totalCharges,
    totalPayments,
    totalCredits,
    totalAdjustments,
    balance,
  };
}
