import type { Contact } from "@/mutual/types";

export function canSendToContact(
  _contact: Contact,
  trustLevel: "remember" | "draft_only" | "ask_first" | "auto_coordinate" = "ask_first",
): boolean {
  return trustLevel === "ask_first" || trustLevel === "auto_coordinate";
}
