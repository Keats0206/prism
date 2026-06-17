import { defineRecipe } from "../../define";

export const releaseTimeline = defineRecipe({
  id: "release-timeline",
  intent: "consume",
  title: "Release timeline",
  description:
    "Vertical schedule of drops and teasers — mobile release calendar for fans.",
  prompt: "Show the release schedule for the album drop this week",
  tags: [
    "timeline",
    "schedule",
    "release",
    "drop",
    "calendar",
    "events",
    "consume",
    "media",
    "mobile",
    "itinerary",
  ],
  atomKinds: ["media", "progress"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "banner", "timeline"],
      },
      header: {
        type: "Hero",
        props: {
          eyebrow: "Album week",
          title: "Neon Hours",
          subtitle: "5 moments across 7 days",
          icon: "calendar",
        },
      },
      banner: {
        type: "Banner",
        props: {
          title: "Next up: lead single",
          message: "Pre-save link goes live tomorrow at noon",
          tone: "success",
          icon: "music",
        },
      },
      timeline: {
        type: "Timeline",
        props: {
          label: "Schedule",
          events: [
            {
              time: "Mon 12pm",
              title: "Teaser clip",
              detail: "15s vertical cut on TikTok",
              tone: "accent",
            },
            {
              time: "Wed 6pm",
              title: "Lead single",
              detail: "Spotify + Apple Music",
              tone: "neutral",
            },
            {
              time: "Fri 8pm",
              title: "Live listening party",
              detail: "Rooftop stream",
              tone: "success",
            },
            {
              time: "Sun",
              title: "Full album",
              detail: "12 tracks · digital + vinyl",
              tone: "neutral",
            },
          ],
        },
      },
    },
  },
});
