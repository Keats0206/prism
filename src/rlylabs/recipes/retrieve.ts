import { recipes } from "./catalog";
import type { IntentCategory, Recipe, ScoredRecipe } from "./types";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "with",
  "of",
  "to",
  "in",
  "on",
  "at",
  "my",
  "me",
  "app",
  "create",
  "make",
  "build",
  "page",
  "screen",
  "that",
  "this",
  "show",
  "i",
  "want",
  "need",
  "some",
  "it",
  "its",
  "help",
  "plan",
]);

/** Intent synonyms for lightweight pre-classification and retrieval boost. */
export const INTENT_SYNONYMS: Record<IntentCategory, string[]> = {
  communicate: [
    "communicate",
    "message",
    "text",
    "invite",
    "nudge",
    "coordinate",
    "react",
    "clarify",
    "send",
    "chat",
    "rsvp",
    "friend",
    "group",
  ],
  consume: [
    "consume",
    "watch",
    "read",
    "listen",
    "discover",
    "recommend",
    "feed",
    "mood",
    "taste",
    "swipe",
    "queue",
    "save",
    "browse",
  ],
  create: [
    "create",
    "make",
    "generate",
    "remix",
    "artifact",
    "playlist",
    "flyer",
    "deck",
    "recipe",
    "design",
    "compose",
    "publish",
    "version",
    "draft",
  ],
  transact: [
    "transact",
    "buy",
    "book",
    "reserve",
    "checkout",
    "purchase",
    "deal",
    "compare",
    "option",
    "budget",
    "decision",
    "confidence",
    "order",
  ],
  navigate: [
    "navigate",
    "map",
    "nearby",
    "today",
    "timeline",
    "location",
    "where",
    "go",
    "event",
    "reservation",
    "slot",
    "plan",
    "weather",
  ],
  track: [
    "track",
    "workout",
    "habit",
    "streak",
    "progress",
    "coach",
    "accountability",
    "checkin",
    "check-in",
    "routine",
    "fitness",
    "gym",
    "daily",
    "improve",
    "goal",
    "metric",
  ],
  belong: [
    "belong",
    "identity",
    "recap",
    "badge",
    "share",
    "wrapped",
    "profile",
    "tribe",
    "compare",
    "social",
    "status",
    "signal",
    "personality",
  ],
};

const FIELD_WEIGHTS = {
  tag: 4,
  intent: 5,
  title: 3,
  atomKind: 3,
  atom: 2.5,
  description: 2,
  prompt: 1.5,
  id: 1,
} as const;

const INTENT_BOOST = 2.5;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word));
}

type IndexedRecipe = {
  recipe: Recipe;
  termWeights: Map<string, number>;
};

function buildTermWeights(recipe: Recipe): Map<string, number> {
  const weights = new Map<string, number>();

  const add = (text: string, weight: number) => {
    for (const term of tokenize(text)) {
      weights.set(term, (weights.get(term) ?? 0) + weight);
    }
  };

  recipe.tags.forEach((tag) => add(tag, FIELD_WEIGHTS.tag));
  add(recipe.intent, FIELD_WEIGHTS.intent);
  add(recipe.title, FIELD_WEIGHTS.title);
  add(recipe.description, FIELD_WEIGHTS.description);
  add(recipe.prompt, FIELD_WEIGHTS.prompt);
  add(recipe.id, FIELD_WEIGHTS.id);
  recipe.atoms.forEach((atom) => add(atom, FIELD_WEIGHTS.atom));
  recipe.atomKinds.forEach((kind) => add(kind, FIELD_WEIGHTS.atomKind));

  for (const synonym of INTENT_SYNONYMS[recipe.intent]) {
    add(synonym, FIELD_WEIGHTS.intent * 0.4);
  }

  return weights;
}

