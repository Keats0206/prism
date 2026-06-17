import type { Spec } from "@json-render/core";

// A recipe is a hand-approved spec you refine over time. The builder retrieves
// the most relevant recipes and injects them as few-shot examples so generated
// apps start from good ideas. To add one: render + refine it on /recipes, then
// paste the saved entry into the array below.
export type Recipe = {
  id: string;
  title: string;
  // What kind of request this recipe is a good answer for. Shown to the model
  // as the example's "Request" line, and scored against the user's prompt.
  prompt: string;
  // Extra keywords to widen retrieval matches.
  tags: string[];
  spec: Spec;
};

export const recipes: Recipe[] = [
  {
    id: "workout-tracker",
    title: "Workout Tracker",
    prompt:
      "A chest day workout tracker with a heading, progress, and exercise cards with set rows for lbs, reps, and completion.",
    tags: ["workout", "fitness", "gym", "exercise", "sets", "reps", "tracker", "progress"],
    spec: {
      root: "workout-screen",
      elements: {
        "workout-screen": {
          type: "Screen",
          props: { maxWidth: "lg" },
          children: [
            "workout-header",
            "workout-progress",
            "incline-collection",
            "bench-collection",
          ],
        },
        "workout-header": {
          type: "ScreenHeader",
          props: {
            eyebrow: "Today",
            title: "Chest Day",
            metaLeft: "0 / 14 sets",
            metaRight: "0%",
          },
        },
        "workout-progress": {
          type: "Progress",
          props: { value: 0, leftLabel: null, rightLabel: null },
        },
        "incline-collection": {
          type: "Collection",
          props: {
            presentation: "card",
            header: {
              title: "Incline Dumbbell Press",
              subtitle: "4 sets",
              trailing: "0/4",
            },
            items: [1, 2, 3, 4].map((set) => ({
              cells: [
                { kind: "label", value: String(set) },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            })),
          },
        },
        "bench-collection": {
          type: "Collection",
          props: {
            presentation: "card",
            header: {
              title: "Flat Bench Press",
              subtitle: "3 sets",
              trailing: "0/3",
            },
            items: [1, 2, 3].map((set) => ({
              cells: [
                { kind: "label", value: String(set) },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            })),
          },
        },
      },
    },
  },
  {
    id: "recipe-card",
    title: "Recipe Card",
    prompt:
      "A cooking recipe page with a hero, an ingredient list, numbered steps, and a start-cooking action.",
    tags: ["recipe", "cooking", "food", "dinner", "ingredients", "steps", "kitchen", "meal"],
    spec: {
      root: "recipe-screen",
      elements: {
        "recipe-screen": {
          type: "Screen",
          props: { maxWidth: "md" },
          children: ["recipe-hero", "recipe-ingredients", "recipe-steps", "recipe-action"],
        },
        "recipe-hero": {
          type: "Hero",
          props: {
            eyebrow: "Dinner · 25 min",
            title: "Miso-Glazed Salmon",
            subtitle: "Sweet-savory glaze broiled until caramelized.",
            icon: "flame",
          },
        },
        "recipe-ingredients": {
          type: "Collection",
          props: {
            presentation: "card",
            header: { title: "Ingredients", subtitle: "4 servings", trailing: null },
            items: [
              { cells: [{ kind: "text", value: "Salmon fillets" }, { kind: "badge", value: "4" }] },
              { cells: [{ kind: "text", value: "White miso paste" }, { kind: "badge", value: "3 tbsp" }] },
              { cells: [{ kind: "text", value: "Mirin" }, { kind: "badge", value: "2 tbsp" }] },
              { cells: [{ kind: "text", value: "Honey" }, { kind: "badge", value: "1 tbsp" }] },
            ],
          },
        },
        "recipe-steps": {
          type: "Stack",
          props: { title: "Steps" },
          children: ["step-1", "step-2", "step-3"],
        },
        "step-1": {
          type: "Row",
          props: {
            title: "Make the glaze",
            subtitle: "Whisk miso, mirin, and honey until smooth.",
            trailing: "1",
            icon: null,
          },
        },
        "step-2": {
          type: "Row",
          props: {
            title: "Marinate the salmon",
            subtitle: "Coat fillets and rest for 15 minutes.",
            trailing: "2",
            icon: null,
          },
        },
        "step-3": {
          type: "Row",
          props: {
            title: "Broil until caramelized",
            subtitle: "6-8 minutes until the top bubbles and browns.",
            trailing: "3",
            icon: "flame",
          },
        },
        "recipe-action": {
          type: "Action",
          props: { label: "Start cooking", variant: "primary", icon: "play" },
        },
      },
    },
  },
  {
    id: "habit-tracker",
    title: "Habit Tracker",
    prompt:
      "A daily habit tracker with a header, day progress, a checklist of routines with times, and a streak metric.",
    tags: ["habit", "tracker", "daily", "routine", "checklist", "streak", "goals", "progress"],
    spec: {
      root: "habits-screen",
      elements: {
        "habits-screen": {
          type: "Screen",
          props: { maxWidth: "md" },
          children: ["habits-header", "habits-progress", "habits-collection", "habits-metric"],
        },
        "habits-header": {
          type: "ScreenHeader",
          props: {
            eyebrow: "Today",
            title: "Daily Habits",
            metaLeft: "2 / 5 done",
            metaRight: "40%",
          },
        },
        "habits-progress": {
          type: "Progress",
          props: { value: 40, leftLabel: "Morning", rightLabel: "40%" },
        },
        "habits-collection": {
          type: "Collection",
          props: {
            presentation: "card",
            header: { title: "Routines", subtitle: null, trailing: null },
            items: [
              { cells: [{ kind: "text", value: "Meditate" }, { kind: "time", value: "7:00" }, { kind: "toggle", icon: "check", checked: true }] },
              { cells: [{ kind: "text", value: "Read 20 pages" }, { kind: "time", value: "8:30" }, { kind: "toggle", icon: "check", checked: true }] },
              { cells: [{ kind: "text", value: "Workout" }, { kind: "time", value: "12:00" }, { kind: "toggle", icon: "check", checked: false }] },
              { cells: [{ kind: "text", value: "Journal" }, { kind: "time", value: "21:00" }, { kind: "toggle", icon: "check", checked: false }] },
            ],
          },
        },
        "habits-metric": {
          type: "Metric",
          props: {
            label: "Current streak",
            value: "12 days",
            detail: "Personal best",
            tone: "success",
            icon: "trophy",
          },
        },
      },
    },
  },
];
