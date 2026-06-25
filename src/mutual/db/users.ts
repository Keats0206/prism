import { getSupabase, normalizePhone } from "./client";
import type { CreatorAnswers, User, UserIntents } from "@/mutual/types";

export async function getUserByPhone(phone: string): Promise<User | null> {
  const db = getSupabase();
  const normalized = normalizePhone(phone);
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("phone", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserById(userId: string): Promise<User | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export type WebProfile = {
  phone: string;
  email: string;
  username: string;
  avatarGradient: string;
  answers: CreatorAnswers;
  name?: string;
};

// Upsert a full web profile keyed by phone (used by onboarding/invite flows).
export async function upsertWebProfile(profile: WebProfile): Promise<User> {
  const db = getSupabase();
  const normalized = normalizePhone(profile.phone);
  const { data, error } = await db
    .from("users")
    .upsert(
      {
        phone: normalized,
        email: profile.email.toLowerCase(),
        username: profile.username.toLowerCase(),
        avatar_gradient: profile.avatarGradient,
        answers: profile.answers,
        name: profile.name ?? profile.username,
        onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "phone" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function upsertUser(phone: string): Promise<User> {
  const db = getSupabase();
  const normalized = normalizePhone(phone);
  const { data, error } = await db
    .from("users")
    .upsert({ phone: normalized }, { onConflict: "phone" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setUserName(userId: string, name: string): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({
      name,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function setUserOptOut(userId: string, optedOut: boolean): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("users")
    .update({ opted_out: optedOut, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) throw error;
}

export async function updateProfile(
  userId: string,
  patch: {
    name?: string;
    bio?: string;
    answers?: CreatorAnswers;
    avatarGradient?: string;
  },
): Promise<User> {
  const db = getSupabase();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.bio !== undefined) update.bio = patch.bio;
  if (patch.answers !== undefined) update.answers = patch.answers;
  if (patch.avatarGradient !== undefined) update.avatar_gradient = patch.avatarGradient;

  const { data, error } = await db
    .from("users")
    .update(update)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateIntents(
  userId: string,
  intents: UserIntents,
): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({ intents, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateLocation(
  userId: string,
  loc: { lat?: number; lng?: number; city?: string },
): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
      city: loc.city ?? null,
      location_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Mark the waitlist interview done. The user stays `waitlist` (gating is
// unchanged) — this only records that the agent learned enough to stop the
// interview and show the confirmation, so we don't re-run it next session.
export async function setInterviewCompleted(userId: string): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({
      interview_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

// Flip a user between waitlist and full access. Used to grant early access
// (no UI yet — call from an admin/script when opening someone's spot).
export async function setAccessStatus(
  userId: string,
  status: "waitlist" | "granted",
): Promise<User> {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .update({ access_status: status, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function createUserFromStart(phone: string): Promise<User> {
  const db = getSupabase();
  const normalized = normalizePhone(phone);
  const { data, error } = await db
    .from("users")
    .upsert(
      { phone: normalized, opted_out: false },
      { onConflict: "phone" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
