import { Money } from './money.js';

export const LedgerEntryType = {
  CHARGE: 'CHARGE',
  PAYMENT: 'PAYMENT',
  CREDIT: 'CREDIT',
  WAIVER: 'WAIVER',
  ADJUSTMENT: 'ADJUSTMENT',
  REFUND: 'REFUND',
  VOID: 'VOID',
} as const;
export type LedgerEntryType = (typeof LedgerEntryType)[keyof typeof LedgerEntryType];

export interface LedgerEntryData {
  readonly id: string;
  readonly clientId: string;
  readonly entryType: LedgerEntryType;
  readonly propertyId: string;
  readonly unitId: string | undefined;
  readonly leaseId: string | undefined;
  readonly residentId: string | undefined;
  readonly amount: Money;
  readonly dueDate: string | undefined;
  readonly postedAt: string;
  readonly chargeDefinitionId: string | undefined;
  readonly chargePlanId: string | undefined;
  readonly chargeAssignmentId: string | undefined;
  readonly occurrenceId: string | undefined;
  readonly allocationGroupId: string | undefined;
  readonly linkedEntryId: string | undefined;
  readonly description: string;
  readonly idempotencyKey: string | undefined;
  readonly createdByActorId: string;
  readonly correlationId: string;
  readonly createdAt: string;
}

export interface DomainEvent {
  readonly eventType: string;
  readonly payload: Record<string, unknown>;
}

/**
 * Immutable ledger entry. Once created, it cannot be modified.
 * Corrections are made via VOID, ADJUSTMENT, CREDIT, or WAIVER entries.
 */
export class LedgerEntry {
  readonly data: LedgerEntryData;
  private readonly events: DomainEvent[] = [];

  private constructor(data: LedgerEntryData) {
    this.data = data;
    Object.freeze(this.data);
  }

  static create(props: LedgerEntryData): LedgerEntry {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.propertyId) throw new Error('propertyId is required');
    if (!props.createdByActorId) throw new Error('createdByActorId is required');
    if (!props.correlationId) throw new Error('correlationId is required');

    if (props.entryType === LedgerEntryType.VOID && !props.linkedEntryId) {
      throw new Error('VOID entries must reference a linkedEntryId');
    }

    const entry = new LedgerEntry(props);
    entry.events.push({
      eventType: 'finance.ledger_entry.posted',
      payload: {
        ledgerEntryId: props.id,
        clientId: props.clientId,
        entryType: props.entryType,
        amount: props.amount.amount,
        currency: props.amount.currency,
        leaseId: props.leaseId,
        propertyId: props.propertyId,
      },
    });
    return entry;
  }

  /** Create a VOID entry that negates this entry */
  createVoid(voidId: string, actorId: string, correlationId: string, reason: string): LedgerEntry {
    return LedgerEntry.create({
      id: voidId,
      clientId: this.data.clientId,
      entryType: LedgerEntryType.VOID,
      propertyId: this.data.propertyId,
      unitId: this.data.unitId,
      leaseId: this.data.leaseId,
      residentId: this.data.residentId,
      amount: this.data.amount.negate(),
      dueDate: this.data.dueDate,
      postedAt: new Date().toISOString(),
      chargeDefinitionId: this.data.chargeDefinitionId,
      chargePlanId: this.data.chargePlanId,
      chargeAssignmentId: this.data.chargeAssignmentId,
      occurrenceId: this.data.occurrenceId,
      allocationGroupId: this.data.allocationGroupId,
      linkedEntryId: this.data.id,
      description: `VOID: ${reason}`,
      idempotencyKey: undefined,
      createdByActorId: actorId,
      correlationId,
      createdAt: new Date().toISOString(),
    });
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> {
    return [...this.events];
  }

  /** Entries are debits (positive balance impact) or credits (negative balance impact) */
  isDebit(): boolean {
    return this.data.entryType === LedgerEntryType.CHARGE ||
           this.data.entryType === LedgerEntryType.REFUND ||
           (this.data.entryType === LedgerEntryType.ADJUSTMENT && this.data.amount.isPositive());
  }

  isCredit(): boolean {
    return !this.isDebit();
  }
}
