import { defineRecipe } from "../../define";

export const coachComment = defineRecipe({
  id: "coach-comment",
  intent: "track",
  title: "Coach read",
  description:
    "Short AI interpretation of patterns — what's working, what's slipping.",
  prompt: "Give me a quick coach read on my habits this week",
  tags: [
    "coach",
    "interpretation",
    "feedback",
    "patterns",
    "insight",
    "weekly",
    "habits",
    "sleep",
    "lifts",
    "accountability",
    "analysis",
    "improve",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: "Coach read" },
        children: ["summary", "strong", "weak", "stat"],
      },
      summary: {
        type: "Copy",
        props: {
          text: "You're consistent on lifts, weak on sleep. Recovery days are getting skipped when work runs late.",
        },
      },
      strong: {
        type: "Pill",
        props: { label: "Strong: 3 lifts logged", tone: "success" },
      },
      weak: {
        type: "Pill",
        props: { label: "Slipping: sleep under 7h", tone: "accent" },
      },
      stat: {
        type: "Metric",
        props: {
          label: "Recovery compliance",
          value: "1 / 3",
          detail: "Target 3 mobility blocks per week",
          tone: "neutral",
          icon: "activity",
        },
      },
    },
  },
});
