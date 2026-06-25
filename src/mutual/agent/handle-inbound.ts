import type { CardPayload, InboundSms, UserIntents } from "@/mutual/types";
import type { AgentContext } from "./channel";
import { smsNotifier } from "./notifiers";
import { parseAgentResponse } from "./parse-intent";
import {
  getUserByPhone,
  getUserById,
  upsertUser,
  setUserName,
  setUserOptOut,
  createUserFromStart,
  updateIntents,
  updateLocation,
  setInterviewCompleted,
} from "@/mutual/db/users";
import {
  getContactsForUser,
  createContact,
  resolveContactByName,
  formatAmbiguousContacts,
  getContactByPhone,
  getContactById,
  linkContactToUser,
  areFriends,
} from "@/mutual/db/contacts";
import {
  getMemoriesForUser,
  createMemory,
  getShareableMemoriesAbout,
} from "@/mutual/db/memories";
import { createSignal } from "@/mutual/db/signals";
import { findMatches, resolveReachableUser } from "@/mutual/db/matching";
import {
  requestConnection,
  getPendingConnectionsForTarget,
  setTargetConsent,
} from "@/mutual/db/connections";
import { logFunnelEvent } from "@/mutual/db/funnel";
import type { Connection, MatchLane, User } from "@/mutual/types";
import { searchLocalEvents } from "@/mutual/events/exa";
import {
  getOrCreateOwnerThread,
  getOrCreateParticipantThread,
  findParticipantThreadForPhone,
  touchThread,
} from "@/mutual/db/threads";
import { logMessage, getRecentMessages } from "@/mutual/db/messages";
import {
  createPendingAction,
  getPendingActionForUser,
  updatePendingActionStatus,
  rejectOtherPendingActions,
} from "@/mutual/db/pending-actions";
import { getOrCreateInvite } from "@/mutual/db/invites";
import { sendSms } from "@/mutual/sms/send";
import {
  parseKeyword,
  HELP_MESSAGE,
  WELCOME_MESSAGE,
  OPT_OUT_MESSAGE,
  OPT_IN_MESSAGE,
} from "@/mutual/sms/keywords";
import { normalizePhone } from "@/mutual/db/client";

// Capabilities locked behind early access. A waitlist user can still onboard
// (capture_preference, remember_fact, set_location, etc.) — only these are gated.
const GATED_INTENTS = new Set<string>([
  "coordinate_plan",
  "search_events",
  "find_matches",
  "request_connection",
  "show_profile",
]);

const WAITLIST_LOCKED_REPLY =
  "You're on the early-access list — I can't open up matches, intros, and plans just yet, but I'll text you the moment your spot is ready. While you wait, tell me more about what you're looking for so I've got great people lined up for you.";

const APPROVAL_WORDS = new Set(["yes", "y", "send", "send it", "approve", "do it", "go ahead", "sure", "ok", "okay"]);
const REJECT_WORDS = new Set(["no", "n", "cancel", "don't", "dont", "nope", "nah"]);

function isApproval(body: string): boolean {
  return APPROVAL_WORDS.has(body.trim().toLowerCase());
}

function isRejection(body: string): boolean {
  return REJECT_WORDS.has(body.trim().toLowerCase());
}

function inviteShareReply(
  intro: string,
  messageBody: string | null,
  link: string,
): string {
  const blurb = messageBody ? `\n\n"${messageBody}"` : "";
  return `${intro}${blurb}\n\n${link}`;
}

const INTENT_LABELS: Record<keyof UserIntents, string> = {
  intros: "intros",
  dating: "dating",
  work: "work",
  friendship: "friendship",
};

function intentsToLabels(intents: UserIntents): string[] {
  return (Object.keys(INTENT_LABELS) as (keyof UserIntents)[])
    .filter((key) => intents[key])
    .map((key) => INTENT_LABELS[key]);
}

