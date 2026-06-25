import { NextResponse } from "next/server";
import { getSessionUserId } from "@/mutual/auth/session";
import { getUserById } from "@/mutual/db/users";
import { getOrCreateOwnerThread } from "@/mutual/db/threads";
import {
  requestConnection,
  getConnectionById,
  getPendingConnectionsForTarget,
} from "@/mutual/db/connections";
import { logFunnelEvent } from "@/mutual/db/funnel";
import {
  notifyConnectionTarget,
  handleConnectionConsent,
} from "@/mutual/agent/handle-inbound";
import { webNotifier } from "@/mutual/agent/notifiers";
import type { AgentContext } from "@/mutual/agent/channel";
import { matchLaneSchema } from "@/mutual/types";

function webCtx(): AgentContext {
  return {
    channel: "web",
    notifier: webNotifier,
    appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "https://mutual.app",
  };
}

// GET /api/mutual/connections — intros awaiting the signed-in user's yes/no.
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const pending = await getPendingConnectionsForTarget(userId);
  return NextResponse.json({
    pending: pending.map((c) => ({ id: c.id, lane: c.lane })),
  });
}

// POST /api/mutual/connections — broker a consent-gated intro to a user.
export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = (await request.json()) as { candidateUserId?: string; lane?: string };
  const lane = matchLaneSchema.safeParse(body.lane);
  if (!lane.success || !body.candidateUserId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (body.candidateUserId === userId) {
    return NextResponse.json({ error: "Can't connect to yourself" }, { status: 400 });
  }

  const target = await getUserById(body.candidateUserId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const connection = await requestConnection({
    initiatorUserId: userId,
    lane: lane.data,
    targetUserId: target.id,
  });
  await logFunnelEvent("connection_requested", userId, {
    lane: lane.data,
    target: "user",
    connectionId: connection.id,
  });
  await notifyConnectionTarget(target, lane.data, webCtx());

  return NextResponse.json({ ok: true, connectionId: connection.id });
}

// PATCH /api/mutual/connections — the target accepts/declines a pending intro.
export async function PATCH(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const body = (await request.json()) as { connectionId?: string; accept?: boolean };
  if (!body.connectionId || typeof body.accept !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const connection = await getConnectionById(body.connectionId);
  if (!connection || connection.target_user_id !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const target = await getUserById(userId);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const thread = await getOrCreateOwnerThread(target.id, target.phone);
  const reply = await handleConnectionConsent(
    target,
    connection,
    body.accept,
    thread.id,
    webCtx(),
  );

  return NextResponse.json({ ok: true, reply });
}
