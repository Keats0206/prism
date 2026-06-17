import { defineRecipe } from "../../define";

export const versionStack = defineRecipe({
  id: "version-stack",
  intent: "create",
  title: "Version stack",
  description:
    "Three variants side by side — safe, bold, and weird — for quick comparison.",
  prompt: "Give me 3 versions of this flyer — safe, bold, and weird",
  tags: [
    "version",
    "variants",
    "compare",
    "safe",
    "bold",
    "weird",
    "remix",
    "create",
    "flyer",
    "design",
    "options",
    "stack",
  ],
  atomKinds: ["generative", "decision"],
  spec: {
    root: "versions",
    elements: {
      versions: {
        type: "Board",
        props: {
          columns: [
            {
              title: "Safe",
              accent: "neutral",
              cards: [
                {
                  title: "Clean minimal flyer",
                  subtitle: "White bg, serif headline, single CTA",
                  meta: "Low risk",
                  badge: "Default",
                },
                {
                  title: "Muted palette",
                  subtitle: "Stone + sky accents",
                  meta: null,
                  badge: null,
                },
              ],
            },
            {
              title: "Bold",
              accent: "accent",
              cards: [
                {
                  title: "High-contrast poster",
                  subtitle: "Oversized type, neon accent bar",
                  meta: "More attention",
                  badge: "Pick",
                },
                {
                  title: "Full-bleed photo",
                  subtitle: "Gradient overlay on hero image",
                  meta: null,
                  badge: null,
                },
              ],
            },
            {
              title: "Weird",
              accent: "success",
              cards: [
                {
                  title: "Chaotic collage",
                  subtitle: "Layered stickers, tilted frames",
                  meta: "Memorable",
                  badge: "Wild",
                },
                {
                  title: "Retro terminal",
                  subtitle: "Monospace, scan lines, glitch border",
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
