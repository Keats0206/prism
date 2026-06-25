import { getSupabase } from "./client";
import type { Connection, MatchLane } from "@/mutual/types";

// Create (or revive) an intro request. The initiator implicitly consents by
// asking. The unique (initiator, target, lane) constraint means a repeat ask for
// the same person/lane updates the existing row rather than duplicating it.
export async function requestConnection(input: {
  initiatorUserId: string;
  lane: MatchLane;
  targetUserId?: string | null;
  targetInviteCode?: string | null;
  context?: string | null;
}): Promise<Connection> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .upsert(
      {
        initiator_user_id: input.initiatorUserId,
        lane: input.lane,
        target_user_id: input.targetUserId ?? null,
        target_invite_code: input.targetInviteCode ?? null,
        context: input.context ?? null,
        initiator_consent: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "initiator_user_id,target_user_id,lane" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as Connection;
}

export async function getConnectionById(id: string): Promise<Connection | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Connection | null;
}

// Intros awaiting THIS user's yes/no (they're the target, not yet answered).
export async function getPendingConnectionsForTarget(
  targetUserId: string,
): Promise<Connection[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .select("*")
    .eq("target_user_id", targetUserId)
    .eq("status", "pending")
    .is("target_consent", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Connection[];
}

// Resolve a connection created against a not-yet-user target by their invite
// code, so their join can be wired back to the original ask (the k-factor link).
export async function getConnectionByInviteCode(
  code: string,
): Promise<Connection | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .select("*")
    .eq("target_invite_code", code.toUpperCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Connection | null;
}

// Bind a freshly-joined user to a connection that was created before they
// existed (they came in through the match invite link).
export async function attachTargetUser(
  connectionId: string,
  targetUserId: string,
): Promise<Connection> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .update({ target_user_id: targetUserId, updated_at: new Date().toISOString() })
    .eq("id", connectionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Connection;
}

// Record the target's decision. Yes -> mutual (reveal both sides); no ->
// declined (never reveal). Returns the updated row so callers can branch.
export async function setTargetConsent(
  connectionId: string,
  consent: boolean,
): Promise<Connection> {
  const db = getSupabase();
  const { data, error } = await db
    .from("connections")
    .update({
      target_consent: consent,
      status: consent ? "mutual" : "declined",
      updated_at: new Date().toISOString(),
    })
    .eq("id", connectionId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Connection;
}
