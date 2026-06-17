import { defineRecipe } from "../../define";

export const musicEmbedMix = defineRecipe({
  id: "music-embed-mix",
  intent: "consume",
  title: "Music embed mix",
  description:
    "Apple Music, Bandcamp, and Vimeo in one block — indie artist release page.",
  prompt: "Embed the Apple Music album, Bandcamp track, and music video",
  tags: [
    "apple music",
    "bandcamp",
    "vimeo",
    "embed",
    "music",
    "video",
    "album",
    "consume",
    "media",
    "mobile",
    "indie",
  ],
  atomKinds: ["media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["hero", "apple", "bandcamp", "vimeo"],
      },
      hero: {
        type: "Hero",
        props: {
          eyebrow: "New release",
          title: "Neon Hours",
          subtitle: "Out now on all platforms",
          icon: "music",
        },
      },
      apple: {
        type: "AppleMusicEmbed",
        props: {
          url: "https://music.apple.com/us/album/neon-hours/1234567890",
        },
      },
      bandcamp: {
        type: "BandcampEmbed",
        props: {
          url: "https://artistname.bandcamp.com/album/neon-hours",
        },
      },
      vimeo: {
        type: "VimeoEmbed",
        props: {
          videoId: "76979871",
          title: "Neon Hours — official video",
        },
      },
    },
  },
});
