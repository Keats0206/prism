import { getSupabase } from "./client";
import { getFriendUserIds, getSecondDegreeUsers } from "./contacts";
import { getSignalsForUser, getVisibleSignals } from "./signals";
import type { MatchLane, MatchSignal, MemoryVisibility, User } from "@/mutual/types";

export type MatchScope = "friends" | "network";

export type MatchCandidate = {
  user: User;
  lane: MatchLane;
  // Tags this user and the candidate share — the "why you match" evidence.
  sharedTags: string[];
  // The candidate's most relevant (visible) signal summary, safe to show.
  summary: string | null;
  score: number;
  scope: MatchScope;
};

function tagsOf(signals: MatchSignal[]): Set<string> {
  const set = new Set<string>();
  for (const s of signals) for (const t of s.tags) set.add(t);
  return set;
}

// Surface people the user might want to connect with on a given lane.
//
// scope "friends" reaches mutual friends and may see friends+public signals;
// scope "network" reaches friends-of-friends and may see ONLY public signals —
// the same cross-user visibility rule the rest of the app enforces. Candidates
// must (a) be open on the lane (intents[lane]) and (b) have at least one visible
// signal there, so we always have a concrete reason to show them. Ranked by
// shared-tag overlap; ties keep zero-overlap "just open on this lane" matches
// last rather than dropping them.
export async function findMatches(
  userId: string,
  lane: MatchLane,
  scope: MatchScope,
  limit = 5,
): Promise<MatchCandidate[]> {
  const candidateIds =
    scope === "friends"
      ? await getFriendUserIds(userId)
      : await getSecondDegreeUsers(userId);
  if (candidateIds.length === 0) return [];

  const visibilities: MemoryVisibility[] =
    scope === "friends" ? ["public", "friends"] : ["public"];

  const db = getSupabase();
  const { data: users, error } = await db
    .from("users")
    .select("*")
    .in("id", candidateIds)
    .eq("opted_out", false);
  if (error) throw error;

  // Only people who've said they're open on this lane.
  const openUsers = (users ?? []).filter(
    (u) => Boolean((u.intents ?? {})[lane]),
  ) as User[];
  if (openUsers.length === 0) return [];

  const signals = await getVisibleSignals(
    openUsers.map((u) => u.id),
    lane,
    visibilities,
  );
  if (signals.length === 0) return [];

  const byUser = new Map<string, MatchSignal[]>();
  for (const s of signals) {
    const list = byUser.get(s.user_id) ?? [];
    list.push(s);
    byUser.set(s.user_id, list);
  }

  const myLaneSignals = (await getSignalsForUser(userId)).filter(
    (s) => s.lane === lane,
  );
  const myTags = tagsOf(myLaneSignals);

  const candidates: MatchCandidate[] = [];
  for (const user of openUsers) {
    const theirSignals = byUser.get(user.id);
    if (!theirSignals || theirSignals.length === 0) continue;
    const sharedTags = [...tagsOf(theirSignals)].filter((t) => myTags.has(t));
    candidates.push({
      user,
      lane,
      sharedTags,
      summary: theirSignals[0]?.summary ?? null,
      score: sharedTags.length,
      scope,
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

// Resolve a named person to a reachable user (friend or friend-of-friend) for an
// intro request. Matches @username exactly, else a case-insensitive name match.
// Used when the named person isn't one of the user's own phone contacts.
export async function resolveReachableUser(
  userId: string,
  query: string,
): Promise<User | null> {
  const q = query.trim().toLowerCase().replace(/^@/, "");
  if (!q) return null;

  const [friends, fof] = await Promise.all([
    getFriendUserIds(userId),
    getSecondDegreeUsers(userId),
  ]);
  const reachable = [...new Set([...friends, ...fof])];
  if (reachable.length === 0) return null;

  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("*")
    .in("id", reachable)
    .eq("opted_out", false);
  if (error) throw error;

  const users = (data ?? []) as User[];
  return (
    users.find((u) => u.username?.toLowerCase() === q) ??
    users.find((u) => u.name?.toLowerCase() === q) ??
    users.find((u) => (u.name ?? "").toLowerCase().includes(q)) ??
    null
  );
}
