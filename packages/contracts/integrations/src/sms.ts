import { z } from "zod";

export const SendSmsRequest = z.object({
  to: z.string(),
  from: z.string(),
  body: z.string(),
  metadata: z.record(z.string(), z.string()).optional(),
});
export type SendSmsRequest = z.infer<typeof SendSmsRequest>;

export interface SendSmsResponse {
  messageId: string;
  status: string;
}

export interface SmsProvider {
  send(request: SendSmsRequest): Promise<SendSmsResponse>;
}
