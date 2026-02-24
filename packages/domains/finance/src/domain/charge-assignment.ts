import type { Money } from './money.js';
import type { RecurrenceSpec } from './recurrence.js';
import type { DomainEvent } from './ledger-entry.js';
import type { AllocationRule } from './allocation.js';

export const AssignmentScope = {
  PROPERTY: 'PROPERTY',
  UNIT: 'UNIT',
  LEASE: 'LEASE',
  RESIDENT: 'RESIDENT',
} as const;
export type AssignmentScope = (typeof AssignmentScope)[keyof typeof AssignmentScope];

export const ChargeAssignmentStatus = {
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type ChargeAssignmentStatus = (typeof ChargeAssignmentStatus)[keyof typeof ChargeAssignmentStatus];

export interface ChargeAssignmentData {
  readonly id: string;
  readonly clientId: string;
  readonly chargePlanId: string;
  readonly scopeType: AssignmentScope;
  readonly scopeId: string;
  readonly leaseId: string | undefined;
  readonly overrideAmount: Money | undefined;
  readonly overrideRecurrence: RecurrenceSpec | undefined;
  readonly allocationRule: AllocationRule | undefined;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | undefined;
  readonly status: ChargeAssignmentStatus;
  readonly metadata: Record<string, unknown> | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Resolution priority: lease > unit > property */
export const SCOPE_PRIORITY: Record<AssignmentScope, number> = {
  LEASE: 3,
  UNIT: 2,
  PROPERTY: 1,
  RESIDENT: 4,
};

export class ChargeAssignment {
  private _data: ChargeAssignmentData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: ChargeAssignmentData) {
    this._data = data;
  }

  get data(): ChargeAssignmentData { return this._data; }

  static create(props: Omit<ChargeAssignmentData, 'status' | 'createdAt' | 'updatedAt'> & { status?: ChargeAssignmentStatus }): ChargeAssignment {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.chargePlanId) throw new Error('chargePlanId is required');
    if (!props.scopeId) throw new Error('scopeId is required');

    const now = new Date().toISOString();
    const assignment = new ChargeAssignment({
      ...props,
      status: props.status ?? ChargeAssignmentStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    assignment._events.push({
      eventType: 'finance.charge.assigned',
      payload: {
        chargeAssignmentId: props.id,
        clientId: props.clientId,
        chargePlanId: props.chargePlanId,
        scopeType: props.scopeType,
        scopeId: props.scopeId,
        effectiveFrom: props.effectiveFrom,
      },
    });
    return assignment;
  }

  end(endDate: string): void {
    if (this._data.status !== ChargeAssignmentStatus.ACTIVE) throw new Error('Can only end active assignments');
    this._data = { ...this._data, status: ChargeAssignmentStatus.ENDED, effectiveTo: endDate, updatedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.charge_assignment.ended',
      payload: { chargeAssignmentId: this._data.id, clientId: this._data.clientId, endedAt: endDate },
    });
  }

  suspend(): void {
    if (this._data.status !== ChargeAssignmentStatus.ACTIVE) throw new Error('Can only suspend active assignments');
    this._data = { ...this._data, status: ChargeAssignmentStatus.SUSPENDED, updatedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.charge_assignment.suspended',
      payload: { chargeAssignmentId: this._data.id, clientId: this._data.clientId },
    });
  }

  resume(): void {
    if (this._data.status !== ChargeAssignmentStatus.SUSPENDED) throw new Error('Can only resume suspended assignments');
    this._data = { ...this._data, status: ChargeAssignmentStatus.ACTIVE, updatedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.charge_assignment.resumed',
      payload: { chargeAssignmentId: this._data.id, clientId: this._data.clientId },
    });
  }

  isActiveAt(date: string): boolean {
    if (this._data.status !== ChargeAssignmentStatus.ACTIVE) return false;
    const d = new Date(date).getTime();
    const from = new Date(this._data.effectiveFrom).getTime();
    if (d < from) return false;
    if (this._data.effectiveTo) {
      return d < new Date(this._data.effectiveTo).getTime();
    }
    return true;
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}

/**
 * Resolve the effective assignments for a lease by deterministic priority.
 * Higher scope priority wins. Within same scope, later effectiveFrom wins.
 */
export function resolveAssignments(assignments: ChargeAssignment[], date: string): ChargeAssignment[] {
  const active = assignments.filter(a => a.isActiveAt(date));
  // Group by charge plan to handle overrides
  const byPlan = new Map<string, ChargeAssignment[]>();
  for (const a of active) {
    const existing = byPlan.get(a.data.chargePlanId);
    if (existing) {
      existing.push(a);
    } else {
      byPlan.set(a.data.chargePlanId, [a]);
    }
  }

  const resolved: ChargeAssignment[] = [];
  for (const [, group] of byPlan) {
    // Sort by scope priority descending (highest wins), then effectiveFrom descending
    const sorted = group.sort((a, b) => {
      const priorityDiff = SCOPE_PRIORITY[b.data.scopeType] - SCOPE_PRIORITY[a.data.scopeType];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.data.effectiveFrom).getTime() - new Date(a.data.effectiveFrom).getTime();
    });
    const winner = sorted[0];
    if (winner) resolved.push(winner);
  }

  return resolved;
}
