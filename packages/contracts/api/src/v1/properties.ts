import { z } from "zod";
import {
  Address,
  CursorPaginationParams,
  createCursorPaginationResult,
} from "@realtyos/validation";

export const PropertyType = z.enum(["residential", "commercial", "mixed"]);
export type PropertyType = z.infer<typeof PropertyType>;

export const PropertyStatus = z.enum(["active", "inactive"]);
export type PropertyStatus = z.infer<typeof PropertyStatus>;

export const CreatePropertyRequest = z.object({
  clientId: z.string(),
  name: z.string(),
  address: Address,
  type: PropertyType,
  unitCount: z.number().int().optional(),
});
export type CreatePropertyRequest = z.infer<typeof CreatePropertyRequest>;

export const PropertyResponse = z.object({
  id: z.string(),
  clientId: z.string(),
  name: z.string(),
  address: Address,
  type: PropertyType,
  unitCount: z.number().int().optional(),
  status: PropertyStatus,
  createdAt: z.string(),
});
export type PropertyResponse = z.infer<typeof PropertyResponse>;

export const ListPropertiesRequest = CursorPaginationParams.extend({
  clientId: z.string(),
  status: z.string().optional(),
});
export type ListPropertiesRequest = z.infer<typeof ListPropertiesRequest>;

export const ListPropertiesResponse =
  createCursorPaginationResult(PropertyResponse);
export type ListPropertiesResponse = z.infer<typeof ListPropertiesResponse>;
