/**
 * Payment allocation repository port. All methods require clientId scoping.
 */
export interface PaymentAllocationData {
  readonly id: string;
  readonly clientId: string;
  readonly paymentId: string;
  readonly targetLedgerChargeEntryId: string;
  readonly allocatedAmount: number;
  readonly currency: string;
  readonly allocationOrder: number;
  readonly allocationRuleApplied: string;
  readonly allocatedAt: string;
  readonly actorId: string;
  readonly correlationId: string;
}

export interface PaymentAllocationRepository {
  findByPaymentId(clientId: string, paymentId: string): Promise<PaymentAllocationData[]>;
  insertMany(allocations: PaymentAllocationData[]): Promise<void>;
}
