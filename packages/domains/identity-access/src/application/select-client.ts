import type {
  SessionRepository,
  MembershipRepository,
  AuditEventRepository,
} from "../ports/repositories.js";
import { AuthError } from "./resident-login.js";
import type { AuditEvent } from "../domain/entities.js";

export interface SelectClientInput {
  sessionId: string;
  userId: string;
  targetClientId: string;
  correlationId: string;
  ipHash: string;
}

/**
 * Allows a user with multiple memberships to switch their active client
 * on a session. Validates membership existence and active status.
 */
export async function selectClient(
  input: SelectClientInput,
  deps: {
    sessionRepo: SessionRepository;
    membershipRepo: MembershipRepository;
    auditRepo: AuditEventRepository;
    generateId: (prefix: string) => string;
    now: () => string;
  },
): Promise<void> {
  // 1. Load session
  const session = await deps.sessionRepo.findById(input.sessionId);
  if (session === null || session.revokedAt !== null) {
    throw new AuthError("AUTH_SESSION_EXPIRED", "Session not found or expired");
  }
  if (session.userId !== input.userId) {
    throw new AuthError("AUTH_FORBIDDEN", "Session does not belong to user");
  }

  // 2. Verify membership
  const membership = await deps.membershipRepo.findByUserAndClient(
    input.userId,
    input.targetClientId,
  );
  if (membership === null || membership.status !== "ACTIVE") {
    throw new AuthError("AUTH_FORBIDDEN", "No active membership for this client");
  }

  // 3. Update session
  await deps.sessionRepo.updateActiveClient(
    input.sessionId,
    input.targetClientId,
    membership.id,
  );

  // 4. Audit
  await deps.auditRepo.create({
    id: deps.generateId("evt"),
    clientId: input.targetClientId,
    actorType: "USER",
    actorId: input.userId,
    membershipId: membership.id,
    eventType: "AUTH_CLIENT_SELECTED" as AuditEvent["eventType"],
    occurredAt: deps.now(),
    correlationId: input.correlationId,
    ipHash: input.ipHash,
    deviceHash: null,
    metadataJson: null,
    severity: "INFO",
  });
}
