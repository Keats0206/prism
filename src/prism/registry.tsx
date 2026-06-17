"use client";

import { useState } from "react";
import { defineCatalog } from "@json-render/core";
import { defineRegistry, useBoundProp } from "@json-render/react";
import { schema } from "@json-render/react/schema";
import { z } from "zod";
import { Icon, iconNames } from "./icons";

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
  },
  actions: {},
});

export const { registry } = defineRegistry(catalog, {
  components: {
    Screen: ({ props, children }) => {
      const widths = {
        sm: "max-w-md",
        md: "max-w-xl",
        lg: "max-w-3xl",
      };

      return (
        <div
          className={`mx-auto flex w-full flex-col gap-4 ${widths[props.maxWidth ?? "md"]}`}
        >
          {children}
        </div>
      );
    },
    ScreenHeader: ({ props }) => (
      <header className="flex flex-col gap-3">
        {props.eyebrow ? (
          <p className="text-xs font-medium text-zinc-400">{props.eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {props.title}
        </h1>
        {props.metaLeft || props.metaRight ? (
          <div className="flex items-center justify-between gap-4 text-sm text-zinc-500">
            <span>{props.metaLeft}</span>
            <span>{props.metaRight}</span>
          </div>
        ) : null}
      </header>
    ),
    Stack: ({ props, children }) => (
      <section className="w-full rounded-[26px] border border-black/10 bg-white p-4 shadow-sm">
        {props.title ? (
          <h2 className="mb-3 px-1 text-xs font-medium text-zinc-400">
            {props.title}
          </h2>
        ) : null}
        <div className="flex flex-col gap-2">{children}</div>
      </section>
    ),
    Pill: ({ props }) => {
      const tones = {
        neutral: "bg-zinc-100 text-zinc-600",
        accent: "bg-sky-50 text-sky-700",
        success: "bg-emerald-50 text-emerald-700",
      };

      return (
        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${tones[props.tone]}`}
        >
          {props.label}
        </span>
      );
    },
    Copy: ({ props }) => (
      <p className="text-sm leading-6 text-zinc-700">{props.text}</p>
    ),
    Hero: ({ props }) => (
      <div className="rounded-2xl border border-black/5 bg-stone-50 px-4 py-3 text-zinc-950">
        <div className="mb-2 flex items-center justify-between gap-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">
            {props.eyebrow}
          </p>
          {props.icon ? (
            <div className="rounded-xl bg-white p-2 shadow-sm">
              <Icon name={props.icon} className="size-4 text-zinc-600" />
            </div>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold tracking-tight">{props.title}</h3>
        <p className="mt-1 max-w-md text-xs leading-5 text-zinc-500">
          {props.subtitle}
        </p>
      </div>
    ),
    Metric: ({ props }) => {
      const tones = {
        neutral: "bg-zinc-50 text-zinc-950",
        accent: "bg-sky-50 text-sky-950",
        success: "bg-emerald-50 text-emerald-950",
      };

      return (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ${tones[props.tone]}`}
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
      );
    },
    Row: ({ props }) => (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex items-center gap-3">
          {props.icon ? (
            <div className="rounded-xl bg-stone-100 p-2">
              <Icon name={props.icon} className="size-3.5 text-zinc-600" />
            </div>
          ) : null}
          <div>
            <p className="text-sm font-medium text-zinc-900">{props.title}</p>
            <p className="mt-0.5 text-xs text-zinc-400">{props.subtitle}</p>
          </div>
        </div>
        {props.trailing ? (
          <span className="shrink-0 text-sm font-medium text-zinc-700">
            {props.trailing}
          </span>
        ) : null}
      </div>
    ),
    Action: ({ props }) => {
      const variants = {
        primary: "bg-zinc-950 text-white",
        secondary: "bg-zinc-100 text-zinc-700",
      };

      return (
        <button
          type="button"
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-medium ${variants[props.variant]}`}
        >
          {props.icon ? <Icon name={props.icon} className="size-4" /> : null}
          {props.label}
        </button>
      );
    },
    Progress: ({ props }) => {
      const hasLabels = props.label || props.leftLabel || props.rightLabel;

      return (
        <div className={hasLabels ? "rounded-xl bg-stone-50 px-3 py-2.5" : ""}>
        {hasLabels ? (
          <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
            <span>{props.label ?? props.leftLabel}</span>
            <span>{props.rightLabel ?? `${props.value}%`}</span>
          </div>
        ) : null}
        <div className="h-1 overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-zinc-950"
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-zinc-950">
                {props.header.title}
              </h2>
              {props.header.subtitle ? (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {props.header.subtitle}
                </p>
              ) : null}
            </div>
            {props.header.trailing ? (
              <span className="pt-0.5 text-xs text-zinc-400">
                {props.header.trailing}
              </span>
            ) : null}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {props.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="grid min-h-10 items-center gap-2 rounded-xl bg-zinc-50 px-3"
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
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-black/15 text-zinc-500"
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
                        className="h-8 w-full min-w-0 bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
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
                        className="justify-self-end rounded-full bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 shadow-sm"
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
                        className="h-1.5 overflow-hidden rounded-full bg-black/10"
                      >
                        <div
                          className="h-full rounded-full bg-zinc-950"
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
                          ? "text-base font-semibold text-zinc-950"
                          : cell.kind === "time"
                            ? "text-xs font-medium text-zinc-400"
                            : "truncate text-sm text-zinc-600"
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
        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
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
          <span className="text-xs text-zinc-400">{props.label}</span>
          <input
            className="h-11 rounded-2xl border border-black/10 px-4 text-sm outline-none focus:border-zinc-300"
            placeholder={props.placeholder ?? ""}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      );
    },
    Board: ({ props }) => {
      const accents = {
        neutral: "text-zinc-400",
        accent: "text-sky-600",
        success: "text-emerald-600",
      };

      return (
        <section className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
          {props.columns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="flex w-60 shrink-0 flex-col gap-2"
            >
              <div className="flex items-center justify-between px-1">
                <h2
                  className={`text-xs font-semibold uppercase tracking-[0.14em] ${accents[column.accent ?? "neutral"]}`}
                >
                  {column.title}
                </h2>
                <span className="text-[11px] text-zinc-400">
                  {column.cards.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {column.cards.map((card, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {card.title}
                      </p>
                      {card.badge ? (
                        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                          {card.badge}
                        </span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {card.subtitle}
                      </p>
                    ) : null}
                    {card.meta ? (
                      <p className="mt-2 text-[11px] text-zinc-400">
                        {card.meta}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      );
    },
    Gallery: ({ props }) => {
      const toneGradients = {
        rose: "from-rose-200 to-orange-200",
        amber: "from-amber-200 to-yellow-100",
        sky: "from-sky-200 to-cyan-100",
        emerald: "from-emerald-200 to-teal-100",
        violet: "from-violet-200 to-fuchsia-100",
        stone: "from-stone-200 to-stone-100",
      };
      const heights = ["h-32", "h-44", "h-36", "h-40", "h-48", "h-32"];

      return (
        <section className="columns-2 gap-3 sm:columns-3">
          {props.tiles.map((tile, tileIndex) => (
            <div
              key={tileIndex}
              className="mb-3 break-inside-avoid overflow-hidden rounded-2xl border border-black/5 shadow-sm"
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
  },
});
