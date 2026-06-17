import { iconNames } from "./icons";

/** Registry component names — keep in sync with src/rlylabs/registry.tsx. */
export const CATALOG_COMPONENT_NAMES = [
  "Screen",
  "ScreenHeader",
  "Stack",
  "Pill",
  "Copy",
  "Hero",
  "Metric",
  "Row",
  "Action",
  "Progress",
  "Collection",
  "Field",
  "Flow",
  "Board",
  "Gallery",
  "ChipRow",
  "CopyBlock",
  "Slider",
  "Map",
  "VideoPlayer",
  "AudioPlayer",
  "MusicRow",
  "SpotifyEmbed",
  "TikTokEmbed",
  "YouTubeEmbed",
  "LinkCard",
  "Quote",
  "MediaStrip",
  "ImageCard",
  "Countdown",
  "AvatarRow",
  "ShareRow",
  "SoundCloudEmbed",
  "InstagramEmbed",
  "Poll",
  "SegmentedControl",
  "Banner",
  "Timeline",
  "Rating",
  "VoiceNote",
  "ReactionBar",
  "PhotoGrid",
  "QRCode",
  "AppleMusicEmbed",
  "BandcampEmbed",
  "VimeoEmbed",
  "StickerRow",
  "FullscreenHero",
  "Stepper",
  "FAB",
  "CommentThread",
  "MentionRow",
  "PriceTag",
  "TicketCard",
  "CalendarSlot",
  "RSVP",
  "TabBar",
  "DirectionsCard",
  "Accordion",
  "StatGrid",
  "BeforeAfter",
  "Tabs",
  "RangeSlider",
  "CircularProgress",
  "OptionCard",
  "ExplanationCard",
] as const;