// Flatten a card into plain text for SMS, where cards can't render.
function flattenCardToText(card: CardPayload): string {
  switch (card.kind) {
    case "event":
      return [card.title, card.venue, card.startsAt, card.url]
        .filter(Boolean)
        .join(" · ");
    case "event_list":
      return card.events
        .map(
          (e) =>
            `• ${[e.title, e.venue].filter(Boolean).join(" — ")}${e.url ? ` ${e.url}` : ""}`,
        )
        .join("\n");
    case "plan":
      // The text reply already states the plan; nothing to add.
      return "";
    case "profile": {
      const header =
        card.name && card.username
          ? `${card.name} (@${card.username})`
          : (card.name ?? (card.username ? `@${card.username}` : ""));
      const lines = [header];
      if (card.bio) lines.push(card.bio);
      if (card.intents?.length) lines.push(`Open to: ${card.intents.join(", ")}`);
      if (card.sharedFacts?.length) {
        lines.push(card.sharedFacts.map((f) => `• ${f}`).join("\n"));
      }
      return lines.filter(Boolean).join("\n");
    }
    case "match_list":
      return card.candidates
        .map((c) => {
          const who = c.name ?? (c.username ? `@${c.username}` : "Someone");
          const why = c.sharedTags?.length
            ? ` (you both: ${c.sharedTags.join(", ")})`
            : c.summary
              ? ` — ${c.summary}`
              : "";
          return `• ${who}${why}`;
        })
        .join("\n");
    case "connection": {
      const who = card.name ?? (card.username ? `@${card.username}` : "them");
      if (card.status === "mutual") return `It's mutual with ${who}! 🎉`;
      if (card.status === "declined") return "";
      return `Waiting to hear back${card.context ? ` — ${card.context}` : ""}.`;
    }
    case "waitlist":
      // The reply text already states they're on the list; the card is web-only.
      return "";
    case "location":
      // The ask text carries the prompt; the tap-to-share button is web-only.
      return "";
  }
}

// Single place outbound replies are logged. On web a card is persisted alongside
// the text (the chat poll renders it). On SMS the card is flattened into the
// text and dropped, so the two channels can't drift.
async function respond(
  threadId: string,
  userId: string,
  text: string,
  ctx: AgentContext,
  card?: CardPayload | null,
): Promise<string> {
  if (ctx.channel === "sms" && card) {
    const flat = flattenCardToText(card);
    const full = flat ? `${text}\n\n${flat}` : text;
    await logMessage(threadId, "outbound", full, { userId });
    return full;
  }
  await logMessage(threadId, "outbound", text, { userId, card: card ?? null });
  return text;
}

// Thin wrapper preserving the original SMS entry point. The Twilio webhook
// still calls this; everything below now flows through the channel-agnostic core.
export async function handleInboundSms(inbound: InboundSms): Promise<string | null> {
  return handleInbound(inbound, {
    channel: "sms",
    notifier: smsNotifier,
    appOrigin: process.env.NEXT_PUBLIC_APP_URL ?? "https://mutual.app",
  });
}

