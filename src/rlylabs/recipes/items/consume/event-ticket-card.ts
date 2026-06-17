import { defineRecipe } from "../../define";

export const eventTicketCard = defineRecipe({
  id: "event-ticket-card",
  intent: "consume",
  title: "Event ticket card",
  description:
    "Mobile wallet pass with QR code, directions, and RSVP — full event entry flow.",
  prompt: "Show my ticket for tonight with QR code and directions",
  tags: [
    "ticket",
    "event",
    "qr",
    "rsvp",
    "directions",
    "wallet",
    "entry",
    "consume",
    "mobile",
    "venue",
  ],
  atomKinds: ["media", "action", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["ticket", "qr", "directions", "rsvp"],
      },
      ticket: {
        type: "TicketCard",
        props: {
          title: "Neon Rooftop Set",
          subtitle: "General admission",
          date: "Fri Jun 20 · 7:00 PM",
          seat: "GA-042",
          code: "NRK-8F2X",
          tone: "violet",
        },
      },
      qr: {
        type: "QRCode",
        props: {
          value: "https://example.com/tickets/NRK-8F2X",
          label: "Scan at door",
          detail: "Brightness up · one scan per ticket",
        },
      },
      directions: {
        type: "DirectionsCard",
        props: {
          label: "The Standard, High Line",
          address: "848 Washington St, New York, NY",
          lat: 40.7409,
          lng: -74.0078,
        },
      },
      rsvp: {
        type: "RSVP",
        props: {
          eventTitle: "Bring a friend?",
          options: [
            { label: "Going", count: 1, selected: true },
            { label: "Maybe", count: 0 },
            { label: "Can't", count: 0 },
          ],
        },
      },
    },
  },
});
