import type { Spec } from "@json-render/core";

export const INTENT_CATEGORIES = [
  "communicate",
  "consume",
  "create",
  "transact",
  "navigate",
  "track",
  "belong",
] as const;

export type IntentCategory = (typeof INTENT_CATEGORIES)[number];

export const ATOM_KINDS = [
  "input",
  "decision",
  "action",
  "social",
  "progress",
  "generative",
  "media",
] as const;

export type AtomKind = (typeof ATOM_KINDS)[number];

export type Recipe = {
  id: string;
  intent: IntentCategory;
  title: string;
  description: string;
  /** Example user intent — retrieval context for Prism. */
  prompt: string;
  tags: string[];
  /** Semantic role of atoms in this block (input, progress, etc.). */
  atomKinds: AtomKind[];
  /** Catalog atom types used in this component (auto-derived if omitted). */
  atoms: string[];
  spec: Spec;
};

export type RecipeInput = Omit<Recipe, "atoms"> & { atoms?: string[] };

export type ScoredRecipe = {
  recipe: Recipe;
  score: number;
  matchedTerms: string[];
};
