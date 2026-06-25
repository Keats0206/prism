import { getSupabase, normalizePhone } from "./client";
import type { Contact, UserIntents } from "@/mutual/types";

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

export async function getContactByLinkedUser(
  ownerUserId: string,
  linkedUserId: string,
): Promise<Contact | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("contacts")
    .select("*")
    .eq("owner_user_id", ownerUserId)
    .eq("linked_user_id", linkedUserId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Create a contact that links to another web user, with no phone number
// (web-invite friends haven't shared a phone). Idempotent on the link.
export async function createLinkedContact(
  ownerUserId: string,
  linkedUserId: string,
  name: string,
): Promise<Contact> {
  const existing = await getContactByLinkedUser(ownerUserId, linkedUserId);
  if (existing) return existing;

  const db = getSupabase();
  const { data, error } = await db
    .from("contacts")
    .insert({
      owner_user_id: ownerUserId,
      linked_user_id: linkedUserId,
      name,
      phone: null,
    })
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

// True only when BOTH users have a contact row linking to the other. We require
// a mutual link before treating them as "friends" for friends-visibility
// sharing — one-directional links (e.g. an SMS contact) don't count.
export async function areFriends(
  userIdA: string,
  userIdB: string,
): Promise<boolean> {
  const [aToB, bToA] = await Promise.all([
    getContactByLinkedUser(userIdA, userIdB),
    getContactByLinkedUser(userIdB, userIdA),
  ]);
  return Boolean(aToB && bToA);
}

// User ids that are mutual friends of `userId` — both directions linked. This
// is the same bidirectional rule areFriends() enforces, batched into one pass.
export async function getFriendUserIds(userId: string): Promise<string[]> {
  const db = getSupabase();
  const [out, inb] = await Promise.all([
    db
      .from("contacts")
      .select("linked_user_id")
      .eq("owner_user_id", userId)
      .not("linked_user_id", "is", null),
    db
      .from("contacts")
      .select("owner_user_id")
      .eq("linked_user_id", userId),
  ]);
  if (out.error) throw out.error;
  if (inb.error) throw inb.error;

  const iLinkTo = new Set(
    (out.data ?? []).map((r) => r.linked_user_id as string),
  );
  const linkToMe = new Set(
    (inb.data ?? []).map((r) => r.owner_user_id as string),
  );
  return [...iLinkTo].filter((id) => linkToMe.has(id));
}

// Second-degree reach: users my friends are connected to, minus me and minus my
// existing friends. Drives friends-of-friends discovery. We don't require the
// friend->FoF link to be bidirectional — reachability is enough, and visibility
// gating (FoF see only `public` signals) does the privacy work. Dropping the
// friend filter here is the only change needed to reach whole-network later.
export async function getSecondDegreeUsers(userId: string): Promise<string[]> {
  const friends = await getFriendUserIds(userId);
  if (friends.length === 0) return [];

  const db = getSupabase();
  const { data, error } = await db
    .from("contacts")
    .select("linked_user_id")
    .in("owner_user_id", friends)
    .not("linked_user_id", "is", null);
  if (error) throw error;

  const exclude = new Set<string>([userId, ...friends]);
  const fof = new Set<string>();
  for (const row of data ?? []) {
    const id = row.linked_user_id as string;
    if (!exclude.has(id)) fof.add(id);
  }
  return [...fof];
}

export type FriendSummary = {
  contactId: string;
  name: string;
  linkedUserId: string | null;
  status: "joined" | "invited";
  username: string | null;
  avatarGradient: string | null;
  bio: string | null;
  intents: UserIntents;
};

// Friends list for the /mutual/friends page: every contact, enriched with the
// linked user's public profile when they're on Mutual.
export async function getFriendsWithStatus(
  userId: string,
): Promise<FriendSummary[]> {
  const contacts = await getContactsForUser(userId);
  const linkedIds = contacts
    .map((c) => c.linked_user_id)
    .filter((id): id is string => Boolean(id));

  const profiles = new Map<
    string,
    { username: string | null; avatar_gradient: string | null; bio: string | null; intents: UserIntents }
  >();

  if (linkedIds.length > 0) {
    const db = getSupabase();
    const { data, error } = await db
      .from("users")
      .select("id, username, avatar_gradient, bio, intents")
      .in("id", linkedIds);
    if (error) throw error;
    for (const u of data ?? []) {
      profiles.set(u.id, {
        username: u.username,
        avatar_gradient: u.avatar_gradient,
        bio: u.bio,
        intents: (u.intents ?? {}) as UserIntents,
      });
    }
  }

  return contacts.map((c) => {
    const profile = c.linked_user_id ? profiles.get(c.linked_user_id) : undefined;
    return {
      contactId: c.id,
      name: c.name,
      linkedUserId: c.linked_user_id,
      status: c.linked_user_id ? "joined" : "invited",
      username: profile?.username ?? null,
      avatarGradient: profile?.avatar_gradient ?? null,
      bio: profile?.bio ?? null,
      intents: profile?.intents ?? {},
    };
  });
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
