export const SOCIAL_GOAL_CHIPS = [
  "More spontaneous",
  "Deeper friendships",
  "More consistent hangouts",
  "Meet new people",
  "Less planning friction",
  "More adventure",
] as const;

export const WISH_SEEN_CHIPS = [
  "College friends",
  "Work friends",
  "Neighbors",
  "Family",
  "Partner's friends",
  "Old roommates",
  "People from home",
] as const;

export const WANT_TO_DO_CHIPS = [
  "Weekly dinners",
  "Game nights",
  "Hiking & outdoors",
  "Trying new restaurants",
  "Live music & shows",
  "Sports & pickup games",
  "Coffee catch-ups",
  "Weekend trips",
] as const;

export const TOGETHER_IDEA_CHIPS = [
  "Grab coffee",
  "Try a new restaurant",
  "See live music",
  "Go for a walk or hike",
  "Game night",
  "Cook dinner together",
  "Check out a new spot",
  "Plan a weekend trip",
] as const;

export function formatChipSelection(selected: string[], custom?: string): string {
  const parts = [...selected];
  const trimmed = custom?.trim();
  if (trimmed) parts.push(trimmed);
  return parts.join(", ");
}
