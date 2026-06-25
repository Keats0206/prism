import type { EventItem } from "@/mutual/types";

export function EventCard({ event }: { event: EventItem }) {
  return (
    <a
      href={event.url ?? "#"}
      target={event.url ? "_blank" : undefined}
      rel="noreferrer"
      className="block rounded-xl border border-white/[0.08] bg-[#333333] p-3.5 transition hover:border-[#1aad77]/40"
    >
      {event.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt=""
          className="mb-3 h-32 w-full rounded-lg object-cover"
        />
      ) : null}
      <p className="text-[15px] font-medium text-[#e8e8e8]">{event.title}</p>
      {event.venue || event.startsAt ? (
        <p className="mt-1 text-[13px] text-[#999999]">
          {[event.venue, event.startsAt].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {event.description ? (
        <p className="mt-2 text-[13px] leading-snug text-[#999999]">
          {event.description}
        </p>
      ) : null}
      {event.url ? (
        <span className="mt-2 inline-block text-[13px] text-[#6dd4b0]">Open ↗</span>
      ) : null}
    </a>
  );
}
