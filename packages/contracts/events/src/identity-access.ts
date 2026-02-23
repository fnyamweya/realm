import { z } from "zod";

export const MEMBERSHIP_CREATED = "membership.created" as const;
export const MEMBERSHIP_ROLES_CHANGED = "membership.roles_changed" as const;
export const MEMBERSHIP_REVOKED = "membership.revoked" as const;

export const MembershipCreatedPayload = z.object({
  membershipId: z.string(),
  clientId: z.string(),
  userId: z.string(),
  roles: z.array(z.string()),
  email: z.string().email(),
});
export type MembershipCreatedPayload = z.infer<
  typeof MembershipCreatedPayload
>;

export const MembershipRolesChangedPayload = z.object({
  membershipId: z.string(),
  clientId: z.string(),
  userId: z.string(),
  previousRoles: z.array(z.string()),
  newRoles: z.array(z.string()),
});
export type MembershipRolesChangedPayload = z.infer<
  typeof MembershipRolesChangedPayload
>;

export const MembershipRevokedPayload = z.object({
  membershipId: z.string(),
  clientId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
});
export type MembershipRevokedPayload = z.infer<
  typeof MembershipRevokedPayload
>;
