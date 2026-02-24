import type { DomainEvent } from './ledger-entry.js';

export const PaymentStatus = {
  INITIATED: 'INITIATED',
  AUTHORIZED: 'AUTHORIZED',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELED: 'CANCELED',
  REFUNDED: 'REFUNDED',
  CHARGEBACK: 'CHARGEBACK',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethodType = {
  CARD: 'CARD',
  ACH: 'ACH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CASH: 'CASH',
  CHECK: 'CHECK',
  MOBILE_MONEY: 'MOBILE_MONEY',
  OTHER: 'OTHER',
} as const;
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const PaymentProvider = {
  STRIPE: 'STRIPE',
  MANUAL: 'MANUAL',
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export interface PaymentData {
  readonly id: string;
  readonly clientId: string;
  readonly leaseId: string | undefined;
  readonly residentId: string | undefined;
  readonly status: PaymentStatus;
  readonly paymentMethodType: PaymentMethodType;
  readonly provider: PaymentProvider;
  readonly providerPaymentId: string | undefined;
  readonly providerCustomerId: string | undefined;
  readonly amountReceived: number;
  readonly receivedCurrency: string;
  readonly amountLedger: number;
  readonly ledgerCurrency: string;
  readonly fxRate: number | undefined;
  readonly initiatedAt: string;
  readonly settledAt: string | undefined;
  readonly idempotencyKey: string | undefined;
  readonly createdByActorId: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Valid status transitions */
const VALID_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  INITIATED: ['AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELED'],
  AUTHORIZED: ['SUCCEEDED', 'FAILED', 'CANCELED'],
  SUCCEEDED: ['REFUNDED', 'CHARGEBACK'],
  FAILED: [],
  CANCELED: [],
  REFUNDED: [],
  CHARGEBACK: [],
};

export class Payment {
  private _data: PaymentData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: PaymentData) {
    this._data = data;
  }

  get data(): PaymentData { return this._data; }

  static create(props: Omit<PaymentData, 'status' | 'settledAt' | 'createdAt' | 'updatedAt'>): Payment {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.createdByActorId) throw new Error('createdByActorId is required');
    if (!props.correlationId) throw new Error('correlationId is required');
    if (props.amountReceived <= 0) throw new Error('amountReceived must be positive');

    const now = new Date().toISOString();
    const payment = new Payment({
      ...props,
      status: PaymentStatus.INITIATED,
      settledAt: undefined,
      createdAt: now,
      updatedAt: now,
    });
    payment._events.push({
      eventType: 'finance.payment.initiated',
      payload: {
        paymentId: props.id,
        clientId: props.clientId,
        leaseId: props.leaseId,
        amount: props.amountReceived,
        currency: props.receivedCurrency,
        provider: props.provider,
      },
    });
    return payment;
  }

  /** For recording manual payments that are already settled */
  static createSettled(props: Omit<PaymentData, 'status' | 'createdAt' | 'updatedAt'>): Payment {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.createdByActorId) throw new Error('createdByActorId is required');
    if (props.amountReceived <= 0) throw new Error('amountReceived must be positive');

    const now = new Date().toISOString();
    const payment = new Payment({
      ...props,
      status: PaymentStatus.SUCCEEDED,
      createdAt: now,
      updatedAt: now,
    });
    payment._events.push({
      eventType: 'finance.payment.succeeded',
      payload: {
        paymentId: props.id,
        clientId: props.clientId,
        leaseId: props.leaseId,
        amount: props.amountReceived,
        currency: props.receivedCurrency,
        provider: props.provider,
      },
    });
    return payment;
  }

  /** Reconstruct from stored data */
  static fromData(data: PaymentData): Payment {
    return new Payment(data);
  }

  private transitionTo(newStatus: PaymentStatus): void {
    const allowed = VALID_TRANSITIONS[this._data.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${this._data.status} to ${newStatus}`);
    }
    this._data = { ...this._data, status: newStatus, updatedAt: new Date().toISOString() };
  }

  markSucceeded(settledAt: string, providerPaymentId: string | undefined): void {
    this.transitionTo(PaymentStatus.SUCCEEDED);
    this._data = {
      ...this._data,
      settledAt,
      providerPaymentId: providerPaymentId ?? this._data.providerPaymentId,
    };
    this._events.push({
      eventType: 'finance.payment.succeeded',
      payload: {
        paymentId: this._data.id,
        clientId: this._data.clientId,
        leaseId: this._data.leaseId,
        amount: this._data.amountReceived,
        currency: this._data.receivedCurrency,
        provider: this._data.provider,
        providerPaymentId: this._data.providerPaymentId,
      },
    });
  }

  markFailed(reason: string): void {
    this.transitionTo(PaymentStatus.FAILED);
    this._events.push({
      eventType: 'finance.payment.failed',
      payload: {
        paymentId: this._data.id,
        clientId: this._data.clientId,
        reason,
      },
    });
  }

  markRefunded(reason: string): void {
    this.transitionTo(PaymentStatus.REFUNDED);
    this._events.push({
      eventType: 'finance.payment.refunded',
      payload: {
        paymentId: this._data.id,
        clientId: this._data.clientId,
        refundAmount: this._data.amountReceived,
        currency: this._data.receivedCurrency,
        reason,
      },
    });
  }

  markChargeback(): void {
    this.transitionTo(PaymentStatus.CHARGEBACK);
    this._events.push({
      eventType: 'finance.payment.chargebacked',
      payload: {
        paymentId: this._data.id,
        clientId: this._data.clientId,
        amount: this._data.amountReceived,
        currency: this._data.receivedCurrency,
      },
    });
  }

  isSettled(): boolean {
    return this._data.status === PaymentStatus.SUCCEEDED;
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
