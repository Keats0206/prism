import { z } from "zod";

export const trustLevelSchema = z.enum([
  "remember",
  "draft_only",
  "ask_first",
  "auto_coordinate",
]);

export const sendSmsPayloadSchema = z.object({
  contactId: z.string().uuid(),
  contactPhone: z.string(),
  contactName: z.string(),
  messageBody: z.string(),
  ownerName: z.string(),
});

export type SendSmsPayload = z.infer<typeof sendSmsPayloadSchema>;

export const matchLaneSchema = z.enum(["dating", "work", "friendship", "intros"]);
export const signalDirectionSchema = z.enum(["seeking", "offering"]);
export const matchScopeSchema = z.enum(["friends", "network"]);

export const agentIntentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("coordinate_plan"),
    contactNames: z.array(z.string()),
    activity: z.string().optional(),
    timeframe: z.string().optional(),
    draftMessage: z.string(),
  }),
  z.object({
    type: z.literal("approve_action"),
  }),
  z.object({
    type: z.literal("reject_action"),
  }),
  z.object({
    type: z.literal("add_contact"),
    name: z.string(),
    phone: z.string().optional(),
  }),
  z.object({
    type: z.literal("set_name"),
    name: z.string(),
  }),
  // Capture a durable fact about the user or one of their friends. `about` is a
  // friend's name (omit when the fact is about the user). visibility controls
  // whether Mutual may ever share it with that friend or others.
  z.object({
    type: z.literal("remember_fact"),
    content: z.string(),
    about: z.string().optional(),
    visibility: z.enum(["private", "friends", "public"]).default("private"),
  }),
  // Pull live local events. The orchestrator runs the search and builds the
  // card — the model only supplies what to look for.
  z.object({
    type: z.literal("search_events"),
    query: z.string(),
    timeframe: z.string().optional(),
  }),
  // Ask the user for their location during onboarding. The orchestrator returns
  // the ask plus a location card (web shows a "use current location" button;
  // SMS just asks for a city). Emit this when you need to geo-locate them.
  z.object({
    type: z.literal("request_location"),
  }),
  // Record a location the user typed as text (e.g. "I'm in Austin"). The
  // orchestrator stores the city; coords come from the browser button instead.
  z.object({
    type: z.literal("set_location"),
    city: z.string(),
  }),
  // Wrap up the waitlist interview. Emit ONLY once you understand what the user
  // is looking for (at least one lane) AND have their location. The orchestrator
  // marks the interview complete and shows the waitlist confirmation card.
  z.object({
    type: z.literal("complete_onboarding"),
    summary: z.string().optional(),
  }),
  // Show what Mutual can share about a friend. The orchestrator enforces
  // visibility — the model only names who.
  z.object({
    type: z.literal("show_profile"),
    name: z.string(),
  }),
  // Capture a structured, matchable preference (distinct from remember_fact's
  // freeform note). `lane` is which track the want sits on; `tags` are short
  // normalized keywords the matcher computes overlap on; `direction` is whether
  // the user is seeking this or offering it. Defaults to friends-visible.
  z.object({
    type: z.literal("capture_preference"),
    lane: matchLaneSchema,
    direction: signalDirectionSchema.default("seeking"),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    visibility: z.enum(["private", "friends", "public"]).default("friends"),
  }),
  // Surface people the user might want to connect with on a lane. The
  // orchestrator runs the match and builds the card — the model only names the
  // lane and how far to reach.
  z.object({
    type: z.literal("find_matches"),
    lane: matchLaneSchema,
    scope: matchScopeSchema.default("friends"),
  }),
  // Ask Mutual to broker a consent-gated intro to a named person on a lane. The
  // orchestrator records the request and asks the other side privately; nobody
  // is revealed until both say yes.
  z.object({
    type: z.literal("request_connection"),
    candidateName: z.string(),
    lane: matchLaneSchema,
  }),
  z.object({
    type: z.literal("general_chat"),
    reply: z.string(),
  }),
]);

// Hand-built cards the agent can attach to a web chat reply. SMS degrades these
// to a text summary (see the `respond` helper in handle-inbound). Event and
// profile cards are built by the orchestrator from real data — never the LLM —
// to avoid hallucinated events/facts; only `plan` is honored from the model.
const eventItemSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  venue: z.string().optional(),
  startsAt: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const cardSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("event") }).merge(eventItemSchema),
  z.object({
    kind: z.literal("event_list"),
    heading: z.string().optional(),
    events: z.array(eventItemSchema).max(5),
  }),
  z.object({
    kind: z.literal("plan"),
    activity: z.string(),
    withNames: z.array(z.string()),
    timeframe: z.string().optional(),
    status: z.enum(["draft", "proposed", "confirmed"]),
    draftMessage: z.string().optional(),
  }),
  z.object({
    kind: z.literal("profile"),
    username: z.string().optional(),
    name: z.string().optional(),
    avatarGradient: z.string().optional(),
    bio: z.string().optional(),
    intents: z.array(z.string()).optional(),
    sharedFacts: z.array(z.string()).optional(),
  }),
  // A ranked set of people the user might want to connect with. Built by the
  // orchestrator from real signals — never the LLM — so nobody is invented.
  z.object({
    kind: z.literal("match_list"),
    lane: matchLaneSchema,
    heading: z.string().optional(),
    candidates: z
      .array(
        z.object({
          name: z.string().optional(),
          username: z.string().optional(),
          avatarGradient: z.string().optional(),
          summary: z.string().optional(),
          sharedTags: z.array(z.string()).optional(),
          scope: matchScopeSchema,
        }),
      )
      .max(5),
  }),
  // The state of a brokered intro. Drives the "is it mutual?" suspense.
  z.object({
    kind: z.literal("connection"),
    lane: matchLaneSchema,
    status: z.enum(["pending", "mutual", "declined"]),
    name: z.string().optional(),
    username: z.string().optional(),
    avatarGradient: z.string().optional(),
    context: z.string().optional(),
  }),
  // Waitlist confirmation. Shown when the onboarding interview wraps up — the
  // user is in line and the full agent stays locked until they're granted.
  z.object({
    kind: z.literal("waitlist"),
    headline: z.string().optional(),
    message: z.string().optional(),
  }),
  // Prompt for the user's location during onboarding. On web the card renders a
  // one-tap "use current location" button; on SMS it degrades to the ask text.
  z.object({
    kind: z.literal("location"),
  }),
]);

