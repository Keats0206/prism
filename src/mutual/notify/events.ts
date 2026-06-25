import type { User } from "@/mutual/types";
import { sendEmail } from "./email";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://mutual.app";
}

// A friend accepted an invite and joined. Nudge the creator to start a plan.
export async function notifyCreatorOfJoin(
  creator: User,
  invitee: User,
  idea: string,
): Promise<void> {
  if (!creator.email) return;
  const who = invitee.username ? `@${invitee.username}` : "A friend";
  await sendEmail(
    creator.email,
    `${who} joined you on Mutual`,
    `${who} just joined Mutual and is up for "${idea}".\n\nOpen Mutual to lock in a plan: ${appUrl()}/mutual`,
  );
}

// A friend replied to a coordination message. Pull the owner back into chat.
export async function notifyOwnerOfReply(
  owner: User,
  fromName: string,
  reply: string,
): Promise<void> {
  if (!owner.email) return;
  await sendEmail(
    owner.email,
    `${fromName} replied on Mutual`,
    `${fromName} replied: "${reply}"\n\nOpen Mutual to keep things moving: ${appUrl()}/mutual`,
  );
}
