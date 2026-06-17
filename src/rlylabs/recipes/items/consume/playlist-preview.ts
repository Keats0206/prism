import { defineRecipe } from "../../define";

export const playlistPreview = defineRecipe({
  id: "playlist-preview",
  intent: "consume",
  title: "Playlist preview",
  description:
    "Spotify-style track list with inline player — preview a curated playlist on mobile.",
  prompt: "Show me the tracks in this sunset playlist with a player at the top",
  tags: [
    "playlist",
    "music",
    "tracks",
    "spotify",
    "listen",
    "preview",
    "queue",
    "consume",
    "media",
    "mobile",
    "audio",
  ],
  atomKinds: ["media"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["header", "player", "tracks"],
      },
      header: {
        type: "FullscreenHero",
        props: {
          eyebrow: "Playlist",
          title: "Sunset French Pop",
          subtitle: "18 tracks · 1h 12m",
          tone: "violet",
          aspect: "square",
        },
      },
      player: {
        type: "SpotifyEmbed",
        props: {
          embedType: "playlist",
          embedId: "37i9dQZF1DX4sWSpwq3LiO",
        },
      },
      tracks: {
        type: "Stack",
        props: { title: "Up next" },
        children: ["track1", "track2", "track3", "track4"],
      },
      track1: {
        type: "MusicRow",
        props: {
          title: "La Femme d'Argent",
          subtitle: "Air",
          duration: "7:09",
          tone: "violet",
        },
      },
      track2: {
        type: "MusicRow",
        props: {
          title: "Les Parapluies",
          subtitle: "Melanie Pain",
          duration: "3:42",
          tone: "rose",
        },
      },
      track3: {
        type: "MusicRow",
        props: {
          title: "Dans la nuit",
          subtitle: "L'Impératrice",
          duration: "4:18",
          tone: "sky",
        },
      },
      track4: {
        type: "MusicRow",
        props: {
          title: "Tombée de la nuit",
          subtitle: "Corine",
          duration: "3:55",
          tone: "amber",
        },
      },
    },
  },
});
