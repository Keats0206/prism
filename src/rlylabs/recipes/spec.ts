import type { Spec } from "@json-render/core";
import type { Recipe } from "./types";

export function deriveAtoms(spec: Spec): string[] {
  const types = new Set<string>();
  for (const element of Object.values(spec.elements)) {
    types.add(element.type);
  }
  return [...types].sort();
}

export function isCompoundSpec(spec: Spec): boolean {
  return Object.keys(spec.elements).length > 1;
}

export function pieceLabel(spec: Spec, id: string): string {
  const element = spec.elements[id];
  if (!element) return id;

  const props = element.props as Record<string, unknown> | undefined;
  if (typeof props?.title === "string" && props.title.trim()) {
    return props.title;
  }

  const header = props?.header;
  if (header && typeof header === "object" && "title" in header) {
    const title = (header as { title?: unknown }).title;
    if (typeof title === "string" && title.trim()) return title;
  }

  return element.type;
}

export function listPieceIds(spec: Spec): string[] {
  const root = spec.elements[spec.root];
  const childIds =
    root && "children" in root && Array.isArray(root.children)
      ? root.children
      : [spec.root];

  return childIds.filter((id) => spec.elements[id]);
}

function collectDescendants(spec: Spec, rootId: string): string[] {
  const ids: string[] = [];

  function visit(id: string) {
    if (ids.includes(id)) return;
    ids.push(id);
    const element = spec.elements[id];
    if (element && "children" in element && Array.isArray(element.children)) {
      element.children.forEach(visit);
    }
  }

  visit(rootId);
  return ids;
}

export function pieceSpec(recipe: Recipe, pieceId: string): Spec {
  const ids = collectDescendants(recipe.spec, pieceId);
  const elements: Spec["elements"] = {};

  for (const id of ids) {
    elements[id] = recipe.spec.elements[id];
  }

  return {
    root: pieceId,
    elements,
    state: recipe.spec.state,
  };
}
