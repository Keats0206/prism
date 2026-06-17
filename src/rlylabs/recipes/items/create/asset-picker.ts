import { defineRecipe } from "../../define";

export const assetPicker = defineRecipe({
  id: "asset-picker",
  intent: "create",
  title: "Asset picker",
  description:
    "Pull from photos, links, notes, calendar, friends, location, or taste.",
  prompt: "Pull in photos and links to use for my trip plan",
  tags: [
    "assets",
    "photos",
    "links",
    "notes",
    "calendar",
    "friends",
    "location",
    "taste",
    "picker",
    "source",
    "create",
    "context",
  ],
  atomKinds: ["input", "generative"],
  spec: {
    root: "block",
    elements: {
      block: {
        type: "Stack",
        props: { title: "Sources" },
        children: ["gallery", "recent"],
      },
      gallery: {
        type: "Gallery",
        props: {
          layout: "grid",
          tiles: [
            { label: "Beach", caption: "Saved photo", tone: "sky", src: null },
            { label: "Cafe", caption: "From camera roll", tone: "amber", src: null },
            { label: "Map pin", caption: "Lisbon", tone: "emerald", src: null },
            { label: "Playlist", caption: "Road trip", tone: "violet", src: null },
          ],
        },
      },
      recent: {
        type: "Collection",
        props: {
          presentation: "plain",
          header: { title: "Recent context", subtitle: "Tap to add", trailing: "4" },
          items: [
            {
              cells: [
                { kind: "text", value: "Notion trip outline" },
                { kind: "badge", value: "Link" },
              ],
            },
            {
              cells: [
                { kind: "text", value: "Flight Thu 9:40am" },
                { kind: "badge", value: "Calendar" },
              ],
            },
            {
              cells: [
                { kind: "text", value: "Alex saved same restaurant" },
                { kind: "badge", value: "Friend" },
              ],
            },
          ],
        },
      },
    },
  },
});
