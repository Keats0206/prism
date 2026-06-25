import type { OwnerNotifier } from "./channel";
import { sendSms } from "@/mutual/sms/send";
import { sendEmail } from "@/mutual/notify/email";

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://mutual.app";
}

// SMS owners get the relay as a text (original behavior).
export const smsNotifier: OwnerNotifier = {
  async notifyOwner(owner, body) {
    const sid = await sendSms(owner.phone, body);
    return { sid };
  },
};

// Web owners get an email nudge; the message itself is also logged to their
// owner thread by the caller, so it surfaces in chat on the next poll.
export const webNotifier: OwnerNotifier = {
  async notifyOwner(owner, body) {
    if (owner.email) {
      await sendEmail(
        owner.email,
        "New activity on Mutual",
        `${body}\n\nOpen Mutual: ${appUrl()}/mutual`,
      );
    }
    return {};
  },
};
