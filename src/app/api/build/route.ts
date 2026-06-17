import { generateSpec } from "@/rlylabs/generation";
import { scoreRecipes, selectRecipes } from "@/rlylabs/recipes/retrieve";
import { DEFAULT_MODEL, MODELS } from "@/lib/models";

const RETRY_MODEL = MODELS[1]?.id ?? DEFAULT_MODEL;

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  const trimmed = prompt.trim();
  const matched = selectRecipes(trimmed);
  const examples = matched.map((recipe) => ({
    title: recipe.title,
    description: recipe.description,
    prompt: recipe.prompt,
    spec: recipe.spec,
  }));

  try {
    let spec;
    try {
      spec = await generateSpec({
        model: DEFAULT_MODEL,
        prompt: trimmed,
        examples,
      });
    } catch (firstError) {
      console.warn("Spec generation retry after:", firstError);
      spec = await generateSpec({
        model: RETRY_MODEL,
        prompt: trimmed,
        examples,
      });
    }

    const scores = scoreRecipes(trimmed)
      .slice(0, 3)
      .map((entry) => ({ id: entry.recipe.id, score: entry.score }));

    return Response.json({
      spec,
      usedRecipes: matched.map((recipe) => recipe.id),
      matchScores: scores,
    });
  } catch (error) {
    console.error("Build failed:", error);

    const message =
      error instanceof Error && error.message.includes("Unauthenticated")
        ? "AI Gateway is not configured. Add AI_GATEWAY_API_KEY to .env.local."
        : "Generation failed. Please try again.";

    return Response.json({ error: message }, { status: 500 });
  }
}
