import { getSupabase } from "./client";
import type { User } from "@/mutual/types";

export type Invite = {
  code: string;
  creator_user_id: string;
  created_at: string;
};

export async function createInvite(
  code: string,
  creatorUserId: string,
): Promise<Invite> {
  const db = getSupabase();
  const { data, error } = await db
    .from("invites")
    .upsert(
      { code: code.toUpperCase(), creator_user_id: creatorUserId },
      { onConflict: "code" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data as Invite;
}

// Resolve an invite code to its creating user (drives invitee onboarding).
export async function getInviteCreator(code: string): Promise<User | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("invites")
    .select("creator_user_id, users:creator_user_id (*)")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  // Supabase returns the joined row under the aliased relation key; depending on
  // inference it may be an object or a single-element array.
  const row = data as unknown as { users: User | User[] | null };
  const creator = Array.isArray(row.users) ? row.users[0] ?? null : row.users;
  return creator ?? null;
}

export async function getInviteForCreator(
  creatorUserId: string,
): Promise<Invite | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("invites")
    .select("*")
    .eq("creator_user_id", creatorUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Invite | null;
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

// Return the user's invite code, creating one if they don't have it yet.
export async function getOrCreateInvite(creatorUserId: string): Promise<Invite> {
  const existing = await getInviteForCreator(creatorUserId);
  if (existing) return existing;
  return createInvite(randomInviteCode(), creatorUserId);
}
