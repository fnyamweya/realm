import { z } from "zod";

export const SessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  clientId: z.string(),
  membershipId: z.string(),
  roles: z.array(z.string()),
  mfaVerified: z.boolean(),
  createdAt: z.string(),
  expiresAt: z.string(),
  lastActivityAt: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

export interface SessionStore {
  create(session: Session): Promise<void>;
  get(sessionId: string): Promise<Session | null>;
  refresh(sessionId: string): Promise<Session>;
  revoke(sessionId: string): Promise<void>;
  revokeAllForUser(userId: string, clientId: string): Promise<void>;
}
