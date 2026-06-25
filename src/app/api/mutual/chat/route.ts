import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getUserById } from "@/mutual/db/users";
import { getOrCreateOwnerThread } from "@/mutual/db/threads";
import { getRecentMessages } from "@/mutual/db/messages";
import { handleInbound } from "@/mutual/agent/handle-inbound";
import { webNotifier } from "@/mutual/agent/notifiers";
import type { InboundSms } from "@/mutual/types";

function appOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
}

// Send a message to Mutual from the web chat. Runs the same agent the SMS
// webhook does, just over JSON with the web channel context.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { body } = (await request.json()) as { body?: string };
  if (!body?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const inbound: InboundSms = {
    from: user.phone,
    to: "web",
    body: body.trim(),
    messageSid: `WEB${Date.now()}`,
  };

  try {
    const reply = await handleInbound(inbound, {
      channel: "web",
      notifier: webNotifier,
      appOrigin: appOrigin(request),
    });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Mutual web chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}

// Poll the owner thread for new messages (friend joins, relayed replies, etc.).
export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const after = new URL(request.url).searchParams.get("after");
  const thread = await getOrCreateOwnerThread(user.id, user.phone);
  const recent = await getRecentMessages(thread.id, 50);

  const filtered = after
    ? recent.filter((m) => m.created_at > after)
    : recent;

  const messages = filtered.map((m) => ({
    id: m.id,
    role: m.direction === "inbound" ? "user" : "mutual",
    text: m.body,
    card: m.card ?? null,
    createdAt: m.created_at,
  }));

  const cursor = recent.length > 0 ? recent[recent.length - 1].created_at : after;

  return NextResponse.json({ messages, cursor });
}
