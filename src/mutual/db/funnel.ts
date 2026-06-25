import { getSupabase } from "./client";

// Append-only funnel logging so the matching loop is measurable end to end:
// match_surfaced -> connection_requested -> invite_sent -> invite_opened ->
// target_consented -> mutual. Fire-and-forget: instrumentation must never break
// a user flow, so failures are swallowed (and logged) rather than thrown.
export type FunnelEvent =
  | "match_surfaced"
  | "connection_requested"
  | "invite_sent"
  | "invite_opened"
  | "target_consented"
  | "target_declined"
  | "connection_mutual"
  | "preference_captured"
  | "location_captured"
  | "waitlisted"
  | "gated_request";

export async function logFunnelEvent(
  name: FunnelEvent,
  userId: string | null,
  props: Record<string, unknown> = {},
): Promise<void> {
  try {
    const db = getSupabase();
    const { error } = await db
      .from("funnel_events")
      .insert({ name, user_id: userId, props });
    if (error) throw error;
  } catch (err) {
    console.error(`[mutual funnel] failed to log ${name}:`, err);
  }
}
