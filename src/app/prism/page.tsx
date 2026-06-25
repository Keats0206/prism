"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { listApps, saveApp, type SavedApp } from "@/rlylabs/appLibrary";
import { registry } from "@/rlylabs/registry";
import { PrismTheme } from "@/rlylabs/PrismTheme";
import { visibleSpec } from "@/rlylabs/specs";
import { usePersistentState } from "@/rlylabs/usePersistentState";

const EMPTY_STATE: Record<string, unknown> = {};

const BUILD_STEPS = [
  "Reading your request",
  "Finding matching components",
  "Designing the layout",
  "Building components",
  "Putting it together",
];

const SUGGESTED_PROMPTS = [
  "Planning a date tonight",
  "Need a chest workout for today",
  "Track my weekly grocery list",
  "Help me plan a weekend trip",
  "Morning routine checklist",
];

export default function Prism() {
  const [prompt, setPrompt] = useState("");
  const [buildingPrompt, setBuildingPrompt] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [activeSpec, setActiveSpec] = useState<Spec | null>(null);
  const [appKey, setAppKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const seed = (activeSpec?.state as Record<string, unknown>) ?? EMPTY_STATE;
  const { initialState, onStateChange } = usePersistentState(appKey, seed);
  const savedApps = !loading && !activeSpec ? listApps() : [];

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading) return;

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

  function openApp(app: SavedApp) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setAppKey(app.id);
    setActiveSpec(app.spec);
    setBuildingPrompt(null);
    setError(null);
    setShowComposer(false);
  }

  function goHome() {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setActiveSpec(null);
    setAppKey(null);
    setBuildingPrompt(null);
    setError(null);
    setShowComposer(false);
  }

  async function buildFromPrompt(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setPrompt("");
    setBuildingPrompt(trimmed);
    setBuildStep(0);
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

      const spec = data.spec as Spec;
      const saved = saveApp({ prompt: trimmed, spec });
      setAppKey(saved.id);
      track("app_built", { prompt: trimmed });
      streamSpec(spec);
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

  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-stone-100 text-zinc-950">
      {loading && buildingPrompt ? (
        <section
          aria-live="polite"
          className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col items-center justify-center px-6 pb-48"
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
              ← Home
            </button>
          </div>
          <section className="min-h-dvh w-full min-w-0 pb-40">
            <div className="w-full min-w-0">
              <JSONUIProvider
                key={appKey ?? activeSpec.root}
                registry={registry}
                initialState={initialState}
                onStateChange={onStateChange}
              >
                <PrismTheme className="w-full min-w-0">
                  <Renderer spec={activeSpec} registry={registry} />
                </PrismTheme>
              </JSONUIProvider>
            </div>
          </section>
        </>
      ) : (
        <section className="min-h-dvh w-full pb-32 pt-16">
          <div className="px-4">
            <h1 className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
              Your apps
            </h1>
          </div>
          {savedApps.length === 0 ? (
            <p className="mt-12 px-4 text-center text-sm text-zinc-400">
              No apps yet — tap + to build one
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {savedApps.map((app) => (
                <li key={app.id}>
                  <button
                    type="button"
                    onClick={() => openApp(app)}
                    className="flex w-full flex-col items-start gap-0.5 px-4 py-4 text-left transition hover:bg-white/60 active:bg-white/80"
                  >
                    <span className="text-base font-medium text-zinc-900">
                      {app.title}
                    </span>
                    <span className="line-clamp-1 text-sm text-zinc-400">
                      {app.prompt}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && !activeSpec ? (
        <div className="fixed inset-x-0 bottom-8 flex justify-center">
          <button
            type="button"
            onClick={() => setShowComposer((open) => !open)}
            aria-label={showComposer ? "Close" : "New app"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-950 text-2xl font-light text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition hover:bg-zinc-800"
          >
            +
          </button>
        </div>
      ) : null}

      {!loading && !activeSpec && showComposer ? (
        <div className="fixed inset-x-0 top-0 z-10 px-4 pt-4 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              {error ? (
                <p className="px-1 text-xs text-rose-600">{error}</p>
              ) : null}
              <input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe what you need…"
                disabled={loading}
                autoFocus
                className="w-full border-b border-black/10 bg-transparent py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60"
              />
            </form>
            <div className="mt-5 flex flex-col items-start gap-2">
              {SUGGESTED_PROMPTS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void buildFromPrompt(suggestion)}
                  className="rounded-full border border-black/[0.06] bg-white/80 px-3.5 py-1.5 text-left text-sm text-zinc-600 transition hover:border-black/10 hover:bg-white hover:text-zinc-950"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
