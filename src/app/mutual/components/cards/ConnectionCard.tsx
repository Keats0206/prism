import type { CardPayload } from "@/mutual/types";

type ConnectionCardData = Extract<CardPayload, { kind: "connection" }>;

const STATUS_COPY: Record<
  ConnectionCardData["status"],
  { label: string; accent: string }
> = {
  pending: { label: "Waiting to hear back", accent: "text-[#d8b96a]" },
  mutual: { label: "It's mutual 🎉", accent: "text-[#6dd4b0]" },
  declined: { label: "Not this time", accent: "text-[#999999]" },
};

export function ConnectionCard({ connection }: { connection: ConnectionCardData }) {
  const status = STATUS_COPY[connection.status];
  const handle = connection.username ? `@${connection.username}` : null;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#333333] p-3.5">
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 shrink-0 rounded-full ${connection.avatarGradient ?? "bg-gradient-to-br from-violet-500 to-fuchsia-500"} ${
            connection.status === "pending" ? "opacity-60" : ""
          }`}
        />
        <div className="min-w-0">
          <p className={`text-[13px] font-medium ${status.accent}`}>
            {status.label}
          </p>
          {connection.status === "mutual" && (connection.name || handle) ? (
            <p className="text-[14px] text-[#e8e8e8]">
              {connection.name ?? handle}
            </p>
          ) : (
            <p className="text-[12px] text-[#999999]">
              {connection.status === "pending"
                ? "They won't know unless you both say yes."
                : ""}
            </p>
          )}
        </div>
      </div>

      {connection.context ? (
        <p className="mt-2.5 text-[12px] leading-snug text-[#999999]">
          {connection.context}
        </p>
      ) : null}
    </div>
  );
}
