import { z } from "zod";

export const SendEmailRequest = z.object({
  to: z.string(),
  from: z.string(),
  subject: z.string(),
  htmlBody: z.string(),
  textBody: z.string().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type SendEmailRequest = z.infer<typeof SendEmailRequest>;

export interface SendEmailResponse {
  messageId: string;
  status: string;
}

export interface EmailProvider {
  send(request: SendEmailRequest): Promise<SendEmailResponse>;
}
