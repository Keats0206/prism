import { defineRecipe } from "../../define";

export const photoAlbum = defineRecipe({
  id: "photo-album",
  intent: "consume",
  title: "Photo album",
  description:
    "Fullscreen hero, photo grid, and before/after comparison — mobile gallery experience.",
  prompt: "Show the event album with a hero shot and before/after setup photos",
  tags: [
    "photos",
    "album",
    "gallery",
    "grid",
    "before after",
    "comparison",
    "consume",
    "media",
    "mobile",
    "visual",
  ],
  atomKinds: ["media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["hero", "grid", "compare"],
      },
      hero: {
        type: "FullscreenHero",
        props: {
          title: "Rooftop launch",
          subtitle: "24 photos · Jun 14",
          tone: "violet",
          aspect: "square",
        },
      },
      grid: {
        type: "PhotoGrid",
        props: {
          columns: "3",
          photos: [
            { label: "Setup", tone: "sky" },
            { label: "Crowd", tone: "violet" },
            { label: "DJ", tone: "rose" },
            { label: "Sunset", tone: "amber" },
            { label: "Dance", tone: "emerald" },
            { label: "Close", tone: "stone" },
          ],
        },
      },
      compare: {
        type: "BeforeAfter",
        props: {
          label: "Venue transform",
          beforeLabel: "Empty",
          afterLabel: "Live",
          position: 55,
          tone: "violet",
        },
      },
    },
  },
});
