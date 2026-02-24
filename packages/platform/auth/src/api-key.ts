import { z } from "zod";

export const ApiKeySchema = z.object({
  keyId: z.string(),
  clientId: z.string(),
  hashedKey: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.string(),
  expiresAt: z.string().optional(),
  lastUsedAt: z.string().optional(),
  status: z.enum(["active", "revoked"]),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

export interface ApiKeyService {
  validate(rawKey: string): Promise<{
    valid: boolean;
    keyId?: string;
    clientId?: string;
    scopes?: string[];
  }>;
  create(
    clientId: string,
    name: string,
    scopes: string[],
  ): Promise<{ keyId: string; rawKey: string }>;
  revoke(clientId: string, keyId: string): Promise<void>;
}
