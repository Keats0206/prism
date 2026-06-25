import type { Spec } from "@json-render/core";

/**
 * Parsing/normalization for jukebox specs. Permissive on purpose: it keeps any
 * known component (primitives + capability), preserves interactivity metadata
 * (on/visible/repeat/watch) so creative state-driven layouts survive, infers a
 * root if needed, and tolerates a truncated trailing object.
 */

const KNOWN_TYPES = new Set([
  // primitives
  "Screen",
  "Box",
  "Stack",
  "Grid",
  "Text",
  "Image",
  "Marquee",
  // capability
  "JukeboxHeader",
  "TrackList",
  "PlaylistShelf",
  "NowPlaying",
  "PlayButton",
]);

function repairJson(text: string): string {
  return text.replace(/,(\s*[}\]])/g, "$1");
}

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json|spec)?\s*\n?([\s\S]*?)```/);
  if (fenced?.[1]) return repairJson(fenced[1].trim());
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) return repairJson(trimmed.slice(start, end + 1));
  return repairJson(trimmed);
}

type RawElement = {
  type?: unknown;
  props?: unknown;
  children?: unknown;
  on?: unknown;
  visible?: unknown;
  repeat?: unknown;
  watch?: unknown;
};

function sanitizeElement(value: unknown): Spec["elements"][string] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as RawElement;

  const type = typeof raw.type === "string" ? raw.type : "";
  if (!KNOWN_TYPES.has(type)) return null;

  const props =
    raw.props && typeof raw.props === "object" && !Array.isArray(raw.props)
      ? (raw.props as Record<string, unknown>)
      : {};
  const children = Array.isArray(raw.children)
    ? raw.children.filter((c): c is string => typeof c === "string")
    : undefined;

  const element = { type, props, children } as Spec["elements"][string];

  // Preserve interactivity metadata (resolved by the json-render runtime).
  const el = element as Record<string, unknown>;
  if (raw.on && typeof raw.on === "object" && !Array.isArray(raw.on)) el.on = raw.on;
  if (raw.visible != null) el.visible = raw.visible;
  if (raw.repeat && typeof raw.repeat === "object") el.repeat = raw.repeat;
  if (raw.watch && typeof raw.watch === "object") el.watch = raw.watch;

  return element;
}

function buildSpec(raw: unknown): Spec {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Spec must be a JSON object");
  }
  const candidate = raw as { root?: unknown; elements?: unknown; state?: unknown };

  const elements: Spec["elements"] = {};
  if (candidate.elements && typeof candidate.elements === "object") {
    for (const [id, el] of Object.entries(candidate.elements as Record<string, unknown>)) {
      const sanitized = sanitizeElement(el);
      if (sanitized) elements[id] = sanitized;
    }
  }
  if (Object.keys(elements).length === 0) {
    throw new Error("Spec has no renderable elements");
  }

  // Drop child references to elements that didn't survive sanitization.
  for (const [id, el] of Object.entries(elements)) {
    if (Array.isArray(el.children)) {
      elements[id] = { ...el, children: el.children.filter((c) => c in elements) };
    }
  }

  // Resolve the root: use the declared one, else an element no one references, else first.
  let root = typeof candidate.root === "string" ? candidate.root : "";
  if (!elements[root]) {
    const referenced = new Set(
      Object.values(elements).flatMap((el) =>
        Array.isArray(el.children) ? el.children : [],
      ),
    );
    root =
      Object.keys(elements).find((id) => !referenced.has(id)) ??
      Object.keys(elements)[0];
  }

  const state =
    candidate.state && typeof candidate.state === "object" && !Array.isArray(candidate.state)
      ? (candidate.state as Record<string, unknown>)
      : undefined;

  return { root, elements, ...(state ? { state } : {}) } as Spec;
}

export function parseJukeboxSpec(text: string): Spec {
  const json = extractJsonText(text);
  try {
    return buildSpec(JSON.parse(json));
  } catch {
    // Tolerate a truncated trailing object by closing braces progressively.
    let suffix = "";
    for (let i = 0; i < 10; i += 1) {
      try {
        return buildSpec(JSON.parse(repairJson(json + suffix)));
      } catch {
        suffix += "}";
      }
    }
    throw new Error("Could not parse a valid spec");
  }
}
