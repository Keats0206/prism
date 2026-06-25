"use client";

import { Children, useState } from "react";
import { defineCatalog } from "@json-render/core";
import { defineRegistry, useBoundProp } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { Icon, iconNames } from "./icons";
import {
  actionVariants,
  aspectHeights,
  bannerTones,
  boardAccents,
  chipTones,
  circularProgressTones,
  explanationCardTones,
  fabVariants,
  metricTones,
  optionCardTones,
  pillTones,
  priceTagTones,
  quoteTones,
  selectedInteractive,
  selectedPollBar,
  timelineDotTones,
  heroBackdropGradients,
  toneGradients,
  unselectedInteractive,
  unselectedPollBar,
  voiceNoteTones,
} from "./theme";

/**
 * Drives an interactive component from the global state model when the prop is
 * bound via `{ $bindState: "/path" }`, and falls back to component-local state
 * otherwise. The binding path is stable for a given element across renders, so
 * the conditional return below does not change hook order. The bound setter
 * takes a concrete value (no functional updater), so callers must compute the
 * next value from the returned current value.
 */
function useBindableState<T>(
  propValue: T,
  bindingPath: string | undefined,
): [T, (next: T) => void] {
  const [bound, setBound] = useBoundProp<T>(propValue, bindingPath);
  const [local, setLocal] = useState<T>(propValue);
  if (bindingPath != null) {
    return [(bound ?? propValue) as T, setBound as (next: T) => void];
  }
  return [local, setLocal];
}

function spotifyEmbedSrc(
  url?: string | null,
  embedId?: string | null,
  embedType?: string | null,
) {
  if (embedId) {
    const type = embedType ?? "track";
    return `https://open.spotify.com/embed/${type}/${embedId}`;
  }

  if (!url) {
    return null;
  }

  const match = url.match(
    /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
  );

  return match
    ? `https://open.spotify.com/embed/${match[1]}/${match[2]}`
    : url;
}

function youtubeVideoId(url?: string | null, videoId?: string | null) {
  if (videoId) {
    return videoId;
  }

  if (!url) {
    return null;
  }

  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
  );

  return match?.[1] ?? null;
}

function tiktokVideoId(url?: string | null, videoId?: string | null) {
  if (videoId) {
    return videoId;
  }

  if (!url) {
    return null;
  }

  const match = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);

  return match?.[1] ?? null;
}

function soundcloudEmbedSrc(url?: string | null) {
  if (!url) {
    return null;
  }

  const encoded = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encoded}&color=%23121212&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`;
}

function instagramShortcode(url?: string | null, shortcode?: string | null) {
  if (shortcode) {
    return shortcode;
  }

  if (!url) {
    return null;
  }

  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);

  return match?.[1] ?? null;
}

function appleMusicEmbedSrc(url?: string | null) {
  if (!url) {
    return null;
  }

  if (url.includes("embed.music.apple.com")) {
    return url;
  }

  return url.replace(
    /music\.apple\.com\/([a-z]{2})\/(song|album|playlist)\/[^/]+\/(\d+)/,
    "https://embed.music.apple.com/$1/$2/$3",
  );
}

function vimeoVideoId(url?: string | null, videoId?: string | null) {
  if (videoId) {
    return videoId;
  }

  if (!url) {
    return null;
  }

  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);

  return match?.[1] ?? null;
}

function bandcampEmbedSrc(url?: string | null) {
  if (!url) {
    return null;
  }

  if (url.includes("EmbeddedPlayer")) {
    return url;
  }

  const encoded = encodeURIComponent(url);
  return `https://bandcamp.com/EmbeddedPlayer/album=0/size=large/bgcol=ffffff/linkcol=0687f5/tracklist=false/artwork=small/transparent=true/?url=${encoded}`;
}

function qrCodeImageUrl(value: string, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
}

