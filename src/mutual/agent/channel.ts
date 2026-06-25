import type { User } from "@/mutual/types";

// The agent serves two transports: the Twilio SMS webhook and the web chat
// endpoint. Everything channel-specific (keyword parsing, how an approved plan
// reaches a friend, how an owner is nudged out-of-band) is selected by this
// context rather than branching on a transport detail inside the orchestration.

export type Channel = "sms" | "web";

export interface OwnerNotifier {
  // Push something to the owner out of band (e.g. a friend replied).
  notifyOwner(owner: User, body: string): Promise<{ sid?: string }>;
}

export type AgentContext = {
  channel: Channel;
  notifier: OwnerNotifier;
  // Origin used to build shareable invite links for web outreach.
  appOrigin: string;
};
