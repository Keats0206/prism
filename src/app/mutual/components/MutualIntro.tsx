"use client";

// Splash for brand-new visitors — Codrops Demo 1 entrance animation (circular
// image stack) with Mutual copy centered in the ring. Fixed full-viewport so
// the animation isn't clipped by the app's max-w-lg chat column.

import { useCallback, useState } from "react";
import { CircularStack } from "./CircularStack";

export function MutualIntro({ onStart }: { onStart: () => void }) {
  const [ready, setReady] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Match demo loader: solid cover until images + timeline are ready */}
      <div
        className="pointer-events-none absolute inset-0 bg-[var(--mutual-bg-base)] transition-opacity duration-500"
        style={{ opacity: ready ? 0 : 1 }}
        aria-hidden
      />

      <CircularStack onReady={handleReady} />

      <div
        className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center transition-[opacity,filter] duration-1000"
        style={{
          opacity: ready ? 1 : 0,
          filter: ready ? "blur(0)" : "blur(24px)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#1aad77]">
          Mutual · AI for real life
        </p>
        <h1
          className="mt-3 text-[clamp(2rem,1.4rem+3vw,3.25rem)] leading-[1.05] text-white"
          style={{ fontFamily: '"Sentient", Georgia, serif', fontWeight: 500 }}
        >
          An AI that makes you
          <br />
          more social — IRL.
        </h1>
        <p className="mt-3 max-w-[20rem] text-[clamp(0.9rem,0.85rem+0.5vw,1rem)] leading-snug text-[#cccccc]">
          No feed. No algorithm. Just more real time with your people.
        </p>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-20 px-6 pb-[max(2rem,env(safe-area-inset-bottom))] transition-opacity duration-500"
        style={{ opacity: ready ? 1 : 0 }}
      >
        <button
          type="button"
          onClick={onStart}
          className="w-full max-w-lg mx-auto block rounded-xl bg-[#1aad77] py-3.5 text-[16px] font-medium text-white transition hover:bg-[#159a6a]"
        >
          Get started
        </button>
      </div>
    </div>
  );
}