export async function handleInbound(
  inbound: InboundSms,
  ctx: AgentContext,
): Promise<string | null> {
  const fromPhone = normalizePhone(inbound.from);
  const body = inbound.body.trim();

  // Carrier compliance keywords only apply to SMS.
  if (ctx.channel === "sms") {
    const keyword = parseKeyword(body);

    if (keyword.type === "help") {
      return HELP_MESSAGE;
    }

    if (keyword.type === "stop") {
      const existing = await getUserByPhone(fromPhone);
      if (existing) {
        await setUserOptOut(existing.id, true);
      }
      return OPT_OUT_MESSAGE;
    }

    if (keyword.type === "start") {
      const user = await createUserFromStart(fromPhone);
      await setUserOptOut(user.id, false);
      const thread = await getOrCreateOwnerThread(user.id, fromPhone);
      await logMessage(thread.id, "inbound", body);
      const reply = OPT_IN_MESSAGE;
      await logMessage(thread.id, "outbound", reply);
      return reply;
    }
  }

  let user = await getUserByPhone(fromPhone);

  // Participant reply routing — non-user who received a coordination text (SMS).
  if (!user) {
    const participantThread = await findParticipantThreadForPhone(fromPhone);
    if (participantThread?.owner_user_id) {
      return handleParticipantReply(
        participantThread,
        body,
        inbound.messageSid,
        ctx,
      );
    }

    // New user onboarding (SMS-first path; web users already exist via OTP).
    user = await upsertUser(fromPhone);
    const thread = await getOrCreateOwnerThread(user.id, fromPhone);
    await logMessage(thread.id, "inbound", body, { twilioSid: inbound.messageSid });

    if (!user.name) {
      if (body.length <= 40 && !body.includes(" ")) {
        user = await setUserName(user.id, body);
        const reply = `Nice to meet you, ${user.name}! Tell me who you want to make plans with — e.g. "Help me plan drinks with Alex Friday."`;
        await logMessage(thread.id, "outbound", reply);
        return reply;
      }
      await logMessage(thread.id, "outbound", WELCOME_MESSAGE);
      return WELCOME_MESSAGE;
    }
  }

  if (user.opted_out) {
    return "You're opted out. Text START to rejoin.";
  }

  const thread = await getOrCreateOwnerThread(user.id, fromPhone);
  await logMessage(thread.id, "inbound", body, {
    userId: user.id,
    twilioSid: inbound.messageSid,
  });
  await touchThread(thread.id);

  const recentMessages = await getRecentMessages(thread.id);
  const contacts = await getContactsForUser(user.id);
  const memories = await getMemoriesForUser(user.id);
  let pendingAction = await getPendingActionForUser(user.id);

  // Inline phone reply after "what's their phone number?" (SMS-style add).
  const phoneReply = tryParsePhoneContactReply(recentMessages, body);
  if (phoneReply) {
    await createContact(user.id, phoneReply.name, phoneReply.phone);
    const reply = `Added ${phoneReply.name}. Want me to reach out about plans?`;
    await logMessage(thread.id, "outbound", reply, { userId: user.id });
    return reply;
  }

  // Fast-path approval/rejection without an LLM round-trip.
  if (pendingAction && isApproval(body)) {
    return executeApprovedAction(user, pendingAction, thread.id, ctx);
  }
  if (pendingAction && isRejection(body)) {
    await updatePendingActionStatus(pendingAction.id, "rejected");
    const reply = "Got it — cancelled. Want to try a different message?";
    await logMessage(thread.id, "outbound", reply, { userId: user.id });
    return reply;
  }

  // Fast-path the target's yes/no to a pending intro (no LLM round-trip). Only
  // when there's no plan draft competing for the same yes/no.
  if (!pendingAction && (isApproval(body) || isRejection(body))) {
    const pendingConns = await getPendingConnectionsForTarget(user.id);
    if (pendingConns.length > 0) {
      return handleConnectionConsent(
        user,
        pendingConns[0],
        isApproval(body),
        thread.id,
        ctx,
      );
    }
  }

  // Name onboarding if not set.
  if (!user.name) {
    user = await setUserName(user.id, body);
    const reply = `Nice to meet you, ${user.name}! Tell me who you want to make plans with.`;
    await logMessage(thread.id, "outbound", reply, { userId: user.id });
    return reply;
  }

  const agentResponse = await parseAgentResponse(
    user,
    contacts,
    recentMessages,
    body,
    pendingAction,
    ctx.channel,
    memories,
  );

  const { intent, replyToSender } = agentResponse;

  // Waitlist gate: until a user is `granted`, the agent only onboards them.
  // The "real" capabilities are locked here (defense in depth — the system
  // prompt already steers the model away from them) so SMS and web share one
  // rule and flipping a user to `granted` lights everything up at once.
  if (user.access_status !== "granted" && GATED_INTENTS.has(intent.type)) {
    await logFunnelEvent("gated_request", user.id, { intent: intent.type });
    return respond(thread.id, user.id, WAITLIST_LOCKED_REPLY, ctx);
  }

  switch (intent.type) {
    case "set_name": {
      user = await setUserName(user.id, intent.name);
      const reply = `Nice to meet you, ${user.name}! Who do you want to make plans with?`;
      await logMessage(thread.id, "outbound", reply, { userId: user.id });
      return reply;
    }

    case "add_contact": {
      if (!intent.phone) {
        const reply = `Got it — what's ${intent.name}'s phone number?`;
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }
      await createContact(user.id, intent.name, intent.phone);
      const reply = `Added ${intent.name}. Want me to reach out to them about plans?`;
      await logMessage(thread.id, "outbound", reply, { userId: user.id });
      return reply;
    }

    case "coordinate_plan": {
      const resolved = resolveContactsForPlan(contacts, intent.contactNames);
      if (resolved.type === "ambiguous") {
        const reply = `Which ${resolved.query} — ${formatAmbiguousContacts(resolved.contacts)}?`;
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }
      if (resolved.type === "missing") {
        const reply = await missingContactReply(user.id, resolved.query, ctx);
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }

      const contact = resolved.contact;
      const ownerName = user.name ?? "Your friend";
      const messageBody =
        intent.draftMessage ||
        `${ownerName} asked Mutual to help coordinate${intent.activity ? ` ${intent.activity}` : " plans"}${intent.timeframe ? ` ${intent.timeframe}` : ""}. You in?`;

      await rejectOtherPendingActions(user.id);
      pendingAction = await createPendingAction(
        user.id,
        {
          contactId: contact.id,
          contactPhone: contact.phone ?? "",
          contactName: contact.name,
          messageBody,
          ownerName,
        },
        replyToSender,
      );

      const cta =
        ctx.channel === "web"
          ? `Want me to send this to ${contact.name}?`
          : `Reply YES to send this to ${contact.name}:`;
      const reply = `${replyToSender}\n\n${cta}\n"${messageBody}"`;
      const planCard: CardPayload = {
        kind: "plan",
        activity: intent.activity ?? "plans",
        withNames: [contact.name],
        timeframe: intent.timeframe,
        status: "draft",
        draftMessage: messageBody,
      };
      return respond(thread.id, user.id, reply, ctx, planCard);
    }

    case "approve_action": {
      pendingAction = await getPendingActionForUser(user.id);
      if (!pendingAction) {
        const reply = "Nothing waiting for approval right now. Who should I help you reach out to?";
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }
      return executeApprovedAction(user, pendingAction, thread.id, ctx);
    }

    case "reject_action": {
      if (pendingAction) {
        await updatePendingActionStatus(pendingAction.id, "rejected");
      }
      const reply = replyToSender || "Cancelled. Want to try something else?";
      await logMessage(thread.id, "outbound", reply, { userId: user.id });
      return reply;
    }

    case "remember_fact": {
      // Resolve who the fact is about. A connected friend gets a subject_user_id
      // so visibility can govern cross-user sharing; a non-user contact stays
      // owner-private (subject null, name carried in the content).
      let subjectUserId: string | null = null;
      if (intent.about) {
        const match = resolveContactByName(contacts, intent.about);
        if (match.status === "found" && match.contact.linked_user_id) {
          subjectUserId = match.contact.linked_user_id;
        }
      }
      await createMemory({
        userId: user.id,
        subjectUserId,
        content: intent.content,
        visibility: intent.visibility,
        source: "user_stated",
      });
      return respond(thread.id, user.id, replyToSender || "Got it — I'll remember that.", ctx);
    }

    case "search_events": {
      const hasLocation = Boolean(user.city) || (user.lat != null && user.lng != null);
      if (!hasLocation) {
        const ask =
          replyToSender ||
          "I can pull live events near you — want to share your location? Tap below to enable it.";
        return respond(thread.id, user.id, ask, ctx);
      }
      try {
        const events = await searchLocalEvents({
          query: intent.query,
          city: user.city,
          lat: user.lat,
          lng: user.lng,
          timeframe: intent.timeframe,
          limit: 5,
        });
        if (events.length === 0) {
          return respond(
            thread.id,
            user.id,
            replyToSender || "I couldn't find anything matching right now. Want to try a different vibe?",
            ctx,
          );
        }
        const card: CardPayload = {
          kind: "event_list",
          heading: intent.timeframe ? `${intent.query} · ${intent.timeframe}` : intent.query,
          events,
        };
        return respond(
          thread.id,
          user.id,
          replyToSender || `Here's what I found${user.city ? ` in ${user.city}` : ""}:`,
          ctx,
          card,
        );
      } catch (error) {
        console.error("Exa event search failed:", error);
        return respond(
          thread.id,
          user.id,
          "I couldn't pull live events right now — try again in a bit.",
          ctx,
        );
      }
    }

    case "show_profile": {
      const match = resolveContactByName(contacts, intent.name);
      if (match.status === "ambiguous") {
        return respond(
          thread.id,
          user.id,
          `Which ${intent.name} — ${formatAmbiguousContacts(match.contacts)}?`,
          ctx,
        );
      }
      if (match.status === "missing" || !match.contact.linked_user_id) {
        return respond(
          thread.id,
          user.id,
          replyToSender || `I don't know much about ${intent.name} yet.`,
          ctx,
        );
      }
      const friend = await getUserById(match.contact.linked_user_id);
      if (!friend) {
        return respond(
          thread.id,
          user.id,
          replyToSender || `I couldn't pull up ${intent.name}'s profile.`,
          ctx,
        );
      }
      const friends = await areFriends(user.id, friend.id);
      const shareable = await getShareableMemoriesAbout(friend.id, user.id, friends);
      const card: CardPayload = {
        kind: "profile",
        username: friend.username ?? undefined,
        name: friend.name ?? match.contact.name,
        avatarGradient: friend.avatar_gradient ?? undefined,
        bio: friend.bio ?? undefined,
        intents: intentsToLabels(friend.intents ?? {}),
        sharedFacts: shareable.map((m) => m.content),
      };
      return respond(
        thread.id,
        user.id,
        replyToSender || `Here's ${card.name}:`,
        ctx,
        card,
      );
    }

    case "capture_preference": {
      await createSignal({
        userId: user.id,
        lane: intent.lane,
        direction: intent.direction,
        summary: intent.summary,
        tags: intent.tags,
        visibility: intent.visibility,
      });
      // Expressing a want on a lane implicitly opens the user to it, so matching
      // (which gates on intents[lane]) works without a separate settings step.
      if (!user.intents?.[intent.lane]) {
        user = await updateIntents(user.id, {
          ...(user.intents ?? {}),
          [intent.lane]: true,
        });
      }
      await logFunnelEvent("preference_captured", user.id, { lane: intent.lane });
      return respond(
        thread.id,
        user.id,
        replyToSender ||
          `Got it — I'll keep an eye out for ${laneLabel(intent.lane)} matches for you.`,
        ctx,
      );
    }

    case "find_matches": {
      const matches = await findMatches(user.id, intent.lane, intent.scope);
      if (matches.length === 0) {
        return respond(
          thread.id,
          user.id,
          replyToSender ||
            `No ${laneLabel(intent.lane)} matches in your ${
              intent.scope === "network" ? "extended network" : "circle"
            } yet — the more friends on Mutual, the better this gets.`,
          ctx,
        );
      }
      await logFunnelEvent("match_surfaced", user.id, {
        lane: intent.lane,
        scope: intent.scope,
        count: matches.length,
      });
      const card: CardPayload = {
        kind: "match_list",
        lane: intent.lane,
        heading: laneHeading(intent.lane),
        candidates: matches.map((m) => ({
          name: m.user.name ?? undefined,
          username: m.user.username ?? undefined,
          avatarGradient: m.user.avatar_gradient ?? undefined,
          summary: m.summary ?? undefined,
          sharedTags: m.sharedTags.length ? m.sharedTags : undefined,
          scope: m.scope,
        })),
      };
      return respond(
        thread.id,
        user.id,
        replyToSender || "Here's who you might click with:",
        ctx,
        card,
      );
    }

    case "request_connection": {
      const match = resolveContactByName(contacts, intent.candidateName);
      if (match.status === "ambiguous") {
        return respond(
          thread.id,
          user.id,
          `Which ${intent.candidateName} — ${formatAmbiguousContacts(match.contacts)}?`,
          ctx,
        );
      }

      // A known contact who isn't on Mutual yet → high-intent invite (k-factor):
      // the intro is staged against their invite code and completes when they join.
      if (match.status === "found" && !match.contact.linked_user_id) {
        const invite = await getOrCreateInvite(user.id);
        await requestConnection({
          initiatorUserId: user.id,
          lane: intent.lane,
          targetInviteCode: invite.code,
          context: intent.candidateName,
        });
        await logFunnelEvent("connection_requested", user.id, {
          lane: intent.lane,
          target: "non_user",
        });
        await logFunnelEvent("invite_sent", user.id, { lane: intent.lane });
        const link = `${ctx.appOrigin}/mutual?join=${invite.code}`;
        return respond(
          thread.id,
          user.id,
          inviteShareReply(
            `${match.contact.name} isn't on Mutual yet — send them this and I'll set up the intro the moment they're in:`,
            null,
            link,
          ),
          ctx,
        );
      }

      // Resolve to a real user: a linked contact, else a reachable network match.
      const target =
        match.status === "found" && match.contact.linked_user_id
          ? await getUserById(match.contact.linked_user_id)
          : await resolveReachableUser(user.id, intent.candidateName);

      if (!target) {
        return respond(
          thread.id,
          user.id,
          replyToSender ||
            `I don't know ${intent.candidateName} yet — add them or share your invite link so I can broker an intro.`,
          ctx,
        );
      }

      const connection = await requestConnection({
        initiatorUserId: user.id,
        lane: intent.lane,
        targetUserId: target.id,
        context: intent.candidateName,
      });
      await logFunnelEvent("connection_requested", user.id, {
        lane: intent.lane,
        target: "user",
        connectionId: connection.id,
      });
      await notifyConnectionTarget(target, intent.lane, ctx);

      const card: CardPayload = {
        kind: "connection",
        lane: intent.lane,
        status: "pending",
        name: target.name ?? undefined,
        username: target.username ?? undefined,
        avatarGradient: target.avatar_gradient ?? undefined,
      };
      return respond(
        thread.id,
        user.id,
        replyToSender ||
          `Asked ${target.name ?? "them"} privately — I'll only reveal anything if it's mutual.`,
        ctx,
        card,
      );
    }

    case "request_location": {
      const ask =
        replyToSender ||
        "Where are you based? Tap below to share your location, or just tell me your city.";
      const card: CardPayload = { kind: "location" };
      return respond(thread.id, user.id, ask, ctx, card);
    }

    case "set_location": {
      user = await updateLocation(user.id, { city: intent.city });
      await logFunnelEvent("location_captured", user.id, { via: "text" });
      return respond(
        thread.id,
        user.id,
        replyToSender ||
          `Got it — ${intent.city}. That helps me line up the right people and plans nearby.`,
        ctx,
      );
    }

    case "complete_onboarding": {
      // Only meaningful for a waitlisted user — a granted user just keeps chatting.
      if (user.access_status === "granted") {
        await logMessage(thread.id, "outbound", replyToSender, { userId: user.id });
        return replyToSender;
      }
      user = await setInterviewCompleted(user.id);
      await logFunnelEvent("waitlisted", user.id, {});
      const card: CardPayload = {
        kind: "waitlist",
        headline: "You're on the list 🎉",
        message: intent.summary || undefined,
      };
      const reply =
        replyToSender ||
        "That's everything I need for now — you're on the early-access list. I'll text you the moment your spot opens and we'll start finding your people.";
      return respond(thread.id, user.id, reply, ctx, card);
    }

    case "general_chat":
    default: {
      await logMessage(thread.id, "outbound", replyToSender, { userId: user.id });
      return replyToSender;
    }
  }
}

