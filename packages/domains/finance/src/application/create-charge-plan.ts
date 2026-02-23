import { ChargePlan, type ProrationPolicy } from '../domain/charge-plan.js';
import type { Money } from '../domain/money.js';
import type { RecurrenceSpec, DueRuleSpec } from '../domain/recurrence.js';
import type { ChargePlanRepository } from '../ports/charge-plan-repository.js';
import type { ChargeDefinitionRepository } from '../ports/charge-definition-repository.js';

export interface CreateChargePlanInput {
  readonly id: string;
  readonly clientId: string;
  readonly chargeDefinitionId: string;
  readonly name: string;
  readonly baseAmount: Money;
  readonly recurrence: RecurrenceSpec;
  readonly dueRule: DueRuleSpec;
  readonly prorationPolicy: ProrationPolicy;
  readonly metadata: Record<string, unknown> | undefined;
}

export async function createChargePlan(
  input: CreateChargePlanInput,
  planRepo: ChargePlanRepository,
  defRepo: ChargeDefinitionRepository,
): Promise<ChargePlan> {
  const definition = await defRepo.findById(input.clientId, input.chargeDefinitionId);
  if (!definition) throw new Error(`ChargeDefinition not found: ${input.chargeDefinitionId}`);

  const plan = ChargePlan.create(input);
  await planRepo.save(plan);
  return plan;
}
