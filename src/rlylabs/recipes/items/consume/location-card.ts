import { defineRecipe } from "../../define";

export const locationCard = defineRecipe({
  id: "location-card",
  intent: "consume",
  title: "Location card",
  description:
    "Map pin with address and event countdown — venue directions on mobile.",
  prompt: "Where is the rooftop event and when does it start?",
  tags: [
    "map",
    "location",
    "venue",
    "directions",
    "address",
    "event",
    "meetup",
    "countdown",
    "consume",
    "navigate",
    "mobile",
  ],
  atomKinds: ["media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "countdown", "map"],
      },
      header: {
        type: "Hero",
        props: {
          eyebrow: "Tonight",
          title: "Rooftop at The Standard",
          subtitle: "Doors 7pm · Rooftop level",
          icon: "mapPin",
        },
      },
      countdown: {
        type: "Countdown",
        props: {
          label: "Starts in",
          targetDate: "2026-06-20T19:00:00",
          detail: "Arrive 15 min early for elevator access",
        },
      },
      map: {
        type: "Map",
        props: {
          label: "The Standard, High Line",
          address: "848 Washington St, New York, NY",
          lat: 40.7409,
          lng: -74.0078,
          zoom: 15,
        },
      },
    },
  },
});
