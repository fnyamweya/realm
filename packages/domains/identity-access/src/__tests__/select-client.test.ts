import { describe, it, expect } from "vitest";
import { selectClient, type SelectClientInput } from "../application/select-client.js";
import { AuthError } from "../application/resident-login.js";
import type {
  SessionRepository,
  MembershipRepository,
  AuditEventRepository,
} from "../ports/repositories.js";
import type { SessionEntity, Membership, AuditEvent } from "../domain/entities.js";

// ─── Stubs ───────────────────────────────────────────────────────────────────

function makeSessionRepo(sessions: SessionEntity[] = []): SessionRepository {
  return {
    findById: async (id) => sessions.find((s) => s.id === id) ?? null,
    findActiveByUserId: async () => [],
    create: async () => {},
    updateLastSeen: async () => {},
    updateActiveClient: async (id, clientId) => {
      const s = sessions.find((s) => s.id === id);
      if (s) (s as Record<string, unknown>).activeClientId = clientId;
    },
    updateMfaLevel: async () => {},
    revoke: async () => {},
    revokeAllForUser: async () => {},
  };
}

function makeMembershipRepo(
  memberships: Membership[] = [],
): MembershipRepository {
  return {
    findById: async (id) => memberships.find((m) => m.id === id) ?? null,
    findByUserAndClient: async (userId, clientId) =>
      memberships.find((m) => m.userId === userId && m.clientId === clientId) ??
      null,
    findAllByUserId: async (userId) =>
      memberships.filter((m) => m.userId === userId),
    findAllByClientId: async () => [],
    create: async () => {},
    updateStatus: async () => {},
    updateRoles: async () => {},
  };
}

function makeAuditRepo(): AuditEventRepository & { events: AuditEvent[] } {
  const events: AuditEvent[] = [];
  return {
    events,
    create: async (e) => { events.push(e); },
    findByClientId: async () => [],
    findByEventType: async () => [],
  };
}

let idCounter = 0;
function generateId(prefix: string): string {
  return `${prefix}_test${String(++idCounter).padStart(4, "0")}`;
}
function now(): string {
  return "2025-06-01T12:00:00.000Z";
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("selectClient", () => {
  const session: SessionEntity = {
    id: "ses_01",
    userId: "usr_01",
    activeClientId: null,
    audience: "console",
    authMethod: "oidc",
    mfaLevel: "NONE",
    mfaLevelExpiresAt: null,
    createdAt: "2025-01-01T00:00:00Z",
    lastSeenAt: "2025-01-01T00:00:00Z",
    expiresAt: "2099-01-01T00:00:00Z",
    revokedAt: null,
    ipHash: "ip_01",
    deviceHash: null,
    userAgentHash: "ua_01",
    refreshTokenHash: null,
  };

  const membershipA: Membership = {
    id: "mem_01",
    userId: "usr_01",
    clientId: "cli_01",
    status: "ACTIVE",
    rolesJson: '["OWNER"]',
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  const membershipB: Membership = {
    id: "mem_02",
    userId: "usr_01",
    clientId: "cli_02",
    status: "ACTIVE",
    rolesJson: '["MANAGER"]',
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };

  it("selects active client when user has membership", async () => {
    idCounter = 0;
    const sessions = [{ ...session }];
    const auditRepo = makeAuditRepo();

    await selectClient(
      {
        sessionId: "ses_01",
        userId: "usr_01",
        targetClientId: "cli_01",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        sessionRepo: makeSessionRepo(sessions),
        membershipRepo: makeMembershipRepo([membershipA, membershipB]),
        auditRepo,
        generateId,
        now,
      },
    );

    expect(sessions[0]!.activeClientId).toBe("cli_01");
    expect(auditRepo.events).toHaveLength(1);
    expect(auditRepo.events[0]!.eventType).toBe("AUTH_CLIENT_SELECTED");
    expect(auditRepo.events[0]!.clientId).toBe("cli_01");
  });

  it("allows switching to different client", async () => {
    idCounter = 0;
    const sessions = [{ ...session, activeClientId: "cli_01" }];

    await selectClient(
      {
        sessionId: "ses_01",
        userId: "usr_01",
        targetClientId: "cli_02",
        correlationId: "cor_01",
        ipHash: "ip_01",
      },
      {
        sessionRepo: makeSessionRepo(sessions),
        membershipRepo: makeMembershipRepo([membershipA, membershipB]),
        auditRepo: makeAuditRepo(),
        generateId,
        now,
      },
    );

    expect(sessions[0]!.activeClientId).toBe("cli_02");
  });

  it("rejects selection for client user has no membership in", async () => {
    idCounter = 0;

    await expect(
      selectClient(
        {
          sessionId: "ses_01",
          userId: "usr_01",
          targetClientId: "cli_99",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          sessionRepo: makeSessionRepo([{ ...session }]),
          membershipRepo: makeMembershipRepo([membershipA]),
          auditRepo: makeAuditRepo(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("No active membership for this client");
  });

  it("rejects selection for suspended membership", async () => {
    idCounter = 0;
    const suspendedMembership: Membership = {
      ...membershipA,
      status: "SUSPENDED",
    };

    await expect(
      selectClient(
        {
          sessionId: "ses_01",
          userId: "usr_01",
          targetClientId: "cli_01",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          sessionRepo: makeSessionRepo([{ ...session }]),
          membershipRepo: makeMembershipRepo([suspendedMembership]),
          auditRepo: makeAuditRepo(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("No active membership for this client");
  });

  it("rejects if session belongs to different user", async () => {
    idCounter = 0;

    await expect(
      selectClient(
        {
          sessionId: "ses_01",
          userId: "usr_02",
          targetClientId: "cli_01",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          sessionRepo: makeSessionRepo([{ ...session }]),
          membershipRepo: makeMembershipRepo([membershipA]),
          auditRepo: makeAuditRepo(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("Session does not belong to user");
  });

  it("ensures client isolation - user cannot access other user's client", async () => {
    idCounter = 0;
    const otherUserMembership: Membership = {
      id: "mem_other",
      userId: "usr_other",
      clientId: "cli_secret",
      status: "ACTIVE",
      rolesJson: '["OWNER"]',
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    };

    await expect(
      selectClient(
        {
          sessionId: "ses_01",
          userId: "usr_01",
          targetClientId: "cli_secret",
          correlationId: "cor_01",
          ipHash: "ip_01",
        },
        {
          sessionRepo: makeSessionRepo([{ ...session }]),
          membershipRepo: makeMembershipRepo([membershipA, otherUserMembership]),
          auditRepo: makeAuditRepo(),
          generateId,
          now,
        },
      ),
    ).rejects.toThrow("No active membership for this client");
  });
});
