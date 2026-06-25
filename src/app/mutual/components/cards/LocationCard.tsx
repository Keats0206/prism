"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { useChat } from "../chat-ui";

// One-tap location share during onboarding. Browser geolocation → coords are
// stored, then we nudge the agent so the interview continues. If the browser
// blocks it (or SMS), the user can still just type their city in the composer.
export function LocationCard() {
  const { addOptimisticUser } = useChat();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  async function share() {
    if (state === "loading" || state === "done") return;
    if (!navigator.geolocation) {
      setState("error");
      return;
    }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/mutual/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          if (!res.ok) throw new Error("save failed");
          setState("done");
          // Nudge the agent so it acknowledges and moves the interview forward.
          // The chat poll reconciles the user bubble + Mutual's reply.
          addOptimisticUser("📍 Shared my location");
          await fetch("/api/mutual/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: "I just shared my location." }),
          });
        } catch {
          setState("error");
        }
      },
      () => setState("error"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  if (state === "done") {
    return (
      <div className="rounded-xl border border-[#1aad77]/30 bg-[#1f2a25] px-3.5 py-3">
        <p className="text-[13px] font-medium text-[#6dd4b0]">
          Location shared ✓
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#333333] p-3.5">
      <button
        type="button"
        onClick={() => void share()}
        disabled={state === "loading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1aad77] py-2.5 text-[15px] font-medium text-white transition hover:bg-[#159a6a] disabled:opacity-60"
      >
        <MapPin className="h-4 w-4" />
        {state === "loading" ? "Getting your location…" : "Use my current location"}
      </button>
      {state === "error" ? (
        <p className="mt-2 text-[12px] text-[#d8b96a]">
          Couldn't read your location — just type your city below and I'll use that.
        </p>
      ) : (
        <p className="mt-2 text-center text-[12px] text-[#8a8a8a]">
          or type your city below
        </p>
      )}
    </div>
  );
}