type ResolveResult =
  | { type: "found"; contact: Awaited<ReturnType<typeof getContactsForUser>>[0] }
  | { type: "ambiguous"; query: string; contacts: Awaited<ReturnType<typeof getContactsForUser>> }
  | { type: "missing"; query: string };

function resolveContactsForPlan(
  contacts: Awaited<ReturnType<typeof getContactsForUser>>,
  contactNames: string[],
): ResolveResult {
  if (contactNames.length === 0) {
    return { type: "missing", query: "that person" };
  }

  // MVP: coordinate with first contact only.
  const nameQuery = contactNames[0];
  const result = resolveContactByName(contacts, nameQuery);
  if (result.status === "found") return { type: "found", contact: result.contact };
  if (result.status === "ambiguous") {
    return { type: "ambiguous", query: nameQuery, contacts: result.contacts };
  }
  return { type: "missing", query: nameQuery };
}

// How to handle a plan with someone we don't know yet, per channel.
async function missingContactReply(
  userId: string,
  query: string,
  ctx: AgentContext,
): Promise<string> {
  if (ctx.channel === "web") {
    const invite = await getOrCreateInvite(userId);
    const link = `${ctx.appOrigin}/mutual?join=${invite.code}`;
    return inviteShareReply(
      `I don't know ${query} yet — share your invite link so they can join, then I'll help you two make a plan.`,
      null,
      link,
    );
  }
  return `I don't have ${query} yet. What's their phone number?`;
}

