import type { Example } from "./types";

export const workout: Example = {
  label: "Workout",
  prompt:
    "Create a chest day workout tracker with a heading, progress, and exercise card collections with set rows for lbs, reps, and completion.",
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
          items: [
            {
              cells: [
                { kind: "label", value: "1" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "label", value: "2" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "label", value: "3" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "label", value: "4" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
          ],
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
          items: [
            {
              cells: [
                { kind: "label", value: "1" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "label", value: "2" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
            {
              cells: [
                { kind: "label", value: "3" },
                { kind: "field", placeholder: "lbs" },
                { kind: "field", placeholder: "reps" },
                { kind: "toggle", icon: "check", checked: false },
              ],
            },
          ],
        },
      },
    },
  },
};
