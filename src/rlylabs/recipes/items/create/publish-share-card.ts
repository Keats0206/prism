import { defineRecipe } from "../../define";

export const publishShareCard = defineRecipe({
  id: "publish-share-card",
  intent: "create",
  title: "Publish / share",
  description:
    "Turns a creation into a shareable object with preview and distribution actions.",
  prompt: "Share this playlist I just made with friends",
  tags: [
    "publish",
    "share",
    "distribute",
    "send",
    "link",
    "social",
    "artifact",
    "create",
    "export",
    "friends",
    "copy",
    "post",
  ],
  atomKinds: ["generative", "action", "social"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: null },
        children: ["hero", "detail", "share", "secondary"],
      },
      hero: {
        type: "Hero",
        props: {
          eyebrow: "Ready to share",
          title: "Late Night French Pop",
          subtitle: "18 tracks · 1h 12m · made for rooftop sunsets",
          icon: "share",
        },
      },
      detail: {
        type: "Copy",
        props: {
          text: "Anyone with the link can listen and save. You can revoke access anytime.",
        },
      },
      share: {
        type: "Action",
        props: { label: "Copy share link", variant: "primary", icon: "link" },
      },
      secondary: {
        type: "Action",
        props: { label: "Send to group chat", variant: "secondary", icon: "send" },
      },
    },
  },
});
