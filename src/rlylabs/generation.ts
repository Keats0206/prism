import { generateText, streamText, type ModelMessage } from "ai";
import { z } from "zod";
import type { Spec } from "@json-render/core";
import { buildCatalogGuide } from "./catalog-guide";
import { iconNames, type IconName } from "./icons";
import type { GradientTone } from "./theme";

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

export function repairJson(text: string): string {
  return text.replace(/,(\s*[}\]])/g, "$1");
}

export function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json|spec)?\s*\n?([\s\S]*?)```/);
  if (fenced?.[1]) return repairJson(fenced[1].trim());

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return repairJson(trimmed.slice(start, end + 1));
  }

  return repairJson(trimmed);
}

const iconNameSet = new Set<string>(iconNames);

function sanitizeIcon(value: unknown): IconName | undefined {
  if (typeof value !== "string") return undefined;
  return iconNameSet.has(value) ? (value as IconName) : undefined;
}

function sanitizeProps(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const props = { ...(value as Record<string, unknown>) };
  if ("icon" in props) {
    const icon = sanitizeIcon(props.icon);
    if (icon) props.icon = icon;
    else delete props.icon;
  }

  return Object.keys(props).length > 0 ? props : undefined;
}

function sanitizeElementType(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "Copy";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sanitizeElement(value: unknown): Spec["elements"][string] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const raw = value as Record<string, unknown>;
  const children = Array.isArray(raw.children)
    ? raw.children.filter((child): child is string => typeof child === "string")
    : undefined;

  return {
    type: sanitizeElementType(raw.type),
    props: sanitizeProps(raw.props) ?? {},
    children,
  };
}

function sanitizeSpec(raw: unknown, prompt?: string): Spec {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Spec must be a JSON object");
  }

  const candidate = raw as Record<string, unknown>;
  const elements: Spec["elements"] = {};

  if (candidate.elements && typeof candidate.elements === "object") {
    for (const [id, element] of Object.entries(
      candidate.elements as Record<string, unknown>,
    )) {
      const sanitized = sanitizeElement(element);
      if (sanitized) elements[id] = sanitized;
    }
  }

  const root = typeof candidate.root === "string" ? candidate.root : "";
  const state =
    candidate.state &&
    typeof candidate.state === "object" &&
    !Array.isArray(candidate.state)
      ? (candidate.state as Record<string, unknown>)
      : undefined;

  return normalizeSpec({ root, elements, state }, prompt);
}

const APP_HEADER_TYPES = new Set(["FullscreenHero", "Hero", "ScreenHeader"]);

function readStringProp(
  props: Record<string, unknown> | undefined,
  key: string,
): string | undefined {
  const value = props?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function titleFromPrompt(prompt: string): string {
  let text = prompt.trim();
  text = text.replace(
    /^(help me|show me|i need to|i need a|i need|create|make|build|plan|track|design)\s+/i,
    "",
  );
  text = text.replace(/\?$/, "").trim();
  if (!text) return "Your app";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function toneFromPrompt(prompt: string): GradientTone {
  const text = prompt.toLowerCase();
  if (/(trip|travel|flight|weekend|vacation|map|city)/.test(text)) return "sky";
  if (/(workout|gym|chest|run|fitness|habit|streak)/.test(text)) {
    return "emerald";
  }
  if (/(date|love|romantic|dinner)/.test(text)) return "rose";
  if (/(food|grocery|recipe|cook|meal)/.test(text)) return "amber";
  if (/(music|playlist|track|listen|album)/.test(text)) return "violet";
  return "stone";
}

function fullscreenHeroPropsFromElement(
  element: Spec["elements"][string],
): Record<string, unknown> {
  const props = (element.props ?? {}) as Record<string, unknown>;

  if (element.type === "Hero") {
    return {
      eyebrow: readStringProp(props, "eyebrow"),
      title: readStringProp(props, "title") ?? "Your app",
      subtitle: readStringProp(props, "subtitle"),
      tone: props.tone ?? "violet",
      aspect: "square",
    };
  }

  if (element.type === "ScreenHeader") {
    const meta = [readStringProp(props, "metaLeft"), readStringProp(props, "metaRight")]
      .filter(Boolean)
      .join(" · ");

    return {
      eyebrow: readStringProp(props, "eyebrow"),
      title: readStringProp(props, "title") ?? "Your app",
      subtitle: meta || undefined,
      tone: "stone",
      aspect: "square",
    };
  }

  return props;
}

function uniqueElementId(elements: Spec["elements"], base: string): string {
  if (!elements[base]) return base;

  let index = 2;
  while (elements[`${base}-${index}`]) index += 1;
  return `${base}-${index}`;
}

export function ensurePlaylistHeader(spec: Spec, prompt?: string): Spec {
  const rootElement = spec.elements[spec.root];
  if (!rootElement || rootElement.type !== "Screen") return spec;

  const children = rootElement.children ?? [];
  const firstId = children[0];
  const firstElement = firstId ? spec.elements[firstId] : undefined;
  const elements = { ...spec.elements };

  if (firstElement?.type === "FullscreenHero") {
    return spec;
  }

  if (firstElement && APP_HEADER_TYPES.has(firstElement.type)) {
    elements[firstId] = {
      type: "FullscreenHero",
      props: fullscreenHeroPropsFromElement(firstElement),
    };
    return { ...spec, elements };
  }

  const heroId = uniqueElementId(elements, "header");
  elements[heroId] = {
    type: "FullscreenHero",
    props: {
      eyebrow: "App",
      title: prompt ? titleFromPrompt(prompt) : "Your app",
      subtitle: prompt ? "Built for your request" : undefined,
      tone: prompt ? toneFromPrompt(prompt) : "stone",
      aspect: "square",
    },
  };

  elements[spec.root] = {
    ...rootElement,
    children: [heroId, ...children],
  };

  return { ...spec, elements };
}

export function normalizeSpec(spec: Spec, prompt?: string): Spec {
  if (!spec.root?.trim() || Object.keys(spec.elements).length === 0) {
    throw new Error("Spec must include a root and at least one element");
  }

  const elements = { ...spec.elements };
  for (const [id, element] of Object.entries(elements)) {
    if ("children" in element && Array.isArray(element.children)) {
      elements[id] = {
        ...element,
        children: element.children.filter((child) => child in elements),
      };
    }
  }

  let root = spec.root;
  if (!elements[root]) {
    const allChildren = new Set(
      Object.values(elements).flatMap((element) =>
        "children" in element && Array.isArray(element.children)
          ? element.children
          : [],
      ),
    );
    const unreferenced = Object.keys(elements).filter(
      (key) => !allChildren.has(key),
    );
    const inferred =
      unreferenced.find((key) => elements[key]?.type === "Screen") ??
      unreferenced[0] ??
      Object.keys(elements)[0];

    if (inferred) root = inferred;
  }

  if (!elements[root]) {
    throw new Error(`Root element "${root}" not found in spec`);
  }

  return ensurePlaylistHeader({ ...spec, root, elements }, prompt);
}

export function parseSpecText(text: string, prompt?: string): Spec {
  return sanitizeSpec(JSON.parse(extractJsonText(text)), prompt);
}

export function tryParseSpecText(text: string): Spec | null {
  try {
    return parseSpecText(text);
  } catch {
    const extracted = extractJsonText(text);
    let suffix = "";

    for (let index = 0; index < 8; index += 1) {
      try {
        return sanitizeSpec(JSON.parse(repairJson(extracted + suffix)));
      } catch {
        suffix += "}";
      }
    }

    return null;
  }
}

const GENERATION_INSTRUCTIONS = `Return ONLY one valid JSON object for the spec format above.
Do not wrap the JSON in markdown fences or add commentary.`;

// Describes the component catalog the model must build specs from. Generated from
// registry component names — see src/rlylabs/catalog-guide.ts.
export const CATALOG_GUIDE = buildCatalogGuide();

export type SpecExample = {
  title: string;
  description?: string;
  prompt: string;
  spec: Spec;
};

// Builds the system prompt, optionally injecting curated component patterns as
// few-shot references so the model assembles better specs from catalog atoms.
export function buildSystemPrompt(examples: SpecExample[] = []): string {
  if (examples.length === 0) {
    return `${CATALOG_GUIDE}\n\n${GENERATION_INSTRUCTIONS}`;
  }

  const blocks = examples
    .map(
      (example) =>
        `### ${example.title}${example.description ? `\nComponent: ${example.description}` : ""}\nUse when: ${example.prompt}\nSpec:\n${JSON.stringify(example.spec)}`,
    )
    .join("\n\n");

  return `${CATALOG_GUIDE}

Below are approved component patterns — composed blocks built from the catalog above, not full apps. Study their prop shapes, density, and composition. Reuse these patterns where they fit the user's request, then assemble an original full spec. Do not copy example content verbatim.

${blocks}

${GENERATION_INSTRUCTIONS}`;
}

export async function generateSpec(options: {
  model: string;
  prompt: string;
  examples?: SpecExample[];
}): Promise<Spec> {
  const { text } = await generateText({
    model: options.model,
    system: buildSystemPrompt(options.examples ?? []),
    prompt: options.prompt,
    maxOutputTokens: 4096,
  });

  return parseSpecText(text, options.prompt);
}

export function streamSpecText(options: {
  model: string;
  prompt?: string;
  messages?: ModelMessage[];
}) {
  return streamText({
    model: options.model,
    system: buildSystemPrompt(),
    ...(options.messages
      ? { messages: options.messages }
      : { prompt: options.prompt ?? "" }),
    maxOutputTokens: 4096,
  });
}
