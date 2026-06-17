import type { InboundSms } from "@/mutual/types";
import { parseAgentResponse } from "./parse-intent";
import {
  getUserByPhone,
  upsertUser,
  setUserName,
  setUserOptOut,
  createUserFromStart,
} from "@/mutual/db/users";
import { getSupabase } from "@/mutual/db/client";
import {
  getContactsForUser,
  createContact,
  resolveContactByName,
  formatAmbiguousContacts,
  getContactByPhone,
  getContactById,
  linkContactToUser,
} from "@/mutual/db/contacts";
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
import { sendSms } from "@/mutual/sms/send";
import {
  parseKeyword,
  HELP_MESSAGE,
  WELCOME_MESSAGE,
  OPT_OUT_MESSAGE,
  OPT_IN_MESSAGE,
} from "@/mutual/sms/keywords";
import { normalizePhone } from "@/mutual/db/client";

const APPROVAL_WORDS = new Set(["yes", "y", "send", "send it", "approve", "do it", "go ahead", "sure", "ok", "okay"]);
const REJECT_WORDS = new Set(["no", "n", "cancel", "don't", "dont", "nope", "nah"]);

function isApproval(body: string): boolean {
  return APPROVAL_WORDS.has(body.trim().toLowerCase());
}

function isRejection(body: string): boolean {
  return REJECT_WORDS.has(body.trim().toLowerCase());
}

export async function handleInboundSms(inbound: InboundSms): Promise<string | null> {
  const fromPhone = normalizePhone(inbound.from);
  const body = inbound.body.trim();

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

  let user = await getUserByPhone(fromPhone);

  // Participant reply routing — non-user who received a coordination text
  if (!user) {
    const participantThread = await findParticipantThreadForPhone(fromPhone);
    if (participantThread?.owner_user_id) {
      return handleParticipantReply(participantThread, fromPhone, body, inbound.messageSid);
    }

    // New user onboarding
    user = await upsertUser(fromPhone);
    const thread = await getOrCreateOwnerThread(user.id, fromPhone);
    await logMessage(thread.id, "inbound", body, { twilioSid: inbound.messageSid });

    if (!user.name) {
      // First message might be their name or a request — try to set name if short
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
  let pendingAction = await getPendingActionForUser(user.id);

  // Inline phone reply after "what's their phone number?"
  const phoneReply = tryParsePhoneContactReply(recentMessages, body);
  if (phoneReply) {
    await createContact(user.id, phoneReply.name, phoneReply.phone);
    const reply = `Added ${phoneReply.name}. Want me to reach out about plans?`;
    await logMessage(thread.id, "outbound", reply, { userId: user.id });
    return reply;
  }

  // Fast-path approval/rejection without LLM
  if (pendingAction && isApproval(body)) {
    return executeApprovedAction(user, pendingAction, thread.id);
  }
  if (pendingAction && isRejection(body)) {
    await updatePendingActionStatus(pendingAction.id, "rejected");
    const reply = "Got it — cancelled. Want to try a different message?";
    await logMessage(thread.id, "outbound", reply, { userId: user.id });
    return reply;
  }

  // Name onboarding if not set
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
  );

  const { intent, replyToSender } = agentResponse;

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
      const resolved = resolveContactsForPlan(user, contacts, intent.contactNames);
      if (resolved.type === "ambiguous") {
        const reply = `Which ${resolved.query} — ${formatAmbiguousContacts(resolved.contacts)}?`;
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }
      if (resolved.type === "missing") {
        const reply = `I don't have ${resolved.query} yet. What's their phone number?`;
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
          contactPhone: contact.phone,
          contactName: contact.name,
          messageBody,
          ownerName,
        },
        replyToSender,
      );

      const reply = `${replyToSender}\n\nReply YES to send this to ${contact.name}:\n"${messageBody}"`;
      await logMessage(thread.id, "outbound", reply, { userId: user.id });
      return reply;
    }

    case "approve_action": {
      pendingAction = await getPendingActionForUser(user.id);
      if (!pendingAction) {
        const reply = "Nothing waiting for approval right now. Who should I help you reach out to?";
        await logMessage(thread.id, "outbound", reply, { userId: user.id });
        return reply;
      }
      return executeApprovedAction(user, pendingAction, thread.id);
    }

    case "reject_action": {
      if (pendingAction) {
        await updatePendingActionStatus(pendingAction.id, "rejected");
      }
      const reply = replyToSender || "Cancelled. Want to try something else?";
      await logMessage(thread.id, "outbound", reply, { userId: user.id });
      return reply;
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
  _user: { id: string },
  contacts: Awaited<ReturnType<typeof getContactsForUser>>,
  contactNames: string[],
): ResolveResult {
  if (contactNames.length === 0) {
    return { type: "missing", query: "that person" };
  }

  // MVP: coordinate with first contact only
  const nameQuery = contactNames[0];
  const result = resolveContactByName(contacts, nameQuery);
  if (result.status === "found") return { type: "found", contact: result.contact };
  if (result.status === "ambiguous") {
    return { type: "ambiguous", query: nameQuery, contacts: result.contacts };
  }
  return { type: "missing", query: nameQuery };
}

async function executeApprovedAction(
  user: { id: string; name: string | null; phone: string },
  pendingAction: Awaited<ReturnType<typeof getPendingActionForUser>> & object,
  ownerThreadId: string,
): Promise<string> {
  const payload = pendingAction.payload;

  await updatePendingActionStatus(pendingAction.id, "approved");

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
  fromPhone: string,
  body: string,
  messageSid: string,
): Promise<string> {
  const ownerUserId = participantThread.owner_user_id;
  if (!ownerUserId) {
    return "Thanks for replying! Text START if you want your own Mutual.";
  }

  const ownerUser = await getOwnerById(ownerUserId);
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

  const ownerTwilioSid = await sendSms(ownerUser.phone, relayBody);
  await logMessage(ownerThread.id, "outbound", relayBody, {
    userId: ownerUserId,
    twilioSid: ownerTwilioSid,
  });

  return `Got it — I'll let ${ownerUser.name ?? "them"} know. Text START for your own Mutual.`;
}

async function getOwnerById(userId: string) {
  const db = getSupabase();
  const { data, error } = await db
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
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

  const nameMatch = lastOutbound.body.match(
    /I don't have (.+?) yet/i,
  );
  const name = nameMatch?.[1]?.trim() ?? "Contact";
  return { name, phone: phoneMatch[1] };
}
