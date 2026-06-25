import type { EventItem } from "@/mutual/types";
import { EventCard } from "./EventCard";

export function EventListCard({
  heading,
  events,
}: {
  heading?: string;
  events: EventItem[];
}) {
  return (
    <div className="space-y-2.5">
      {heading ? (
        <p className="text-[13px] font-medium tracking-wide text-[#999999] uppercase">
          {heading}
        </p>
      ) : null}
      {events.map((event, i) => (
        <EventCard key={`${event.title}-${i}`} event={event} />
      ))}
    </div>
  );
}
