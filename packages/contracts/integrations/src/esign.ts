import { z } from "zod";

export const SigningParty = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
});
export type SigningParty = z.infer<typeof SigningParty>;

export const InitiateSigningRequest = z.object({
  documentId: z.string(),
  documentUrl: z.string(),
  parties: z.array(SigningParty),
  callbackUrl: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type InitiateSigningRequest = z.infer<typeof InitiateSigningRequest>;

export interface InitiateSigningResponse {
  signingId: string;
  status: string;
  signingUrl: string;
}

export interface EsignProvider {
  initiateSigning(
    request: InitiateSigningRequest,
  ): Promise<InitiateSigningResponse>;
}
