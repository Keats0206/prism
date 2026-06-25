"use client";

import { type CSSProperties, useState } from "react";
import { defineCatalog } from "@json-render/core";
import { defineRegistry, useActions } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { Icon } from "@/rlylabs/icons";

/**
 * Jukebox catalog. Two tiers, one engine:
 *
 *  - EXPRESSIVE PRIMITIVES (Box/Stack/Grid/Text/Image/Marquee) — a freeform,
 *    inline-style escape hatch so the model can compose genuinely weird, varied
 *    interfaces. Styling is inline CSS (not Tailwind classes, which the JIT
 *    can't emit for runtime-generated values); motion uses statically-defined
 *    animation classes from globals.css.
 *  - CAPABILITY COMPONENTS (JukeboxHeader/TrackList/PlaylistShelf/NowPlaying/
 *    PlayButton) — bound to the real Spotify action handlers. "Pixels are free,
 *    power is typed": creative layouts stay safe because anything that *acts*
 *    goes through the registered, validated action handlers.
 */

// --- action dispatch -------------------------------------------------------

function useRun() {
  const { handlers } = useActions();
  return (name: string, params: Record<string, unknown>) => {
    const fn = handlers[name];
    if (fn) void Promise.resolve(fn(params)).catch(() => {});
  };
}

// --- inline style engine ---------------------------------------------------

const SHADOWS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.3)",
  md: "0 8px 24px rgba(0,0,0,0.35)",
  lg: "0 24px 70px rgba(0,0,0,0.5)",
  glow: "0 0 48px rgba(110,231,183,0.55)",
};

const ANIM_CLASS: Record<string, string> = {
  none: "",
  float: "jb-anim-float",
  spin: "jb-anim-spin",
  pulse: "jb-anim-pulse",
  wobble: "jb-anim-wobble",
  gradient: "jb-anim-gradient",
};

const FONTS: Record<string, string> = {
  sans: '"Satoshi", system-ui, sans-serif',
  serif: '"Sentient", Georgia, serif',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
  display: '"Clash Display", "Satoshi", sans-serif',
};

function dim(v: unknown): string | undefined {
  if (v == null) return undefined;
  return typeof v === "number" ? `${v}px` : String(v);
}

/** Shared style props every primitive accepts. */
const styleFields = {
  bg: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  padding: z.union([z.string(), z.number()]).nullable().optional(),
  margin: z.union([z.string(), z.number()]).nullable().optional(),
  radius: z.union([z.string(), z.number()]).nullable().optional(),
  width: z.union([z.string(), z.number()]).nullable().optional(),
  height: z.union([z.string(), z.number()]).nullable().optional(),
  minHeight: z.union([z.string(), z.number()]).nullable().optional(),
  maxWidth: z.union([z.string(), z.number()]).nullable().optional(),
  border: z.string().nullable().optional(),
  opacity: z.number().nullable().optional(),
  rotate: z.number().nullable().optional(),
  scale: z.number().nullable().optional(),
  blur: z.number().nullable().optional(),
  shadow: z.enum(["none", "sm", "md", "lg", "glow"]).nullable().optional(),
  animation: z
    .enum(["none", "float", "spin", "pulse", "wobble", "gradient"])
    .nullable()
    .optional(),
};

type Styleish = Record<string, unknown>;

function resolveStyle(p: Styleish): { style: CSSProperties; animClass: string } {
  const style: CSSProperties = {};
  if (p.bg != null) style.background = String(p.bg);
  if (p.color != null) style.color = String(p.color);
  if (p.padding != null) style.padding = dim(p.padding);
  if (p.margin != null) style.margin = dim(p.margin);
  if (p.radius != null) style.borderRadius = dim(p.radius);
  if (p.width != null) style.width = dim(p.width);
  if (p.height != null) style.height = dim(p.height);
  if (p.minHeight != null) style.minHeight = dim(p.minHeight);
  if (p.maxWidth != null) style.maxWidth = dim(p.maxWidth);
  if (p.border != null) style.border = String(p.border);
  if (p.opacity != null) style.opacity = Number(p.opacity);
  if (p.blur != null) style.filter = `blur(${Number(p.blur)}px)`;

  const transforms: string[] = [];
  if (p.rotate != null) transforms.push(`rotate(${Number(p.rotate)}deg)`);
  if (p.scale != null) transforms.push(`scale(${Number(p.scale)})`);
  if (transforms.length) style.transform = transforms.join(" ");

  const shadow = p.shadow != null ? SHADOWS[String(p.shadow)] : undefined;
  if (shadow) style.boxShadow = shadow;

  return { style, animClass: ANIM_CLASS[String(p.animation ?? "none")] ?? "" };
}

const JUSTIFY: Record<string, string> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
};

// --- capability helpers ----------------------------------------------------

