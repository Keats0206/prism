/**
 * Copy this file into items/<intent>/your-recipe-name.ts
 * Then export it from items/<intent>/index.ts and register in catalog.ts
 */
import { defineRecipe } from "../define";

export const exampleRecipe = defineRecipe({
  id: "example-recipe",
  intent: "track",
  title: "Example recipe",
  description: "One-line description of what human goal this block compresses.",
  prompt: "Example user prompt this component helps with",
  tags: ["keyword", "matching", "retrieval"],
  atomKinds: ["progress"],
  spec: {
    root: "root-id",
    elements: {
      "root-id": {
        type: "Copy",
        props: { text: "Replace with your composed component spec." },
      },
    },
  },
});