async function executeApprovedAction(
  user: { id: string; name: string | null; phone: string },
  pendingAction: NonNullable<Awaited<ReturnType<typeof getPendingActionForUser>>>,
  ownerThreadId: string,
  ctx: AgentContext,
): Promise<string> {
  const payload = pendingAction.payload;
  await updatePendingActionStatus(pendingAction.id, "approved");

  if (ctx.channel === "web") {
    const contact = await getContactById(payload.contactId);

    // Friend is already on Mutual → deliver into their chat + email them.
    if (contact?.linked_user_id) {
      const recipient = await getUserById(contact.linked_user_id);
      if (recipient) {
        const recipientThread = await getOrCreateOwnerThread(
          recipient.id,
          recipient.phone,
        );
        const deliver = `${payload.ownerName} wants to make plans: "${payload.messageBody}"\n\nReply here and I'll relay it back.`;
        await logMessage(recipientThread.id, "outbound", deliver, {
          userId: recipient.id,
        });
        await ctx.notifier.notifyOwner(recipient, deliver);
      }
      await updatePendingActionStatus(pendingAction.id, "executed");
      const reply = `Sent to ${payload.contactName}! I'll let you know when they reply.`;
      await logMessage(ownerThreadId, "outbound", reply, { userId: user.id });
      return reply;
    }

    // Friend isn't on Mutual yet → hand the user a shareable invite link.
    const invite = await getOrCreateInvite(user.id);
    const link = `${ctx.appOrigin}/mutual?join=${invite.code}`;
    await updatePendingActionStatus(pendingAction.id, "executed");
    const reply = inviteShareReply(
      `${payload.contactName} isn't on Mutual yet. Send them this to get them in, then I'll help you plan:`,
      payload.messageBody,
      link,
    );
    await logMessage(ownerThreadId, "outbound", reply, { userId: user.id });
    return reply;
  }

  // SMS channel: text the friend directly (original behavior).
  const participantThread = await getOrCreateParticipantThread(
    payload.contactPhone,
    user.id,
    payload.contactId,
  );

  const twilioSid = await sendSms(payload.contactPhone, payload.messageBody, {
    includeStartCta: true,
  });

  await logMessage(participantThread.id, "outbound", payload.messageBody, {
    userId: user.id,
    twilioSid,
  });

  await updatePendingActionStatus(pendingAction.id, "executed");

  const contact = await getContactByPhone(user.id, payload.contactPhone);
  if (contact) {
    const linkedUser = await getUserByPhone(payload.contactPhone);
    if (linkedUser) {
      await linkContactToUser(contact.id, linkedUser.id);
    }
  }

  const reply = `Sent to ${payload.contactName}! I'll let you know when they reply.`;
  await logMessage(ownerThreadId, "outbound", reply, { userId: user.id });
  return reply;
}