/** Prop documentation for each catalog component — keep in sync with registry.tsx. */
const COMPONENT_SPECS: Record<(typeof CATALOG_COMPONENT_NAMES)[number], string> = {
  Screen: 'Screen { maxWidth: "sm"|"md"|"lg" } — page container, holds sections as children.',
  ScreenHeader:
    "ScreenHeader { eyebrow?, title, metaLeft?, metaRight? } — page header.",
  Hero: "Hero { eyebrow, title, subtitle, icon? } — featured summary.",
  Stack: "Stack { title? } — vertical card container; holds children.",
  Pill: 'Pill { label, tone: "neutral"|"accent"|"success" } — status chip.',
  Copy: "Copy { text } — paragraph of text.",
  Metric:
    'Metric { label, value, detail?, tone: "neutral"|"accent"|"success", icon? } — stat card.',
  Row: "Row { title, subtitle, trailing?, icon? } — list row.",
  Action:
    'Action { label, variant: "primary"|"secondary", icon? } — button.',
  Progress:
    "Progress { label?, value: 0-100, leftLabel?, rightLabel? } — progress bar.",
  Field: "Field { label, value?, placeholder? } — text input.",
  Collection:
    'Collection { presentation: "card"|"plain", header: { title, subtitle?, trailing? }, items: [{ cells: [{ kind: "label"|"field"|"toggle"|"text"|"time"|"badge"|"progress", value?, placeholder?, icon?, checked? }] }] } — repeated data rows.',
  Board:
    'Board { columns: [{ title, accent?, cards: [{ title, subtitle?, meta?, badge? }] }] } — kanban.',
  Gallery:
    'Gallery { layout?: "grid"|"masonry", tiles: [{ label?, caption?, tone?: "rose"|"amber"|"sky"|"emerald"|"violet"|"stone", src? }] } — moodboard.',
  ChipRow:
    'ChipRow { label?, chips: [{ label, selected?, tone?: "neutral"|"accent"|"success" }] } — horizontal choice chips for mood, tone, style, or constraints.',
  Flow:
    'Flow { mode: "single"|"repeatable", initialStep, steps: [{ id, title, subtitle?, blocks: [...] }] } — multi-step flow.',
  CopyBlock:
    "CopyBlock { title?, text, copyLabel? } — tap-to-copy text section for captions, scripts, share copy.",
  Slider:
    'Slider { slides: [{ src?, title?, caption?, tone? }], aspect?: "square"|"wide"|"tall" } — swipeable carousel.',
  Map:
    "Map { label, address?, lat, lng, zoom? } — location map card with pin.",
  VideoPlayer:
    'VideoPlayer { src, poster?, title?, aspect?: "square"|"wide"|"tall" } — inline video with controls.',
  AudioPlayer:
    "AudioPlayer { src, title, subtitle?, duration? } — compact audio player row.",
  MusicRow:
    'MusicRow { title, subtitle?, artworkSrc?, tone?, duration? } — Spotify-style track row.',
  SpotifyEmbed:
    'SpotifyEmbed { url?, embedId?, embedType?: "track"|"album"|"playlist"|"episode"|"show", height? } — embedded Spotify player.',
  TikTokEmbed:
    "TikTokEmbed { url?, videoId? } — embedded TikTok video.",
  YouTubeEmbed:
    "YouTubeEmbed { url?, videoId?, title? } — embedded YouTube player.",
  LinkCard:
    "LinkCard { title, description?, url, imageSrc?, domain? } — rich link preview card.",
  Quote:
    'Quote { text, attribution?, tone?: "neutral"|"accent"|"success" } — pull quote or testimonial.',
  MediaStrip:
    "MediaStrip { label?, items: [{ label, src?, tone? }] } — horizontal stories/reels row.",
  ImageCard:
    'ImageCard { src?, title?, caption?, aspect?: "square"|"wide"|"tall", tone? } — full-bleed feed image card.',
  Countdown:
    "Countdown { label, targetDate, detail? } — event countdown timer.",
  AvatarRow:
    "AvatarRow { label?, people: [{ name, subtitle?, src?, tone? }] } — horizontal people row.",
  ShareRow:
    "ShareRow { label?, targets: [{ label, icon? }] } — iOS-style share targets row.",
  SoundCloudEmbed:
    "SoundCloudEmbed { url, height? } — embedded SoundCloud player.",
  InstagramEmbed:
    "InstagramEmbed { url?, shortcode? } — embedded Instagram post or reel.",
  Poll:
    "Poll { question, options: [{ label, votes? }] } — tap-to-vote poll.",
  SegmentedControl:
    "SegmentedControl { segments: [{ label, selected? }] } — mobile segmented tabs.",
  Banner:
    'Banner { title, message?, tone?: "neutral"|"accent"|"success"|"warning", icon? } — inline alert banner.',
  Timeline:
    'Timeline { label?, events: [{ time, title, detail?, tone? }] } — vertical event timeline.',
  Rating:
    "Rating { label?, value: 0-5, max?, detail? } — star rating display.",
  VoiceNote:
    'VoiceNote { src, title?, duration?, tone?: "neutral"|"accent"|"success" } — voice message player.',
  ReactionBar:
    "ReactionBar { reactions: [{ emoji, count? }] } — tap reaction row with counts.",
  PhotoGrid:
    'PhotoGrid { photos: [{ src?, label?, tone? }], columns?: "2"|"3" } — tap-friendly photo grid.',
  QRCode:
    "QRCode { value, label?, detail? } — scannable QR code card.",
  AppleMusicEmbed:
    "AppleMusicEmbed { url, height? } — embedded Apple Music player.",
  BandcampEmbed:
    "BandcampEmbed { url, height? } — embedded Bandcamp player.",
  VimeoEmbed:
    "VimeoEmbed { url?, videoId?, title? } — embedded Vimeo player.",
  StickerRow:
    "StickerRow { label?, stickers: [{ emoji, label? }] } — horizontal emoji sticker row.",
  FullscreenHero:
    'FullscreenHero { eyebrow?, title, subtitle?, src?, tone?, aspect?: "square"|"wide"|"tall" } — Spotify-style cover header; square artwork over a tone gradient with title and metadata below.',
  Stepper:
    "Stepper { label, value, min?, max?, step? } — plus/minus quantity stepper.",
  FAB:
    'FAB { label?, icon?, variant?: "primary"|"accent" } — floating action button.',
  CommentThread:
    "CommentThread { label?, comments: [{ author, text, time?, tone? }] } — comment list.",
  MentionRow:
    "MentionRow { label?, mentions: [{ handle, name?, src?, tone? }] } — @mention chips.",
  PriceTag:
    'PriceTag { price, compareAt?, label?, tone?: "neutral"|"accent"|"success" } — pricing display.',
  TicketCard:
    "TicketCard { title, subtitle?, code?, seat?, date?, tone? } — event pass card.",
  CalendarSlot:
    "CalendarSlot { date, time, label, selected? } — selectable date/time slot.",
  RSVP:
    "RSVP { eventTitle?, options: [{ label, count?, selected? }] } — going/maybe/no picker.",
  TabBar:
    "TabBar { tabs: [{ label, icon?, selected? }] } — bottom tab bar preview.",
  DirectionsCard:
    "DirectionsCard { label, address, url?, lat?, lng? } — open in Maps row.",
  Accordion:
    "Accordion { items: [{ title, content, open? }] } — expandable FAQ sections.",
  StatGrid:
    'StatGrid { stats: [{ label, value, detail? }], columns?: "2"|"3" } — compact stat grid.',
  BeforeAfter:
    "BeforeAfter { label?, beforeSrc?, afterSrc?, beforeLabel?, afterLabel?, position?: 0-100, tone? } — comparison slider.",
  Tabs:
    "Tabs { tabs: [{ label, selected? }] } — content tabs; children are panel bodies in order.",
  RangeSlider:
    "RangeSlider { label?, value: 0-100, min?, max?, step?, leftLabel?, rightLabel? } — continuous value slider for mood, budget, urgency.",
  CircularProgress:
    'CircularProgress { label?, value: 0-100, detail?, size?: "sm"|"md"|"lg", tone?: "neutral"|"accent"|"success" } — circular progress ring.',
  OptionCard:
    'OptionCard { label?, layout?: "stack"|"row", options: [{ title, subtitle?, tradeoff?, badge?, selected?, tone? }] } — option comparison for decisions.',
  ExplanationCard:
    'ExplanationCard { label?, title?, context?, reasons: [string], icon?, tone?: "neutral"|"accent"|"success" } — structured "Why this?" explanation.',
};

