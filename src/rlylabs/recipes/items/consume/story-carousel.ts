import { defineRecipe } from "../../define";

export const storyCarousel = defineRecipe({
  id: "story-carousel",
  intent: "consume",
  title: "Story carousel",
  description:
    "Swipeable slider plus stories strip — mobile-native photo and reel browsing.",
  prompt: "Show the event photos as a swipeable carousel with story highlights",
  tags: [
    "stories",
    "carousel",
    "slider",
    "photos",
    "reels",
    "swipe",
    "gallery",
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
        children: ["header", "stories", "carousel"],
      },
      header: {
        type: "ScreenHeader",
        props: {
          eyebrow: "Weekend recap",
          title: "Rooftop launch",
          metaLeft: "24 photos",
          metaRight: "Jun 14",
        },
      },
      stories: {
        type: "MediaStrip",
        props: {
          label: "Highlights",
          items: [
            { label: "Setup", tone: "sky" },
            { label: "Crowd", tone: "violet" },
            { label: "DJ", tone: "rose" },
            { label: "Sunset", tone: "amber" },
            { label: "After", tone: "emerald" },
          ],
        },
      },
      carousel: {
        type: "Slider",
        props: {
          aspect: "tall",
          slides: [
            {
              title: "Golden hour",
              caption: "Doors opened at 7:12pm",
              tone: "amber",
            },
            {
              title: "First set",
              caption: "French touch all night",
              tone: "violet",
            },
            {
              title: "City lights",
              caption: "Crowd stayed until close",
              tone: "sky",
            },
          ],
        },
      },
    },
  },
});
