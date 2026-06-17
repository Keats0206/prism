import { generateText, Output } from "ai";
import { z } from "zod";

// Loose schema for a @json-render Spec. Element props vary per component, so
// props/state are kept open and the catalog is described in the system prompt.
const elementSchema = z.object({
  type: z.string().describe("Component name from the catalog, e.g. Screen, Hero, Collection"),
  props: z.record(z.string(), z.unknown()).nullable().optional(),
  children: z.array(z.string()).nullable().optional(),
});

const specSchema = z.object({
  root: z.string().describe("Key of the root element in `elements`"),
  elements: z.record(z.string(), elementSchema),
  state: z.record(z.string(), z.unknown()).nullable().optional(),
});

const SYSTEM = `You generate UI specs for the PRISM renderer. A spec is JSON:
{ "root": "<id>", "elements": { "<id>": { "type": "<Component>", "props": {...}, "children": ["<id>", ...] } } }

Rules:
- Every id referenced in a "children" array MUST exist as a key in "elements".
- The root is usually a "Screen" whose children are the sections of the page.
- Use only the components below, with exactly these props.

Components:
- Screen { maxWidth: "sm"|"md"|"lg" } — page container, holds sections as children.
- ScreenHeader { eyebrow?, title, metaLeft?, metaRight? } — page header.
- Hero { eyebrow, title, subtitle, icon? } — featured summary.
- Stack { title? } — vertical card container; holds children.
- Pill { label, tone: "neutral"|"accent"|"success" } — status chip.
- Copy { text } — paragraph of text.
- Metric { label, value, detail?, tone: "neutral"|"accent"|"success", icon? } — stat card.
- Row { title, subtitle, trailing?, icon? } — list row.
- Action { label, variant: "primary"|"secondary", icon? } — button.
- Progress { label?, value: 0-100, leftLabel?, rightLabel? } — progress bar.
- Field { label, value?, placeholder? } — text input.
- Collection { presentation: "card"|"plain", header: { title, subtitle?, trailing? }, items: [{ cells: [{ kind: "label"|"field"|"toggle"|"text"|"time"|"badge"|"progress", value?, placeholder?, icon?, checked? }] }] } — repeated data rows.
- Board { columns: [{ title, accent?, cards: [{ title, subtitle?, meta?, badge? }] }] } — kanban.
- Gallery { layout?: "grid"|"masonry", tiles: [{ label?, caption?, tone?: "rose"|"amber"|"sky"|"emerald"|"violet"|"stone", src? }] } — moodboard.

icon must be one of: utensils, flame, clock, leaf, star, heart, check, plus, timer, chefHat, droplet, sparkles (omit if unsure — the prop is optional).

Build a polished, content-rich spec for the user's request. Prefer a Screen root with a Hero and 2-4 sections (Stack/Collection/Metric/Row). Return only the spec.`;

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  if (!prompt?.trim()) {
    return Response.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const { output } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      system: SYSTEM,
      prompt: prompt.trim(),
      output: Output.object({ schema: specSchema }),
    });

    return Response.json({ spec: output });
  } catch (error) {
    console.error("Spec generation failed:", error);
    return Response.json({ error: "Generation failed" }, { status: 500 });
  }
}
