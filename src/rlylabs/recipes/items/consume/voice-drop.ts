import { defineRecipe } from "../../define";

export const voiceDrop = defineRecipe({
  id: "voice-drop",
  intent: "consume",
  title: "Voice drop",
  description:
    "Voice note with audio player and share row — mobile voice memo consumption.",
  prompt: "Listen to the voice note from the host and share it",
  tags: [
    "voice",
    "audio",
    "memo",
    "message",
    "listen",
    "share",
    "consume",
    "media",
    "mobile",
    "podcast",
  ],
  atomKinds: ["media", "social"],
  spec: {
    root: "screen",
    elements: {
      screen: {
        type: "Screen",
        props: { maxWidth: "md" },
        children: ["banner", "voice", "player", "share"],
      },
      banner: {
        type: "Banner",
        props: {
          title: "New voice drop",
          message: "Recorded 2 hours ago from the rooftop",
          tone: "accent",
          icon: "mic",
        },
      },
      voice: {
        type: "VoiceNote",
        props: {
          src: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
          title: "Host intro",
          duration: "0:42",
          tone: "accent",
        },
      },
      player: {
        type: "AudioPlayer",
        props: {
          src: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3",
          title: "Full message",
          subtitle: "From Alex · Event host",
          duration: "1:24",
        },
      },
      share: {
        type: "ShareRow",
        props: {
          label: "Forward to",
          targets: [
            { label: "Copy", icon: "copy" },
            { label: "Message", icon: "messageCircle" },
            { label: "Share", icon: "share" },
          ],
        },
      },
    },
  },
});
