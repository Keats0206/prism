import { getSupabase } from "./client";
import type { PendingAction, SendSmsPayload } from "@/mutual/types";

export async function createPendingAction(
  userId: string,
  payload: SendSmsPayload,
  draftReply: string,
): Promise<PendingAction> {
  const db = getSupabase();
  const { data, error } = await db
    .from("pending_actions")
    .insert({
      user_id: userId,
      action_type: "send_sms",
      payload,
      draft_reply: draftReply,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PendingAction;
}

export async function getPendingActionForUser(
  userId: string,
): Promise<PendingAction | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("pending_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as PendingAction | null;
}

export async function updatePendingActionStatus(
  actionId: string,
  status: PendingAction["status"],
): Promise<PendingAction> {
  const db = getSupabase();
  const { data, error } = await db
    .from("pending_actions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", actionId)
    .select("*")
    .single();

  if (error) throw error;
  return data as PendingAction;
}

export async function rejectOtherPendingActions(
  userId: string,
  exceptId?: string,
): Promise<void> {
  const db = getSupabase();
  let query = db
    .from("pending_actions")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "pending");

  if (exceptId) {
    query = query.neq("id", exceptId);
  }

  const { error } = await query;
  if (error) throw error;
}
