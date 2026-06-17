import { defineRecipe } from "../../define";

export const workoutSetBlock = defineRecipe({
  id: "workout-set-block",
  intent: "track",
  title: "Workout set block",
  description:
    "Exercise card with set rows for weight, reps, and a completion toggle.",
  prompt: "Track gym sets with lbs, reps, and check-off per set",
  tags: [
    "workout",
    "fitness",
    "gym",
    "sets",
    "reps",
    "lbs",
    "exercise",
    "chest",
    "tracker",
    "weight",
    "training",
    "lifting",
  ],
  atomKinds: ["progress"],
  spec: {
    root: "exercise-sets",
    elements: {
      "exercise-sets": {
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
    },
  },
});
