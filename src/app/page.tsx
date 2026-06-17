"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/prism/registry";
import { recipes } from "@/prism/recipes";
import { visibleSpec } from "@/prism/specs";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [activeSpec, setActiveSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  // Reveals a spec's sections one at a time for a generated-in feel.
  function streamSpec(spec: Spec) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    const rootElement = spec.elements[spec.root];
    const children = "children" in rootElement ? rootElement.children ?? [] : [];
    let count = 0;

    setActiveSpec(visibleSpec(spec, count));

    streamTimerRef.current = setInterval(() => {
      count += 1;
      setActiveSpec(visibleSpec(spec, count));

      if (count >= children.length) {
        if (streamTimerRef.current) clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }, 200);
  }

  function goHome() {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setActiveSpec(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      track("app_built", { prompt: trimmed });
      streamSpec(data.spec as Spec);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <div className="fixed right-4 top-4 z-10">
        <Link
          href="/recipes"
          className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition hover:text-zinc-950"
        >
          Recipes →
        </Link>
      </div>

      {activeSpec ? (
        <>
          <div className="fixed left-4 top-4 z-10">
            <button
              type="button"
              onClick={goHome}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition hover:text-zinc-950"
            >
              ← New app
            </button>
          </div>
          <section className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 pb-40 pt-20">
            <JSONUIProvider
              key={activeSpec.root}
              registry={registry}
              initialState={activeSpec.state ?? {}}
            >
              <Renderer spec={activeSpec} registry={registry} />
            </JSONUIProvider>
          </section>
        </>
      ) : (
        <section className="mx-auto w-full max-w-3xl px-6 pb-48 pt-20">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Prism
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Describe an app below and Prism builds it from your recipe
              library, or tap a recipe to render it.
            </p>
          </header>

          <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Recipes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => {
                  track("recipe_opened", { recipe: recipe.id });
                  streamSpec(recipe.spec);
                }}
                className="flex flex-col rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:border-black/20 hover:shadow-md"
              >
                <span className="text-sm font-semibold text-zinc-900">
                  {recipe.title}
                </span>
                <span className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                  {recipe.prompt}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 px-4 pb-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl flex-col gap-2"
        >
          {error ? <p className="px-3 text-xs text-rose-600">{error}</p> : null}
          <div className="flex items-center gap-3 rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the app you want to build…"
              className="h-12 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Building…" : "Build"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
