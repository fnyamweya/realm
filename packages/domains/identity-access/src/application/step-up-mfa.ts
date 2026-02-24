import type {
  MfaFactorRepository,
  MfaChallengeRepository,
  SessionRepository,
  AuditEventRepository,
  OtpGenerator,
} from "../ports/repositories.js";
import { AuthError } from "./resident-login.js";
import type { MfaLevel } from "../domain/value-objects.js";
import type { AuditEvent } from "../domain/entities.js";

// ─── Step-up MFA Use Case ────────────────────────────────────────────────────

export interface CreateMfaChallengeInput {
  userId: string;
  sessionId: string;
  factorId: string;
  correlationId: string;
  ipHash: string;
}

export interface CreateMfaChallengeOutput {
  challengeId: string;
  deliveryChannel: string;
  expiresAt: string;
}

export async function createMfaChallenge(
  input: CreateMfaChallengeInput,
  deps: {
    factorRepo: MfaFactorRepository;
    challengeRepo: MfaChallengeRepository;
    auditRepo: AuditEventRepository;
    otpGenerator: OtpGenerator;
    generateId: (prefix: string) => string;
    now: () => string;
    challengeTtlSeconds: number;
  },
): Promise<CreateMfaChallengeOutput> {
  // 1. Load factor
  const factor = await deps.factorRepo.findById(input.factorId);
  if (factor === null || factor.status !== "ACTIVE") {
    throw new AuthError("AUTH_FORBIDDEN", "MFA factor not found or disabled");
  }
  if (factor.userId !== input.userId) {
    throw new AuthError("AUTH_FORBIDDEN", "Factor does not belong to user");
  }

  // 2. Generate challenge
  const challengeId = deps.generateId("mch");
  const now = deps.now();
  const expiresAt = new Date(
    new Date(now).getTime() + deps.challengeTtlSeconds * 1000,
  ).toISOString();

  const code = deps.otpGenerator.generate();
  const codeHash = deps.otpGenerator.hash(code);

  const deliveryChannel =
    factor.factorType === "TOTP"
      ? "APP"
      : factor.factorType === "WEBAUTHN"
        ? "WEBAUTHN"
        : "SMS";

  await deps.challengeRepo.create({
    id: challengeId,
    userId: input.userId,
    sessionId: input.sessionId,
    challengeType: "STEP_UP",
    deliveryChannel,
    codeHash,
    expiresAt,
    attempts: 0,
    status: "PENDING",
  });

  // 3. Audit
  await deps.auditRepo.create({
    id: deps.generateId("evt"),
    clientId: null,
    actorType: "USER",
    actorId: input.userId,
    membershipId: null,
    eventType: "MFA_CHALLENGE_CREATED" as AuditEvent["eventType"],
    occurredAt: now,
    correlationId: input.correlationId,
    ipHash: input.ipHash,
    deviceHash: null,
    metadataJson: JSON.stringify({ factorType: factor.factorType }),
    severity: "INFO",
  });

  return { challengeId, deliveryChannel, expiresAt };
}

// ─── Verify MFA Challenge ────────────────────────────────────────────────────

export interface VerifyMfaChallengeInput {
  userId: string;
  sessionId: string;
  challengeId: string;
  code: string;
  correlationId: string;
  ipHash: string;
}

export interface VerifyMfaChallengeOutput {
  verified: boolean;
  mfaLevel: MfaLevel;
  mfaLevelExpiresAt: string | null;
}

const MAX_CHALLENGE_ATTEMPTS = 5;
const MFA_STEP_UP_DURATION_SECONDS = 300;

export async function verifyMfaChallenge(
  input: VerifyMfaChallengeInput,
  deps: {
    challengeRepo: MfaChallengeRepository;
    sessionRepo: SessionRepository;
    factorRepo: MfaFactorRepository;
    auditRepo: AuditEventRepository;
    otpGenerator: OtpGenerator;
    generateId: (prefix: string) => string;
    now: () => string;
  },
): Promise<VerifyMfaChallengeOutput> {
  const now = deps.now();

  // 1. Load challenge
  const challenge = await deps.challengeRepo.findById(input.challengeId);
  if (challenge === null) {
    throw new AuthError("AUTH_TOKEN_INVALID", "Challenge not found");
  }
  if (challenge.userId !== input.userId) {
    throw new AuthError("AUTH_FORBIDDEN", "Challenge does not belong to user");
  }
  if (challenge.status !== "PENDING") {
    throw new AuthError("AUTH_TOKEN_INVALID", "Challenge is no longer pending");
  }
  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    await deps.challengeRepo.updateStatus(input.challengeId, "EXPIRED");
    throw new AuthError("AUTH_TOKEN_EXPIRED", "Challenge has expired");
  }
  if (challenge.attempts >= MAX_CHALLENGE_ATTEMPTS) {
    await deps.challengeRepo.updateStatus(input.challengeId, "FAILED");
    throw new AuthError("AUTH_RATE_LIMITED", "Too many verification attempts");
  }

  // 2. Increment attempts
  await deps.challengeRepo.incrementAttempts(input.challengeId);

  // 3. Verify code
  const valid = deps.otpGenerator.verify(input.code, challenge.codeHash ?? "");
  if (!valid) {
    await emitMfaAudit(deps, input, "MFA_STEP_UP_FAIL");
    return { verified: false, mfaLevel: "NONE", mfaLevelExpiresAt: null };
  }

  // 4. Mark challenge as verified
  await deps.challengeRepo.updateStatus(input.challengeId, "VERIFIED");

  // 5. Upgrade session MFA level
  const mfaLevelExpiresAt = new Date(
    new Date(now).getTime() + MFA_STEP_UP_DURATION_SECONDS * 1000,
  ).toISOString();

  await deps.sessionRepo.updateMfaLevel(
    input.sessionId,
    "STRONG",
    mfaLevelExpiresAt,
  );

  // 6. Audit
  await emitMfaAudit(deps, input, "MFA_STEP_UP_SUCCESS");

  return { verified: true, mfaLevel: "STRONG", mfaLevelExpiresAt };
}

async function emitMfaAudit(
  deps: { auditRepo: AuditEventRepository; generateId: (prefix: string) => string; now: () => string },
  input: { userId: string; correlationId: string; ipHash: string },
  eventType: AuditEvent["eventType"],
): Promise<void> {
  await deps.auditRepo.create({
    id: deps.generateId("evt"),
    clientId: null,
    actorType: "USER",
    actorId: input.userId,
    membershipId: null,
    eventType,
    occurredAt: deps.now(),
    correlationId: input.correlationId,
    ipHash: input.ipHash,
    deviceHash: null,
    metadataJson: null,
    severity: eventType.includes("FAIL") ? "WARNING" : "INFO",
  });
}
