import type { Spec } from "@json-render/core";
import type { Example } from "./types";
import { workout } from "./workout";

export type { Example } from "./types";

export type ExampleGroup = {
  title: string;
  examples: Example[];
};

// Register new specs here — add the file under specs/ and drop it into a group.
export const exampleGroups: ExampleGroup[] = [
  { title: "Help me follow through", examples: [workout] },
];

// Flat list derived from the groups.
export const examples: Example[] = exampleGroups.flatMap(
  (group) => group.examples,
);

export function buildPromptSpec(prompt: string): Spec {
  return {
    root: "prompt-card",
    elements: {
      "prompt-card": {
        type: "Stack",
        props: { title: "Prompt Result" },
        children: ["prompt-pill", "prompt-copy"],
      },
      "prompt-pill": {
        type: "Pill",
        props: { label: "Generated", tone: "neutral" },
      },
      "prompt-copy": {
        type: "Copy",
        props: { text: `Input captured: ${prompt}` },
      },
    },
  };
}

function collectDescendants(spec: Spec, id: string, out: Spec["elements"]) {
  const el = spec.elements[id];
  if (!el) return;
  out[id] = el;
  const kids = "children" in el ? el.children ?? [] : [];
  for (const kid of kids) collectDescendants(spec, kid, out);
}

export function visibleSpec(spec: Spec, count: number): Spec {
  const root = spec.root;
  const rootElement = spec.elements[root];
  const children =
    rootElement && "children" in rootElement
      ? rootElement.children ?? []
      : [];
  const visibleChildren = children.slice(0, count);
  const elements: Spec["elements"] = {
    [root]: { ...rootElement, children: visibleChildren },
  };

  for (const childId of visibleChildren) {
    collectDescendants(spec, childId, elements);
  }

  return { ...spec, elements };
}
