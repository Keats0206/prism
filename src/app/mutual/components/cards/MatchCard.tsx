import type { CardPayload } from "@/mutual/types";

type MatchCardData = Extract<CardPayload, { kind: "match_list" }>;

export function MatchCard({ match }: { match: MatchCardData }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#333333] p-3.5">
      {match.heading ? (
        <p className="mb-2.5 text-[13px] font-medium text-[#e8e8e8]">
          {match.heading}
        </p>
      ) : null}

      <div className="space-y-2.5">
        {match.candidates.map((c, i) => {
          const handle = c.username ? `@${c.username}` : null;
          return (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-9 w-9 shrink-0 rounded-full ${c.avatarGradient ?? "bg-gradient-to-br from-violet-500 to-fuchsia-500"}`}
              />
              <div className="min-w-0">
                <p className="text-[14px] font-medium text-[#e8e8e8]">
                  {c.name ?? handle ?? "Someone"}
                  {c.scope === "network" ? (
                    <span className="ml-1.5 text-[11px] text-[#888888]">
                      · friend of a friend
                    </span>
                  ) : null}
                </p>
                {c.summary ? (
                  <p className="text-[12px] leading-snug text-[#999999]">
                    {c.summary}
                  </p>
                ) : null}
                {c.sharedTags && c.sharedTags.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {c.sharedTags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/[0.08] bg-[#2a2a2a] px-2 py-0.5 text-[11px] text-[#6dd4b0]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[12px] text-[#888888]">
        Want an intro? Tell me who and I&apos;ll check if it&apos;s mutual.
      </p>
    </div>
  );
}
