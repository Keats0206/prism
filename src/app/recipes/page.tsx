"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ImagePlus, X } from "lucide-react";
import { JSONUIProvider, Renderer, useUIStream } from "@json-render/react";
import { registry } from "@/prism/registry";
import { DEFAULT_MODEL, MODELS, estimateCost, getModel } from "@/lib/models";

export default function RecipesPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [image, setImage] = useState<string | null>(null); // data URL
  const [saved, setSaved] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms, ticks live during streaming
  const [finalMs, setFinalMs] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Native @json-render streaming: applies JSON Patch lines from the API into a
  // renderable spec as they arrive, so the preview builds live.
  const { spec, isStreaming, error, usage, send } = useUIStream({
    api: "/api/recipes/generate",
  });

  // Live elapsed-time ticker while a generation is in flight.
  useEffect(() => {
    if (!isStreaming) return;
    const start = Date.now();
    setElapsed(0);
    setFinalMs(null);
    const id = setInterval(() => setElapsed(Date.now() - start), 100);
    return () => {
      clearInterval(id);
      setFinalMs(Date.now() - start);
    };
  }, [isStreaming]);

  // Estimated cost from the model's pricing and the reported token usage.
  const cost = useMemo(() => {
    if (!usage) return null;
    return estimateCost(getModel(model), usage.promptTokens, usage.completionTokens);
  }, [usage, model]);

  function handleImagePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = prompt.trim();
    if ((!trimmed && !image) || isStreaming) return;
    setSaved(false);
    await send(trimmed, { model, image });
  }

  // Recipes live in src/prism/recipes/index.ts. "Save" copies a ready-to-paste
  // Recipe entry to the clipboard so you can drop refined specs into the library.
  async function handleSave() {
    if (!spec) return;
    const slug =
      prompt
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "untitled";

    const entry = {
      id: slug,
      title: prompt.trim().slice(0, 40) || "Untitled",
      prompt: prompt.trim(),
      tags: [],
      spec,
    };

    await navigator.clipboard.writeText(JSON.stringify(entry, null, 2) + ",");
    setSaved(true);
  }

  const hasSpec = Boolean(spec?.root);
  const canRender = Boolean(spec?.root && spec.elements?.[spec.root]);

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
          disabled={!hasSpec || isStreaming}
          className="rounded-full bg-zinc-950 px-4 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-30"
        >
          {saved ? "Copied ✓" : "Save recipe"}
        </button>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 px-6 pb-40 pt-6 lg:grid-cols-2">
        {/* JSON spec column */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-black/10 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-black/5 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            JSON Spec
            {isStreaming ? (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            ) : null}
          </div>
          <pre className="flex-1 overflow-auto p-4 text-[11px] leading-5 text-zinc-700">
            {hasSpec
              ? JSON.stringify(spec, null, 2)
              : "// Describe a recipe app below to generate its spec."}
          </pre>
        </div>

        {/* Visual output column — renders live as patches stream in. */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-black/10 bg-stone-50 shadow-sm">
          <div className="border-b border-black/5 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Preview
          </div>
          <div className="flex-1 overflow-auto p-4">
            {canRender ? (
              <JSONUIProvider
                key={spec!.root}
                registry={registry}
                initialState={spec!.state ?? {}}
              >
                <Renderer spec={spec!} registry={registry} />
              </JSONUIProvider>
            ) : isStreaming ? (
              <p className="text-sm text-zinc-400">Building spec…</p>
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
            <p className="px-3 text-xs text-rose-600">{error.message}</p>
          ) : null}

          {/* Live stats: ticking timer while streaming, totals afterward. */}
          {(isStreaming || usage) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-[11px] font-medium text-zinc-500">
              <span>
                ⏱ {((isStreaming ? elapsed : finalMs ?? elapsed) / 1000).toFixed(1)}s
              </span>
              {usage ? (
                <>
                  <span>
                    {usage.totalTokens.toLocaleString()} tok ({usage.promptTokens.toLocaleString()} in / {usage.completionTokens.toLocaleString()} out)
                  </span>
                  {cost != null ? <span>~${cost.toFixed(4)} est.</span> : null}
                </>
              ) : (
                <span className="text-zinc-400">streaming spec…</span>
              )}
            </div>
          )}

          {image ? (
            <div className="relative ml-4 h-16 w-16 overflow-hidden rounded-xl border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="attachment" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ) : null}

          <div className="flex items-center gap-2 rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImagePick}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label="Attach image"
            >
              <ImagePlus size={20} />
            </button>
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe a recipe app to generate…"
              className="h-12 flex-1 bg-transparent px-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <select
              value={model}
              onChange={(event) => setModel(event.target.value)}
              className="h-12 shrink-0 rounded-2xl border border-black/10 bg-stone-50 px-3 text-xs font-medium text-zinc-700 outline-none transition hover:bg-stone-100"
              aria-label="Model"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isStreaming}
              className="h-12 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isStreaming ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
