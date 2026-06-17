import { defineRecipe } from "../../define";

export const remixBar = defineRecipe({
  id: "remix-bar",
  intent: "create",
  title: "Remix bar",
  description:
    "Tiny style controls to reshape an artifact — cleaner, chaotic, premium, Gen Z.",
  prompt: "Make this flyer cleaner and more premium",
  tags: [
    "remix",
    "style",
    "cleaner",
    "chaotic",
    "premium",
    "genz",
    "tone",
    "adjust",
    "create",
    "edit",
    "transform",
    "chips",
  ],
  atomKinds: ["generative", "input"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: "Remix" },
        children: ["preview", "styles", "actions"],
      },
      preview: {
        type: "Copy",
        props: {
          text: "Summer rooftop party · Fri 8pm · DJ set + open bar · RSVP by Thursday",
        },
      },
      styles: {
        type: "ChipRow",
        props: {
          label: "Style",
          chips: [
            { label: "Cleaner", selected: true, tone: "accent" },
            { label: "More chaotic", selected: false, tone: "neutral" },
            { label: "More premium", selected: false, tone: "neutral" },
            { label: "More Gen Z", selected: false, tone: "neutral" },
            { label: "More useful", selected: false, tone: "neutral" },
          ],
        },
      },
      actions: {
        type: "Action",
        props: { label: "Apply remix", variant: "primary", icon: "refresh" },
      },
    },
  },
});
