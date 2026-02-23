import { z } from "zod";

export const MembershipStatus = z.enum(["active", "suspended", "revoked"]);
export type MembershipStatus = z.infer<typeof MembershipStatus>;

export const CreateMembershipRequest = z.object({
  clientId: z.string(),
  userId: z.string(),
  roles: z.array(z.string()),
  email: z.string().email(),
});
export type CreateMembershipRequest = z.infer<typeof CreateMembershipRequest>;

export const MembershipResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  userId: z.string(),
  roles: z.array(z.string()),
  status: MembershipStatus,
  createdAt: z.string(),
});
export type MembershipResponse = z.infer<typeof MembershipResponse>;
