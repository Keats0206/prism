import { generateObject } from "ai";
import { agentResponseSchema } from "@/mutual/types";
import type { Contact, Memory, Message, PendingAction, User } from "@/mutual/types";
import type { Channel } from "./channel";
import { buildSystemPrompt } from "./system-prompt";
import { formatMessagesForPrompt } from "@/mutual/db/messages";

export async function parseAgentResponse(
  user: User,
  contacts: Contact[],
  recentMessages: Message[],
  inboundBody: string,
  pendingAction: PendingAction | null,
  channel: Channel = "sms",
  memories: Memory[] = [],
) {
  const history = formatMessagesForPrompt(recentMessages);

  const { object } = await generateObject({
    // Sonnet 4.6 over Haiku: the agent now does real tool selection (capture
    // preference / find matches / request connection) plus a conversational
    // interview, where Haiku was unreliable at emitting valid structured output.
    model: "anthropic/claude-sonnet-4.6",
    system: buildSystemPrompt(user, contacts, pendingAction, channel, memories),
    prompt: `Recent conversation:\n${history}\n\nLatest message: ${inboundBody}`,
    schema: agentResponseSchema,
  });

  return object;
}