const GUIDE_RULES = `You generate UI specs for the PRISM renderer. A spec is JSON:
{ "root": "<id>", "elements": { "<id>": { "type": "<Component>", "props": {...}, "children": ["<id>", ...] } } }

Rules:
- Every id referenced in a "children" array MUST exist as a key in "elements".
- The root is usually a "Screen" whose children are the sections of the page.
- Use only the components below, with exactly these props.`;

const GUIDE_FOOTER = `Any "icon" prop MUST be one of: ${iconNames.join(", ")}. Omit the prop if none fit.

Build a polished, content-rich spec for the user's request. Every Screen MUST start with a FullscreenHero as its first child — a Spotify-style cover header with eyebrow, title, subtitle, tone, and optional src. Put the rest of the app content after it in 2-4 sections. Do not use Hero or ScreenHeader as the app header.`;

/** Validates that every registry component has documentation. */
export function assertCatalogGuideSync(): void {
  const documented = new Set(Object.keys(COMPONENT_SPECS));
  const missingDocs = CATALOG_COMPONENT_NAMES.filter((name) => !documented.has(name));
  const extraDocs = Object.keys(COMPONENT_SPECS).filter(
    (name) => !CATALOG_COMPONENT_NAMES.includes(name as (typeof CATALOG_COMPONENT_NAMES)[number]),
  );

  if (missingDocs.length > 0 || extraDocs.length > 0) {
    throw new Error(
      `CATALOG_GUIDE out of sync with registry. Missing docs: [${missingDocs.join(", ")}]. Extra docs: [${extraDocs.join(", ")}]`,
    );
  }
}

export function buildCatalogGuide(): string {
  assertCatalogGuideSync();

  const components = CATALOG_COMPONENT_NAMES.map((name) => `- ${COMPONENT_SPECS[name]}`).join(
    "\n",
  );

  return `${GUIDE_RULES}

Components:
${components}

${GUIDE_FOOTER}`;
}
