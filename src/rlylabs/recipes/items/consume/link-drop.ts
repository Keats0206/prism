import { defineRecipe } from "../../define";

export const linkDrop = defineRecipe({
  id: "link-drop",
  title: "Link drop",
  intent: "consume",
  description:
    "Rich link preview with SoundCloud and Instagram embeds — mixed social link card.",
  prompt: "Share the article, SoundCloud track, and Instagram post together",
  tags: [
    "link",
    "preview",
    "url",
    "share",
    "soundcloud",
    "instagram",
    "embed",
    "consume",
    "media",
    "mobile",
    "social",
  ],
  atomKinds: ["media", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "link", "soundcloud", "instagram"],
      },
      header: {
        type: "ScreenHeader",
        props: {
          eyebrow: "Shared with you",
          title: "Weekend picks",
          metaLeft: "3 links",
          metaRight: null,
        },
      },
      link: {
        type: "LinkCard",
        props: {
          title: "The best rooftop sets in NYC this summer",
          description: "A curated guide to sunset listening spots across the city.",
          url: "https://example.com/rooftop-guide",
          domain: "example.com",
        },
      },
      soundcloud: {
        type: "SoundCloudEmbed",
        props: {
          url: "https://soundcloud.com/forss/flickermood",
        },
      },
      instagram: {
        type: "InstagramEmbed",
        props: {
          shortcode: "C8abc123def",
        },
      },
    },
  },
});
