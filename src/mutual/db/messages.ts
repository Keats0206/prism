import { getSupabase } from "./client";
import type { CardPayload, Message } from "@/mutual/types";

export async function logMessage(
  threadId: string,
  direction: "inbound" | "outbound",
  body: string,
  options?: { userId?: string; twilioSid?: string; card?: CardPayload | null },
): Promise<Message> {
  const db = getSupabase();
  const { data, error } = await db
    .from("messages")
    .insert({
      thread_id: threadId,
      user_id: options?.userId ?? null,
      direction,
      body,
      twilio_sid: options?.twilioSid ?? null,
      card: options?.card ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentMessages(
  threadId: string,
  limit = 20,
): Promise<Message[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).reverse();
}

export function formatMessagesForPrompt(messages: Message[]): string {
  if (messages.length === 0) return "(no prior messages)";
  return messages
    .map((m) => `${m.direction === "inbound" ? "User" : "Mutual"}: ${m.body}`)
    .join("\n");
}