function domainFromUrl(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export const catalog = defineCatalog(schema, {
  components: {
    Screen: {
      props: z.object({
        maxWidth: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      description: "Generic screen container that arranges assembled sections",
    },
    ScreenHeader: {
      props: z.object({
        eyebrow: z.string().nullable(),
        title: z.string(),
        metaLeft: z.string().nullable(),
        metaRight: z.string().nullable(),
      }),
      description: "Generic page header with optional summary metadata",
    },
    Stack: {
      props: z.object({ title: z.string().nullable() }),
      description: "Vertical layout container",
    },
    Pill: {
      props: z.object({
        label: z.string(),
        tone: z.enum(["neutral", "accent", "success"]),
      }),
      description: "Compact status chip",
    },
    Copy: {
      props: z.object({ text: z.string() }),
      description: "Simple text block",
    },
    Hero: {
      props: z.object({
        eyebrow: z.string(),
        title: z.string(),
        subtitle: z.string(),
        icon: z.enum(iconNames).nullable(),
      }),
      description: "Consumer app hero summary",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        detail: z.string().nullable(),
        tone: z.enum(["neutral", "accent", "success"]),
        icon: z.enum(iconNames).nullable(),
      }),
      description: "Compact metric card",
    },
    Row: {
      props: z.object({
        title: z.string(),
        subtitle: z.string(),
        trailing: z.string().nullable(),
        icon: z.enum(iconNames).nullable(),
      }),
      description: "List row for app data",
    },
    Action: {
      props: z.object({
        label: z.string(),
        variant: z.enum(["primary", "secondary"]),
        icon: z.enum(iconNames).nullable(),
      }),
      description: "Call to action button",
    },
    Progress: {
      props: z.object({
        label: z.string().nullable().optional(),
        value: z.number().min(0).max(100),
        leftLabel: z.string().nullable().optional(),
        rightLabel: z.string().nullable().optional(),
      }),
      description: "Progress indicator",
    },
    Collection: {
      props: z.object({
        presentation: z.enum(["card", "plain"]),
        header: z.object({
          title: z.string(),
          subtitle: z.string().nullable(),
          trailing: z.string().nullable(),
        }),
        items: z.array(
          z.object({
            cells: z.array(
              z.object({
                kind: z.enum([
                  "label",
                  "field",
                  "toggle",
                  "text",
                  "time",
                  "badge",
                  "progress",
                ]),
                value: z.union([z.string(), z.number()]).nullable().optional(),
                placeholder: z.string().nullable().optional(),
                icon: z.enum(iconNames).nullable().optional(),
                checked: z.boolean().nullable().optional(),
              }),
            ),
          }),
        ),
      }),
      description:
        "Generic collection intent assembled into a section, header, and repeated data rows",
    },
    Field: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.record(z.string(), z.unknown())]).nullable(),
        placeholder: z.string().nullable(),
      }),
      description: "Text input field",
    },
    Flow: {
      props: z.object({
        mode: z.enum(["single", "repeatable"]),
        initialStep: z.string(),
        steps: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            subtitle: z.string().nullable().optional(),
            blocks: z.array(
              z.object({
                type: z.enum(["imageUpload", "image", "text", "button"]),
                bind: z.string().nullable().optional(),
                source: z.string().nullable().optional(),
                value: z.string().nullable().optional(),
                label: z.string().nullable().optional(),
                accept: z.string().nullable().optional(),
                goTo: z.string().nullable().optional(),
                reset: z.boolean().nullable().optional(),
              }),
            ),
          }),
        ),
      }),
      description:
        "Generic multi-step flow with bound user input, navigation, and optional reset loops",
    },
    Board: {
      props: z.object({
        columns: z.array(
          z.object({
            title: z.string(),
            accent: z.enum(["neutral", "accent", "success"]).nullable().optional(),
            cards: z.array(
              z.object({
                title: z.string(),
                subtitle: z.string().nullable().optional(),
                meta: z.string().nullable().optional(),
                badge: z.string().nullable().optional(),
              }),
            ),
          }),
        ),
      }),
      description:
        "Horizontally scrolling kanban board with columns of cards for pipelines",
    },
    Gallery: {
      props: z.object({
        layout: z.enum(["grid", "masonry"]).nullable().optional(),
        tiles: z.array(
          z.object({
            label: z.string().nullable().optional(),
            caption: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
            src: z.string().nullable().optional(),
          }),
        ),
      }),
      description:
        "Moodboard-style image/color grid of tiles with optional labels and captions",
    },
    ChipRow: {
      props: z.object({
        label: z.string().nullable().optional(),
        chips: z.array(
          z.object({
            label: z.string(),
            selected: z.boolean().nullable().optional(),
            tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
          }),
        ),
      }),
      description:
        "Horizontal row of selectable choice chips for mood, tone, style, or constraints",
    },
    CopyBlock: {
      props: z.object({
        title: z.string().nullable().optional(),
        text: z.string(),
        copyLabel: z.string().nullable().optional(),
      }),
      description:
        "Copyable text section with tap-to-copy — captions, scripts, share text",
    },
    Slider: {
      props: z.object({
        slides: z.array(
          z.object({
            src: z.string().nullable().optional(),
            title: z.string().nullable().optional(),
            caption: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
        aspect: z.enum(["square", "wide", "tall"]).nullable().optional(),
      }),
      description:
        "Swipeable horizontal carousel for images or cards — mobile-first stories",
    },
    Map: {
      props: z.object({
        label: z.string(),
        address: z.string().nullable().optional(),
        lat: z.number(),
        lng: z.number(),
        zoom: z.number().min(1).max(18).nullable().optional(),
      }),
      description: "Location map card with pin — venues, meetups, directions",
    },
    VideoPlayer: {
      props: z.object({
        src: z.string(),
        poster: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
        aspect: z.enum(["square", "wide", "tall"]).nullable().optional(),
      }),
      description: "Inline video player with poster and native controls",
    },
    AudioPlayer: {
      props: z.object({
        src: z.string(),
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        duration: z.string().nullable().optional(),
      }),
      description: "Compact audio player row with play/pause and scrub bar",
    },
    MusicRow: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        artworkSrc: z.string().nullable().optional(),
        tone: z
          .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
          .nullable()
          .optional(),
        duration: z.string().nullable().optional(),
      }),
      description:
        "Spotify-style track row with artwork, title, artist, and play affordance",
    },
    SpotifyEmbed: {
      props: z.object({
        url: z.string().nullable().optional(),
        embedId: z.string().nullable().optional(),
        embedType: z
          .enum(["track", "album", "playlist", "episode", "show"])
          .nullable()
          .optional(),
        height: z.number().nullable().optional(),
      }),
      description: "Embedded Spotify player for tracks, albums, or playlists",
    },
    TikTokEmbed: {
      props: z.object({
        url: z.string().nullable().optional(),
        videoId: z.string().nullable().optional(),
      }),
      description: "Embedded TikTok video card",
    },
    YouTubeEmbed: {
      props: z.object({
        url: z.string().nullable().optional(),
        videoId: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
      }),
      description: "Embedded YouTube video player",
    },
    LinkCard: {
      props: z.object({
        title: z.string(),
        description: z.string().nullable().optional(),
        url: z.string(),
        imageSrc: z.string().nullable().optional(),
        domain: z.string().nullable().optional(),
      }),
      description: "Rich link preview card for shared URLs and deep links",
    },
    Quote: {
      props: z.object({
        text: z.string(),
        attribution: z.string().nullable().optional(),
        tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
      }),
      description: "Pull quote or testimonial block with attribution",
    },
    MediaStrip: {
      props: z.object({
        label: z.string().nullable().optional(),
        items: z.array(
          z.object({
            label: z.string(),
            src: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
      }),
      description:
        "Horizontally scrolling media row — stories, reels, thumbnails",
    },
    ImageCard: {
      props: z.object({
        src: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
        caption: z.string().nullable().optional(),
        aspect: z.enum(["square", "wide", "tall"]).nullable().optional(),
        tone: z
          .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
          .nullable()
          .optional(),
      }),
      description:
        "Full-bleed image card with title and caption — mobile feed posts",
    },
    Countdown: {
      props: z.object({
        label: z.string(),
        targetDate: z.string(),
        detail: z.string().nullable().optional(),
      }),
      description:
        "Event countdown timer — launches, drops, meetups, deadlines",
    },
    AvatarRow: {
      props: z.object({
        label: z.string().nullable().optional(),
        people: z.array(
          z.object({
            name: z.string(),
            subtitle: z.string().nullable().optional(),
            src: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
      }),
      description:
        "Horizontal row of people with avatars — guests, collaborators, crew",
    },
    ShareRow: {
      props: z.object({
        label: z.string().nullable().optional(),
        targets: z.array(
          z.object({
            label: z.string(),
            icon: z.enum(iconNames).nullable().optional(),
          }),
        ),
      }),
      description:
        "iOS-style share sheet row of tap targets — copy, message, post",
    },
    SoundCloudEmbed: {
      props: z.object({
        url: z.string(),
        height: z.number().nullable().optional(),
      }),
      description: "Embedded SoundCloud track or playlist player",
    },
    InstagramEmbed: {
      props: z.object({
        url: z.string().nullable().optional(),
        shortcode: z.string().nullable().optional(),
      }),
      description: "Embedded Instagram post or reel card",
    },
    Poll: {
      props: z.object({
        question: z.string(),
        options: z.array(
          z.object({
            label: z.string(),
            votes: z.number().nullable().optional(),
          }),
        ),
      }),
      description: "Tap-to-vote poll with option bars — quick audience input",
    },
    SegmentedControl: {
      props: z.object({
        segments: z.array(
          z.object({
            label: z.string(),
            selected: z.boolean().nullable().optional(),
          }),
        ),
        // Selected segment index. Bind with { "$bindState": "/path" } to track
        // the choice in state; falls back to `selected` / local state otherwise.
        value: z.number().nullable().optional(),
      }),
      description:
        "Mobile segmented control for switching views or filters",
    },
    Banner: {
      props: z.object({
        title: z.string(),
        message: z.string().nullable().optional(),
        tone: z.enum(["neutral", "accent", "success", "warning"]).nullable().optional(),
        icon: z.enum(iconNames).nullable().optional(),
      }),
      description:
        "Inline alert or announcement banner — updates, promos, warnings",
    },
    Timeline: {
      props: z.object({
        label: z.string().nullable().optional(),
        events: z.array(
          z.object({
            time: z.string(),
            title: z.string(),
            detail: z.string().nullable().optional(),
            tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
          }),
        ),
      }),
      description:
        "Vertical event timeline — itineraries, release schedules, history",
    },
    Rating: {
      props: z.object({
        label: z.string().nullable().optional(),
        value: z.number().min(0).max(5),
        max: z.number().min(1).max(5).nullable().optional(),
        detail: z.string().nullable().optional(),
      }),
      description: "Star rating display — reviews, scores, satisfaction",
    },
    VoiceNote: {
      props: z.object({
        src: z.string(),
        title: z.string().nullable().optional(),
        duration: z.string().nullable().optional(),
        tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
      }),
      description:
        "Voice message player row with waveform affordance — mobile voice memos",
    },
    ReactionBar: {
      props: z.object({
        reactions: z.array(
          z.object({
            emoji: z.string(),
            count: z.number().nullable().optional(),
          }),
        ),
      }),
      description: "Tap reaction row — heart, fire, clap counts on posts",
    },
    PhotoGrid: {
      props: z.object({
        photos: z.array(
          z.object({
            src: z.string().nullable().optional(),
            label: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
        columns: z.enum(["2", "3"]).nullable().optional(),
      }),
      description: "Tap-friendly photo grid — 2×2 or 3-column album layouts",
    },
    QRCode: {
      props: z.object({
        value: z.string(),
        label: z.string().nullable().optional(),
        detail: z.string().nullable().optional(),
      }),
      description: "Scannable QR code card — join links, tickets, WiFi",
    },
    AppleMusicEmbed: {
      props: z.object({
        url: z.string(),
        height: z.number().nullable().optional(),
      }),
      description: "Embedded Apple Music song, album, or playlist",
    },
    BandcampEmbed: {
      props: z.object({
        url: z.string(),
        height: z.number().nullable().optional(),
      }),
      description: "Embedded Bandcamp track or album player",
    },
    VimeoEmbed: {
      props: z.object({
        url: z.string().nullable().optional(),
        videoId: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
      }),
      description: "Embedded Vimeo video player",
    },
    StickerRow: {
      props: z.object({
        label: z.string().nullable().optional(),
        stickers: z.array(
          z.object({
            emoji: z.string(),
            label: z.string().nullable().optional(),
          }),
        ),
      }),
      description: "Horizontal emoji sticker picker — reactions and replies",
    },
    FullscreenHero: {
      props: z.object({
        eyebrow: z.string().nullable().optional(),
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        src: z.string().nullable().optional(),
        tone: z
          .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
          .nullable()
          .optional(),
        aspect: z.enum(["square", "wide", "tall"]).nullable().optional(),
      }),
      description:
        "Spotify-style cover header — square artwork, title, and metadata on a tone gradient",
    },
    Stepper: {
      props: z.object({
        label: z.string(),
        value: z.number(),
        min: z.number().nullable().optional(),
        max: z.number().nullable().optional(),
        step: z.number().nullable().optional(),
      }),
      description: "Plus/minus quantity stepper — tickets, servings, guests",
    },
    FAB: {
      props: z.object({
        label: z.string().nullable().optional(),
        icon: z.enum(iconNames).nullable().optional(),
        variant: z.enum(["primary", "accent"]).nullable().optional(),
      }),
      description: "Floating action button affordance — primary mobile CTA",
    },
    CommentThread: {
      props: z.object({
        label: z.string().nullable().optional(),
        comments: z.array(
          z.object({
            author: z.string(),
            text: z.string(),
            time: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
      }),
      description: "Nested comment list — post feedback and discussion",
    },
    MentionRow: {
      props: z.object({
        label: z.string().nullable().optional(),
        mentions: z.array(
          z.object({
            handle: z.string(),
            name: z.string().nullable().optional(),
            src: z.string().nullable().optional(),
            tone: z
              .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
              .nullable()
              .optional(),
          }),
        ),
      }),
      description: "Horizontal @mention chips with avatars — tagged people",
    },
    PriceTag: {
      props: z.object({
        price: z.string(),
        compareAt: z.string().nullable().optional(),
        label: z.string().nullable().optional(),
        tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
      }),
      description: "Product or ticket pricing display with optional compare-at",
    },
    TicketCard: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        code: z.string().nullable().optional(),
        seat: z.string().nullable().optional(),
        date: z.string().nullable().optional(),
        tone: z
          .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
          .nullable()
          .optional(),
      }),
      description: "Event pass card with code and seat — mobile wallet style",
    },
    CalendarSlot: {
      props: z.object({
        date: z.string(),
        time: z.string(),
        label: z.string(),
        selected: z.boolean().nullable().optional(),
      }),
      description: "Selectable date/time slot card — booking and scheduling",
    },
    RSVP: {
      props: z.object({
        eventTitle: z.string().nullable().optional(),
        options: z.array(
          z.object({
            label: z.string(),
            count: z.number().nullable().optional(),
            selected: z.boolean().nullable().optional(),
          }),
        ),
      }),
      description: "Going / maybe / no RSVP picker — event attendance",
    },
    TabBar: {
      props: z.object({
        tabs: z.array(
          z.object({
            label: z.string(),
            icon: z.enum(iconNames).nullable().optional(),
            selected: z.boolean().nullable().optional(),
          }),
        ),
      }),
      description: "Bottom tab bar preview — mobile app navigation",
    },
    DirectionsCard: {
      props: z.object({
        label: z.string(),
        address: z.string(),
        url: z.string().nullable().optional(),
        lat: z.number().nullable().optional(),
        lng: z.number().nullable().optional(),
      }),
      description: "Open in Maps directions row — venue navigation",
    },
    Accordion: {
      props: z.object({
        items: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
            open: z.boolean().nullable().optional(),
          }),
        ),
      }),
      description: "Expandable FAQ sections — mobile-friendly collapsible content",
    },
    StatGrid: {
      props: z.object({
        stats: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            detail: z.string().nullable().optional(),
          }),
        ),
        columns: z.enum(["2", "3"]).nullable().optional(),
      }),
      description: "2×2 or 3-column stat grid — compact mobile metrics",
    },
    BeforeAfter: {
      props: z.object({
        label: z.string().nullable().optional(),
        beforeSrc: z.string().nullable().optional(),
        afterSrc: z.string().nullable().optional(),
        beforeLabel: z.string().nullable().optional(),
        afterLabel: z.string().nullable().optional(),
        position: z.number().min(0).max(100).nullable().optional(),
        tone: z
          .enum(["rose", "amber", "sky", "emerald", "violet", "stone"])
          .nullable()
          .optional(),
      }),
      description: "Drag comparison slider — transformations and progress photos",
    },
    Tabs: {
      props: z.object({
        tabs: z.array(
          z.object({
            label: z.string(),
            selected: z.boolean().nullable().optional(),
          }),
        ),
        // Active tab index. Bind with { "$bindState": "/path" } to track the
        // active tab in state; falls back to `selected` / local state otherwise.
        value: z.number().nullable().optional(),
      }),
      description:
        "Content tabs with switchable panels — use children for each tab panel body",
    },
    RangeSlider: {
      props: z.object({
        label: z.string().nullable().optional(),
        value: z.number().min(0).max(100),
        min: z.number().nullable().optional(),
        max: z.number().nullable().optional(),
        step: z.number().nullable().optional(),
        leftLabel: z.string().nullable().optional(),
        rightLabel: z.string().nullable().optional(),
      }),
      description:
        "Continuous value slider for mood dials, budget, urgency, or intensity",
    },
    CircularProgress: {
      props: z.object({
        label: z.string().nullable().optional(),
        value: z.number().min(0).max(100),
        detail: z.string().nullable().optional(),
        size: z.enum(["sm", "md", "lg"]).nullable().optional(),
        tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
      }),
      description:
        "Circular progress ring for streaks, goals, confidence, or completion",
    },
    OptionCard: {
      props: z.object({
        label: z.string().nullable().optional(),
        layout: z.enum(["stack", "row"]).nullable().optional(),
        options: z.array(
          z.object({
            title: z.string(),
            subtitle: z.string().nullable().optional(),
            tradeoff: z.string().nullable().optional(),
            badge: z.string().nullable().optional(),
            selected: z.boolean().nullable().optional(),
            tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
          }),
        ),
      }),
      description:
        "Option comparison card — 2-4 choices with tradeoffs for decisions",
    },
    ExplanationCard: {
      props: z.object({
        label: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
        context: z.string().nullable().optional(),
        reasons: z.array(z.string()),
        icon: z.enum(iconNames).nullable().optional(),
        tone: z.enum(["neutral", "accent", "success"]).nullable().optional(),
      }),
      description:
        'Structured "Why this?" explanation with context and reason bullets',
    },
  },
  actions: {},
});

