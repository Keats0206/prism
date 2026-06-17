"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/rlylabs/registry";
import { PrismTheme } from "@/rlylabs/PrismTheme";
import { visibleSpec } from "@/rlylabs/specs";

const SUGGESTED_PROMPTS = [
  "Planning a date tonight",
  "Need a chest workout for today",
  "Track my weekly grocery list",
  "Help me plan a weekend trip",
  "Morning routine checklist",
];

const BUILD_STEPS = [
  "Reading your request",
  "Finding matching components",
  "Designing the layout",
  "Building components",
  "Putting it together",
];

export default function Prism() {
  const [prompt, setPrompt] = useState("");
  const [buildingPrompt, setBuildingPrompt] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [activeSpec, setActiveSpec] = useState<Spec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setBuildStep(0);
      return;
    }

    setBuildStep(0);
    const id = setInterval(() => {
      setBuildStep((step) => Math.min(step + 1, BUILD_STEPS.length - 1));
    }, 1400);

    return () => clearInterval(id);
  }, [loading]);

  function streamSpec(spec: Spec) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    const rootElement = spec.elements[spec.root];
    const children =
      rootElement && "children" in rootElement
        ? rootElement.children ?? []
        : [];
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
    setBuildingPrompt(null);
    setError(null);
  }

  async function buildFromPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setPrompt("");
    setBuildingPrompt(trimmed);
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
      setBuildingPrompt(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await buildFromPrompt(prompt);
  }

  function handleSuggestedPrompt(text: string) {
    void buildFromPrompt(text);
  }

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      {loading && buildingPrompt ? (
        <section
          aria-live="polite"
          className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 pb-48"
        >
          <p className="max-w-md text-center text-sm text-zinc-400">
            &ldquo;{buildingPrompt}&rdquo;
          </p>
          <ul className="mt-10 flex w-full max-w-sm flex-col gap-3">
            {BUILD_STEPS.map((step, index) => {
              const done = index < buildStep;
              const active = index === buildStep;

              return (
                <li
                  key={step}
                  className={`flex items-center gap-3 text-sm transition-colors duration-300 ${
                    done
                      ? "text-zinc-400"
                      : active
                        ? "text-zinc-800"
                        : "text-zinc-300"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      done
                        ? "border-zinc-300 bg-zinc-100 text-zinc-500"
                        : active
                          ? "border-zinc-400 bg-white"
                          : "border-zinc-200 bg-white/50"
                    }`}
                  >
                    {done ? (
                      "✓"
                    ) : active ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                    ) : null}
                  </span>
                  {step}
                  {active ? "…" : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : activeSpec ? (
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
          <section className="mx-auto flex min-h-screen w-full max-w-3xl items-start px-6 pb-40">
            <JSONUIProvider
              key={activeSpec.root}
              registry={registry}
              initialState={activeSpec.state ?? {}}
            >
              <PrismTheme className="w-full">
                <Renderer spec={activeSpec} registry={registry} />
              </PrismTheme>
            </JSONUIProvider>
          </section>
        </>
      ) : (
        <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 pb-48 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            What are you working on?
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Pick a suggestion or describe what you need below.
          </p>
          <div className="mt-8 flex max-w-xl flex-wrap justify-center gap-2">
            {SUGGESTED_PROMPTS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestedPrompt(suggestion)}
                className="rounded-md border border-black/[0.06] bg-white/80 px-3.5 py-1.5 text-sm text-zinc-600 transition hover:border-black/10 hover:bg-white hover:text-zinc-950"
              >
                {suggestion}
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
              placeholder="Describe what you need…"
              disabled={loading}
              className="h-12 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
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
