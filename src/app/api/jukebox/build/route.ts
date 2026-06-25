import { generateText, stepCountIs } from "ai";
import type { Spec } from "@json-render/core";
import { buildJukeboxGuide, editInstruction } from "@/jukebox/catalog-guide";
import { parseJukeboxSpec } from "@/jukebox/spec";
import { toAISdkTools } from "@/spotify/tools";
import { isConnected } from "@/spotify/client";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";

export const dynamic = "force-dynamic";

const RETRY_MODEL = MODELS[1]?.id ?? DEFAULT_MODEL;
const SYSTEM = buildJukeboxGuide();

async function generate(
  model: string,
  prompt: string,
  currentSpec?: Spec,
): Promise<Spec> {
  const system = currentSpec
    ? `${SYSTEM}\n\n${editInstruction(currentSpec)}`
    : SYSTEM;

  const { text } = await generateText({
    model,
    system,
    prompt,
    tools: toAISdkTools("read"),
    // Let the model call Spotify read tools across a few steps, then emit the spec.
    stopWhen: stepCountIs(6),
    maxOutputTokens: 16000,
  });
  return parseJukeboxSpec(text);
}

export async function POST(request: Request) {
  const { prompt, currentSpec } = (await request.json()) as {
    prompt?: string;
    currentSpec?: Spec;
  };

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  // The build agent needs the user's real Spotify data; gate on a connection.
  if (!(await isConnected())) {
    return Response.json({ error: "not_connected" }, { status: 401 });
  }

  const trimmed = prompt.trim();

  try {
    let spec: Spec;
    try {
      spec = await generate(DEFAULT_MODEL, trimmed, currentSpec);
    } catch (firstError) {
      console.warn("Jukebox generation retry after:", firstError);
      spec = await generate(RETRY_MODEL, trimmed, currentSpec);
    }
    return Response.json({ spec });
  } catch (error) {
    console.error("Jukebox build failed:", error);
    const message =
      error instanceof Error && error.message.includes("Unauthenticated")
        ? "AI Gateway is not configured. Add AI_GATEWAY_API_KEY to .env.local."
        : "Generation failed. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}
