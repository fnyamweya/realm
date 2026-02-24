import type { ChargeDefinition } from '../domain/charge-definition.js';

export interface ChargeDefinitionRepository {
  save(definition: ChargeDefinition): Promise<void>;
  findById(clientId: string, id: string): Promise<ChargeDefinition | null>;
  findByClientId(clientId: string): Promise<ChargeDefinition[]>;
}