async function handleParticipantReply(
  participantThread: NonNullable<
    Awaited<ReturnType<typeof findParticipantThreadForPhone>>
  >,
  body: string,
  messageSid: string,
  ctx: AgentContext,
): Promise<string> {
  const ownerUserId = participantThread.owner_user_id;
  if (!ownerUserId) {
    return "Thanks for replying! Text START if you want your own Mutual.";
  }

  const ownerUser = await getUserById(ownerUserId);
  if (!ownerUser) {
    return "Thanks for your reply!";
  }

  await logMessage(participantThread.id, "inbound", body, { twilioSid: messageSid });
  await touchThread(participantThread.id);

  const ownerThread = await getOrCreateOwnerThread(ownerUserId, ownerUser.phone);

  let name = "They";
  if (participantThread.contact_id) {
    const contact = await getContactById(participantThread.contact_id);
    if (contact?.name) name = contact.name;
  }

  const relayBody = `${name} replied: "${body}"\n\nWant me to follow up or lock in a time?`;

  // Log to the owner's thread (surfaces in web chat) and notify out of band.
  await logMessage(ownerThread.id, "outbound", relayBody, { userId: ownerUserId });
  await ctx.notifier.notifyOwner(ownerUser, relayBody);

  return `Got it — I'll let ${ownerUser.name ?? "them"} know. Text START for your own Mutual.`;
}

