import { defineRecipe } from "../../define";

export const dayProgressHeader = defineRecipe({
  id: "day-progress-header",
  intent: "track",
  title: "Day progress header",
  description: "Screen header paired with a progress bar for daily completion.",
  prompt: "Show today's progress with a done count and percentage bar",
  tags: [
    "progress",
    "daily",
    "header",
    "tracker",
    "completion",
    "stats",
    "overview",
    "productivity",
    "habits",
    "goals",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: null },
        children: ["header", "progress"],
      },
      header: {
        type: "ScreenHeader",
        props: {
          eyebrow: "Today",
          title: "Daily Habits",
          metaLeft: "2 / 5 done",
          metaRight: "40%",
        },
      },
      progress: {
        type: "Progress",
        props: { value: 40, leftLabel: "Morning", rightLabel: "40%" },
      },
    },
  },
});
