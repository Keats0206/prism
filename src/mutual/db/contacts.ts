import { getSupabase, normalizePhone } from "./client";
import type { Contact } from "@/mutual/types";

export async function getContactsForUser(userId: string): Promise<Contact[]> {
  const db = getSupabase();
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .eq("owner_user_id", userId)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function getContactById(contactId: string): Promise<Contact | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getContactByPhone(
  ownerUserId: string,
  phone: string,
): Promise<Contact | null> {
  const db = getSupabase();
  const normalized = normalizePhone(phone);
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("phone", normalized)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createContact(
  ownerUserId: string,
  name: string,
  phone: string,
  notes?: string,
): Promise<Contact> {
  const db = getSupabase();
  const normalized = normalizePhone(phone);
  const { data, error } = await db
    .from("contacts")
    .upsert(
      {
        owner_user_id: ownerUserId,
        name,
        phone: normalized,
        notes: notes ?? null,
      },
      { onConflict: "owner_user_id,phone" },
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function linkContactToUser(
  contactId: string,
  linkedUserId: string,
): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("contacts")
    .update({ linked_user_id: linkedUserId, updated_at: new Date().toISOString() })
    .eq("id", contactId);

  if (error) throw error;
}

export type ContactMatchResult =
  | { status: "found"; contact: Contact }
  | { status: "ambiguous"; contacts: Contact[] }
  | { status: "missing" };

export function resolveContactByName(
  contacts: Contact[],
  nameQuery: string,
): ContactMatchResult {
  const query = nameQuery.trim().toLowerCase();
  if (!query) return { status: "missing" };

  const exact = contacts.filter((c) => c.name.toLowerCase() === query);
  if (exact.length === 1) return { status: "found", contact: exact[0] };
  if (exact.length > 1) return { status: "ambiguous", contacts: exact };

  const partial = contacts.filter((c) =>
    c.name.toLowerCase().includes(query) ||
    query.includes(c.name.toLowerCase().split(" ")[0] ?? ""),
  );
  if (partial.length === 1) return { status: "found", contact: partial[0] };
  if (partial.length > 1) return { status: "ambiguous", contacts: partial };

  const firstNameMatches = contacts.filter(
    (c) => c.name.toLowerCase().split(" ")[0] === query,
  );
  if (firstNameMatches.length === 1) {
    return { status: "found", contact: firstNameMatches[0] };
  }
  if (firstNameMatches.length > 1) {
    return { status: "ambiguous", contacts: firstNameMatches };
  }

  return { status: "missing" };
}

export function formatAmbiguousContacts(contacts: Contact[]): string {
  return contacts.map((c) => c.name).join(" or ");
}
