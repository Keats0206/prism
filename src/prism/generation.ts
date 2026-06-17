import { z } from "zod";
import type { Spec } from "@json-render/core";
import { iconNames } from "./icons";

// Loose schema for a @json-render Spec. Element props vary per component, so
// props/state are kept open and the catalog is described in the prompt below.
const elementSchema = z.object({
  type: z
    .string()
    .describe("Component name from the catalog, e.g. Screen, Hero, Collection"),
  props: z.record(z.string(), z.unknown()).nullable().optional(),
  children: z.array(z.string()).nullable().optional(),
});

export const specSchema = z.object({
  root: z.string().describe("Key of the root element in `elements`"),
  elements: z.record(z.string(), elementSchema),
  state: z.record(z.string(), z.unknown()).nullable().optional(),
});

// Describes the component catalog the model must build specs from. Keep this in
// sync with src/prism/registry.tsx.
export const CATALOG_GUIDE = `You generate UI specs for the PRISM renderer. A spec is JSON:
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

Any "icon" prop MUST be one of: ${iconNames.join(", ")}. Omit the prop if none fit.

Build a polished, content-rich spec for the user's request. Prefer a Screen root with a Hero or ScreenHeader and 2-4 sections. Return only the spec.`;

export type SpecExample = {
  title: string;
  prompt: string;
  spec: Spec;
};

// Builds the system prompt, optionally injecting curated specs as few-shot
// examples so the model has good, hand-approved patterns to start from.
export function buildSystemPrompt(examples: SpecExample[] = []): string {
  if (examples.length === 0) return CATALOG_GUIDE;

  const blocks = examples
    .map(
      (example) =>
        `### ${example.title}\nRequest: ${example.prompt}\nSpec:\n${JSON.stringify(example.spec)}`,
    )
    .join("\n\n");

  return `${CATALOG_GUIDE}

Below are approved example specs. Study their structure, density, and prop usage, then build something original for the user's request — reuse the patterns, do not copy the content verbatim.

${blocks}`;
}