function formatDuration(ms?: number | null): string | null {
  if (!ms || ms <= 0) return null;
  const total = Math.round(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

const TONE_GRADIENTS: Record<string, string> = {
  violet: "linear-gradient(160deg, #7c3aed, #18181b)",
  rose: "linear-gradient(160deg, #e11d48, #18181b)",
  emerald: "linear-gradient(160deg, #059669, #18181b)",
  amber: "linear-gradient(160deg, #f59e0b, #18181b)",
  sky: "linear-gradient(160deg, #0284c7, #18181b)",
  stone: "linear-gradient(160deg, #57534e, #18181b)",
};

function Artwork({ src, size }: { src?: string | null; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        flexShrink: 0,
        background: src
          ? `center/cover no-repeat url(${src})`
          : "rgba(255,255,255,0.1)",
      }}
    />
  );
}

const trackItem = z.object({
  name: z.string(),
  uri: z.string(),
  artists: z.string().nullable().optional(),
  album: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  durationMs: z.number().nullable().optional(),
});

const playlistItem = z.object({
  name: z.string(),
  uri: z.string().nullable().optional(),
  id: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  trackCount: z.number().nullable().optional(),
});

// --- catalog ---------------------------------------------------------------

export const catalog = defineCatalog(schema, {
  components: {
    // Expressive primitives
    Screen: {
      props: z.object({ ...styleFields }),
      description:
        "Root canvas. Accepts all style props (bg gradient, minHeight, etc.). Holds anything as children.",
    },
    Box: {
      props: z.object({ ...styleFields }),
      description:
        "Freeform styled container. Use bg (any CSS color/gradient), padding, radius, border, shadow, rotate, scale, blur, opacity, animation. Holds children.",
    },
    Stack: {
      props: z.object({
        ...styleFields,
        direction: z.enum(["row", "col"]).nullable().optional(),
        gap: z.number().nullable().optional(),
        align: z
          .enum(["start", "center", "end", "stretch"])
          .nullable()
          .optional(),
        justify: z
          .enum(["start", "center", "end", "between", "around"])
          .nullable()
          .optional(),
        wrap: z.boolean().nullable().optional(),
      }),
      description: "Flex layout container (row or col) with gap/align/justify.",
    },
    Grid: {
      props: z.object({
        ...styleFields,
        columns: z.number().nullable().optional(),
        gap: z.number().nullable().optional(),
      }),
      description: "CSS grid with N equal columns.",
    },
    Text: {
      props: z.object({
        ...styleFields,
        content: z.string(),
        size: z.union([z.string(), z.number()]).nullable().optional(),
        weight: z.union([z.string(), z.number()]).nullable().optional(),
        font: z.enum(["sans", "serif", "mono", "display"]).nullable().optional(),
        align: z.enum(["left", "center", "right"]).nullable().optional(),
        tracking: z.union([z.string(), z.number()]).nullable().optional(),
        italic: z.boolean().nullable().optional(),
        uppercase: z.boolean().nullable().optional(),
        gradient: z
          .boolean()
          .nullable()
          .optional()
          .describe("Clip `bg` gradient into the text for gradient type"),
      }),
      description:
        "Typography. size/weight as px-number or CSS string; font display = Clash Display; gradient:true clips bg into the glyphs.",
    },
    Image: {
      props: z.object({
        ...styleFields,
        src: z.string(),
        fit: z.enum(["cover", "contain"]).nullable().optional(),
        aspect: z.union([z.string(), z.number()]).nullable().optional(),
      }),
      description: "Image block (background-image based). Use radius/shadow/etc.",
    },
    Marquee: {
      props: z.object({
        ...styleFields,
        text: z.string().nullable().optional(),
        speed: z.number().nullable().optional(),
      }),
      description:
        "Horizontally scrolling marquee of `text` (or children). speed = seconds per loop.",
    },

    // Capability components (bound to live Spotify)
    JukeboxHeader: {
      props: z.object({
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        tone: z
          .enum(["violet", "rose", "emerald", "amber", "sky", "stone"])
          .nullable()
          .optional(),
      }),
      description: "Spotify-style cover header with artwork + title.",
    },
    TrackList: {
      props: z.object({
        title: z.string().nullable().optional(),
        items: z.array(trackItem),
        saveAsPlaylist: z.boolean().nullable().optional(),
      }),
      description:
        "List of REAL tracks. Each row plays/queues itself; header can play all or save the set. Keep exact uri values.",
    },
    PlaylistShelf: {
      props: z.object({
        title: z.string().nullable().optional(),
        items: z.array(playlistItem),
      }),
      description: "Horizontal cards of playlists/albums; tap plays that uri.",
    },
    NowPlaying: {
      props: z.object({
        name: z.string().nullable().optional(),
        artists: z.string().nullable().optional(),
        image: z.string().nullable().optional(),
        isPlaying: z.boolean().nullable().optional(),
      }),
      description: "Now-playing bar with live play/pause + skip controls.",
    },
    PlayButton: {
      props: z.object({
        ...styleFields,
        uri: z.string().nullable().optional(),
        contextUri: z.string().nullable().optional(),
        uris: z.array(z.string()).nullable().optional(),
        label: z.string().nullable().optional(),
      }),
      description:
        "A styleable button that triggers real playback — drop it anywhere in a creative layout. Give it a track uri, a contextUri (playlist/album), or a uris array.",
    },
  },
  actions: {},
});

