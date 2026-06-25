import type { CardPayload } from "@/mutual/types";

type WaitlistCardData = Extract<CardPayload, { kind: "waitlist" }>;

// Shown when the onboarding interview wraps up. The full agent stays locked
// behind early access — this is the warm "you're in line" confirmation.
export function WaitlistCard({ card }: { card: WaitlistCardData }) {
  return (
    <div className="rounded-xl border border-[#1aad77]/30 bg-gradient-to-br from-[#173a2e] to-[#1f2a25] p-4">
      <p className="text-[15px] font-medium text-[#6dd4b0]">
        {card.headline ?? "You're on the list 🎉"}
      </p>
      {card.message ? (
        <p className="mt-1.5 text-[13px] leading-snug text-[#cfd8d2]">
          {card.message}
        </p>
      ) : null}
      <p className="mt-2.5 text-[12px] leading-snug text-[#8aa39a]">
        I'll text you the moment your spot opens — then we'll start finding your
        people.
      </p>
    </div>
  );
}
