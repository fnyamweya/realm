import { ChargeDefinition, type ChargeCategory } from '../domain/charge-definition.js';
import type { ChargeDefinitionRepository } from '../ports/charge-definition-repository.js';

export interface CreateChargeDefinitionInput {
  readonly id: string;
  readonly clientId: string;
  readonly name: string;
  readonly category: ChargeCategory;
  readonly description: string | undefined;
  readonly glCode: string | undefined;
  readonly taxable: boolean;
  readonly metadataSchema: Record<string, unknown> | undefined;
}

export async function createChargeDefinition(
  input: CreateChargeDefinitionInput,
  repo: ChargeDefinitionRepository,
): Promise<ChargeDefinition> {
  const definition = ChargeDefinition.create(input);
  await repo.save(definition);
  return definition;
}
