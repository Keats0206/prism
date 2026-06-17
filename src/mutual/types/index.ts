import { z } from "zod";

export const trustLevelSchema = z.enum([
  "remember",
  "draft_only",
  "ask_first",
  "auto_coordinate",
]);

export const sendSmsPayloadSchema = z.object({
  contactId: z.string().uuid(),
  contactPhone: z.string(),
  contactName: z.string(),
  messageBody: z.string(),
  ownerName: z.string(),
});

export type SendSmsPayload = z.infer<typeof sendSmsPayloadSchema>;

export const agentIntentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("coordinate_plan"),
    contactNames: z.array(z.string()),
    activity: z.string().optional(),
    timeframe: z.string().optional(),
    draftMessage: z.string(),
  }),
  z.object({
    type: z.literal("approve_action"),
  }),
  z.object({
    type: z.literal("reject_action"),
  }),
  z.object({
    type: z.literal("add_contact"),
    name: z.string(),
    phone: z.string().optional(),
  }),
  z.object({
    type: z.literal("set_name"),
    name: z.string(),
  }),
  z.object({
    type: z.literal("general_chat"),
    reply: z.string(),
  }),
]);

export const agentResponseSchema = z.object({
  intent: agentIntentSchema,
  replyToSender: z.string(),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type AgentIntent = z.infer<typeof agentIntentSchema>;

export type InboundSms = {
  from: string;
  to: string;
  body: string;
  messageSid: string;
};

export type User = {
  id: string;
  phone: string;
  name: string | null;
  opted_out: boolean;
  onboarded_at: string | null;
};

export type Contact = {
  id: string;
  owner_user_id: string;
  phone: string;
  name: string;
  notes: string | null;
  linked_user_id: string | null;
};

export type PendingAction = {
  id: string;
  user_id: string;
  action_type: "send_sms";
  payload: SendSmsPayload;
  draft_reply: string | null;
  status: "pending" | "approved" | "rejected" | "expired" | "executed";
  expires_at: string;
};

export type Thread = {
  id: string;
  owner_user_id: string | null;
  contact_id: string | null;
  participant_phone: string;
  kind: "owner" | "participant";
};

export type Message = {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  body: string;
  created_at: string;
};
