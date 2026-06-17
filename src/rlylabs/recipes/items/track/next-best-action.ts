import { defineRecipe } from "../../define";

export const nextBestAction = defineRecipe({
  id: "next-best-action",
  intent: "track",
  title: "Do this today",
  description:
    "One clear next action — not a dashboard — with context on why it matters now.",
  prompt: "What's the one thing I should do today to stay on track?",
  tags: [
    "action",
    "today",
    "next",
    "focus",
    "priority",
    "coach",
    "habit",
    "goal",
    "single",
    "clear",
    "accountability",
    "improve",
  ],
  atomKinds: ["progress", "action"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: null },
        children: ["hero", "why", "cta"],
      },
      hero: {
        type: "Hero",
        props: {
          eyebrow: "Next best action",
          title: "20-minute mobility session",
          subtitle: "Back-safe streak is at risk — you've skipped recovery 2 days.",
          icon: "target",
        },
      },
      why: {
        type: "Copy",
        props: {
          text: "You crushed lifts Mon/Wed. A short mobility block keeps the streak alive without adding fatigue.",
        },
      },
      cta: {
        type: "Action",
        props: { label: "Start 20 min session", variant: "primary", icon: "play" },
      },
    },
  },
});
