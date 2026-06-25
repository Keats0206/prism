"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Spec } from "@json-render/core";
import { JSONUIProvider, Renderer } from "@json-render/react";
import { registry } from "@/jukebox/registry";

const EMPTY_STATE: Record<string, unknown> = {};

const SUGGESTED_PROMPTS = [
  "a neon synthwave player for my liked songs",
  "a brutalist black-and-white wall of my playlists",
  "a cozy lo-fi corner from my recently played",
  "a chaotic poster collage of a hype workout mix",
];

// Runtime Spotify action handlers — keys must match the write tools in
// src/spotify/tools.ts. The generated components dispatch these by name.
const WRITE_TOOLS = [
  "playMusic",
  "pausePlayback",
  "resumePlayback",
  "skipToNext",
  "addToQueue",
  "createPlaylist",
  "addTracksToPlaylist",
] as const;

type ConnState = "checking" | "connected" | "disconnected";
type Message = { id: number; role: "user" | "assistant"; text: string };

export default function Jukebox() {
  const [connection, setConnection] = useState<ConnState>("checking");
  const [messages, setMessages] = useState<Message[]>([]);
  const [spec, setSpec] = useState<Spec | null>(null);
  const [specVersion, setSpecVersion] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("error");
    fetch("/api/spotify/auth/status")
      .then((res) => res.json())
      .then((data: { connected: boolean }) => {
        setConnection(data.connected ? "connected" : "disconnected");
        if (oauthError) setError(`Spotify connection failed: ${oauthError}`);
      })
      .catch(() => setConnection("disconnected"));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handlers = useMemo(() => {
    const make = (tool: string) => async (params: Record<string, unknown>) => {
      const res = await fetch("/api/spotify/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool, params }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? "Spotify action failed");
        throw new Error(data.error ?? "Spotify action failed");
      }
      if (tool === "createPlaylist") showToast("Playlist saved to Spotify ✓");
      return data.result;
    };
    return Object.fromEntries(WRITE_TOOLS.map((t) => [t, make(t)]));
  }, [showToast]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: ++idRef.current, role: "user", text: trimmed };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/jukebox/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: trimmed, currentSpec: spec ?? undefined }),
        });
        const data = await res.json();
        if (res.status === 401 && data.error === "not_connected") {
          setConnection("disconnected");
          return;
        }
        if (!res.ok) throw new Error(data.error ?? "Generation failed");

        const editing = Boolean(spec);
        setSpec(data.spec as Spec);
        setSpecVersion((v) => v + 1);
        setMessages((m) => [
          ...m,
          {
            id: ++idRef.current,
            role: "assistant",
            text: editing ? "Updated the interface ✓" : "Built it ✓ — keep typing to refine.",
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setMessages((m) => [
          ...m,
          { id: ++idRef.current, role: "assistant", text: `⚠ ${message}` },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, spec],
  );

  // --- connect gate --------------------------------------------------------
  if (connection !== "connected") {
    return (
      <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
        <h1 className="text-3xl font-bold tracking-tight">Jukebox</h1>
        <p className="mt-3 max-w-sm text-sm text-white/60">
          Prompt an interface and it&rsquo;s built live on top of your real Spotify —
          then chat to keep editing it.
        </p>
        {connection === "checking" ? (
          <p className="mt-8 text-sm text-white/40">Checking connection…</p>
        ) : (
          <a
            href="/api/spotify/auth/login"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            Connect Spotify
          </a>
        )}
        {error ? <p className="mt-4 text-xs text-rose-400">{error}</p> : null}
      </main>
    );
  }

  // --- editor (chat left, preview right) -----------------------------------
  return (
    <main className="flex h-dvh w-full flex-col bg-black text-white md:flex-row">
      {/* Chat panel */}
      <aside className="flex h-[44vh] w-full flex-col border-b border-white/10 md:h-full md:w-[360px] md:border-b-0 md:border-r">
        <header className="shrink-0 px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">Jukebox</h1>
          <p className="text-xs text-white/40">Describe it, then chat to edit.</p>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {messages.length === 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-white/50">Try one:</p>
              {SUGGESTED_PROMPTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="block w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <span
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-emerald-500 text-black"
                      : "bg-white/10 text-white/90"
                  }`}
                >
                  {m.text}
                </span>
              </div>
            ))
          )}
          {loading ? (
            <div className="flex justify-start">
              <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/60">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce">·</span>
                  <span className="animate-bounce [animation-delay:0.15s]">·</span>
                  <span className="animate-bounce [animation-delay:0.3s]">·</span>
                </span>
              </span>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="shrink-0 border-t border-white/10 p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={spec ? "Make an edit…" : "Describe your interface…"}
            disabled={loading}
            autoFocus
            className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-white/30 disabled:opacity-60"
          />
        </form>
      </aside>

      {/* Live preview */}
      <section className="relative min-h-0 flex-1 overflow-y-auto">
        {spec ? (
          <JSONUIProvider
            key={specVersion}
            registry={registry}
            initialState={EMPTY_STATE}
            handlers={handlers}
          >
            <Renderer spec={spec} registry={registry} />
          </JSONUIProvider>
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white/40">
            <p className="text-sm">Your interface will render here.</p>
            <p className="mt-1 text-xs">Send a message to build it.</p>
          </div>
        )}
        {toast ? (
          <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black shadow-lg">
              {toast}
            </span>
          </div>
        ) : null}
      </section>
    </main>
  );
}
