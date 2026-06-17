import { getSupabase, normalizePhone } from "./client";
import type { Thread } from "@/mutual/types";

export async function getOrCreateOwnerThread(
  userId: string,
  participantPhone: string,
): Promise<Thread> {
  const db = getSupabase();
  const normalized = normalizePhone(participantPhone);

  const { data: existing } = await db
    .from("threads")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("participant_phone", normalized)
    .eq("kind", "owner")
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await db
    .from("threads")
    .insert({
      owner_user_id: userId,
      participant_phone: normalized,
      kind: "owner",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getOrCreateParticipantThread(
  participantPhone: string,
  ownerUserId: string,
  contactId?: string,
): Promise<Thread> {
  const db = getSupabase();
  const normalized = normalizePhone(participantPhone);

  const { data: existing } = await db
    .from("threads")
    .select("*")
    .eq("participant_phone", normalized)
    .eq("owner_user_id", ownerUserId)
    .eq("kind", "participant")
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await db
    .from("threads")
    .insert({
      owner_user_id: ownerUserId,
      contact_id: contactId ?? null,
      participant_phone: normalized,
      kind: "participant",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function findParticipantThreadForPhone(
  participantPhone: string,
): Promise<Thread | null> {
  const db = getSupabase();
  const normalized = normalizePhone(participantPhone);

  const { data, error } = await db
    .from("threads")
    .select("*")
    .eq("participant_phone", normalized)
    .eq("kind", "participant")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function touchThread(threadId: string): Promise<void> {
  const db = getSupabase();
  await db
    .from("threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);
}
