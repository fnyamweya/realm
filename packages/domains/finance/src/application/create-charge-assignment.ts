import { ChargeAssignment, type AssignmentScope } from '../domain/charge-assignment.js';
import type { Money } from '../domain/money.js';
import type { RecurrenceSpec } from '../domain/recurrence.js';
import type { AllocationRule } from '../domain/allocation.js';
import type { ChargeAssignmentRepository } from '../ports/charge-assignment-repository.js';
import type { ChargePlanRepository } from '../ports/charge-plan-repository.js';

export interface CreateChargeAssignmentInput {
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
  readonly metadata: Record<string, unknown> | undefined;
}

export async function createChargeAssignment(
  input: CreateChargeAssignmentInput,
  assignmentRepo: ChargeAssignmentRepository,
  planRepo: ChargePlanRepository,
): Promise<ChargeAssignment> {
  const plan = await planRepo.findById(input.clientId, input.chargePlanId);
  if (!plan) throw new Error(`ChargePlan not found: ${input.chargePlanId}`);

  const assignment = ChargeAssignment.create(input);
  await assignmentRepo.save(assignment);
  return assignment;
}