export type CardPayload = z.infer<typeof cardSchema>;
export type EventItem = z.infer<typeof eventItemSchema>;

// Some models (notably Haiku via the gateway) occasionally serialize a nested
// object field as a JSON string instead of inlining it, which fails schema
// validation. Tolerate that by parsing a stringified value back into an object
// before validation. The emitted JSON schema is unchanged, so generation still
// targets the real shape — this only recovers the malformed case.
const coerceJson = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((val) => {
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }
    return val;
  }, schema);

export const agentResponseSchema = z.object({
  // Models frequently omit `intent` when they just want to talk (e.g. the
  // onboarding interview asks a question with no structured action). Treat a
  // missing intent as plain conversation rather than failing the whole turn —
  // `replyToSender` still carries the text. This keeps a chatty reply from
  // 500ing the request regardless of which model is behind the gateway.
  intent: coerceJson(agentIntentSchema).default({
    type: "general_chat",
    reply: "",
  }),
  replyToSender: z.string(),
  card: coerceJson(cardSchema).optional(),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;
export type AgentIntent = z.infer<typeof agentIntentSchema>;

export type InboundSms = {
  from: string;
  to: string;
  body: string;
  messageSid: string;
};

export type CreatorAnswers = {
  socialGoal?: string;
  wishSeenMore?: string;
  wantToDo?: string;
};

export type UserIntents = {
  intros?: boolean;
  dating?: boolean;
  work?: boolean;
  friendship?: boolean;
};

export type User = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  username: string | null;
  avatar_gradient: string | null;
  answers: CreatorAnswers;
  opted_out: boolean;
  onboarded_at: string | null;
  bio: string | null;
  intents: UserIntents;
  lat: number | null;
  lng: number | null;
  city: string | null;
  location_updated_at: string | null;
  access_status: "waitlist" | "granted";
  interview_completed_at: string | null;
};

export type MemoryVisibility = "private" | "friends" | "public";
export type MemorySource = "user_stated" | "agent_inferred" | "onboarding";

export type Memory = {
  id: string;
  user_id: string;
  subject_user_id: string | null;
  content: string;
  visibility: MemoryVisibility;
  source: MemorySource;
  created_at: string;
};

export type Contact = {
  id: string;
  owner_user_id: string;
  phone: string;
  name: string;
  notes: string | null;
  linked_user_id: string | null;
};

export type PendingAction = {
  id: string;
  user_id: string;
  action_type: "send_sms";
  payload: SendSmsPayload;
  draft_reply: string | null;
  status: "pending" | "approved" | "rejected" | "expired" | "executed";
  expires_at: string;
};

export type Thread = {
  id: string;
  owner_user_id: string | null;
  contact_id: string | null;
  participant_phone: string;
  kind: "owner" | "participant";
};

export type Message = {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  body: string;
  card: CardPayload | null;
  created_at: string;
};

// --- Matching engine --------------------------------------------------------

// The four "lanes" a want can sit on. These mirror UserIntents keys so a user's
// coarse intent (`intents.dating`) gates which of their signals are matchable.
export type MatchLane = "dating" | "work" | "friendship" | "intros";
export const MATCH_LANES: MatchLane[] = ["dating", "work", "friendship", "intros"];

// "seeking" = what you want (looking to date), "offering" = what you bring
// (available to mentor). Matching pairs a seeker with an offerer or two seekers.
export type SignalDirection = "seeking" | "offering";

// A structured, matchable projection of a preference. Freeform context still
// lives in `memories`; this is the part the matcher computes overlap on.
export type MatchSignal = {
  id: string;
  user_id: string;
  lane: MatchLane;
  direction: SignalDirection;
  summary: string;
  tags: string[];
  visibility: MemoryVisibility;
  created_at: string;
};

export type ConnectionStatus = "pending" | "mutual" | "declined" | "expired";

// A double-opt-in intro. Revealed only once both consents are true.
export type Connection = {
  id: string;
  lane: MatchLane;
  initiator_user_id: string;
  target_user_id: string | null;
  target_invite_code: string | null;
  context: string | null;
  initiator_consent: boolean;
  target_consent: boolean | null;
  status: ConnectionStatus;
  created_at: string;
};
