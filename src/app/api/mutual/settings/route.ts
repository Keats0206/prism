import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getUserById, setUserOptOut, updateIntents } from "@/mutual/db/users";
import type { UserIntents } from "@/mutual/types";

const INTENT_KEYS: (keyof UserIntents)[] = ["intros", "dating", "work", "friendship"];

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    settings: { intents: user.intents ?? {}, optedOut: user.opted_out },
  });
}

export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = (await request.json()) as {
    intents?: UserIntents;
    optedOut?: boolean;
  };

  if (body.intents) {
    // Whitelist known keys to keep the jsonb clean.
    const clean: UserIntents = {};
    for (const key of INTENT_KEYS) {
      if (typeof body.intents[key] === "boolean") clean[key] = body.intents[key];
    }
    await updateIntents(userId, clean);
  }

  if (typeof body.optedOut === "boolean") {
    await setUserOptOut(userId, body.optedOut);
  }

  const user = await getUserById(userId);
  return NextResponse.json({
    ok: true,
    settings: { intents: user?.intents ?? {}, optedOut: user?.opted_out ?? false },
  });
}
