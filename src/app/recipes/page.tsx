"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { JSONUIProvider, Renderer } from "@json-render/react";
import {
  ATOM_KINDS,
  INTENT_CATEGORIES,
  filterRecipes,
  isCompoundSpec,
  listPieceIds,
  pieceLabel,
  pieceSpec,
  recipeStats,
  recipes,
  scoreRecipes,
  type AtomKind,
  type IntentCategory,
  type Recipe,
} from "@/rlylabs/recipes";
import { registry } from "@/rlylabs/registry";
import { PrismTheme } from "@/rlylabs/PrismTheme";

const stats = recipeStats();

const INTENT_LABELS: Record<IntentCategory, string> = {
  communicate: "Communicate",
  consume: "Consume",
  create: "Create",
  transact: "Transact",
  navigate: "Navigate",
  track: "Track",
  belong: "Belong",
};

const ATOM_KIND_LABELS: Record<AtomKind, string> = {
  input: "Input",
  decision: "Decision",
  action: "Action",
  social: "Social",
  progress: "Progress",
  generative: "Generative",
  media: "Media",
};

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [intent, setIntent] = useState<string | null>(null);
  const [atomKind, setAtomKind] = useState<string | null>(null);
  const [atom, setAtom] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState(recipes[0]?.id ?? "");
  const [showSpec, setShowSpec] = useState(false);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () => filterRecipes({ query, intent, atomKind, atom }),
    [query, intent, atomKind, atom],
  );

  const selected =
    filtered.find((recipe) => recipe.id === selectedId) ??
    recipes.find((recipe) => recipe.id === selectedId) ??
    filtered[0] ??
    null;

  const matchPreview = useMemo(() => {
    if (!query.trim() || !selected) return null;
    return scoreRecipes(query).find((entry) => entry.recipe.id === selected.id);
  }, [query, selected]);

  async function copyRecipe(recipe: Recipe) {
    await navigator.clipboard.writeText(JSON.stringify(recipe, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const pieceIds = selected ? listPieceIds(selected.spec) : [];
  const compound = selected ? isCompoundSpec(selected.spec) : false;

  return (
    <main className="flex h-screen flex-col bg-stone-100 text-zinc-950">
      <header className="shrink-0 border-b border-black/5 px-6 py-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold tracking-tight">Recipes</h1>
              <span className="rounded-full bg-zinc-950 px-2 py-0.5 text-[10px] font-medium text-white">
                {stats.total}
              </span>
            </div>
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              Intent-native blocks for Prism · one file per recipe in{" "}
              <code className="text-zinc-600">src/rlylabs/recipes/items/</code>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/prism"
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition hover:text-zinc-950"
            >
              Prism →
            </Link>
          </div>
        </div>
      </header>

      {recipes.length === 0 ? (
        <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h2 className="text-lg font-medium text-zinc-800">No recipes yet</h2>
          <p className="mt-2 max-w-md text-sm text-zinc-500">
            Create a file under{" "}
            <code className="rounded bg-white px-1.5 py-0.5 text-xs">
              src/rlylabs/recipes/items/&lt;intent&gt;/your-recipe.ts
            </code>{" "}
            and register it in <code className="rounded bg-white px-1.5 py-0.5 text-xs">catalog.ts</code>.
          </p>
        </section>
      ) : (
        <div className="mx-auto grid min-h-0 w-full max-w-[1400px] flex-1 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col border-b border-black/5 lg:border-b-0 lg:border-r">
            <div className="shrink-0 space-y-3 border-b border-black/5 p-4">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, tags, atoms…"
                className="h-10 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-black/20"
              />

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setIntent(null)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                    intent === null
                      ? "bg-zinc-950 text-white"
                      : "bg-white text-zinc-500 ring-1 ring-black/10 hover:text-zinc-900"
                  }`}
                >
                  All
                </button>
                {INTENT_CATEGORIES.filter((key) => stats.intents.has(key)).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setIntent((current) => (current === key ? null : key))
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                        intent === key
                          ? "bg-zinc-950 text-white"
                          : "bg-white text-zinc-500 ring-1 ring-black/10 hover:text-zinc-900"
                      }`}
                    >
                      {INTENT_LABELS[key]}
                      <span className="ml-1 opacity-60">{stats.intents.get(key)}</span>
                    </button>
                  ),
                )}
              </div>

              {stats.atomKinds.size > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ATOM_KINDS.filter((key) => stats.atomKinds.has(key)).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          setAtomKind((current) => (current === key ? null : key))
                        }
                        className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition ${
                          atomKind === key
                            ? "bg-stone-200 text-zinc-900"
                            : "bg-white text-zinc-400 ring-1 ring-black/10 hover:text-zinc-700"
                        }`}
                      >
                        {ATOM_KIND_LABELS[key]}
                      </button>
                    ),
                  )}
                </div>
              ) : null}

              {stats.atoms.length > 1 ? (
                <select
                  value={atom ?? ""}
                  onChange={(event) => setAtom(event.target.value || null)}
                  className="h-9 w-full rounded-xl border border-black/10 bg-white px-3 text-xs text-zinc-700 outline-none"
                >
                  <option value="">All atoms</option>
                  {stats.atoms.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : null}

              <p className="text-[11px] text-zinc-400">
                Showing {filtered.length} of {stats.total}
              </p>
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-zinc-400">
                  No matches
                </li>
              ) : (
                filtered.map((recipe) => {
                  const active = recipe.id === selected?.id;

                  return (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(recipe.id)}
                        className={`mb-1 w-full rounded-xl px-3 py-2.5 text-left transition ${
                          active ? "bg-white shadow-sm ring-1 ring-black/10" : "hover:bg-white/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug text-zinc-900">
                            {recipe.title}
                          </p>
                          <span className="shrink-0 rounded-md bg-stone-100 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-zinc-500">
                            {recipe.intent}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-zinc-400">
                          {recipe.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {recipe.atoms.slice(0, 4).map((type) => (
                            <span
                              key={type}
                              className="font-mono text-[9px] text-zinc-400"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </aside>

          {selected ? (
            <section className="min-h-0 overflow-y-auto p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold tracking-tight">
                      {selected.title}
                    </h2>
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {selected.intent}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">{selected.description}</p>
                  <p className="mt-1 font-mono text-[11px] text-zinc-400">{selected.id}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSpec((value) => !value)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:text-zinc-950"
                  >
                    {showSpec ? "Hide spec" : "View spec"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void copyRecipe(selected)}
                    className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[11px] font-medium text-zinc-600 transition hover:text-zinc-950"
                  >
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              {matchPreview ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Search relevance{" "}
                  <span className="font-medium text-zinc-700">
                    {matchPreview.score.toFixed(2)}
                  </span>
                  {matchPreview.matchedTerms.length > 0 ? (
                    <>
                      {" "}
                      · matched{" "}
                      {matchPreview.matchedTerms.slice(0, 6).join(", ")}
                    </>
                  ) : null}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <MetaBlock label="Retrieval tags">
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </MetaBlock>
                <MetaBlock label="Example prompt">
                  <p className="text-sm leading-relaxed text-zinc-700">{selected.prompt}</p>
                </MetaBlock>
                <MetaBlock label="Atom kinds">
                  <p className="text-sm text-zinc-700">
                    {selected.atomKinds.map((kind) => ATOM_KIND_LABELS[kind]).join(" · ")}
                  </p>
                </MetaBlock>
                <MetaBlock label="Catalog atoms">
                  <p className="font-mono text-sm text-zinc-700">
                    {selected.atoms.join(" · ")}
                  </p>
                </MetaBlock>
                <MetaBlock label="Prism retrieval">
                  <p className="text-sm leading-relaxed text-zinc-600">
                    Injected as a few-shot component pattern when user prompts
                    score ≥ 1.25 on shared keywords or intent match.
                  </p>
                </MetaBlock>
              </div>

              {showSpec ? (
                <pre className="mt-4 max-h-64 overflow-auto rounded-2xl border border-black/10 bg-zinc-950 p-4 text-[11px] leading-5 text-zinc-300">
                  {JSON.stringify(selected, null, 2)}
                </pre>
              ) : null}

              <div className="mt-6">
                <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-400">
                  Preview
                </p>

                {compound ? (
                  <div className="flex flex-col gap-3">
                    {pieceIds.map((pieceId) => (
                      <PreviewCard
                        key={pieceId}
                        label={pieceLabel(selected.spec, pieceId)}
                        type={selected.spec.elements[pieceId]?.type ?? "Unknown"}
                        recipeKey={`${selected.id}-${pieceId}`}
                        spec={pieceSpec(selected, pieceId)}
                        state={selected.spec.state ?? {}}
                      />
                    ))}
                  </div>
                ) : (
                  <PreviewCard
                    label={selected.title}
                    type={selected.atoms.join(", ")}
                    recipeKey={selected.id}
                    spec={selected.spec}
                    state={selected.spec.state ?? {}}
                  />
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PreviewCard({
  label,
  type,
  recipeKey,
  spec,
  state,
}: {
  label: string;
  type: string;
  recipeKey: string;
  spec: Recipe["spec"];
  state: Record<string, unknown>;
}) {
  return (
    <article className="overflow-hidden rounded-[20px] border border-black/10 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-2">
        <p className="text-sm font-medium text-zinc-800">{label}</p>
        <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[10px] text-zinc-600">
          {type}
        </span>
      </div>
      <div className="p-4">
        <PrismTheme>
          <JSONUIProvider key={recipeKey} registry={registry} initialState={state}>
            <Renderer spec={spec} registry={registry} />
          </JSONUIProvider>
        </PrismTheme>
      </div>
    </article>
  );
}
