import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getFriendsWithStatus } from "@/mutual/db/contacts";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const friends = await getFriendsWithStatus(userId);
  return NextResponse.json({ friends });
}