// --- registry --------------------------------------------------------------

export const { registry } = defineRegistry(catalog, {
  components: {
    Screen: ({ props, children }) => {
      const { style, animClass } = resolveStyle(props);
      return (
        <div
          className={animClass}
          style={{ minHeight: "100%", color: "#fff", ...style }}
        >
          {children}
        </div>
      );
    },

    Box: ({ props, children }) => {
      const { style, animClass } = resolveStyle(props);
      return (
        <div className={animClass} style={style}>
          {children}
        </div>
      );
    },

    Stack: ({ props, children }) => {
      const { style, animClass } = resolveStyle(props);
      return (
        <div
          className={animClass}
          style={{
            display: "flex",
            flexDirection: props.direction === "row" ? "row" : "column",
            gap: props.gap ?? 12,
            alignItems:
              props.align === "stretch"
                ? "stretch"
                : JUSTIFY[props.align ?? "start"],
            justifyContent: JUSTIFY[props.justify ?? "start"],
            flexWrap: props.wrap ? "wrap" : "nowrap",
            ...style,
          }}
        >
          {children}
        </div>
      );
    },

    Grid: ({ props, children }) => {
      const { style, animClass } = resolveStyle(props);
      return (
        <div
          className={animClass}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${props.columns ?? 2}, minmax(0, 1fr))`,
            gap: props.gap ?? 12,
            ...style,
          }}
        >
          {children}
        </div>
      );
    },

    Text: ({ props }) => {
      const { style, animClass } = resolveStyle(props);
      const gradient =
        props.gradient && props.bg
          ? {
              backgroundImage: String(props.bg),
              WebkitBackgroundClip: "text" as const,
              backgroundClip: "text" as const,
              color: "transparent",
            }
          : {};
      return (
        <div
          className={animClass}
          style={{
            fontSize: dim(props.size) ?? "1rem",
            fontWeight: (props.weight as number | string | undefined) ?? 400,
            fontFamily: FONTS[props.font ?? "sans"],
            textAlign: props.align ?? "left",
            letterSpacing: dim(props.tracking),
            fontStyle: props.italic ? "italic" : undefined,
            textTransform: props.uppercase ? "uppercase" : undefined,
            lineHeight: 1.15,
            ...style,
            ...gradient,
          }}
        >
          {props.content}
        </div>
      );
    },

    Image: ({ props }) => {
      const { style, animClass } = resolveStyle(props);
      return (
        <div
          className={animClass}
          style={{
            aspectRatio:
              props.aspect != null ? String(props.aspect) : undefined,
            background: `center/${props.fit ?? "cover"} no-repeat url(${props.src})`,
            ...style,
          }}
        />
      );
    },

    Marquee: ({ props, children }) => {
      const { style, animClass } = resolveStyle(props);
      const content = props.text ? (
        <span style={{ paddingRight: 48 }}>{props.text}</span>
      ) : (
        <span style={{ paddingRight: 48, display: "inline-flex", gap: 24 }}>
          {children}
        </span>
      );
      return (
        <div
          className={animClass}
          style={{ overflow: "hidden", width: "100%", ...style }}
        >
          <div
            className="jb-marquee-track"
            style={props.speed ? { animationDuration: `${props.speed}s` } : undefined}
          >
            {content}
            {content}
          </div>
        </div>
      );
    },

    // --- capability components ---

    JukeboxHeader: ({ props }) => (
      <header
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 16,
          padding: "48px 20px 24px",
          background: TONE_GRADIENTS[props.tone ?? "violet"],
        }}
      >
        <Artwork src={props.image} size={120} />
        <div style={{ minWidth: 0, paddingBottom: 4 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
            }}
          >
            Jukebox
          </p>
          <h1
            style={{
              margin: "4px 0 0",
              fontSize: 32,
              fontWeight: 800,
              fontFamily: FONTS.display,
            }}
          >
            {props.title}
          </h1>
          {props.subtitle ? (
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              {props.subtitle}
            </p>
          ) : null}
        </div>
      </header>
    ),

    TrackList: ({ props }) => {
      const run = useRun();
      const items = props.items ?? [];
      const uris = items.map((t) => t.uri).filter(Boolean);
      return (
        <section style={{ padding: "12px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: FONTS.display }}>
              {props.title ?? "Tracks"}
            </h2>
            <div style={{ display: "flex", gap: 8 }}>
              {props.saveAsPlaylist && uris.length > 0 ? (
                <button
                  type="button"
                  onClick={() => run("createPlaylist", { name: props.title ?? "Jukebox mix", uris })}
                  style={pillBtn(false)}
                >
                  <Icon name="plus" className="size-3.5" /> Save
                </button>
              ) : null}
              {uris.length > 0 ? (
                <button type="button" onClick={() => run("playMusic", { uris })} style={pillBtn(true)}>
                  <Icon name="play" className="size-3.5" /> Play all
                </button>
              ) : null}
            </div>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((track, index) => (
              <li
                key={track.uri ?? index}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px" }}
              >
                <span style={{ width: 20, textAlign: "right", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  {index + 1}
                </span>
                <Artwork src={track.image} size={40} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {track.name}
                  </p>
                  {track.artists ? (
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{track.artists}</p>
                  ) : null}
                </div>
                {formatDuration(track.durationMs) ? (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDuration(track.durationMs)}</span>
                ) : null}
                <button type="button" title="Queue" onClick={() => run("addToQueue", { uri: track.uri })} style={iconBtn}>
                  <Icon name="plus" className="size-4" />
                </button>
                <button type="button" title="Play" onClick={() => run("playMusic", { uri: track.uri })} style={{ ...iconBtn, background: "rgba(255,255,255,0.1)" }}>
                  <Icon name="play" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      );
    },

    PlaylistShelf: ({ props }) => {
      const run = useRun();
      const items = props.items ?? [];
      return (
        <section style={{ padding: "12px 0" }}>
          {props.title ? (
            <h2 style={{ padding: "0 16px", margin: "0 0 12px", fontSize: 18, fontWeight: 800, fontFamily: FONTS.display }}>
              {props.title}
            </h2>
          ) : null}
          <div style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 8px" }}>
            {items.map((p, i) => (
              <button
                key={p.id ?? p.uri ?? i}
                type="button"
                onClick={() => (p.uri ? run("playMusic", { contextUri: p.uri }) : undefined)}
                style={{ width: 144, flexShrink: 0, textAlign: "left", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, padding: 12, cursor: "pointer", color: "#fff" }}
              >
                <Artwork src={p.image} size={120} />
                <p style={{ margin: "8px 0 0", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  {p.owner ?? (p.trackCount != null ? `${p.trackCount} tracks` : "")}
                </p>
              </button>
            ))}
          </div>
        </section>
      );
    },

    NowPlaying: ({ props }) => {
      const run = useRun();
      const [playing, setPlaying] = useState<boolean>(props.isPlaying ?? false);
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "12px 16px", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(24,24,27,0.8)" }}>
          <Artwork src={props.image} size={48} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{props.name ?? "Nothing playing"}</p>
            {props.artists ? <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{props.artists}</p> : null}
          </div>
          <button
            type="button"
            title={playing ? "Pause" : "Play"}
            onClick={() => {
              run(playing ? "pausePlayback" : "resumePlayback", {});
              setPlaying(!playing);
            }}
            style={{ borderRadius: 999, padding: 8, background: "#fff", color: "#000", border: "none", cursor: "pointer", display: "inline-flex" }}
          >
            <Icon name={playing ? "pause" : "play"} className="size-4" />
          </button>
          <button type="button" title="Next" onClick={() => run("skipToNext", {})} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Next ›
          </button>
        </div>
      );
    },

    PlayButton: ({ props }) => {
      const run = useRun();
      const { style, animClass } = resolveStyle(props);
      return (
        <button
          type="button"
          className={animClass}
          onClick={() =>
            run("playMusic", {
              uri: props.uri ?? undefined,
              uris: props.uris ?? undefined,
              contextUri: props.contextUri ?? undefined,
            })
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 999,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            background: "#1db954",
            color: "#000",
            ...style,
          }}
        >
          <Icon name="play" className="size-4" />
          {props.label ?? "Play"}
        </button>
      );
    },
  },
});

// --- shared button styles --------------------------------------------------

function pillBtn(primary: boolean): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: primary ? 700 : 500,
    cursor: "pointer",
    border: primary ? "none" : "1px solid rgba(255,255,255,0.15)",
    background: primary ? "#1db954" : "transparent",
    color: primary ? "#000" : "rgba(255,255,255,0.8)",
  };
}

const iconBtn: CSSProperties = {
  borderRadius: 999,
  padding: 6,
  border: "none",
  background: "transparent",
  color: "rgba(255,255,255,0.7)",
  cursor: "pointer",
  display: "inline-flex",
};
