import { describe, it, expect } from 'vitest';
import { ChargeDefinition, ChargeDefinitionStatus, ChargeCategory } from '../charge-definition.js';

function makeProps(overrides: Partial<Parameters<typeof ChargeDefinition.create>[0]> = {}) {
  return {
    id: 'cd-1',
    clientId: 'client-1',
    name: 'Monthly Rent',
    category: ChargeCategory.RENT as const,
    description: 'Standard rent charge',
    glCode: '4000',
    taxable: false,
    metadataSchema: undefined,
    ...overrides,
  };
}

describe('ChargeDefinition', () => {
  it('creates with ACTIVE status by default', () => {
    const def = ChargeDefinition.create(makeProps());
    expect(def.data.status).toBe(ChargeDefinitionStatus.ACTIVE);
    expect(def.data.name).toBe('Monthly Rent');
    expect(def.data.clientId).toBe('client-1');
  });

  it('requires clientId', () => {
    expect(() => ChargeDefinition.create(makeProps({ clientId: '' }))).toThrow('clientId is required');
  });

  it('requires name', () => {
    expect(() => ChargeDefinition.create(makeProps({ name: '' }))).toThrow('name is required');
  });

  it('transitions ACTIVE -> INACTIVE via deactivate()', () => {
    const def = ChargeDefinition.create(makeProps());
    expect(def.data.status).toBe(ChargeDefinitionStatus.ACTIVE);
    def.deactivate();
    expect(def.data.status).toBe(ChargeDefinitionStatus.INACTIVE);
  });

  it('transitions INACTIVE -> ARCHIVED via archive()', () => {
    const def = ChargeDefinition.create(makeProps());
    def.deactivate();
    def.archive();
    expect(def.data.status).toBe(ChargeDefinitionStatus.ARCHIVED);
  });

  it('transitions INACTIVE -> ACTIVE via activate()', () => {
    const def = ChargeDefinition.create(makeProps());
    def.deactivate();
    def.activate();
    expect(def.data.status).toBe(ChargeDefinitionStatus.ACTIVE);
  });

  it('cannot archive from ACTIVE (must deactivate first)', () => {
    const def = ChargeDefinition.create(makeProps());
    expect(() => def.archive()).toThrow('Can only archive inactive charge definitions');
  });

  it('cannot deactivate from ARCHIVED', () => {
    const def = ChargeDefinition.create(makeProps());
    def.deactivate();
    def.archive();
    expect(() => def.deactivate()).toThrow('Cannot deactivate an archived charge definition');
  });

  it('updateName() updates and emits event', () => {
    const def = ChargeDefinition.create(makeProps());
    def.updateName('New Rent');
    expect(def.data.name).toBe('New Rent');

    const events = def.getDomainEvents();
    const updateEvent = events.find(e => e.eventType === 'finance.charge_definition.updated');
    expect(updateEvent).toBeDefined();
    expect(updateEvent!.payload.changedFields).toEqual(['name']);
  });

  it('getDomainEvents() returns creation event', () => {
    const def = ChargeDefinition.create(makeProps());
    const events = def.getDomainEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[0]!.eventType).toBe('finance.charge_definition.created');
    expect(events[0]!.payload.chargeDefinitionId).toBe('cd-1');
  });
});
