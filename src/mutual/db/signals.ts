import { getSupabase } from "./client";
import type { MatchLane, MatchSignal, MemoryVisibility, SignalDirection } from "@/mutual/types";

// Normalize free-text tags so overlap matching is case/whitespace insensitive.
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = raw.trim().toLowerCase();
    if (tag) seen.add(tag);
  }
  return [...seen];
}

export async function createSignal(input: {
  userId: string;
  lane: MatchLane;
  direction?: SignalDirection;
  summary: string;
  tags?: string[];
  visibility?: MemoryVisibility;
}): Promise<MatchSignal> {
  const db = getSupabase();
  const { data, error } = await db
    .from("match_signals")
    .insert({
      user_id: input.userId,
      lane: input.lane,
      direction: input.direction ?? "seeking",
      summary: input.summary,
      tags: normalizeTags(input.tags ?? []),
      // Signals default to friends-visible: matchable within the trust graph but
      // not broadcast to the whole network until the user opts a fact public.
      visibility: input.visibility ?? "friends",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as MatchSignal;
}

// The owner's own signals (all visibilities) for their settings/profile view.
export async function getSignalsForUser(userId: string): Promise<MatchSignal[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("match_signals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MatchSignal[];
}

// Signals from a set of candidate users that `viewer` is allowed to see, scoped
// to one lane. Friends may see friends+public; non-friends (e.g. FoF) only
// public — the same cross-user rule getShareableMemoriesAbout enforces.
export async function getVisibleSignals(
  candidateUserIds: string[],
  lane: MatchLane,
  visibilities: MemoryVisibility[],
): Promise<MatchSignal[]> {
  if (candidateUserIds.length === 0) return [];
  const db = getSupabase();
  const { data, error } = await db
    .from("match_signals")
    .select("*")
    .in("user_id", candidateUserIds)
    .eq("lane", lane)
    .in("visibility", visibilities);

  if (error) throw error;
  return (data ?? []) as MatchSignal[];
}

export async function deleteSignal(id: string, userId: string): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("match_signals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
