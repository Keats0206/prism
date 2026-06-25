import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { findMatches } from "@/mutual/db/matching";
import { logFunnelEvent } from "@/mutual/db/funnel";
import { matchLaneSchema, matchScopeSchema } from "@/mutual/types";

// GET /api/mutual/matches?lane=dating&scope=friends — people the signed-in user
// might want to connect with. Identity is only as exposed as visibility allows;
// nothing here reveals a private signal.
export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const lane = matchLaneSchema.safeParse(params.get("lane"));
  if (!lane.success) {
    return NextResponse.json({ error: "Invalid lane" }, { status: 400 });
  }
  const scopeParse = matchScopeSchema.safeParse(params.get("scope") ?? "friends");
  const scope = scopeParse.success ? scopeParse.data : "friends";

  const matches = await findMatches(userId, lane.data, scope);
  if (matches.length > 0) {
    await logFunnelEvent("match_surfaced", userId, {
      lane: lane.data,
      scope,
      count: matches.length,
    });
  }

  return NextResponse.json({
    matches: matches.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      username: m.user.username,
      avatarGradient: m.user.avatar_gradient,
      summary: m.summary,
      sharedTags: m.sharedTags,
      scope: m.scope,
    })),
  });
}
