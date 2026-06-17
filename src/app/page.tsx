"use client";

import { useEffect, useRef, useState } from "react";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/prism/registry";
import {
  buildPromptSpec,
  exampleGroups,
  examples,
  visibleSpec,
  type Example,
} from "@/prism/specs";

type Mode = "json" | "spec";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("json");
  const [activeSpec, setActiveSpec] = useState<Spec | null>(null);
  const [selectedExample, setSelectedExample] = useState<Example | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

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
    }, 260);
  }

  function handleExampleClick(example: Example) {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    setPrompt(example.prompt);
    setSelectedExample(example);
    setActiveSpec(null);
  }

  function launchExample(example: Example) {
    setPrompt(example.prompt);
    setSelectedExample(example);
    streamSpec(example.spec);
  }

  function goHome() {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    setActiveSpec(null);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    streamSpec(selectedExample?.prompt === trimmedPrompt ? selectedExample.spec : buildPromptSpec(trimmedPrompt));
  }

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <div className="fixed inset-x-0 top-0 flex justify-center px-4 pt-4">
        <div className="inline-flex rounded-full border border-black/10 bg-white p-0.5 text-[11px] font-medium shadow-sm">
          {(["json", "spec"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={`rounded-full px-2.5 py-1 capitalize transition ${
                option === mode
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {activeSpec ? (
        <>
          <div className="fixed left-4 top-4 z-10">
            <button
              type="button"
              onClick={goHome}
              className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] font-medium text-zinc-500 shadow-sm transition hover:text-zinc-950"
            >
              ← All apps
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
              Tap an app to render it from its JSON spec, or describe your own
              below.
            </p>
          </header>

          <div className="flex flex-col gap-8">
            {exampleGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
                  {group.title}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.examples.map((example) => (
                    <button
                      key={example.label}
                      type="button"
                      onClick={() => launchExample(example)}
                      className="flex flex-col rounded-2xl border border-black/10 bg-white p-4 text-left shadow-sm transition hover:border-black/20 hover:shadow-md"
                    >
                      <span className="text-sm font-semibold text-zinc-900">
                        {example.label}
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                        {example.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 px-4 pb-4 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex w-full max-w-3xl items-center gap-3 rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_60px_rgba(15,23,42,0.12)]"
        >
          <input
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={`Describe the ${mode} UI you want to render`}
            className="h-12 flex-1 bg-transparent px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          <button
            type="submit"
            className="h-12 rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            Render
          </button>
        </form>
      </div>
    </main>
  );
}
