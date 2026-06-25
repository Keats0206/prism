import type { CardPayload } from "@/mutual/types";
import { EventCard } from "./EventCard";
import { EventListCard } from "./EventListCard";
import { PlanCard } from "./PlanCard";
import { ProfileCard } from "./ProfileCard";
import { MatchCard } from "./MatchCard";
import { ConnectionCard } from "./ConnectionCard";
import { WaitlistCard } from "./WaitlistCard";
import { LocationCard } from "./LocationCard";

// Renders a hand-built card attached to a Mutual chat message. New card kinds
// added to cardSchema should get a branch here.
export function MessageCard({ card }: { card: CardPayload }) {
  return (
    <div className="w-full border-b border-white/[0.07] px-4 pt-1 pb-3.5">
      <CardBody card={card} />
    </div>
  );
}

function CardBody({ card }: { card: CardPayload }) {
  switch (card.kind) {
    case "event":
      return <EventCard event={card} />;
    case "event_list":
      return <EventListCard heading={card.heading} events={card.events} />;
    case "plan":
      return <PlanCard plan={card} />;
    case "profile":
      return <ProfileCard profile={card} />;
    case "match_list":
      return <MatchCard match={card} />;
    case "connection":
      return <ConnectionCard connection={card} />;
    case "waitlist":
      return <WaitlistCard card={card} />;
    case "location":
      return <LocationCard />;
    default:
      return null;
  }
}
