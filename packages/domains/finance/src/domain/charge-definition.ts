import type { DomainEvent } from './ledger-entry.js';

export const ChargeDefinitionStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ChargeDefinitionStatus = (typeof ChargeDefinitionStatus)[keyof typeof ChargeDefinitionStatus];

export const ChargeCategory = {
  RENT: 'RENT', PARKING: 'PARKING', UTILITY: 'UTILITY', FEE: 'FEE',
  DEPOSIT: 'DEPOSIT', PET: 'PET', AMENITY: 'AMENITY', LATE_FEE: 'LATE_FEE',
  INSURANCE: 'INSURANCE', TAX: 'TAX', OTHER: 'OTHER',
} as const;
export type ChargeCategory = (typeof ChargeCategory)[keyof typeof ChargeCategory];

export interface ChargeDefinitionData {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly category: ChargeCategory;
  readonly description: string | undefined;
  readonly glCode: string | undefined;
  readonly taxable: boolean;
  readonly status: ChargeDefinitionStatus;
  readonly metadataSchema: Record<string, unknown> | undefined;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export class ChargeDefinition {
  private _data: ChargeDefinitionData;
  private readonly _events: DomainEvent[] = [];

  private constructor(data: ChargeDefinitionData) {
    this._data = data;
  }

  get data(): ChargeDefinitionData { return this._data; }

  static create(props: Omit<ChargeDefinitionData, 'status' | 'createdAt' | 'updatedAt'> & { status?: ChargeDefinitionStatus }): ChargeDefinition {
    if (!props.clientId) throw new Error('clientId is required');
    if (!props.name || props.name.trim().length === 0) throw new Error('name is required');

    const now = new Date().toISOString();
    const def = new ChargeDefinition({
      ...props,
      status: props.status ?? ChargeDefinitionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });
    def._events.push({
      eventType: 'finance.charge_definition.created',
      payload: { chargeDefinitionId: props.id, clientId: props.clientId, name: props.name, category: props.category },
    });
    return def;
  }

  updateName(name: string): void {
    if (!name || name.trim().length === 0) throw new Error('name is required');
    this._data = { ...this._data, name, updatedAt: new Date().toISOString() };
    this._events.push({
      eventType: 'finance.charge_definition.updated',
      payload: { chargeDefinitionId: this._data.id, clientId: this._data.clientId, changedFields: ['name'] },
    });
  }

  deactivate(): void {
    if (this._data.status === ChargeDefinitionStatus.ARCHIVED) throw new Error('Cannot deactivate an archived charge definition');
    this._data = { ...this._data, status: ChargeDefinitionStatus.INACTIVE, updatedAt: new Date().toISOString() };
  }

  archive(): void {
    if (this._data.status !== ChargeDefinitionStatus.INACTIVE) throw new Error('Can only archive inactive charge definitions');
    this._data = { ...this._data, status: ChargeDefinitionStatus.ARCHIVED, updatedAt: new Date().toISOString() };
  }

  activate(): void {
    if (this._data.status !== ChargeDefinitionStatus.INACTIVE) throw new Error('Can only activate inactive charge definitions');
    this._data = { ...this._data, status: ChargeDefinitionStatus.ACTIVE, updatedAt: new Date().toISOString() };
  }

  getDomainEvents(): ReadonlyArray<DomainEvent> { return [...this._events]; }
}
