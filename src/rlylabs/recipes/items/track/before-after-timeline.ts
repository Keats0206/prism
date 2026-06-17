import { defineRecipe } from "../../define";

export const beforeAfterTimeline = defineRecipe({
  id: "before-after-timeline",
  intent: "track",
  title: "Before / after timeline",
  description:
    "Transformation over time across phases — body, habits, money, or learning.",
  prompt: "Show my progress over the last 3 months — before, during, after",
  tags: [
    "timeline",
    "before",
    "after",
    "transformation",
    "progress",
    "history",
    "phases",
    "body",
    "habits",
    "learning",
    "compare",
    "journey",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "timeline",
    elements: {
      timeline: {
        type: "Board",
        props: {
          columns: [
            {
              title: "Month 1",
              accent: "neutral",
              cards: [
                {
                  title: "Starting point",
                  subtitle: "185 lbs · inconsistent sleep",
                  meta: "Jan",
                  badge: "Before",
                },
                {
                  title: "2 workouts / week",
                  subtitle: "No mobility habit",
                  meta: null,
                  badge: null,
                },
              ],
            },
            {
              title: "Month 2",
              accent: "accent",
              cards: [
                {
                  title: "Routine locked",
                  subtitle: "3 lifts + 1 mobility / week",
                  meta: "Feb",
                  badge: "Building",
                },
                {
                  title: "Sleep avg 6.5h",
                  subtitle: "Energy still uneven",
                  meta: null,
                  badge: null,
                },
              ],
            },
            {
              title: "Month 3",
              accent: "success",
              cards: [
                {
                  title: "182 lbs · stronger",
                  subtitle: "Back-safe streak: 18 days",
                  meta: "Mar",
                  badge: "After",
                },
                {
                  title: "Sleep avg 7.2h",
                  subtitle: "Recovery compliance 80%",
                  meta: null,
                  badge: null,
                },
              ],
            },
          ],
        },
      },
    },
  },
});
