import { defineRecipe } from "../../define";

export const videoMoment = defineRecipe({
  id: "video-moment",
  intent: "consume",
  title: "Video moment",
  description:
    "Inline video with quote and rating — watch, react, and review on mobile.",
  prompt: "Play the highlight clip and show what people are saying about it",
  tags: [
    "video",
    "watch",
    "clip",
    "highlight",
    "review",
    "rating",
    "quote",
    "consume",
    "media",
    "mobile",
    "reaction",
  ],
  atomKinds: ["media", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["video", "quote", "rating"],
      },
      video: {
        type: "VideoPlayer",
        props: {
          src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
          title: "Rooftop highlight",
          aspect: "wide",
        },
      },
      quote: {
        type: "Quote",
        props: {
          text: "The sunset transition during the second track gave me chills. Best rooftop set this year.",
          attribution: "Maya · attended live",
          tone: "accent",
        },
      },
      rating: {
        type: "Rating",
        props: {
          label: "Crowd score",
          value: 4.8,
          detail: "128 ratings from attendees",
        },
      },
    },
  },
});
