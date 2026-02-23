import { describe, it, expect } from 'vitest';
import { ChargeAssignment, ChargeAssignmentStatus, AssignmentScope, resolveAssignments } from '../charge-assignment.js';
import { Money } from '../money.js';

function makeProps(overrides: Partial<Parameters<typeof ChargeAssignment.create>[0]> = {}) {
  return {
    id: 'ca-1',
    clientId: 'client-1',
    chargePlanId: 'cp-1',
    scopeType: 'LEASE' as const,
    scopeId: 'lease-1',
    leaseId: 'lease-1',
    overrideAmount: undefined as Money | undefined,
    overrideRecurrence: undefined,
    allocationRule: undefined,
    effectiveFrom: '2024-01-01T00:00:00.000Z',
    effectiveTo: undefined as string | undefined,
    metadata: undefined,
    ...overrides,
  };
}

describe('ChargeAssignment', () => {
  it('creates with ACTIVE status', () => {
    const a = ChargeAssignment.create(makeProps());
    expect(a.data.status).toBe(ChargeAssignmentStatus.ACTIVE);
  });

  it('requires clientId', () => {
    expect(() => ChargeAssignment.create(makeProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires chargePlanId', () => {
    expect(() => ChargeAssignment.create(makeProps({ chargePlanId: '' }))).toThrow('chargePlanId is required');
  });

  it('requires scopeId', () => {
    expect(() => ChargeAssignment.create(makeProps({ scopeId: '' }))).toThrow('scopeId is required');
  });

  it('end() transitions ACTIVE -> ENDED', () => {
    const a = ChargeAssignment.create(makeProps());
    a.end('2024-06-01T00:00:00.000Z');
    expect(a.data.status).toBe(ChargeAssignmentStatus.ENDED);
    expect(a.data.effectiveTo).toBe('2024-06-01T00:00:00.000Z');
  });

  it('suspend() transitions ACTIVE -> SUSPENDED', () => {
    const a = ChargeAssignment.create(makeProps());
    a.suspend();
    expect(a.data.status).toBe(ChargeAssignmentStatus.SUSPENDED);
  });

  it('resume() transitions SUSPENDED -> ACTIVE', () => {
    const a = ChargeAssignment.create(makeProps());
    a.suspend();
    a.resume();
    expect(a.data.status).toBe(ChargeAssignmentStatus.ACTIVE);
  });

  it('cannot end non-active assignment', () => {
    const a = ChargeAssignment.create(makeProps());
    a.suspend();
    expect(() => a.end('2024-06-01T00:00:00.000Z')).toThrow('Can only end active assignments');
  });

  it('isActiveAt() checks date window', () => {
    const a = ChargeAssignment.create(makeProps({
      effectiveFrom: '2024-01-01T00:00:00.000Z',
      effectiveTo: '2024-06-01T00:00:00.000Z',
    }));

    expect(a.isActiveAt('2024-03-15T00:00:00.000Z')).toBe(true);
    expect(a.isActiveAt('2023-12-31T00:00:00.000Z')).toBe(false);
    expect(a.isActiveAt('2024-06-01T00:00:00.000Z')).toBe(false); // exclusive end
  });

  it('isActiveAt() returns false for non-active status', () => {
    const a = ChargeAssignment.create(makeProps());
    a.suspend();
    expect(a.isActiveAt('2024-03-15T00:00:00.000Z')).toBe(false);
  });
});

describe('resolveAssignments', () => {
  it('picks highest priority scope (LEASE > UNIT > PROPERTY)', () => {
    const propAssignment = ChargeAssignment.create(makeProps({
      id: 'ca-prop',
      scopeType: AssignmentScope.PROPERTY,
      scopeId: 'prop-1',
      chargePlanId: 'cp-1',
      effectiveFrom: '2024-01-01T00:00:00.000Z',
    }));
    const unitAssignment = ChargeAssignment.create(makeProps({
      id: 'ca-unit',
      scopeType: AssignmentScope.UNIT,
      scopeId: 'unit-1',
      chargePlanId: 'cp-1',
      effectiveFrom: '2024-01-01T00:00:00.000Z',
    }));
    const leaseAssignment = ChargeAssignment.create(makeProps({
      id: 'ca-lease',
      scopeType: AssignmentScope.LEASE,
      scopeId: 'lease-1',
      chargePlanId: 'cp-1',
      effectiveFrom: '2024-01-01T00:00:00.000Z',
    }));

    const resolved = resolveAssignments(
      [propAssignment, unitAssignment, leaseAssignment],
      '2024-03-01T00:00:00.000Z',
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.data.id).toBe('ca-lease');
  });

  it('filters inactive assignments', () => {
    const active = ChargeAssignment.create(makeProps({
      id: 'ca-active',
      chargePlanId: 'cp-1',
      effectiveFrom: '2024-01-01T00:00:00.000Z',
    }));
    const suspended = ChargeAssignment.create(makeProps({
      id: 'ca-suspended',
      chargePlanId: 'cp-1',
      effectiveFrom: '2024-01-01T00:00:00.000Z',
    }));
    suspended.suspend();

    const resolved = resolveAssignments(
      [active, suspended],
      '2024-03-01T00:00:00.000Z',
    );

    expect(resolved).toHaveLength(1);
    expect(resolved[0]!.data.id).toBe('ca-active');
  });
});
