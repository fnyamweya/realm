// ═══════════════════════════════════════════════════════════════════════════
// Read model / projection types for financial dashboards
// ═══════════════════════════════════════════════════════════════════════════

export const DelinquencyStatus = {
  CURRENT: 'CURRENT',
  AT_RISK: 'AT_RISK',
  DELINQUENT: 'DELINQUENT',
  IN_DISPUTE: 'IN_DISPUTE',
} as const;
export type DelinquencyStatus = (typeof DelinquencyStatus)[keyof typeof DelinquencyStatus];

export interface LeaseBalanceSummary {
  readonly clientId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly totalCharges: number;
  readonly totalPayments: number;
  readonly totalCredits: number;
  readonly totalWaivers: number;
  readonly totalRefunds: number;
  readonly currentBalance: number;
  readonly currency: string;
  readonly lastUpdatedAt: string;
}

export interface ResidentBalanceSummary {
  readonly clientId: string;
  readonly residentId: string;
  readonly totalBalance: number;
  readonly currency: string;
  readonly leaseCount: number;
  readonly lastUpdatedAt: string;
}

export interface AgingBucketSummary {
  readonly clientId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly current: number;
  readonly days1to30: number;
  readonly days31to60: number;
  readonly days61to90: number;
  readonly days90plus: number;
  readonly currency: string;
  readonly lastUpdatedAt: string;
}

export interface NextDueSummary {
  readonly clientId: string;
  readonly leaseId: string;
  readonly nextDueDate: string | undefined;
  readonly nextDueAmount: number | undefined;
  readonly currency: string | undefined;
  readonly lastUpdatedAt: string;
}

export interface DelinquencyStatusSummary {
  readonly clientId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly status: DelinquencyStatus;
  readonly daysOverdue: number;
  readonly totalOverdue: number;
  readonly currency: string;
  readonly hasOpenDispute: boolean;
  readonly lastUpdatedAt: string;
}

export interface OpenChargeView {
  readonly clientId: string;
  readonly ledgerEntryId: string;
  readonly leaseId: string;
  readonly propertyId: string;
  readonly category: string;
  readonly outstandingAmount: number;
  readonly currency: string;
  readonly dueDate: string;
  readonly isDisputed: boolean;
  readonly chargeDefinitionId: string | undefined;
}
