import { deriveAtoms } from "./spec";
import type { AtomKind, IntentCategory, Recipe, RecipeInput } from "./types";
import { ATOM_KINDS, INTENT_CATEGORIES } from "./types";

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defineRecipe(input: RecipeInput): Recipe {
  if (!ID_PATTERN.test(input.id)) {
    throw new Error(
      `Recipe id "${input.id}" must be kebab-case (e.g. workout-set-block)`,
    );
  }

  if (!INTENT_CATEGORIES.includes(input.intent as IntentCategory)) {
    throw new Error(`Recipe "${input.id}" has invalid intent "${input.intent}"`);
  }

  if (!input.tags.length) {
    throw new Error(`Recipe "${input.id}" needs at least one tag for retrieval`);
  }

  if (!input.atomKinds.length) {
    throw new Error(`Recipe "${input.id}" needs at least one atomKind`);
  }

  for (const kind of input.atomKinds) {
    if (!ATOM_KINDS.includes(kind as AtomKind)) {
      throw new Error(`Recipe "${input.id}" has invalid atomKind "${kind}"`);
    }
  }

  if (!input.spec.root?.trim() || !Object.keys(input.spec.elements).length) {
    throw new Error(`Recipe "${input.id}" spec must include a root and elements`);
  }

  if (!input.spec.elements[input.spec.root]) {
    throw new Error(`Recipe "${input.id}" root "${input.spec.root}" not in elements`);
  }

  return {
    ...input,
    atoms: input.atoms ?? deriveAtoms(input.spec),
  };
}

export function defineCatalog(entries: Recipe[]): Recipe[] {
  const seen = new Set<string>();

  for (const recipe of entries) {
    if (seen.has(recipe.id)) {
      throw new Error(`Duplicate recipe id "${recipe.id}"`);
    }
    seen.add(recipe.id);
  }

  return entries.sort((a, b) => a.title.localeCompare(b.title));
}
