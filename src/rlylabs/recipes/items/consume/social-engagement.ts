import { defineRecipe } from "../../define";

export const socialEngagement = defineRecipe({
  id: "social-engagement",
  intent: "consume",
  title: "Social engagement",
  description:
    "Reactions, comments, mentions, and sticker replies — mobile post engagement UI.",
  prompt: "Show reactions and comments on this post with tagged friends",
  tags: [
    "reactions",
    "comments",
    "mentions",
    "stickers",
    "social",
    "engagement",
    "post",
    "consume",
    "mobile",
    "feedback",
  ],
  atomKinds: ["media", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["image", "reactions", "mentions", "comments", "stickers"],
      },
      image: {
        type: "ImageCard",
        props: {
          title: "Rooftop golden hour",
          caption: "Posted by Maya · 2h ago",
          aspect: "wide",
          tone: "amber",
        },
      },
      reactions: {
        type: "ReactionBar",
        props: {
          reactions: [
            { emoji: "❤️", count: 128 },
            { emoji: "🔥", count: 64 },
            { emoji: "👏", count: 31 },
            { emoji: "✨", count: 18 },
          ],
        },
      },
      mentions: {
        type: "MentionRow",
        props: {
          label: "Tagged",
          mentions: [
            { handle: "@maya", name: "Maya", tone: "rose" },
            { handle: "@alex", name: "Alex", tone: "violet" },
            { handle: "@jordan", name: "Jordan", tone: "sky" },
          ],
        },
      },
      comments: {
        type: "CommentThread",
        props: {
          label: "Comments",
          comments: [
            {
              author: "Sam",
              text: "This lighting is unreal. Need the full set list.",
              time: "1h",
              tone: "sky",
            },
            {
              author: "Riley",
              text: "Already saved this to my summer playlist.",
              time: "45m",
              tone: "emerald",
            },
          ],
        },
      },
      stickers: {
        type: "StickerRow",
        props: {
          label: "Reply with",
          stickers: [
            { emoji: "🔥", label: "Fire" },
            { emoji: "😍", label: "Love" },
            { emoji: "🙌", label: "Yes" },
            { emoji: "💃", label: "Dance" },
            { emoji: "🌅", label: "Vibes" },
          ],
        },
      },
    },
  },
});
