import type { CardPayload } from "@/mutual/types";

type ProfileCardData = Extract<CardPayload, { kind: "profile" }>;

export function ProfileCard({ profile }: { profile: ProfileCardData }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#333333] p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={`h-12 w-12 shrink-0 rounded-full ${profile.avatarGradient ?? "bg-gradient-to-br from-violet-500 to-fuchsia-500"}`}
        />
        <div className="min-w-0">
          {profile.name ? (
            <p className="text-[15px] font-medium text-[#e8e8e8]">{profile.name}</p>
          ) : null}
          {profile.username ? (
            <p className="text-[13px] text-[#6dd4b0]">@{profile.username}</p>
          ) : null}
        </div>
      </div>

      {profile.bio ? (
        <p className="mt-3 text-[13px] leading-snug text-[#cccccc]">{profile.bio}</p>
      ) : null}

      {profile.intents && profile.intents.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.intents.map((intent) => (
            <span
              key={intent}
              className="rounded-full border border-white/[0.08] bg-[#2a2a2a] px-2.5 py-0.5 text-[12px] text-[#999999]"
            >
              {intent}
            </span>
          ))}
        </div>
      ) : null}

      {profile.sharedFacts && profile.sharedFacts.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {profile.sharedFacts.map((fact, i) => (
            <li key={i} className="text-[13px] text-[#999999]">
              • {fact}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