const LANE_LABELS: Record<MatchLane, string> = {
  dating: "dating",
  work: "work",
  friendship: "friendship",
  intros: "an intro",
};

function laneLabel(lane: MatchLane): string {
  return LANE_LABELS[lane];
}

const LANE_HEADINGS: Record<MatchLane, string> = {
  dating: "People you might want to date",
  work: "Worth connecting with",
  friendship: "People to hang with",
  intros: "Worth an intro",
};

function laneHeading(lane: MatchLane): string {
  return LANE_HEADINGS[lane];
}

// Ask a potential match privately whether they're open — WITHOUT naming the
// initiator. Nobody is revealed until the consent is mutual. Exported so the web
// connections API brokers intros through the exact same path as SMS.
export async function notifyConnectionTarget(
  target: { id: string; phone: string },
  lane: MatchLane,
  ctx: AgentContext,
): Promise<void> {
  const targetThread = await getOrCreateOwnerThread(target.id, target.phone);
  const ask = `Someone in your circle wants to connect with you about ${laneLabel(lane)}. Want me to see if it's mutual? Reply YES or NO — they won't know unless you both say yes.`;
  await logMessage(targetThread.id, "outbound", ask, { userId: target.id });
  await ctx.notifier.notifyOwner(target as User, ask);
}