export const { registry } = defineRegistry(catalog, {
  components: {
    Screen: ({ children }) => (
      <div className="flex w-full min-w-0 flex-col">{children}</div>
    ),
    ScreenHeader: ({ props }) => (
      <header className="flex flex-col gap-3">
        {props.eyebrow ? (
          <p className="text-xs font-medium text-subtle">{props.eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {props.title}
        </h1>
        {props.metaLeft || props.metaRight ? (
          <div className="flex items-center justify-between gap-4 text-sm text-muted">
            <span>{props.metaLeft}</span>
            <span>{props.metaRight}</span>
          </div>
        ) : null}
      </header>
    ),
    Stack: ({ props, children }) => (
      <section className="w-full border-b border-border bg-surface py-4">
        {props.title ? (
          <h2 className="mb-3 px-4 text-xs font-medium text-subtle">
            {props.title}
          </h2>
        ) : null}
        <div className="flex flex-col gap-2 px-4">{children}</div>
      </section>
    ),
    Pill: ({ props }) => (
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${pillTones[props.tone]}`}
        >
          {props.label}
        </span>
      ),
    Copy: ({ props }) => (
      <p className="text-sm leading-6 text-fg-secondary">{props.text}</p>
    ),
    Hero: ({ props }) => (
      <div className="rounded-2xl border border-border-subtle bg-surface-muted px-4 py-3 text-fg">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.eyebrow}
          </p>
          {props.icon ? (
            <div className="rounded-xl bg-surface p-2 shadow-sm">
              <Icon name={props.icon} className="size-4 text-muted" />
            </div>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{props.title}</h3>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted">
          {props.subtitle}
        </p>
      </div>
    ),
    Metric: ({ props }) => (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${metricTones[props.tone]}`}
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-50">
              {props.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight">
              {props.value}
            </p>
            {props.detail ? (
              <p className="text-xs opacity-60">{props.detail}</p>
            ) : null}
          </div>
          {props.icon ? (
            <Icon name={props.icon} className="size-4 opacity-50" />
          ) : null}
        </div>
      ),
    Row: ({ props }) => (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border-subtle bg-surface px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          {props.icon ? (
            <div className="rounded-xl bg-surface-elevated p-2">
              <Icon name={props.icon} className="size-3.5 text-muted" />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium text-fg">{props.title}</p>
            <p className="mt-0.5 text-xs text-subtle">{props.subtitle}</p>
          </div>
        </div>
        {props.trailing ? (
          <span className="shrink-0 text-sm font-medium text-fg-secondary">
            {props.trailing}
          </span>
        ) : null}
      </div>
    ),
    Action: ({ props, emit }) => (
        <button
          type="button"
          onClick={() => emit("press")}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium ${actionVariants[props.variant]}`}
        >
          {props.icon ? <Icon name={props.icon} className="size-4" /> : null}
          {props.label}
        </button>
      ),
    Progress: ({ props }) => {
      const hasLabels = props.label || props.leftLabel || props.rightLabel;

      return (
        <div className={hasLabels ? "border-b border-border bg-surface px-4 py-4" : ""}>
        {hasLabels ? (
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>{props.label ?? props.leftLabel}</span>
            <span>{props.rightLabel ?? `${props.value}%`}</span>
          </div>
        ) : null}
        <div className="h-1 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${props.value}%` }}
          />
        </div>
      </div>
      );
    },
    Collection: ({ props }) => {
      const [checkedCells, setCheckedCells] = useState(() => {
        const initial = new Set<string>();

        props.items.forEach((item, itemIndex) => {
          item.cells.forEach((cell, cellIndex) => {
            if (cell.kind === "toggle" && cell.checked) {
              initial.add(`${itemIndex}:${cellIndex}`);
            }
          });
        });

        return initial;
      });
      const columnForKind = (kind: (typeof props.items)[number]["cells"][number]["kind"]) => {
        if (kind === "toggle") return "2.5rem";
        if (kind === "time") return "3.25rem";
        if (kind === "badge") return "4.5rem";
        if (kind === "progress") return "5rem";
        if (kind === "label") return "minmax(2.25rem, max-content)";

        return "minmax(0, 1fr)";
      };

      const body = (
        <>
          <div className="flex items-start justify-between gap-4 px-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-fg">
                {props.header.title}
              </h2>
              {props.header.subtitle ? (
                <p className="mt-0.5 text-xs text-subtle">
                  {props.header.subtitle}
                </p>
              ) : null}
            </div>
            {props.header.trailing ? (
              <span className="pt-0.5 text-xs text-subtle">
                {props.header.trailing}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-2 px-4">
            {props.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="grid min-h-10 items-center gap-2 rounded-xl bg-surface-muted px-3"
                style={{
                  gridTemplateColumns: item.cells
                    .map((cell) => columnForKind(cell.kind))
                    .join(" "),
                }}
              >
                {item.cells.map((cell, cellIndex) => {
                  if (cell.kind === "toggle") {
                    const cellKey = `${itemIndex}:${cellIndex}`;
                    const isChecked = checkedCells.has(cellKey);

                    return (
                      <button
                        key={cellIndex}
                        type="button"
                        aria-pressed={isChecked}
                        onClick={() => {
                          setCheckedCells((current) => {
                            const next = new Set(current);

                            if (next.has(cellKey)) {
                              next.delete(cellKey);
                            } else {
                              next.add(cellKey);
                            }

                            return next;
                          });
                        }}
                        className={`ml-auto inline-flex size-7 items-center justify-center rounded-full border transition ${
                          isChecked
                            ? selectedInteractive
                            : "border-border-strong text-muted"
                        }`}
                      >
                        <Icon
                          name={cell.icon ?? "check"}
                          className="size-3"
                        />
                      </button>
                    );
                  }

                  if (cell.kind === "field") {
                    return (
                      <input
                        key={cellIndex}
                        aria-label={cell.placeholder ?? "Value"}
                        className="h-8 w-full min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
                        inputMode="decimal"
                        placeholder={cell.placeholder ?? ""}
                        defaultValue={cell.value?.toString() ?? ""}
                      />
                    );
                  }

                  if (cell.kind === "badge") {
                    return (
                      <span
                        key={cellIndex}
                        className="justify-self-end rounded-full bg-surface px-2 py-1 text-[11px] font-medium text-muted shadow-sm"
                      >
                        {cell.value}
                      </span>
                    );
                  }

                  if (cell.kind === "progress") {
                    const value =
                      typeof cell.value === "number"
                        ? Math.max(0, Math.min(100, cell.value))
                        : 0;

                    return (
                      <div
                        key={cellIndex}
                        className="h-1.5 overflow-hidden rounded-full bg-track-strong"
                      >
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    );
                  }

                  return (
                    <span
                      key={cellIndex}
                      className={
                        cell.kind === "label"
                          ? "text-base font-semibold text-fg"
                          : cell.kind === "time"
                            ? "text-xs font-medium text-subtle"
                            : "truncate text-sm text-muted"
                      }
                    >
                      {cell.value}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      );

      if (props.presentation === "plain") {
        return <section>{body}</section>;
      }

      return (
        <section className="border-b border-border bg-surface py-4">
          {body}
        </section>
      );
    },
    Field: ({ props, bindings }) => {
      const [value, setValue] = useBoundProp<unknown>(
        props.value,
        bindings?.value,
      );

      return (
        <label className="flex flex-col gap-2">
          <span className="text-xs text-subtle">{props.label}</span>
          <input
            className="h-11 rounded-2xl border border-border px-4 text-sm outline-none focus:border-border"
            placeholder={props.placeholder ?? ""}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      );
    },
    Flow: ({ props }) => {
      const [stepId, setStepId] = useState(props.initialStep);
      const [values, setValues] = useState<Record<string, string>>({});

      const step =
        props.steps.find((candidate) => candidate.id === stepId) ??
        props.steps[0];

      if (!step) {
        return null;
      }

      const resetFlow = () => {
        setValues({});
        setStepId(props.initialStep);
      };

      return (
        <section className="w-full rounded-[26px] border border-border bg-surface p-4 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight text-fg">
              {step.title}
            </h2>
            {step.subtitle ? (
              <p className="mt-0.5 text-xs text-subtle">{step.subtitle}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-3">
            {step.blocks.map((block, blockIndex) => {
              if (block.type === "imageUpload") {
                const bind = block.bind;
                const current = bind ? values[bind] : undefined;

                return (
                  <label
                    key={blockIndex}
                    className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center"
                  >
                    {current ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={current}
                        alt={block.label ?? ""}
                        className="max-h-48 w-full rounded-xl object-cover"
                      />
                    ) : (
                      <>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="size-6 text-subtle"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 21" />
                        </svg>
                        <span className="text-sm font-medium text-muted">
                          {block.label ?? "Upload an image"}
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept={block.accept ?? "image/*"}
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file || !bind) {
                          return;
                        }

                        const reader = new FileReader();

                        reader.onload = () => {
                          setValues((current) => ({
                            ...current,
                            [bind]: String(reader.result ?? ""),
                          }));
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                );
              }

              if (block.type === "image") {
                const src = block.source
                  ? values[block.source]
                  : block.value ?? undefined;

                if (!src) {
                  return (
                    <div
                      key={blockIndex}
                      className="flex h-48 w-full items-center justify-center rounded-2xl bg-surface-elevated text-xs text-subtle"
                    >
                      {block.label ?? "No image yet"}
                    </div>
                  );
                }

                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={blockIndex}
                    src={src}
                    alt={block.label ?? ""}
                    className="max-h-64 w-full rounded-2xl object-cover"
                  />
                );
              }

              if (block.type === "text") {
                const text = block.source
                  ? values[block.source]
                  : block.value ?? "";

                return (
                  <p
                    key={blockIndex}
                    className="text-sm leading-6 text-fg-secondary"
                  >
                    {text}
                  </p>
                );
              }

              return (
                <button
                  key={blockIndex}
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-white"
                  onClick={() => {
                    if (block.reset) {
                      resetFlow();

                      return;
                    }

                    if (block.goTo) {
                      setStepId(block.goTo);
                    }
                  }}
                >
                  {block.label ?? "Continue"}
                </button>
              );
            })}
          </div>
        </section>
      );
    },
    Board: ({ props }) => (
        <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {props.columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex w-60 shrink-0 flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1">
                <h2
                  className={`text-xs font-semibold uppercase tracking-[0.14em] ${boardAccents[column.accent ?? "neutral"]}`}
                >
                  {column.title}
                </h2>
                <span className="text-[11px] text-subtle">
                  {column.cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {column.cards.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-2xl border border-border bg-surface p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-fg">
                        {card.title}
                      </p>
                      {card.badge ? (
                        <span className="shrink-0 rounded-full bg-surface-elevated px-2 py-0.5 text-[10px] font-medium text-muted">
                          {card.badge}
                        </span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <p className="mt-0.5 text-xs text-muted">
                        {card.subtitle}
                      </p>
                    ) : null}
                    {card.meta ? (
                      <p className="mt-2 text-[11px] text-subtle">
                        {card.meta}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      ),
    ChipRow: ({ props }) => (
        <div className="flex flex-col gap-2">
          {props.label ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.label}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {props.chips.map((chip, index) => {
              const tone = chip.selected ? "accent" : (chip.tone ?? "neutral");
              return (
                <button
                  key={index}
                  type="button"
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${chipTones[tone]}`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>
      ),
    Gallery: ({ props }) => {
      const heights = ["h-32", "h-44", "h-36", "h-40", "h-48", "h-32"];

      return (
        <section className="columns-2 gap-3 sm:columns-3">
          {props.tiles.map((tile, tileIndex) => (
            <div
              key={tileIndex}
              className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-border-subtle shadow-sm"
            >
              <div
                className={`relative w-full bg-gradient-to-br ${heights[tileIndex % heights.length]} ${toneGradients[tile.tone ?? "stone"]}`}
              >
                {tile.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tile.src}
                    alt={tile.label ?? ""}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                {tile.label || tile.caption ? (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent p-3">
                    {tile.label ? (
                      <p className="text-sm font-semibold text-white">
                        {tile.label}
                      </p>
                    ) : null}
                    {tile.caption ? (
                      <p className="text-[11px] text-white/80">{tile.caption}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </section>
      );
    },
    CopyBlock: ({ props }) => {
      const [copied, setCopied] = useState(false);

      return (
        <section className="rounded-2xl border border-border bg-surface-muted p-4">
          {props.title ? (
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.title}
            </p>
          ) : null}
          <p className="whitespace-pre-wrap text-sm leading-6 text-fg-secondary">
            {props.text}
          </p>
          <button
            type="button"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-2xl bg-surface px-4 text-sm font-medium text-fg-secondary shadow-sm ring-1 ring-border-subtle"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(props.text);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              } catch {
                setCopied(false);
              }
            }}
          >
            <Icon name="copy" className="size-4" />
            {copied ? "Copied" : (props.copyLabel ?? "Copy")}
          </button>
        </section>
      );
    },
    Slider: ({ props }) => {
      const [index, setIndex] = useState(0);
      const slides = props.slides.length > 0 ? props.slides : [{ title: "Slide" }];
      const current = slides[index % slides.length];
      const aspect = aspectHeights[props.aspect ?? "wide"];

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className={`relative w-full bg-gradient-to-br ${aspect} ${toneGradients[current.tone ?? "stone"]}`}>
            {current.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.src}
                alt={current.title ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            {current.title || current.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                {current.title ? (
                  <p className="text-sm font-semibold text-white">{current.title}</p>
                ) : null}
                {current.caption ? (
                  <p className="mt-0.5 text-xs text-white/80">{current.caption}</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {slides.length > 1 ? (
            <div className="flex items-center justify-between px-4 py-3">
              <button
                type="button"
                aria-label="Previous slide"
                className="inline-flex size-9 items-center justify-center rounded-full bg-surface-elevated text-muted"
                onClick={() =>
                  setIndex((value) => (value - 1 + slides.length) % slides.length)
                }
              >
                <Icon name="arrowRight" className="size-4 rotate-180" />
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, slideIndex) => (
                  <button
                    key={slideIndex}
                    type="button"
                    aria-label={`Go to slide ${slideIndex + 1}`}
                    className={`h-1.5 rounded-full transition ${
                      slideIndex === index ? "w-5 bg-primary" : "w-1.5 bg-dot-inactive"
                    }`}
                    onClick={() => setIndex(slideIndex)}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="Next slide"
                className="inline-flex size-9 items-center justify-center rounded-full bg-surface-elevated text-muted"
                onClick={() => setIndex((value) => (value + 1) % slides.length)}
              >
                <Icon name="arrowRight" className="size-4" />
              </button>
            </div>
          ) : null}
        </section>
      );
    },
    Map: ({ props }) => {
      const zoom = props.zoom ?? 14;
      const bbox = 0.02 / (zoom / 10);
      const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${props.lng - bbox}%2C${props.lat - bbox}%2C${props.lng + bbox}%2C${props.lat + bbox}&layer=mapnik&marker=${props.lat}%2C${props.lng}`;

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div className="relative aspect-[5/3] w-full bg-surface-elevated">
            <iframe
              title={props.label}
              src={embedUrl}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          </div>
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="rounded-xl bg-accent-subtle p-2">
              <Icon name="mapPin" className="size-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg">{props.label}</p>
              {props.address ? (
                <p className="mt-0.5 text-xs text-muted">{props.address}</p>
              ) : (
                <p className="mt-0.5 text-xs text-subtle">
                  {props.lat.toFixed(4)}, {props.lng.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </section>
      );
    },
    VideoPlayer: ({ props }) => {
      const aspect = aspectHeights[props.aspect ?? "wide"];

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-media shadow-sm">
          {props.title ? (
            <p className="bg-surface px-4 py-2 text-sm font-medium text-fg">
              {props.title}
            </p>
          ) : null}
          <video
            className={`w-full ${aspect} bg-media`}
            src={props.src}
            poster={props.poster ?? undefined}
            controls
            playsInline
            preload="metadata"
          />
        </section>
      );
    },
    AudioPlayer: ({ props }) => {
      const [playing, setPlaying] = useState(false);
      const [progress, setProgress] = useState(0);

      return (
        <section className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-3 shadow-sm">
          <button
            type="button"
            aria-label={playing ? "Pause audio" : "Play audio"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
            onClick={() => {
              const audio = document.getElementById(
                `audio-${props.title}`,
              ) as HTMLAudioElement | null;

              if (!audio) {
                return;
              }

              if (playing) {
                audio.pause();
              } else {
                void audio.play();
              }
            }}
          >
            <Icon name={playing ? "pause" : "play"} className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{props.title}</p>
            {props.subtitle ? (
              <p className="truncate text-xs text-muted">{props.subtitle}</p>
            ) : null}
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-track">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          {props.duration ? (
            <span className="shrink-0 text-xs text-subtle">{props.duration}</span>
          ) : null}
          <audio
            id={`audio-${props.title}`}
            src={props.src}
            className="hidden"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => {
              const audio = event.currentTarget;

              if (!audio.duration) {
                return;
              }

              setProgress((audio.currentTime / audio.duration) * 100);
            }}
          />
        </section>
      );
    },
    MusicRow: ({ props }) => (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 shadow-sm">
        <div
          className={`relative size-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${toneGradients[props.tone ?? "violet"]}`}
        >
          {props.artworkSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.artworkSrc}
              alt={props.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon name="music" className="size-4 text-white/80" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{props.title}</p>
          {props.subtitle ? (
            <p className="truncate text-xs text-muted">{props.subtitle}</p>
          ) : null}
        </div>
        {props.duration ? (
          <span className="shrink-0 text-xs text-subtle">{props.duration}</span>
        ) : null}
        <button
          type="button"
          aria-label={`Play ${props.title}`}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
        >
          <Icon name="play" className="size-4" />
        </button>
      </div>
    ),
    SpotifyEmbed: ({ props }) => {
      const src = spotifyEmbedSrc(props.url, props.embedId, props.embedType);

      if (!src) {
        return (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            Spotify embed URL required
          </div>
        );
      }

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-embed shadow-sm">
          <iframe
            title="Spotify embed"
            src={src}
            className="w-full border-0"
            style={{ height: props.height ?? 152 }}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </section>
      );
    },
    TikTokEmbed: ({ props }) => {
      const id = tiktokVideoId(props.url, props.videoId);

      if (!id) {
        return (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            TikTok video URL or ID required
          </div>
        );
      }

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-media shadow-sm">
          <iframe
            title="TikTok embed"
            src={`https://www.tiktok.com/embed/v2/${id}`}
            className="aspect-[9/16] w-full max-h-[640px] border-0"
            allow="encrypted-media; fullscreen"
            loading="lazy"
          />
        </section>
      );
    },
    YouTubeEmbed: ({ props }) => {
      const id = youtubeVideoId(props.url, props.videoId);

      if (!id) {
        return (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            YouTube video URL or ID required
          </div>
        );
      }

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-media shadow-sm">
          {props.title ? (
            <p className="bg-surface px-4 py-2 text-sm font-medium text-fg">
              {props.title}
            </p>
          ) : null}
          <iframe
            title={props.title ?? "YouTube embed"}
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            className="aspect-video w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            loading="lazy"
          />
        </section>
      );
    },
    LinkCard: ({ props }) => (
      <a
        href={props.url}
        target="_blank"
        rel="noreferrer"
        className="flex overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-border-strong"
      >
        {props.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.imageSrc}
            alt=""
            className="h-24 w-24 shrink-0 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-surface-elevated">
            <Icon name="link" className="size-5 text-subtle" />
          </div>
        )}
        <div className="min-w-0 flex-1 px-3 py-3">
          <p className="line-clamp-2 text-sm font-medium text-fg">
            {props.title}
          </p>
          {props.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted">
              {props.description}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
            {props.domain ?? domainFromUrl(props.url)}
          </p>
        </div>
      </a>
    ),
    Quote: ({ props }) => (
        <blockquote
          className={`rounded-2xl border px-4 py-4 ${quoteTones[props.tone ?? "neutral"]}`}
        >
          <Icon name="quote" className="mb-2 size-4 opacity-40" />
          <p className="text-sm leading-6">{props.text}</p>
          {props.attribution ? (
            <footer className="mt-3 text-xs font-medium opacity-60">
              — {props.attribution}
            </footer>
          ) : null}
        </blockquote>
      ),
    MediaStrip: ({ props }) => (
      <section className="flex flex-col gap-2">
        {props.label ? (
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {props.items.map((item, index) => (
            <button
              key={index}
              type="button"
              className="flex w-20 shrink-0 flex-col items-center gap-2"
            >
              <div
                className={`relative size-16 overflow-hidden rounded-full bg-gradient-to-br ring-2 ring-surface ${toneGradients[item.tone ?? "sky"]}`}
              >
                {item.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt={item.label}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <span className="w-full truncate text-center text-[11px] text-muted">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    ),
    ImageCard: ({ props }) => {
      const aspect = aspectHeights[props.aspect ?? "wide"];

      return (
        <article className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <div
            className={`relative w-full bg-gradient-to-br ${aspect} ${toneGradients[props.tone ?? "stone"]}`}
          >
            {props.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.src}
                alt={props.title ?? ""}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>
          {props.title || props.caption ? (
            <div className="px-4 py-3">
              {props.title ? (
                <p className="text-sm font-semibold text-fg">{props.title}</p>
              ) : null}
              {props.caption ? (
                <p className="mt-0.5 text-xs leading-5 text-muted">{props.caption}</p>
              ) : null}
            </div>
          ) : null}
        </article>
      );
    },
    Countdown: ({ props }) => {
      const target = new Date(props.targetDate).getTime();
      const now = Date.now();
      const remaining = Math.max(0, target - now);
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      return (
        <section className="rounded-2xl border border-border bg-primary px-4 py-4 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Icon name="clock" className="size-4 text-white/60" />
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/60">
              {props.label}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { value: days, unit: "days" },
              { value: hours, unit: "hrs" },
              { value: minutes, unit: "min" },
            ].map((part) => (
              <div
                key={part.unit}
                className="rounded-xl bg-primary-fg/10 px-3 py-2 text-center"
              >
                <p className="text-2xl font-semibold tabular-nums">{part.value}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/50">
                  {part.unit}
                </p>
              </div>
            ))}
          </div>
          {props.detail ? (
            <p className="mt-3 text-xs text-white/60">{props.detail}</p>
          ) : null}
        </section>
      );
    },
    AvatarRow: ({ props }) => (
      <section className="flex flex-col gap-2">
        {props.label ? (
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
          {props.people.map((person, index) => (
            <div key={index} className="flex w-20 shrink-0 flex-col items-center gap-2">
              <div
                className={`relative size-14 overflow-hidden rounded-full bg-gradient-to-br ring-2 ring-surface ${toneGradients[person.tone ?? "violet"]}`}
              >
                {person.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={person.src}
                    alt={person.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-white/90">
                    {person.name.slice(0, 1)}
                  </div>
                )}
              </div>
              <div className="w-full text-center">
                <p className="truncate text-[11px] font-medium text-fg-secondary">
                  {person.name}
                </p>
                {person.subtitle ? (
                  <p className="truncate text-[10px] text-subtle">{person.subtitle}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    ShareRow: ({ props }) => (
      <section className="flex flex-col gap-2">
        {props.label ? (
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {props.targets.map((target, index) => (
            <button
              key={index}
              type="button"
              className="flex w-16 shrink-0 flex-col items-center gap-2"
            >
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-surface-elevated text-fg-secondary">
                <Icon name={target.icon ?? "share"} className="size-4" />
              </div>
              <span className="w-full truncate text-center text-[10px] text-muted">
                {target.label}
              </span>
            </button>
          ))}
        </div>
      </section>
    ),
    SoundCloudEmbed: ({ props }) => (
      <section className="overflow-hidden rounded-2xl border border-border bg-surface-muted shadow-sm">
        <iframe
          title="SoundCloud embed"
          src={soundcloudEmbedSrc(props.url) ?? props.url}
          className="w-full border-0"
          style={{ height: props.height ?? 166 }}
          allow="autoplay"
          loading="lazy"
        />
      </section>
    ),
    InstagramEmbed: ({ props }) => {
      const code = instagramShortcode(props.url, props.shortcode);

      if (!code) {
        return (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            Instagram post URL or shortcode required
          </div>
        );
      }

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <iframe
            title="Instagram embed"
            src={`https://www.instagram.com/p/${code}/embed`}
            className="aspect-square w-full max-h-[520px] border-0"
            allow="encrypted-media"
            loading="lazy"
          />
        </section>
      );
    },
    Poll: ({ props }) => {
      const [selected, setSelected] = useState<number | null>(null);
      const totalVotes = props.options.reduce(
        (sum, option) => sum + (option.votes ?? 0),
        0,
      );

      return (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="text-sm font-semibold text-fg">{props.question}</p>
          <div className="mt-3 flex flex-col gap-2">
            {props.options.map((option, index) => {
              const votes = option.votes ?? 0;
              const percent =
                totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              const isSelected = selected === index;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelected(index)}
                  className={`relative overflow-hidden rounded-xl border px-3 py-2.5 text-left transition ${
                    isSelected
                      ? selectedInteractive
                      : unselectedInteractive
                  }`}
                >
                  {selected !== null && totalVotes > 0 ? (
                    <div
                      className={`absolute inset-y-0 left-0 ${isSelected ? selectedPollBar : unselectedPollBar}`}
                      style={{ width: `${percent}%` }}
                    />
                  ) : null}
                  <div className="relative flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{option.label}</span>
                    {selected !== null && totalVotes > 0 ? (
                      <span className="text-xs opacity-70">{percent}%</span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      );
    },
    SegmentedControl: ({ props, bindings, emit }) => {
      const initial =
        props.value ??
        (props.segments.findIndex((segment) => segment.selected) >= 0
          ? props.segments.findIndex((segment) => segment.selected)
          : 0);
      const [active, setActive] = useBindableState<number>(
        initial,
        bindings?.value,
      );

      const select = (index: number) => {
        setActive(index);
        emit("change");
      };

      return (
        <div className="flex w-full border-b border-border bg-surface-elevated p-1">
          {props.segments.map((segment, index) => (
            <button
              key={index}
              type="button"
              onClick={() => select(index)}
              className={`flex-1 rounded-xl px-3 py-2 text-xs font-medium transition ${
                active === index
                  ? "bg-surface text-fg shadow-sm"
                  : "text-muted"
              }`}
            >
              {segment.label}
            </button>
          ))}
        </div>
      );
    },
    Banner: ({ props }) => (
        <section
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${bannerTones[props.tone ?? "neutral"]}`}
        >
          <div className="rounded-xl bg-surface/70 p-2">
            <Icon name={props.icon ?? "bell"} className="size-4 opacity-70" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{props.title}</p>
            {props.message ? (
              <p className="mt-0.5 text-xs leading-5 opacity-70">{props.message}</p>
            ) : null}
          </div>
        </section>
      ),
    Timeline: ({ props }) => (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {props.label ? (
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.label}
            </p>
          ) : null}
          <div className="flex flex-col gap-4">
            {props.events.map((event, index) => (
              <div key={index} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`size-2.5 rounded-full ${timelineDotTones[event.tone ?? "neutral"]}`}
                  />
                  {index < props.events.length - 1 ? (
                    <div className="mt-1 w-px flex-1 bg-track-strong" />
                  ) : null}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
                    {event.time}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-fg">{event.title}</p>
                  {event.detail ? (
                    <p className="mt-0.5 text-xs text-muted">{event.detail}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ),
    Rating: ({ props }) => {
      const max = props.max ?? 5;

      return (
        <section className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          {props.label ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.label}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-1">
            {Array.from({ length: max }).map((_, index) => (
              <Icon
                key={index}
                name="star"
                className={`size-4 ${
                  index < Math.round(props.value)
                    ? "fill-star text-star"
                    : "text-star-inactive"
                }`}
              />
            ))}
            <span className="ml-2 text-sm font-semibold text-fg">
              {props.value.toFixed(1)}
            </span>
          </div>
          {props.detail ? (
            <p className="mt-1 text-xs text-muted">{props.detail}</p>
          ) : null}
        </section>
      );
    },
    VoiceNote: ({ props }) => {
      const [playing, setPlaying] = useState(false);

      return (
        <section
          className={`flex items-center gap-3 rounded-2xl border border-border px-3 py-3 shadow-sm ${voiceNoteTones[props.tone ?? "neutral"]}`}
        >
          <button
            type="button"
            aria-label={playing ? "Pause voice note" : "Play voice note"}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg"
            onClick={() => {
              const audio = document.getElementById(
                `voice-${props.src}`,
              ) as HTMLAudioElement | null;

              if (!audio) {
                return;
              }

              if (playing) {
                audio.pause();
              } else {
                void audio.play();
              }
            }}
          >
            <Icon name={playing ? "pause" : "play"} className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Icon name="mic" className="size-3.5 text-subtle" />
              <p className="truncate text-sm font-medium text-fg">
                {props.title ?? "Voice note"}
              </p>
            </div>
            <div className="mt-2 flex h-6 items-end gap-0.5">
              {[3, 5, 4, 7, 5, 8, 4, 6, 3, 5, 7, 4, 6, 5, 8, 4, 3, 6, 5, 4].map(
                (height, index) => (
                  <div
                    key={index}
                    className="w-1 rounded-full bg-dot-inactive"
                    style={{ height: `${height * 2}px` }}
                  />
                ),
              )}
            </div>
          </div>
          {props.duration ? (
            <span className="shrink-0 text-xs text-subtle">{props.duration}</span>
          ) : null}
          <audio
            id={`voice-${props.src}`}
            src={props.src}
            className="hidden"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        </section>
      );
    },
    ReactionBar: ({ props }) => {
      const [active, setActive] = useState<number | null>(null);

      return (
        <div className="flex flex-wrap gap-2">
          {props.reactions.map((reaction, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActive(active === index ? null : index)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                active === index
                  ? "bg-primary text-primary-fg"
                  : "bg-surface-elevated text-fg-secondary"
              }`}
            >
              <span>{reaction.emoji}</span>
              {reaction.count != null ? (
                <span className="text-xs font-medium">{reaction.count}</span>
              ) : null}
            </button>
          ))}
        </div>
      );
    },
    PhotoGrid: ({ props }) => {
      const cols = props.columns === "3" ? "grid-cols-3" : "grid-cols-2";

      return (
        <section className={`grid ${cols} gap-2`}>
          {props.photos.map((photo, index) => (
            <button
              key={index}
              type="button"
              className="relative aspect-square overflow-hidden rounded-2xl border border-border-subtle shadow-sm"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${toneGradients[photo.tone ?? "stone"]}`}
              />
              {photo.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.src}
                  alt={photo.label ?? ""}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              {photo.label ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                  <p className="truncate text-[11px] font-medium text-white">
                    {photo.label}
                  </p>
                </div>
              ) : null}
            </button>
          ))}
        </section>
      );
    },
    QRCode: ({ props }) => (
      <section className="flex flex-col items-center rounded-2xl border border-border bg-surface p-4 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrCodeImageUrl(props.value)}
          alt={props.label ?? "QR code"}
          className="size-40 rounded-xl"
        />
        {props.label ? (
          <p className="mt-3 text-sm font-semibold text-fg">{props.label}</p>
        ) : null}
        {props.detail ? (
          <p className="mt-1 text-center text-xs text-muted">{props.detail}</p>
        ) : null}
      </section>
    ),
    AppleMusicEmbed: ({ props }) => {
      const src = appleMusicEmbedSrc(props.url);

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-media shadow-sm">
          <iframe
            title="Apple Music embed"
            src={src ?? props.url}
            className="w-full border-0"
            style={{ height: props.height ?? 175 }}
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            loading="lazy"
          />
        </section>
      );
    },
    BandcampEmbed: ({ props }) => (
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <iframe
          title="Bandcamp embed"
          src={bandcampEmbedSrc(props.url) ?? props.url}
          className="w-full border-0"
          style={{ height: props.height ?? 120 }}
          loading="lazy"
        />
      </section>
    ),
    VimeoEmbed: ({ props }) => {
      const id = vimeoVideoId(props.url, props.videoId);

      if (!id) {
        return (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted px-4 py-8 text-center text-sm text-muted">
            Vimeo video URL or ID required
          </div>
        );
      }

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-media shadow-sm">
          {props.title ? (
            <p className="bg-surface px-4 py-2 text-sm font-medium text-fg">
              {props.title}
            </p>
          ) : null}
          <iframe
            title={props.title ?? "Vimeo embed"}
            src={`https://player.vimeo.com/video/${id}`}
            className="aspect-video w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </section>
      );
    },
    StickerRow: ({ props }) => (
      <section className="flex flex-col gap-2">
        {props.label ? (
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {props.stickers.map((sticker, index) => (
            <button
              key={index}
              type="button"
              className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-surface-elevated px-3 py-2"
            >
              <span className="text-2xl">{sticker.emoji}</span>
              {sticker.label ? (
                <span className="text-[10px] text-muted">{sticker.label}</span>
              ) : null}
            </button>
          ))}
        </div>
      </section>
    ),
    FullscreenHero: ({ props }) => {
      const tone = props.tone ?? "violet";
      const aspect = aspectHeights[props.aspect ?? "square"];

      return (
        <section className="w-full overflow-hidden">
          <div
            className={`relative bg-gradient-to-b pb-7 pt-8 ${heroBackdropGradients[tone]}`}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-white/10 blur-3xl" />
            <div className="relative mx-auto w-full max-w-[220px]">
              <div
                className={`relative overflow-hidden rounded-md shadow-[0_24px_48px_rgba(0,0,0,0.45)] ${aspect} bg-gradient-to-br ${toneGradients[tone]}`}
              >
                {props.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={props.src}
                    alt={props.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
              </div>
            </div>
            <div className="relative mt-6 px-4 text-white">
              {props.eyebrow ? (
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  {props.eyebrow}
                </p>
              ) : null}
              <h2 className="mt-2 text-[2rem] font-bold leading-tight tracking-tight">
                {props.title}
              </h2>
              {props.subtitle ? (
                <p className="mt-2 text-sm text-white/75">{props.subtitle}</p>
              ) : null}
            </div>
          </div>
        </section>
      );
    },
    Stepper: ({ props, bindings, emit }) => {
      const min = props.min ?? 0;
      const max = props.max ?? 99;
      const step = props.step ?? 1;
      const [value, setValue] = useBindableState<number>(
        props.value,
        bindings?.value,
      );

      const update = (next: number) => {
        setValue(next);
        emit("change");
      };

      return (
        <section className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          <span className="text-sm font-medium text-fg">{props.label}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease"
              className="inline-flex size-9 items-center justify-center rounded-full bg-surface-elevated text-fg-secondary"
              onClick={() => update(Math.max(min, value - step))}
            >
              <Icon name="minus" className="size-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums">
              {value}
            </span>
            <button
              type="button"
              aria-label="Increase"
              className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-fg"
              onClick={() => update(Math.min(max, value + step))}
            >
              <Icon name="plus" className="size-4" />
            </button>
          </div>
        </section>
      );
    },
    FAB: ({ props }) => (
        <div className="flex justify-end">
          <button
            type="button"
            className={`inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-medium shadow-lg ${fabVariants[props.variant ?? "primary"]}`}
          >
            <Icon name={props.icon ?? "plus"} className="size-4" />
            {props.label ?? "Add"}
          </button>
        </div>
      ),
    CommentThread: ({ props }) => (
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        {props.label ? (
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="flex flex-col gap-4">
          {props.comments.map((comment, index) => (
            <div key={index} className="flex gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white ${toneGradients[comment.tone ?? "sky"]}`}
              >
                {comment.author.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-sm font-medium text-fg">{comment.author}</p>
                  {comment.time ? (
                    <p className="text-[11px] text-subtle">{comment.time}</p>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm leading-5 text-muted">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    MentionRow: ({ props }) => (
      <section className="flex flex-col gap-2">
        {props.label ? (
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
            {props.label}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {props.mentions.map((mention, index) => (
            <button
              key={index}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-surface-elevated py-1 pl-1 pr-3"
            >
              <div
                className={`relative size-7 overflow-hidden rounded-full bg-gradient-to-br ${toneGradients[mention.tone ?? "violet"]}`}
              >
                {mention.src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mention.src}
                    alt={mention.name ?? mention.handle}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-[10px] font-semibold text-white">
                    {mention.handle.slice(1, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-fg-secondary">
                {mention.name ?? mention.handle}
              </span>
            </button>
          ))}
        </div>
      </section>
    ),
    PriceTag: ({ props }) => (
        <section
          className={`rounded-2xl border border-border px-4 py-3 shadow-sm ${priceTagTones[props.tone ?? "neutral"]}`}
        >
          {props.label ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-50">
              {props.label}
            </p>
          ) : null}
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">{props.price}</span>
            {props.compareAt ? (
              <span className="text-sm text-subtle line-through">{props.compareAt}</span>
            ) : null}
          </div>
        </section>
      ),
    TicketCard: ({ props }) => (
      <section
        className={`overflow-hidden rounded-2xl border border-border bg-gradient-to-br text-white shadow-sm ${toneGradients[props.tone ?? "violet"]}`}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold tracking-tight">{props.title}</p>
              {props.subtitle ? (
                <p className="mt-0.5 text-xs text-white/80">{props.subtitle}</p>
              ) : null}
            </div>
            <Icon name="ticket" className="size-5 text-white/70" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/80">
            {props.date ? <span>{props.date}</span> : null}
            {props.seat ? <span>Seat {props.seat}</span> : null}
          </div>
        </div>
        {props.code ? (
          <div className="border-t border-white/20 bg-media/15 px-4 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/60">
              Entry code
            </p>
            <p className="mt-1 font-mono text-sm tracking-widest">{props.code}</p>
          </div>
        ) : null}
      </section>
    ),
    CalendarSlot: ({ props }) => (
      <button
        type="button"
        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
          props.selected
            ? selectedInteractive
            : "border-border bg-surface text-fg shadow-sm"
        }`}
      >
        <div
          className={`rounded-xl p-2 ${props.selected ? "bg-primary-fg/15" : "bg-surface-elevated"}`}
        >
          <Icon name="calendar" className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{props.label}</p>
          <p className={`mt-0.5 text-xs ${props.selected ? "text-white/70" : "text-muted"}`}>
            {props.date} · {props.time}
          </p>
        </div>
        {props.selected ? <Icon name="check" className="size-4" /> : null}
      </button>
    ),
    RSVP: ({ props }) => {
      const initial =
        props.options.findIndex((option) => option.selected) >= 0
          ? props.options.findIndex((option) => option.selected)
          : null;
      const [selected, setSelected] = useState<number | null>(initial);

      return (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {props.eventTitle ? (
            <p className="mb-3 text-sm font-semibold text-fg">{props.eventTitle}</p>
          ) : null}
          <div className="flex gap-2">
            {props.options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelected(index)}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-center transition ${
                  selected === index
                    ? selectedInteractive
                    : unselectedInteractive
                }`}
              >
                <p className="text-sm font-medium">{option.label}</p>
                {option.count != null ? (
                  <p className="mt-0.5 text-[11px] opacity-70">{option.count}</p>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      );
    },
    TabBar: ({ props }) => {
      const initial =
        props.tabs.findIndex((tab) => tab.selected) >= 0
          ? props.tabs.findIndex((tab) => tab.selected)
          : 0;
      const [active, setActive] = useState(initial);

      return (
        <nav className="rounded-2xl border border-border bg-surface px-2 py-2 shadow-sm">
          <div className="flex justify-around">
            {props.tabs.map((tab, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActive(index)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                  active === index ? "text-fg" : "text-subtle"
                }`}
              >
                <Icon name={tab.icon ?? "home"} className="size-4" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      );
    },
    DirectionsCard: ({ props }) => {
      const mapsUrl =
        props.url ??
        (props.lat != null && props.lng != null
          ? `https://maps.google.com/?q=${props.lat},${props.lng}`
          : `https://maps.google.com/?q=${encodeURIComponent(props.address)}`);

      return (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm transition hover:border-border-strong"
        >
          <div className="rounded-xl bg-accent-subtle p-2">
            <Icon name="navigation" className="size-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-fg">{props.label}</p>
            <p className="mt-0.5 text-xs text-muted">{props.address}</p>
          </div>
          <span className="shrink-0 text-xs font-medium text-accent">Open</span>
        </a>
      );
    },
    Accordion: ({ props }) => {
      const initial = new Set(
        props.items
          .map((item, index) => (item.open ? index : -1))
          .filter((index) => index >= 0),
      );
      const [open, setOpen] = useState(initial);

      return (
        <section className="flex flex-col gap-2">
          {props.items.map((item, index) => {
            const isOpen = open.has(index);

            return (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpen((current) => {
                      const next = new Set(current);

                      if (next.has(index)) {
                        next.delete(index);
                      } else {
                        next.add(index);
                      }

                      return next;
                    });
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-fg">{item.title}</span>
                  <Icon
                    name="chevronDown"
                    className={`size-4 text-subtle transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <p className="border-t border-border-subtle px-4 py-3 text-sm leading-6 text-muted">
                    {item.content}
                  </p>
                ) : null}
              </div>
            );
          })}
        </section>
      );
    },
    StatGrid: ({ props }) => {
      const cols = props.columns === "3" ? "grid-cols-3" : "grid-cols-2";

      return (
        <section
          className={`grid ${cols} divide-x divide-border border-b border-border bg-border`}
        >
          {props.stats.map((stat, index) => (
            <div key={index} className="bg-surface px-4 py-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-subtle">
                {stat.label}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-fg">
                {stat.value}
              </p>
              {stat.detail ? (
                <p className="mt-0.5 text-[11px] text-muted">{stat.detail}</p>
              ) : null}
            </div>
          ))}
        </section>
      );
    },
    BeforeAfter: ({ props }) => {
      const [position, setPosition] = useState(props.position ?? 50);

      return (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {props.label ? (
            <p className="px-4 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.label}
            </p>
          ) : null}
          <div className="relative aspect-[4/5] w-full">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${toneGradients[props.tone ?? "stone"]}`}
            />
            {props.beforeSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={props.beforeSrc}
                alt={props.beforeLabel ?? "Before"}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              {props.afterSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={props.afterSrc}
                  alt={props.afterLabel ?? "After"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className={`h-full w-full bg-gradient-to-br ${toneGradients[props.tone ?? "emerald"]}`}
                />
              )}
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              className="absolute inset-0 z-10 h-full w-full cursor-ew-resize opacity-0"
              aria-label="Compare before and after"
            />
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-surface shadow-[0_0_8px_rgba(0,0,0,0.35)]"
              style={{ left: `${position}%` }}
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-between text-[11px] font-medium text-white drop-shadow">
              <span>{props.beforeLabel ?? "Before"}</span>
              <span>{props.afterLabel ?? "After"}</span>
            </div>
          </div>
        </section>
      );
    },
    Tabs: ({ props, children, bindings, emit }) => {
      const panels = Children.toArray(children);
      const initial =
        props.value ??
        (props.tabs.findIndex((tab) => tab.selected) >= 0
          ? props.tabs.findIndex((tab) => tab.selected)
          : 0);
      const [active, setActive] = useBindableState<number>(
        initial,
        bindings?.value,
      );

      const select = (index: number) => {
        setActive(index);
        emit("change");
      };

      return (
        <section className="w-full border-b border-border bg-surface">
          <div className="flex gap-1 overflow-x-auto border-b border-border-subtle px-0 pt-2">
            {props.tabs.map((tab, index) => (
              <button
                key={index}
                type="button"
                onClick={() => select(index)}
                className={`shrink-0 rounded-t-xl px-4 py-2 text-xs font-medium transition ${
                  active === index
                    ? "bg-surface-muted text-fg"
                    : "text-subtle hover:text-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="py-4 px-4">{panels[active] ?? null}</div>
        </section>
      );
    },
    RangeSlider: ({ props }) => {
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const step = props.step ?? 1;
      const [value, setValue] = useState(props.value);

      return (
        <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          {props.label || props.leftLabel || props.rightLabel ? (
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-muted">
              <span>{props.label ?? props.leftLabel}</span>
              <span className="font-medium text-fg-secondary">
                {props.rightLabel ?? `${value}%`}
              </span>
            </div>
          ) : null}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-track accent-primary"
            aria-label={props.label ?? "Value"}
          />
        </div>
      );
    },
    CircularProgress: ({ props }) => {
      const sizes = { sm: 56, md: 80, lg: 112 };
      const size = sizes[props.size ?? "md"];
      const stroke = size > 80 ? 8 : 6;
      const radius = (size - stroke) / 2;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (props.value / 100) * circumference;

      return (
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
          <div
            className="relative shrink-0"
            style={{ width: size, height: size }}
            role="img"
            aria-label={`${props.value}% complete`}
          >
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                className="text-track"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={circularProgressTones[props.tone ?? "neutral"]}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-fg">
                {props.value}%
              </span>
            </div>
          </div>
          <div className="min-w-0">
            {props.label ? (
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
                {props.label}
              </p>
            ) : null}
            {props.detail ? (
              <p className="mt-1 text-sm leading-5 text-fg-secondary">{props.detail}</p>
            ) : null}
          </div>
        </div>
      );
    },
    OptionCard: ({ props }) => {
      const layout = props.layout ?? "stack";

      return (
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {props.label ? (
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-subtle">
              {props.label}
            </p>
          ) : null}
          <div
            className={
              layout === "row"
                ? "grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                : "flex flex-col gap-2"
            }
          >
            {props.options.map((option, index) => {
              const tone = option.selected
                ? "accent"
                : (option.tone ?? "neutral");

              return (
                <button
                  key={index}
                  type="button"
                  className={`rounded-2xl border px-4 py-3 text-left transition ${optionCardTones[tone]} ${
                    option.selected ? "ring-2 ring-accent" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-fg">
                      {option.title}
                    </p>
                    {option.badge ? (
                      <span className="shrink-0 rounded-full bg-surface/80 px-2 py-0.5 text-[10px] font-medium text-muted">
                        {option.badge}
                      </span>
                    ) : null}
                  </div>
                  {option.subtitle ? (
                    <p className="mt-1 text-xs text-muted">{option.subtitle}</p>
                  ) : null}
                  {option.tradeoff ? (
                    <p className="mt-2 text-[11px] font-medium text-subtle">
                      {option.tradeoff}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      );
    },
    ExplanationCard: ({ props }) => (
        <section
          className={`rounded-2xl border px-4 py-3 shadow-sm ${explanationCardTones[props.tone ?? "neutral"]}`}
        >
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-surface/80 p-2">
              <Icon
                name={props.icon ?? "sparkles"}
                className="size-4 text-muted"
              />
            </div>
            <div className="min-w-0 flex-1">
              {props.label ? (
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">
                  {props.label}
                </p>
              ) : null}
              {props.title ? (
                <p className="mt-1 text-sm font-semibold text-fg">
                  {props.title}
                </p>
              ) : null}
              {props.context ? (
                <p className="mt-1 text-sm leading-5 text-fg-secondary">
                  {props.context}
                </p>
              ) : null}
              {props.reasons.length > 0 ? (
                <ul className="mt-2 space-y-1">
                  {props.reasons.map((reason, index) => (
                    <li
                      key={index}
                      className="flex gap-2 text-xs leading-5 text-muted"
                    >
                      <span className="text-subtle">·</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>
      ),
  },
});
