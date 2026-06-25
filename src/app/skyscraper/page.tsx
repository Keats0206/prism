"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

const PILLARS = [
  {
    name: "Chat",
    tagline: "like texting a plugged-in friend",
    body: "“Who should I meet this week?” “I want to get closer to AI founders.” “Help me follow up with Sarah.” Skyscraper replies with moves, intro drafts, and people to reconnect with.",
  },
  {
    name: "Me",
    tagline: "your social brief",
    body: "What you're building, what you want, who you want to meet, and what you can offer — distilled into the intro blurb that explains you in one line.",
  },
  {
    name: "People",
    tagline: "your relationship map",
    body: "People you know, weak ties to revive, and the high-signal intros worth making. “You should meet Anna. Ask Jack for the intro — here's the text.”",
  },
  {
    name: "Moves",
    tagline: "your action feed",
    body: "Daily social missions: follow up with three people, ask for one intro, invite two to coffee, host a small dinner. Not a CRM — a social operating system.",
  },
];

export default function Skyscraper() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    track("skyscraper_waitlist", { email: trimmed });
    setJoined(true);
    setEmail("");
  }

  return (
    <main className="min-h-dvh w-full overflow-x-hidden bg-stone-100 text-zinc-950">
      <div
        className={`transition-opacity duration-[2s] ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Hero */}
        <section className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Skyscraper
          </p>
          <h1
            className="mt-6 text-4xl leading-[1.1] tracking-tight text-zinc-950 sm:text-6xl"
            style={{ fontFamily: '"Sentient", Georgia, serif', fontWeight: 500 }}
          >
            an AI that understands
            <br />
            your social life
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-500">
            Tell it a little about your world and it works like a plugged-in
            friend — helping you meet the right new people and deepen the
            relationships you already have.
          </p>

          {joined ? (
            <p className="mt-10 text-sm text-zinc-600">
              You&apos;re on the list. We&apos;ll be in touch soon.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="w-full flex-1 rounded-full border border-black/10 bg-white px-5 py-3 text-base text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-black/30"
              />
              <button
                type="submit"
                className="rounded-full bg-zinc-950 px-6 py-3 text-base font-medium text-white transition hover:bg-zinc-800"
              >
                Join waitlist
              </button>
            </form>
          )}
        </section>

        {/* Pillars */}
        <section className="mx-auto w-full max-w-3xl px-6 pb-32">
          <h2 className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-400">
            Four screens
          </h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-black/5 sm:grid-cols-2">
            {PILLARS.map((pillar) => (
              <article key={pillar.name} className="bg-stone-100 p-8">
                <h3
                  className="text-2xl tracking-tight text-zinc-950"
                  style={{
                    fontFamily: '"Sentient", Georgia, serif',
                    fontWeight: 500,
                  }}
                >
                  {pillar.name}
                </h3>
                <p className="mt-1 text-sm lowercase text-zinc-400">
                  {pillar.tagline}
                </p>
                <p className="mt-4 text-base leading-relaxed text-zinc-600">
                  {pillar.body}
                </p>
              </article>
            ))}
          </div>

          <p className="mt-16 text-center text-sm text-zinc-400">
            a project by{" "}
            <span className="text-zinc-600">pete keating</span>
          </p>
        </section>
      </div>
    </main>
  );
}