function buildIndex(allRecipes: Recipe[]) {
  const entries: IndexedRecipe[] = allRecipes.map((recipe) => ({
    recipe,
    termWeights: buildTermWeights(recipe),
  }));

  const documentFrequency = new Map<string, number>();

  for (const entry of entries) {
    for (const term of entry.termWeights.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  return {
    entries,
    documentFrequency,
    totalDocuments: allRecipes.length,
  };
}

export const recipeIndex = buildIndex(recipes);

function idf(term: string): number {
  const df = recipeIndex.documentFrequency.get(term) ?? 0;
  if (df === 0) return 0;
  return Math.log(1 + (recipeIndex.totalDocuments + 1) / (df + 1));
}

/** Lightweight intent classification from prompt keywords. */
export function classifyIntent(prompt: string): IntentCategory | null {
  const queryTerms = new Set(tokenize(prompt));
  let best: IntentCategory | null = null;
  let bestScore = 0;

  for (const [intent, synonyms] of Object.entries(INTENT_SYNONYMS) as [
    IntentCategory,
    string[],
  ][]) {
    let score = 0;
    for (const synonym of synonyms) {
      if (queryTerms.has(synonym)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return bestScore >= 1 ? best : null;
}

function scorePromptAgainstRecipe(
  prompt: string,
  entry: IndexedRecipe,
): ScoredRecipe {
  const queryTerms = tokenize(prompt);
  const matchedTerms: string[] = [];
  let score = 0;

  for (const term of queryTerms) {
    const tf = entry.termWeights.get(term);
    if (!tf) continue;

    matchedTerms.push(term);
    score += tf * idf(term);
  }

  const tagSet = new Set(entry.recipe.tags.map((tag) => tag.toLowerCase()));
  for (const term of queryTerms) {
    if (tagSet.has(term)) score += FIELD_WEIGHTS.tag * 0.5;
  }

  const classified = classifyIntent(prompt);
  if (classified && classified === entry.recipe.intent) {
    score += INTENT_BOOST;
    matchedTerms.push(`intent:${classified}`);
  }

  return {
    recipe: entry.recipe,
    score,
    matchedTerms,
  };
}

/** Score all recipes against a query — used by the library UI and Prism. */
export function scoreRecipes(
  prompt: string,
  subset: Recipe[] = recipes,
): ScoredRecipe[] {
  const allowed = new Set(subset.map((recipe) => recipe.id));

  return recipeIndex.entries
    .filter((entry) => allowed.has(entry.recipe.id))
    .map((entry) => scorePromptAgainstRecipe(prompt, entry))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

/** Top matches for Prism few-shot injection. Returns nothing if nothing relevant. */
export function selectRecipes(
  prompt: string,
  options: { limit?: number; minScore?: number } = {},
): Recipe[] {
  const { limit = 3, minScore = 1.25 } = options;

  return scoreRecipes(prompt)
    .filter((entry) => entry.score >= minScore)
    .slice(0, limit)
    .map((entry) => entry.recipe);
}

/** Client-side library search across metadata fields. */
export function filterRecipes(options: {
  query?: string;
  intent?: string | null;
  atomKind?: string | null;
  atom?: string | null;
}): Recipe[] {
  const { query = "", intent = null, atomKind = null, atom = null } = options;
  let list = recipes;

  if (intent) {
    list = list.filter((recipe) => recipe.intent === intent);
  }

  if (atomKind) {
    list = list.filter((recipe) => recipe.atomKinds.includes(atomKind as Recipe["atomKinds"][number]));
  }

  if (atom) {
    list = list.filter((recipe) => recipe.atoms.includes(atom));
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return [...list].sort((a, b) => a.title.localeCompare(b.title));
  }

  const lower = trimmed.toLowerCase();
  const direct = list.filter((recipe) => {
    if (recipe.id.includes(lower)) return true;
    if (recipe.title.toLowerCase().includes(lower)) return true;
    if (recipe.description.toLowerCase().includes(lower)) return true;
    if (recipe.prompt.toLowerCase().includes(lower)) return true;
    if (recipe.intent.includes(lower)) return true;
    if (recipe.tags.some((tag) => tag.includes(lower))) return true;
    if (recipe.atoms.some((type) => type.toLowerCase().includes(lower))) return true;
    if (recipe.atomKinds.some((kind) => kind.includes(lower))) return true;
    return false;
  });

  if (direct.length > 0) {
    return direct.sort((a, b) => a.title.localeCompare(b.title));
  }

  const scored = scoreRecipes(trimmed, list);
  return scored.map((entry) => entry.recipe);
}

export function recipeStats() {
  const byIntent = new Map<string, number>();
  const byAtomKind = new Map<string, number>();
  const atoms = new Set<string>();

  for (const recipe of recipes) {
    byIntent.set(recipe.intent, (byIntent.get(recipe.intent) ?? 0) + 1);
    for (const kind of recipe.atomKinds) {
      byAtomKind.set(kind, (byAtomKind.get(kind) ?? 0) + 1);
    }
    recipe.atoms.forEach((atom) => atoms.add(atom));
  }

  return {
    total: recipes.length,
    intents: byIntent,
    atomKinds: byAtomKind,
    atoms: [...atoms].sort(),
  };
}
