import { getSupabase, normalizePhone } from "./client";
import type { User } from "@/mutual/types";

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
