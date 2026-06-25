import { NextResponse } from "next/server";
import { upsertWebProfile, updateIntents } from "@/mutual/db/users";
import { createInvite, getInviteCreator } from "@/mutual/db/invites";
import { createLinkedContact } from "@/mutual/db/contacts";
import { createSignal } from "@/mutual/db/signals";
import {
  getConnectionByInviteCode,
  attachTargetUser,
} from "@/mutual/db/connections";
import { logFunnelEvent } from "@/mutual/db/funnel";
import { notifyConnectionTarget } from "@/mutual/agent/handle-inbound";
import { webNotifier } from "@/mutual/agent/notifiers";
import type { AgentContext } from "@/mutual/agent/channel";
import { getOrCreateOwnerThread } from "@/mutual/db/threads";
import { logMessage } from "@/mutual/db/messages";
import { notifyCreatorOfJoin } from "@/mutual/notify/events";
import type { CreatorAnswers, User } from "@/mutual/types";

function webCtx(): AgentContext {
  return {
    channel: "web",
    notifier: webNotifier,
    appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "https://mutual.app",
  };
}

// Turn an onboarding activity answer into a matchable friendship signal and make
// sure the user is flagged open on that lane, so newly-connected pairs are
// immediately matchable on what they each said they want to do.
async function seedActivitySignal(user: User, idea: string): Promise<void> {
  const tag = idea.trim().toLowerCase();
  if (!tag) return;
  await createSignal({
    userId: user.id,
    lane: "friendship",
    direction: "seeking",
    summary: `Wants to ${idea}`,
    tags: [tag],
    visibility: "friends",
  });
  await updateIntents(user.id, { ...(user.intents ?? {}), friendship: true });
}

type CreatorPayload = {
  type: "creator";
  inviteCode: string;
  phone: string;
  email: string;
  username: string;
  avatarGradient: string;
  answers: CreatorAnswers;
};

type InviteePayload = {
  type: "invitee";
  inviteCode: string;
  phone: string;
  email: string;
  name: string;
  username: string;
  avatarGradient: string;
  togetherIdea: string;
};

// Resolve an invite code to the creator's public profile (drives invitee
// onboarding). Returns only the fields the invitee UI renders.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.toUpperCase();
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const creator = await getInviteCreator(code);
  if (!creator) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    creator: {
      userId: creator.id,
      username: creator.username,
      avatarGradient: creator.avatar_gradient,
      answers: creator.answers ?? {},
    },
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreatorPayload | InviteePayload;

  if (body.type === "creator") {
    const user = await upsertWebProfile({
      phone: body.phone,
      email: body.email,
      username: body.username,
      avatarGradient: body.avatarGradient,
      answers: body.answers,
    });
    await createInvite(body.inviteCode, user.id);
    if (body.answers?.wantToDo) {
      await seedActivitySignal(user, body.answers.wantToDo);
    }
    return NextResponse.json({ ok: true, code: body.inviteCode, userId: user.id });
  }

  // Invitee join: become a real user, link both directions, notify the creator.
  const creator = await getInviteCreator(body.inviteCode);
  if (!creator) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  const invitee = await upsertWebProfile({
    phone: body.phone,
    email: body.email,
    username: body.username,
    avatarGradient: body.avatarGradient,
    name: body.name,
    answers: { wantToDo: body.togetherIdea },
  });

  // Link both ways so either user can coordinate with the other.
  await createLinkedContact(creator.id, invitee.id, invitee.username ?? body.name);
  await createLinkedContact(invitee.id, creator.id, creator.username ?? "your friend");

  // Seed the invitee's stated activity as a matchable signal.
  if (body.togetherIdea) {
    await seedActivitySignal(invitee, body.togetherIdea);
  }

  // If this invite was staged against a pending intro (someone asked to be
  // connected to this person before they were on Mutual), wire the new user in
  // as the target and ask them to consent — completing the k-factor loop.
  const pendingIntro = await getConnectionByInviteCode(body.inviteCode);
  if (pendingIntro && !pendingIntro.target_user_id) {
    await attachTargetUser(pendingIntro.id, invitee.id);
    await logFunnelEvent("invite_opened", invitee.id, {
      connectionId: pendingIntro.id,
    });
    await notifyConnectionTarget(invitee, pendingIntro.lane, webCtx());
  }

  // Surface the join in the creator's web chat + send an email nudge.
  const creatorThread = await getOrCreateOwnerThread(creator.id, creator.phone);
  await logMessage(
    creatorThread.id,
    "outbound",
    `@${invitee.username} just joined Mutual — they're up for "${body.togetherIdea}". Want me to help you lock in a plan?`,
    { userId: creator.id },
  );
  await notifyCreatorOfJoin(creator, invitee, body.togetherIdea);

  return NextResponse.json({ ok: true, userId: invitee.id });
}

// Lightweight helper for the share panel to confirm an invite exists.
export async function HEAD(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.toUpperCase();
  if (!code) return new Response(null, { status: 400 });
  const creator = await getInviteCreator(code);
  return new Response(null, { status: creator ? 200 : 404 });
}

