/**
 * Policy version repository port. All methods require clientId scoping.
 */
export interface PolicyVersionData {
  readonly id: string;
  readonly clientId: string;
  readonly kind: string;
  readonly policyId: string;
  readonly schemaVersion: number;
  readonly policyVersion: number;
  readonly status: string;
  readonly scopeType: string;
  readonly scopeId: string | undefined;
  readonly jsonPayload: string;
  readonly checksum: string;
  readonly publishedAt: string | undefined;
  readonly publishedByActorId: string | undefined;
  readonly createdAt: string;
}

export interface PolicyVersionRepository {
  findPublished(clientId: string, kind: string, scopeType: string, scopeId: string | undefined): Promise<PolicyVersionData | undefined>;
  findByIdScoped(clientId: string, id: string): Promise<PolicyVersionData | undefined>;
  insert(data: PolicyVersionData): Promise<void>;
  deprecateOldVersions(clientId: string, kind: string, scopeType: string, scopeId: string | undefined, exceptId: string): Promise<void>;
}
