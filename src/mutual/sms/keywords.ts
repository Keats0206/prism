export type KeywordAction =
  | { type: "stop" }
  | { type: "start" }
  | { type: "help" }
  | { type: "none" };

const STOP_KEYWORDS = new Set(["stop", "stopall", "unsubscribe", "cancel", "end", "quit"]);
const START_KEYWORDS = new Set(["start", "unstop"]);
const HELP_KEYWORDS = new Set(["help", "info"]);

export function parseKeyword(body: string): KeywordAction {
  const normalized = body.trim().toLowerCase();

  if (STOP_KEYWORDS.has(normalized)) {
    return { type: "stop" };
  }
  if (START_KEYWORDS.has(normalized)) {
    return { type: "start" };
  }
  if (HELP_KEYWORDS.has(normalized)) {
    return { type: "help" };
  }
  return { type: "none" };
}

export const HELP_MESSAGE =
  "Mutual helps you coordinate plans with friends via SMS. Text what you want to do, approve drafts with YES, and reply STOP to opt out.";

export const WELCOME_MESSAGE =
  "Hey — I'm Mutual, your SMS social coordinator. What's your name?";

export const OPT_OUT_MESSAGE =
  "You've been unsubscribed. Text START to opt back in.";

export const OPT_IN_MESSAGE =
  "You're back! What's your name? (Or just tell me who you want to make plans with.)";
