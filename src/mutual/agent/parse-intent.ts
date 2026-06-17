import { generateObject } from "ai";
import { agentResponseSchema } from "@/mutual/types";
import type { Contact, Message, PendingAction, User } from "@/mutual/types";
import { buildSystemPrompt } from "./system-prompt";
import { formatMessagesForPrompt } from "@/mutual/db/messages";

export async function parseAgentResponse(
  user: User,
  contacts: Contact[],
  recentMessages: Message[],
  inboundBody: string,
  pendingAction: PendingAction | null,
) {
  const history = formatMessagesForPrompt(recentMessages);

  const { object } = await generateObject({
    model: "anthropic/claude-haiku-4.5",
    system: buildSystemPrompt(user, contacts, pendingAction),
    prompt: `Recent conversation:\n${history}\n\nLatest message: ${inboundBody}`,
    schema: agentResponseSchema,
  });

  return object;
}
