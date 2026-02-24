import type {
  LeaseBalanceSummary,
  AgingBucketSummary,
  DelinquencyStatusSummary,
  NextDueSummary,
  OpenChargeView,
} from '../domain/balance-summary.js';

/**
 * Balance projections repository. All methods scoped by clientId.
 * These are read models updated by event-driven projections.
 */
export interface BalanceProjectionRepository {
  getLeaseBalance(clientId: string, leaseId: string): Promise<LeaseBalanceSummary | undefined>;
  upsertLeaseBalance(data: LeaseBalanceSummary): Promise<void>;

  getAgingBuckets(clientId: string, leaseId: string): Promise<AgingBucketSummary | undefined>;
  upsertAgingBuckets(data: AgingBucketSummary): Promise<void>;

  getDelinquencyStatus(clientId: string, leaseId: string): Promise<DelinquencyStatusSummary | undefined>;
  upsertDelinquencyStatus(data: DelinquencyStatusSummary): Promise<void>;

  getNextDue(clientId: string, leaseId: string): Promise<NextDueSummary | undefined>;
  upsertNextDue(data: NextDueSummary): Promise<void>;

  getOpenCharges(clientId: string, leaseId: string): Promise<OpenChargeView[]>;
  upsertOpenCharge(data: OpenChargeView): Promise<void>;
  removeOpenCharge(clientId: string, ledgerEntryId: string): Promise<void>;
}
