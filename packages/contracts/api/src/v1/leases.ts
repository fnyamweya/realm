import { z } from "zod";

export const LeasePartyRole = z.enum([
  "primary_tenant",
  "co_tenant",
  "guarantor",
]);
export type LeasePartyRole = z.infer<typeof LeasePartyRole>;

export const LeaseParty = z.object({
  userId: z.string(),
  role: LeasePartyRole,
});
export type LeaseParty = z.infer<typeof LeaseParty>;

export const LeaseStatus = z.enum([
  "draft",
  "pending_signature",
  "active",
  "expired",
  "terminated",
]);
export type LeaseStatus = z.infer<typeof LeaseStatus>;

export const CreateLeaseRequest = z.object({
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  parties: z.array(LeaseParty),
  startDate: z.string(),
  endDate: z.string(),
  rentAmount: z.number(),
  currency: z.string(),
});
export type CreateLeaseRequest = z.infer<typeof CreateLeaseRequest>;

export const LeaseResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  propertyId: z.string(),
  unitId: z.string(),
  parties: z.array(LeaseParty),
  startDate: z.string(),
  endDate: z.string(),
  rentAmount: z.number(),
  currency: z.string(),
  status: LeaseStatus,
  createdAt: z.string(),
});
export type LeaseResponse = z.infer<typeof LeaseResponse>;
