import { recipes, type Recipe } from "./index";

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "for", "with", "of", "to", "in", "on", "my",
  "me", "app", "create", "make", "build", "page", "screen", "that", "this",
  "show", "i", "want", "need", "some", "it", "its",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

// A recipe's searchable bag of words: tags (weighted) + title + prompt +
// component types it uses.
function recipeTerms(recipe: Recipe): Map<string, number> {
  const terms = new Map<string, number>();
  const add = (text: string, weight: number) => {
    for (const word of tokenize(text)) {
      terms.set(word, (terms.get(word) ?? 0) + weight);
    }
  };

  recipe.tags.forEach((tag) => add(tag, 3));
  add(recipe.title, 2);
  add(recipe.prompt, 1);
  Object.values(recipe.spec.elements).forEach((element) => add(element.type, 1));

  return terms;
}

/**
 * Scores curated recipes against the user's prompt by keyword/tag overlap and
 * returns the top `limit`. Falls back to the first `limit` recipes when nothing
 * matches, so the model always gets at least some grounding examples.
 */
export function selectRecipes(prompt: string, limit = 2): Recipe[] {
  const queryWords = new Set(tokenize(prompt));

  const scored = recipes
    .map((recipe) => {
      const terms = recipeTerms(recipe);
      let score = 0;
      for (const word of queryWords) score += terms.get(word) ?? 0;
      return { recipe, score };
    })
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((entry) => entry.score > 0);
  const chosen = (matched.length > 0 ? matched : scored).slice(0, limit);

  return chosen.map((entry) => entry.recipe);
}
