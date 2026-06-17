import { defineRecipe } from "../../define";

export const eventBooking = defineRecipe({
  id: "event-booking",
  intent: "transact",
  title: "Event booking",
  description:
    "Pick a time slot, set guest count, see pricing, and book — mobile checkout flow.",
  prompt: "Book 2 tickets for the rooftop listening party",
  tags: [
    "booking",
    "tickets",
    "calendar",
    "price",
    "guests",
    "checkout",
    "transact",
    "mobile",
    "event",
    "reserve",
  ],
  atomKinds: ["decision", "action", "input"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "slots", "guests", "price", "book"],
      },
      header: {
        type: "Hero",
        props: {
          eyebrow: "Reserve",
          title: "Listening party",
          subtitle: "Fri Jun 20 · The Standard rooftop",
          icon: "ticket",
        },
      },
      slots: {
        type: "Stack",
        props: { title: "Pick a time" },
        children: ["slot1", "slot2"],
      },
      slot1: {
        type: "CalendarSlot",
        props: {
          label: "Early access",
          date: "Fri Jun 20",
          time: "6:30 PM",
          selected: true,
        },
      },
      slot2: {
        type: "CalendarSlot",
        props: {
          label: "General doors",
          date: "Fri Jun 20",
          time: "7:00 PM",
        },
      },
      guests: {
        type: "Stepper",
        props: {
          label: "Tickets",
          value: 2,
          min: 1,
          max: 6,
        },
      },
      price: {
        type: "PriceTag",
        props: {
          label: "Total",
          price: "$48",
          compareAt: "$60",
          tone: "accent",
        },
      },
      book: {
        type: "FAB",
        props: {
          label: "Book now",
          icon: "ticket",
          variant: "primary",
        },
      },
    },
  },
});
