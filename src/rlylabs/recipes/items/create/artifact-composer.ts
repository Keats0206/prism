import { defineRecipe } from "../../define";

export const artifactComposer = defineRecipe({
  id: "artifact-composer",
  intent: "create",
  title: "Blank to artifact",
  description:
    "Prompt → generated object card for playlists, flyers, workouts, trip plans, or notes.",
  prompt: "Make me a workout plan from a short description",
  tags: [
    "create",
    "generate",
    "artifact",
    "composer",
    "prompt",
    "playlist",
    "flyer",
    "workout",
    "trip",
    "plan",
    "draft",
    "make",
  ],
  atomKinds: ["input", "generative"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: null },
        children: ["hero", "input", "generate"],
      },
      hero: {
        type: "Hero",
        props: {
          eyebrow: "Create",
          title: "Back-safe push day",
          subtitle: "4 exercises · 45 min · no overhead pressing",
          icon: "sparkles",
        },
      },
      input: {
        type: "Field",
        props: {
          label: "Describe what you want",
          value: "Upper body, bad shoulder, 45 minutes",
          placeholder: "A date night playlist, summer trip outline, gym flyer…",
        },
      },
      generate: {
        type: "Action",
        props: { label: "Generate artifact", variant: "primary", icon: "sparkles" },
      },
    },
  },
});
