/**
 * Delinquency run repositories. All methods require clientId scoping.
 */

export interface InterestRunData {
  readonly id: string;
  readonly clientId: string;
  readonly runKey: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly executedAt: string;
  readonly status: string;
  readonly principalConsidered: number;
  readonly interestPosted: number;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface InterestRunBasisData {
  readonly id: string;
  readonly clientId: string;
  readonly interestRunId: string;
  readonly leaseId: string;
  readonly chargeEntryId: string;
  readonly principalOutstanding: number;
  readonly daysAccrued: number;
  readonly aprPercentUsed: number;
  readonly basisMethod: string;
  readonly computedInterest: number;
  readonly remainderCarried: number;
  readonly createdAt: string;
}

export interface InterestRunRepository {
  findByRunKey(clientId: string, runKey: string): Promise<InterestRunData | undefined>;
  insert(data: InterestRunData): Promise<void>;
  updateStatus(clientId: string, id: string, status: string): Promise<void>;
  insertBasis(data: InterestRunBasisData): Promise<void>;
  insertBasisMany(data: InterestRunBasisData[]): Promise<void>;
}

export interface LateFeeRunData {
  readonly id: string;
  readonly clientId: string;
  readonly runKey: string;
  readonly policyId: string;
  readonly policyVersion: number;
  readonly asOfDate: string;
  readonly executedAt: string;
  readonly status: string;
  readonly chargesConsidered: number;
  readonly feesPosted: number;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface LateFeeRunItemData {
  readonly id: string;
  readonly clientId: string;
  readonly lateFeeRunId: string;
  readonly leaseId: string;
  readonly chargeEntryId: string;
  readonly outstandingAtRun: number;
  readonly feeAmountPosted: number;
  readonly occurrenceNumber: number;
  readonly createdAt: string;
}

export interface LateFeeRunRepository {
  findByRunKey(clientId: string, runKey: string): Promise<LateFeeRunData | undefined>;
  insert(data: LateFeeRunData): Promise<void>;
  updateStatus(clientId: string, id: string, status: string): Promise<void>;
  insertItem(data: LateFeeRunItemData): Promise<void>;
  insertItemMany(data: LateFeeRunItemData[]): Promise<void>;
  countOccurrences(clientId: string, chargeEntryId: string): Promise<number>;
}
