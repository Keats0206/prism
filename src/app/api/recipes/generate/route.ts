import { streamObject, type ModelMessage } from "ai";
import { diffToPatches } from "@json-render/core";
import { buildSystemPrompt, specSchema } from "@/prism/generation";
import { getModel } from "@/lib/models";

// Authoring endpoint for the /recipes page. Speaks the @json-render streaming
// protocol that `useUIStream` consumes: newline-delimited JSON Patch lines that
// progressively build a renderable spec, followed by a `{__meta:"usage"}` line.
export async function POST(request: Request) {
  const { prompt, context } = (await request.json()) as {
    prompt?: string;
    context?: { model?: string; image?: string };
  };

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Resolve against the allowlist so only known gateway models can be invoked.
  const modelInfo = getModel(context?.model);
  const image = context?.image;

  const messages: ModelMessage[] = [
    {
      role: "user",
      content: image
        ? [
            { type: "text", text: prompt.trim() },
            { type: "image", image },
          ]
        : prompt.trim(),
    },
  ];

  const result = streamObject({
    model: modelInfo.id,
    system: buildSystemPrompt(),
    messages,
    schema: specSchema,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // Diff each partial against the last emitted snapshot and stream only the
      // changed bits as JSON Patch ops — the client applies them incrementally.
      let prev: Record<string, unknown> = { root: "", elements: {} };
      try {
        for await (const partial of result.partialObjectStream) {
          const next: Record<string, unknown> = {
            root: partial?.root ?? "",
            elements: partial?.elements ?? {},
            ...(partial?.state ? { state: partial.state } : {}),
          };
          for (const patch of diffToPatches(prev, next)) send(patch);
          prev = next;
        }

        const usage = await result.usage;
        send({
          __meta: "usage",
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
          totalTokens:
            usage.totalTokens ??
            (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        });
      } catch (error) {
        console.error("Spec generation failed:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
