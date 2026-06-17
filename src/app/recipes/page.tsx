"use client";

import { useState } from "react";
import Link from "next/link";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/prism/registry";

const SAVED_KEY = "prism.recipes.saved";

export default function RecipesPage() {
  const [prompt, setPrompt] = useState("");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setSpec(data.spec as Spec);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!spec) return;
    const existing = JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
    existing.push({ prompt, spec, savedAt: new Date().toISOString() });
    localStorage.setItem(SAVED_KEY, JSON.stringify(existing));
    setSaved(true);
  }

  return (
    <main className="flex min-h-screen flex-col bg-stone-50 text-zinc-950">
      <div className="flex items-center justify-between px-6 pt-5">
        <Link
          href="/"
          className="text-[11px] font-medium text-zinc-500 transition hover:text-zinc-950"
        >
          ← Home
        </Link>
        <button
          type="button"
          onClick={handleSave}
          disabled={!spec}
          className="rounded-full bg-zinc-950 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-30"
        >
          {saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 px-6 pb-40 pt-6 lg:grid-cols-2">
        {/* JSON spec column */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="border-b border-black/5 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            JSON Spec
          </div>
          <pre className="flex-1 overflow-auto p-4 text-[11px] leading-5 text-zinc-700">
            {spec
              ? JSON.stringify(spec, null, 2)
              : "// Describe a recipe app below to generate its spec."}
          </pre>
        </div>

        {/* Visual output column */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-black/10 bg-stone-50 shadow-sm">
          <div className="border-b border-black/5 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Preview
          </div>
          <div className="flex-1 overflow-auto p-4">
            {spec ? (
              <JSONUIProvider
                key={spec.root}
                registry={registry}
                initialState={spec.state ?? {}}
              >
                <Renderer spec={spec} registry={registry} />
              </JSONUIProvider>
            ) : (
              <p className="text-sm text-zinc-400">Preview appears here.</p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 px-4 pb-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl flex-col gap-2"
        >
          {error ? (
            <p className="px-3 text-xs text-rose-600">{error}</p>
          ) : null}
          <div className="flex items-center gap-3 rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe a recipe app to generate…"
              className="h-12 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
