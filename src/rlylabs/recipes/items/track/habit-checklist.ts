import { defineRecipe } from "../../define";

export const habitChecklist = defineRecipe({
  id: "habit-checklist",
  intent: "track",
  title: "Habit checklist",
  description: "Routine rows with label, scheduled time, and a done toggle.",
  prompt: "Daily habit tracker with times and check-off for each routine",
  tags: [
    "habit",
    "tracker",
    "daily",
    "routine",
    "checklist",
    "morning",
    "goals",
    "toggle",
    "schedule",
    "productivity",
    "accountability",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "routines",
    elements: {
      routines: {
        type: "Collection",
        props: {
          presentation: "card",
          header: { title: "Routines", subtitle: null, trailing: null },
          items: [
            {
              cells: [
                { kind: "text", value: "Meditate" },
                { kind: "time", value: "7:00" },
                { kind: "toggle", icon: "check", checked: true },
              ],
            },
            {
              cells: [
                { kind: "text", value: "Read 20 pages" },
                { kind: "time", value: "8:30" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "text", value: "Workout" },
                { kind: "time", value: "12:00" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
          ],
        },
      },
    },
  },
});
