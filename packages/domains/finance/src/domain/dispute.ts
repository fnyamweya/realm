import type { DomainEvent } from './ledger-entry.js';

// ═══════════════════════════════════════════════════════════════════════════
// Dispute entity — models provider disputes/chargebacks
// ═══════════════════════════════════════════════════════════════════════════

export const DisputeStatus = {
  OPEN: 'OPEN',
  EVIDENCE_SUBMITTED: 'EVIDENCE_SUBMITTED',
  WON: 'WON',
  LOST: 'LOST',
  CLOSED: 'CLOSED',
} as const;
export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const DisputeReason = {
  FRAUDULENT: 'FRAUDULENT',
  DUPLICATE: 'DUPLICATE',
  PRODUCT_NOT_RECEIVED: 'PRODUCT_NOT_RECEIVED',
  PRODUCT_UNACCEPTABLE: 'PRODUCT_UNACCEPTABLE',
  SUBSCRIPTION_CANCELED: 'SUBSCRIPTION_CANCELED',
  UNRECOGNIZED: 'UNRECOGNIZED',
  GENERAL: 'GENERAL',
  OTHER: 'OTHER',
} as const;
export type DisputeReason = (typeof DisputeReason)[keyof typeof DisputeReason];

export interface DisputeData {
  readonly id: string;
  readonly clientId: string;
  readonly paymentId: string;
  readonly provider: string;
  readonly providerDisputeId: string;
  readonly status: DisputeStatus;
  readonly reason: DisputeReason;
  readonly amount: number;
  readonly currency: string;
  readonly feeAmount: number | undefined;
  readonly feeCurrency: string | undefined;
  readonly openedAt: string;
  readonly evidenceDueBy: string | undefined;
  readonly closedAt: string | undefined;
  readonly pauseReminders: boolean;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const VALID_DISPUTE_TRANSITIONS: Record<DisputeStatus, readonly DisputeStatus[]> = {
  OPEN: ['EVIDENCE_SUBMITTED', 'WON', 'LOST', 'CLOSED'],
  EVIDENCE_SUBMITTED: ['WON', 'LOST', 'CLOSED'],
  WON: ['CLOSED'],
  LOST: ['CLOSED'],
  CLOSED: [],
};

export class Dispute {
  private _data: DisputeData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: DisputeData) {
    this._data = data;
  }

  get data(): DisputeData { return this._data; }

  static create(props: Omit<DisputeData, 'status' | 'closedAt' | 'createdAt' | 'updatedAt'>): Dispute {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.paymentId) throw new Error('paymentId is required');
    if (!props.providerDisputeId) throw new Error('providerDisputeId is required');
    if (props.amount <= 0) throw new Error('amount must be positive');

    const now = new Date().toISOString();
    const dispute = new Dispute({
      ...props,
      status: DisputeStatus.OPEN,
      closedAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
    dispute._events.push({
      eventType: 'finance.dispute.opened',
      payload: {
        disputeId: props.id,
        clientId: props.clientId,
        paymentId: props.paymentId,
        amount: props.amount,
        currency: props.currency,
        reason: props.reason,
      },
    });
    return dispute;
  }

  static fromData(data: DisputeData): Dispute {
    return new Dispute(data);
  }

  private transitionTo(newStatus: DisputeStatus): void {
    const allowed = VALID_DISPUTE_TRANSITIONS[this._data.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid dispute transition from ${this._data.status} to ${newStatus}`);
    }
    this._data = { ...this._data, status: newStatus, updatedAt: new Date().toISOString() };
  }

  submitEvidence(): void {
    this.transitionTo(DisputeStatus.EVIDENCE_SUBMITTED);
    this._events.push({
      eventType: 'finance.dispute.updated',
      payload: {
        disputeId: this._data.id,
        clientId: this._data.clientId,
        status: DisputeStatus.EVIDENCE_SUBMITTED,
      },
    });
  }

  markWon(): void {
    this.transitionTo(DisputeStatus.WON);
    this._events.push({
      eventType: 'finance.dispute.closed',
      payload: {
        disputeId: this._data.id,
        clientId: this._data.clientId,
        outcome: 'WON',
      },
    });
  }

  markLost(): void {
    this.transitionTo(DisputeStatus.LOST);
    this._data = { ...this._data, closedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.dispute.closed',
      payload: {
        disputeId: this._data.id,
        clientId: this._data.clientId,
        outcome: 'LOST',
      },
    });
    this._events.push({
      eventType: 'finance.chargeback.applied',
      payload: {
        disputeId: this._data.id,
        clientId: this._data.clientId,
        paymentId: this._data.paymentId,
        amount: this._data.amount,
        currency: this._data.currency,
      },
    });
  }

  close(): void {
    this.transitionTo(DisputeStatus.CLOSED);
    this._data = { ...this._data, closedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.dispute.closed',
      payload: {
        disputeId: this._data.id,
        clientId: this._data.clientId,
        outcome: this._data.status,
      },
    });
  }

  isOpen(): boolean {
    return this._data.status === DisputeStatus.OPEN ||
           this._data.status === DisputeStatus.EVIDENCE_SUBMITTED;
  }

  isLost(): boolean {
    return this._data.status === DisputeStatus.LOST;
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
