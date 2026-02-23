import type { ChargePlan } from '../domain/charge-plan.js';

export interface ChargePlanRepository {
  save(plan: ChargePlan): Promise<void>;
  findById(clientId: string, id: string): Promise<ChargePlan | null>;
  findByChargeDefinitionId(clientId: string, chargeDefinitionId: string): Promise<ChargePlan[]>;
  findByClientId(clientId: string): Promise<ChargePlan[]>;
}
