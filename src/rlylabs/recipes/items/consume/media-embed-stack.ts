import { defineRecipe } from "../../define";

export const mediaEmbedStack = defineRecipe({
  id: "media-embed-stack",
  intent: "consume",
  title: "Media embed stack",
  description:
    "Layers Spotify, TikTok, and YouTube embeds for a mixed-media listening and watching moment.",
  prompt: "Drop in the Spotify playlist, TikTok, and YouTube video for this drop",
  tags: [
    "embed",
    "spotify",
    "tiktok",
    "youtube",
    "video",
    "music",
    "playlist",
    "reel",
    "consume",
    "media",
    "mobile",
    "social",
  ],
  atomKinds: ["media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "spotify", "tiktok", "youtube"],
      },
      header: {
        type: "Hero",
        props: {
          eyebrow: "Tonight's drop",
          title: "Neon Rooftop Set",
          subtitle: "Playlist + behind-the-scenes reel + full live cut",
          icon: "music",
        },
      },
      spotify: {
        type: "SpotifyEmbed",
        props: {
          embedType: "playlist",
          embedId: "37i9dQZF1DX4sWSpwq3LiO",
          height: 352,
        },
      },
      tiktok: {
        type: "TikTokEmbed",
        props: { videoId: "7234567890123456789" },
      },
      youtube: {
        type: "YouTubeEmbed",
        props: {
          videoId: "dQw4w9WgXcQ",
          title: "Full rooftop set",
        },
      },
    },
  },
});
