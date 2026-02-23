import type { LedgerEntry, LedgerEntryData } from '../domain/ledger-entry.js';

export interface LedgerEntryFilter {
  readonly clientId: string;
  readonly propertyId?: string;
  readonly unitId?: string;
  readonly leaseId?: string;
  readonly residentId?: string;
  readonly entryType?: string;
  readonly fromDate?: string;
  readonly toDate?: string;
}

export interface LedgerRepository {
  save(entry: LedgerEntry): Promise<void>;
  findById(clientId: string, id: string): Promise<LedgerEntry | null>;
  findByIdempotencyKey(clientId: string, key: string): Promise<LedgerEntry | null>;
  findByFilter(filter: LedgerEntryFilter): Promise<LedgerEntry[]>;
  findByLeaseId(clientId: string, leaseId: string): Promise<LedgerEntry[]>;
}
