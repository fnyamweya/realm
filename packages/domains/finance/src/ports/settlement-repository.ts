import type { ProviderBalanceTransactionData, ReconciliationMatchData } from '../domain/settlement.js';

/**
 * Provider balance transaction repository. All methods scoped by clientId.
 */
export interface ProviderBalanceTransactionRepository {
  findByProviderTxnId(clientId: string, provider: string, providerTxnId: string): Promise<ProviderBalanceTransactionData | undefined>;
  findByRelatedPaymentId(clientId: string, provider: string, relatedProviderPaymentId: string): Promise<ProviderBalanceTransactionData[]>;
  findByWindow(clientId: string, provider: string, start: string, end: string, cursor: string | undefined, limit: number): Promise<{ items: ProviderBalanceTransactionData[]; nextCursor: string | undefined }>;
  insert(data: ProviderBalanceTransactionData): Promise<void>;
  insertMany(data: ProviderBalanceTransactionData[]): Promise<void>;
}

/**
 * Reconciliation match repository. All methods scoped by clientId.
 */
export interface ReconciliationMatchRepository {
  findByProviderTxnId(clientId: string, provider: string, providerTxnId: string): Promise<ReconciliationMatchData | undefined>;
  findByStatus(clientId: string, status: string, cursor: string | undefined, limit: number): Promise<{ items: ReconciliationMatchData[]; nextCursor: string | undefined }>;
  insert(data: ReconciliationMatchData): Promise<void>;
  update(data: ReconciliationMatchData): Promise<void>;
}
