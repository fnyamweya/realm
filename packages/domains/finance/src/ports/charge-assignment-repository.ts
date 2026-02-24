import type { ChargeAssignment } from '../domain/charge-assignment.js';

export interface ChargeAssignmentRepository {
  save(assignment: ChargeAssignment): Promise<void>;
  findById(clientId: string, id: string): Promise<ChargeAssignment | null>;
  findByChargePlanId(clientId: string, chargePlanId: string): Promise<ChargeAssignment[]>;
  findByScopeId(clientId: string, scopeType: string, scopeId: string): Promise<ChargeAssignment[]>;
  findByLeaseId(clientId: string, leaseId: string): Promise<ChargeAssignment[]>;
  findActiveByDate(clientId: string, date: string): Promise<ChargeAssignment[]>;
}
