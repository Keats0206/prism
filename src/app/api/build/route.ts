import { generateText, Output } from "ai";
import { buildSystemPrompt, specSchema } from "@/prism/generation";
import { selectRecipes } from "@/prism/recipes/retrieve";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  // Retrieve the most relevant curated recipes and inject them as few-shot
  // examples so the generated app starts from approved patterns.
  const examples = selectRecipes(prompt.trim());

  try {
    const { output } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      system: buildSystemPrompt(examples),
      prompt: prompt.trim(),
      output: Output.object({ schema: specSchema }),
    });

    return Response.json({
      spec: output,
      usedRecipes: examples.map((recipe) => recipe.id),
    });
  } catch (error) {
    console.error("Build failed:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
