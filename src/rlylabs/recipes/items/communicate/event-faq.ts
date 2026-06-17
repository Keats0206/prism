import { defineRecipe } from "../../define";

export const eventFaq = defineRecipe({
  id: "event-faq",
  intent: "communicate",
  title: "Event FAQ",
  description:
    "Stats, accordion FAQ, and tab bar — mobile event info hub.",
  prompt: "Answer common questions about the rooftop event with stats",
  tags: [
    "faq",
    "accordion",
    "stats",
    "info",
    "questions",
    "communicate",
    "mobile",
    "event",
    "help",
  ],
  atomKinds: ["media", "decision"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "stats", "faq", "nav"],
      },
      header: {
        type: "ScreenHeader",
        props: {
          eyebrow: "Event info",
          title: "Neon Rooftop Set",
          metaLeft: "FAQ",
          metaRight: "Updated today",
        },
      },
      stats: {
        type: "StatGrid",
        props: {
          columns: "2",
          stats: [
            { label: "Capacity", value: "120", detail: "GA only" },
            { label: "Doors", value: "7 PM", detail: "Elevator B" },
            { label: "Duration", value: "4 hrs", detail: "Until 11 PM" },
            { label: "Age", value: "21+", detail: "ID required" },
          ],
        },
      },
      faq: {
        type: "Accordion",
        props: {
          items: [
            {
              title: "What should I bring?",
              content:
                "Valid ID, comfortable shoes, and a light jacket. No outside drinks.",
              open: true,
            },
            {
              title: "Is there a dress code?",
              content: "Smart casual. Rooftop gets breezy after sunset.",
            },
            {
              title: "Can I transfer my ticket?",
              content: "Yes — use the share link in your wallet pass up to 2 hours before doors.",
            },
          ],
        },
      },
      nav: {
        type: "TabBar",
        props: {
          tabs: [
            { label: "Info", icon: "home", selected: true },
            { label: "Lineup", icon: "music" },
            { label: "Map", icon: "mapPin" },
            { label: "Chat", icon: "messageCircle" },
          ],
        },
      },
    },
  },
});
