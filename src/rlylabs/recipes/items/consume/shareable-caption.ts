import { defineRecipe } from "../../define";

export const shareableCaption = defineRecipe({
  id: "shareable-caption",
  intent: "consume",
  title: "Shareable caption",
  description:
    "Tap-to-copy caption block with share targets — post-ready copy for mobile social.",
  prompt: "Give me the caption to copy and share for this post",
  tags: [
    "caption",
    "copy",
    "share",
    "social",
    "post",
    "text",
    "clipboard",
    "consume",
    "communicate",
    "mobile",
    "instagram",
    "tiktok",
  ],
  atomKinds: ["media", "action", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["image", "caption", "share"],
      },
      image: {
        type: "ImageCard",
        props: {
          title: "Neon rooftop",
          caption: "Shot on iPhone · Jun 14",
          aspect: "wide",
          tone: "violet",
        },
      },
      caption: {
        type: "CopyBlock",
        props: {
          title: "Caption",
          text: "Golden hour on the roof. French pop, city lights, and the best crew. 🌆🎶\n\n#rooftop #sunset #frenchpop",
          copyLabel: "Copy caption",
        },
      },
      share: {
        type: "ShareRow",
        props: {
          label: "Share to",
          targets: [
            { label: "Copy", icon: "copy" },
            { label: "Message", icon: "messageCircle" },
            { label: "Stories", icon: "image" },
            { label: "Post", icon: "send" },
          ],
        },
      },
    },
  },
});
