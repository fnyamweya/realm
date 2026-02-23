import type { Money } from './money.js';
import type { RecurrenceSpec, DueRuleSpec } from './recurrence.js';
import type { DomainEvent } from './ledger-entry.js';

export const ChargePlanStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ChargePlanStatus = (typeof ChargePlanStatus)[keyof typeof ChargePlanStatus];

export const ProrationPolicy = {
  NONE: 'NONE',
  DAILY_ACTUAL: 'DAILY_ACTUAL',
  DAILY_30: 'DAILY_30',
  HOURLY: 'HOURLY',
} as const;
export type ProrationPolicy = (typeof ProrationPolicy)[keyof typeof ProrationPolicy];

export interface ChargePlanData {
  readonly id: string;
  readonly clientId: string;
  readonly chargeDefinitionId: string;
  readonly name: string;
  readonly baseAmount: Money;
  readonly recurrence: RecurrenceSpec;
  readonly dueRule: DueRuleSpec;
  readonly prorationPolicy: ProrationPolicy;
  readonly status: ChargePlanStatus;
  readonly metadata: Record<string, unknown> | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class ChargePlan {
  private _data: ChargePlanData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: ChargePlanData) {
    this._data = data;
  }

  get data(): ChargePlanData { return this._data; }

  static create(props: Omit<ChargePlanData, 'status' | 'createdAt' | 'updatedAt'> & { status?: ChargePlanStatus }): ChargePlan {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.chargeDefinitionId) throw new Error('chargeDefinitionId is required');
    if (!props.name) throw new Error('name is required');
    if (props.baseAmount.isNegative()) throw new Error('baseAmount cannot be negative');

    const now = new Date().toISOString();
    const plan = new ChargePlan({
      ...props,
      status: props.status ?? ChargePlanStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    plan._events.push({
      eventType: 'finance.charge_plan.created',
      payload: { chargePlanId: props.id, clientId: props.clientId, chargeDefinitionId: props.chargeDefinitionId, name: props.name },
    });
    return plan;
  }

  updateBaseAmount(amount: Money): void {
    if (amount.isNegative()) throw new Error('baseAmount cannot be negative');
    this._data = { ...this._data, baseAmount: amount, updatedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.charge_plan.updated',
      payload: { chargePlanId: this._data.id, clientId: this._data.clientId, changedFields: ['baseAmount'] },
    });
  }

  deactivate(): void {
    if (this._data.status === ChargePlanStatus.ARCHIVED) throw new Error('Cannot deactivate archived plan');
    this._data = { ...this._data, status: ChargePlanStatus.INACTIVE, updatedAt: new Date().toISOString() };
  }

  activate(): void {
    if (this._data.status !== ChargePlanStatus.INACTIVE) throw new Error('Can only activate inactive plans');
    this._data = { ...this._data, status: ChargePlanStatus.ACTIVE, updatedAt: new Date().toISOString() };
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
