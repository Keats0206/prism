import { defineRecipe } from "../../define";

export const checkInCard = defineRecipe({
  id: "check-in-card",
  intent: "track",
  title: "How do you feel?",
  description:
    "One-tap mood and energy check-in with optional context for adaptive coaching.",
  prompt: "How do I feel today — quick mood and energy check-in",
  tags: [
    "checkin",
    "check-in",
    "mood",
    "energy",
    "feel",
    "wellness",
    "daily",
    "journal",
    "state",
    "coach",
    "mindfulness",
    "self",
  ],
  atomKinds: ["input", "progress"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: "Check-in" },
        children: ["prompt", "mood", "energy", "note"],
      },
      prompt: {
        type: "Copy",
        props: { text: "Tap how you're doing right now." },
      },
      mood: {
        type: "ChipRow",
        props: {
          label: "Mood",
          chips: [
            { label: "Low", selected: false, tone: "neutral" },
            { label: "Okay", selected: true, tone: "accent" },
            { label: "Good", selected: false, tone: "neutral" },
            { label: "Great", selected: false, tone: "neutral" },
          ],
        },
      },
      energy: {
        type: "ChipRow",
        props: {
          label: "Energy",
          chips: [
            { label: "Drained", selected: false, tone: "neutral" },
            { label: "Steady", selected: false, tone: "neutral" },
            { label: "Wired", selected: true, tone: "accent" },
          ],
        },
      },
      note: {
        type: "Field",
        props: {
          label: "Anything else?",
          value: null,
          placeholder: "Sore back, slept 5h, big meeting later…",
        },
      },
    },
  },
});