// The target answered a pending intro. Yes reveals both sides; no stays silent —
// the initiator is never told it was declined. Exported for the web API.
export async function handleConnectionConsent(
  target: User,
  connection: Connection,
  accept: boolean,
  targetThreadId: string,
  ctx: AgentContext,
): Promise<string> {
  await setTargetConsent(connection.id, accept);
  const initiator = await getUserById(connection.initiator_user_id);

  if (!accept) {
    await logFunnelEvent("target_declined", target.id, {
      connectionId: connection.id,
    });
    const reply = "No worries — I won't share anything, and they won't know.";
    await logMessage(targetThreadId, "outbound", reply, { userId: target.id });
    return reply;
  }

  await logFunnelEvent("target_consented", target.id, { connectionId: connection.id });
  await logFunnelEvent("connection_mutual", target.id, { connectionId: connection.id });

  // Reveal to the initiator in their thread + out of band.
  if (initiator) {
    const initiatorThread = await getOrCreateOwnerThread(initiator.id, initiator.phone);
    const handle = target.username ? ` (@${target.username})` : "";
    const toInitiator = `It's mutual! ${target.name ?? "They"}${handle} is up for connecting about ${laneLabel(connection.lane)}. Take it from here.`;
    await logMessage(initiatorThread.id, "outbound", toInitiator, {
      userId: initiator.id,
    });
    await ctx.notifier.notifyOwner(initiator, toInitiator);
  }

  const handle = initiator?.username ? ` (@${initiator.username})` : "";
  const reply = `It's mutual! ${initiator?.name ?? "They"}${handle} wanted to connect too — you two take it from here.`;
  await logMessage(targetThreadId, "outbound", reply, { userId: target.id });
  return reply;
}

function tryParsePhoneContactReply(
  recentMessages: Awaited<ReturnType<typeof getRecentMessages>>,
  body: string,
): { name: string; phone: string } | null {
  const lastOutbound = [...recentMessages]
    .reverse()
    .find((m) => m.direction === "outbound");
  if (!lastOutbound) return null;

  const askedForPhone =
    lastOutbound.body.includes("phone number") ||
    lastOutbound.body.includes("What's their number");
  if (!askedForPhone) return null;

  const phoneMatch = body.match(
    /(\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/,
  );
  if (!phoneMatch) return null;

  const nameMatch = lastOutbound.body.match(/I don't have (.+?) yet/i);
  const name = nameMatch?.[1]?.trim() ?? "Contact";
  return { name, phone: phoneMatch[1] };
}
