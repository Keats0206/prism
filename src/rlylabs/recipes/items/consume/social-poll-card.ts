import { defineRecipe } from "../../define";

export const socialPollCard = defineRecipe({
  id: "social-poll-card",
  intent: "consume",
  title: "Social poll card",
  description:
    "Audience poll with avatar row and segmented filter — mobile engagement block.",
  prompt: "Let the audience vote on the encore song and see who's here",
  tags: [
    "poll",
    "vote",
    "audience",
    "engagement",
    "social",
    "crowd",
    "consume",
    "decision",
    "mobile",
    "interactive",
  ],
  atomKinds: ["decision", "social", "media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["filter", "guests", "poll"],
      },
      filter: {
        type: "SegmentedControl",
        props: {
          segments: [
            { label: "Live", selected: true },
            { label: "Remote" },
            { label: "All" },
          ],
        },
      },
      guests: {
        type: "AvatarRow",
        props: {
          label: "In the room",
          people: [
            { name: "Maya", subtitle: "Host", tone: "rose" },
            { name: "Alex", subtitle: "DJ", tone: "violet" },
            { name: "Jordan", subtitle: "Guest", tone: "sky" },
            { name: "Sam", subtitle: "Guest", tone: "amber" },
          ],
        },
      },
      poll: {
        type: "Poll",
        props: {
          question: "What should we play for the encore?",
          options: [
            { label: "La Femme d'Argent", votes: 42 },
            { label: "Dans la nuit", votes: 31 },
            { label: "Surprise remix", votes: 18 },
          ],
        },
      },
    },
  },
});
