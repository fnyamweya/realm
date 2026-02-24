import type { DomainEvent } from './ledger-entry.js';

// ═══════════════════════════════════════════════════════════════════════════
// Refund entity — models payment refunds (full or partial)
// ═══════════════════════════════════════════════════════════════════════════

export const RefundStatus = {
  INITIATED: 'INITIATED',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
} as const;
export type RefundStatus = (typeof RefundStatus)[keyof typeof RefundStatus];

export interface RefundData {
  readonly id: string;
  readonly clientId: string;
  readonly paymentId: string;
  readonly provider: string;
  readonly providerRefundId: string | undefined;
  readonly status: RefundStatus;
  readonly amount: number;
  readonly currency: string;
  readonly reason: string;
  readonly reversalMapId: string | undefined;
  readonly idempotencyKey: string | undefined;
  readonly createdByActorId: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const VALID_REFUND_TRANSITIONS: Record<RefundStatus, readonly RefundStatus[]> = {
  INITIATED: ['SUCCEEDED', 'FAILED'],
  SUCCEEDED: [],
  FAILED: [],
};

export class Refund {
  private _data: RefundData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: RefundData) {
    this._data = data;
  }

  get data(): RefundData { return this._data; }

  static create(props: Omit<RefundData, 'status' | 'createdAt' | 'updatedAt'>): Refund {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.paymentId) throw new Error('paymentId is required');
    if (props.amount <= 0) throw new Error('amount must be positive');
    if (!props.createdByActorId) throw new Error('createdByActorId is required');
    if (!props.correlationId) throw new Error('correlationId is required');

    const now = new Date().toISOString();
    const refund = new Refund({
      ...props,
      status: RefundStatus.INITIATED,
      createdAt: now,
      updatedAt: now,
    });
    refund._events.push({
      eventType: 'finance.refund.initiated',
      payload: {
        refundId: props.id,
        clientId: props.clientId,
        paymentId: props.paymentId,
        amount: props.amount,
        currency: props.currency,
      },
    });
    return refund;
  }

  static fromData(data: RefundData): Refund {
    return new Refund(data);
  }

  private transitionTo(newStatus: RefundStatus): void {
    const allowed = VALID_REFUND_TRANSITIONS[this._data.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid refund transition from ${this._data.status} to ${newStatus}`);
    }
    this._data = { ...this._data, status: newStatus, updatedAt: new Date().toISOString() };
  }

  markSucceeded(providerRefundId: string | undefined): void {
    this.transitionTo(RefundStatus.SUCCEEDED);
    this._data = {
      ...this._data,
      providerRefundId: providerRefundId ?? this._data.providerRefundId,
    };
    this._events.push({
      eventType: 'finance.refund.succeeded',
      payload: {
        refundId: this._data.id,
        clientId: this._data.clientId,
        paymentId: this._data.paymentId,
        amount: this._data.amount,
        currency: this._data.currency,
      },
    });
  }

  markFailed(reason: string): void {
    this.transitionTo(RefundStatus.FAILED);
    this._events.push({
      eventType: 'finance.refund.failed',
      payload: {
        refundId: this._data.id,
        clientId: this._data.clientId,
        paymentId: this._data.paymentId,
        reason,
      },
    });
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
