import { getSupabase } from "./client";
import type { Memory, MemoryVisibility, MemorySource } from "@/mutual/types";

export async function createMemory(input: {
  userId: string;
  subjectUserId?: string | null;
  content: string;
  visibility?: MemoryVisibility;
  source?: MemorySource;
}): Promise<Memory> {
  const db = getSupabase();
  const { data, error } = await db
    .from("memories")
    .insert({
      user_id: input.userId,
      subject_user_id: input.subjectUserId ?? null,
      content: input.content,
      visibility: input.visibility ?? "private",
      source: input.source ?? "user_stated",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Facts in a user's own store, recalled into THEIR prompt (recency-ordered).
export async function getMemoriesForUser(
  userId: string,
  limit = 30,
): Promise<Memory[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("memories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// Authoritative cross-user visibility filter: facts about `subjectUserId` that
// viewer `viewerId` is allowed to see. `public` is always shareable; `friends`
// only when the two are connected; `private` is never returned for a viewer who
// isn't the subject. This is the single source of truth — never hand another
// user's raw store to a prompt that could echo it.
export async function getShareableMemoriesAbout(
  subjectUserId: string,
  viewerId: string,
  areFriends: boolean,
): Promise<Memory[]> {
  if (subjectUserId === viewerId) {
    // Viewing your own facts — everything is fair game.
    const db = getSupabase();
    const { data, error } = await db
      .from("memories")
      .select("*")
      .eq("subject_user_id", subjectUserId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  const allowed: MemoryVisibility[] = areFriends
    ? ["public", "friends"]
    : ["public"];

  const db = getSupabase();
  const { data, error } = await db
    .from("memories")
    .select("*")
    .eq("subject_user_id", subjectUserId)
    .in("visibility", allowed)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteMemory(id: string, userId: string): Promise<void> {
  const db = getSupabase();
  // Scope the delete to the owner so a user can only remove their own memories.
  const { error } = await db
    .from("memories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
