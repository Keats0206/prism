export type SemanticTone = "neutral" | "accent" | "success";
export type SemanticToneWithWarning = SemanticTone | "warning";
export type ActionVariant = "primary" | "secondary";
export type FabVariant = "primary" | "accent";

export const toneGradients = {
  rose: "from-rose-200 to-orange-200",
  amber: "from-amber-200 to-yellow-100",
  sky: "from-sky-200 to-cyan-100",
  emerald: "from-emerald-200 to-teal-100",
  violet: "from-violet-200 to-fuchsia-100",
  stone: "from-stone-200 to-stone-100",
} as const;

/** Richer gradients for Spotify-style app headers. */
export const heroBackdropGradients = {
  rose: "from-rose-600 via-rose-800 to-stone-950",
  amber: "from-amber-600 via-orange-800 to-stone-950",
  sky: "from-sky-600 via-cyan-800 to-stone-950",
  emerald: "from-emerald-600 via-teal-800 to-stone-950",
  violet: "from-violet-600 via-purple-900 to-stone-950",
  stone: "from-stone-600 via-stone-800 to-stone-950",
} as const;

export type GradientTone = keyof typeof toneGradients;

export const aspectHeights = {
  square: "aspect-square",
  wide: "aspect-video",
  tall: "aspect-[3/4]",
} as const;

export const pillTones: Record<SemanticTone, string> = {
  neutral: "bg-surface-elevated text-muted",
  accent: "bg-accent-subtle text-accent",
  success: "bg-success-subtle text-success",
};

export const metricTones: Record<SemanticTone, string> = {
  neutral: "bg-surface-muted text-fg",
  accent: "bg-accent-subtle text-accent-fg",
  success: "bg-success-subtle text-success-fg",
};

export const actionVariants: Record<ActionVariant, string> = {
  primary: "bg-primary text-primary-fg",
  secondary: "bg-surface-elevated text-fg-secondary",
};

export const bannerTones: Record<SemanticToneWithWarning, string> = {
  neutral: "border-border bg-surface-muted text-fg-secondary",
  accent: "border-accent-border bg-accent-subtle text-accent-fg",
  success: "border-success-border bg-success-subtle text-success-fg",
  warning: "border-warning-border bg-warning-subtle text-warning-fg",
};

export const chipTones: Record<SemanticTone, string> = {
  neutral: "bg-surface-elevated text-muted",
  accent: "bg-accent-subtle text-accent ring-1 ring-accent-border",
  success: "bg-success-subtle text-success",
};

export const boardAccents: Record<SemanticTone, string> = {
  neutral: "text-subtle",
  accent: "text-accent",
  success: "text-success",
};

export const quoteTones: Record<SemanticTone, string> = {
  neutral: "border-border bg-surface-muted text-fg-secondary",
  accent: "border-accent-border bg-accent-subtle text-accent-fg",
  success: "border-success-border bg-success-subtle text-success-fg",
};

export const timelineDotTones: Record<SemanticTone, string> = {
  neutral: "bg-primary",
  accent: "bg-accent",
  success: "bg-success",
};

export const voiceNoteTones: Record<SemanticTone, string> = {
  neutral: "bg-surface-muted",
  accent: "bg-accent-subtle",
  success: "bg-success-subtle",
};

export const priceTagTones: Record<SemanticTone, string> = {
  neutral: "bg-surface text-fg",
  accent: "bg-accent-subtle text-accent-fg",
  success: "bg-success-subtle text-success-fg",
};

export const fabVariants: Record<FabVariant, string> = {
  primary: "bg-primary text-primary-fg",
  accent: "bg-accent text-primary-fg",
};

export const circularProgressTones: Record<SemanticTone, string> = {
  neutral: "stroke-primary",
  accent: "stroke-accent",
  success: "stroke-success",
};

export const optionCardTones: Record<SemanticTone, string> = {
  neutral: "border-border bg-surface",
  accent: "border-accent-border bg-accent-subtle",
  success: "border-success-border bg-success-subtle",
};

export const explanationCardTones: Record<SemanticTone, string> = {
  neutral: "border-border bg-surface-muted",
  accent: "border-accent-border bg-accent-subtle",
  success: "border-success-border bg-success-subtle",
};

export const selectedInteractive =
  "border-primary bg-primary text-primary-fg";

export const unselectedInteractive =
  "border-border bg-surface-muted text-fg-secondary";

export const selectedPollBar = "bg-primary/15";
export const unselectedPollBar = "bg-track-strong";
