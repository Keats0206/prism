import type { CardPayload } from "@/mutual/types";

type PlanCardData = Extract<CardPayload, { kind: "plan" }>;

const STATUS_LABEL: Record<PlanCardData["status"], string> = {
  draft: "Draft",
  proposed: "Proposed",
  confirmed: "Confirmed",
};

export function PlanCard({ plan }: { plan: PlanCardData }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#333333] p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[15px] font-medium text-[#e8e8e8]">{plan.activity}</p>
        <span className="rounded-full bg-[#1aad77]/15 px-2.5 py-0.5 text-[12px] text-[#6dd4b0]">
          {STATUS_LABEL[plan.status]}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-[#999999]">
        With {plan.withNames.join(", ")}
        {plan.timeframe ? ` · ${plan.timeframe}` : ""}
      </p>
      {plan.draftMessage ? (
        <p className="mt-2.5 rounded-lg bg-[#2a2a2a] px-3 py-2 text-[13px] leading-snug text-[#cccccc] italic">
          “{plan.draftMessage}”
        </p>
      ) : null}
    </div>
  );
}
