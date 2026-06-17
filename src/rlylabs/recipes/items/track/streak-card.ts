import { defineRecipe } from "../../define";

export const streakCard = defineRecipe({
  id: "streak-card",
  intent: "track",
  title: "Streak alive",
  description:
    "Shows an active streak, what's at risk, and weekly momentum at a glance.",
  prompt: "Am I still on my workout streak and what happens if I skip today?",
  tags: [
    "streak",
    "momentum",
    "consistency",
    "habit",
    "fitness",
    "weekly",
    "accountability",
    "progress",
    "alive",
    "risk",
    "coach",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: null },
        children: ["status", "ring", "metric"],
      },
      status: {
        type: "Pill",
        props: { label: "12-day streak alive", tone: "success" },
      },
      ring: {
        type: "CircularProgress",
        props: {
          label: "Weekly target",
          value: 75,
          detail: "3 of 4 workouts done — skip today and the streak resets",
          tone: "accent",
          size: "md",
        },
      },
      metric: {
        type: "Metric",
        props: {
          label: "This week",
          value: "3 / 4 workouts",
          detail: "Mon · Wed · Fri open",
          tone: "accent",
          icon: "flame",
        },
      },
    },
  },
});
