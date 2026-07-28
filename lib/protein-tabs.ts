// ═══════════════════════════════════════════════════════════
// Protein tabs — ONE home for the category row
// ═══════════════════════════════════════════════════════════
// The homepage and /ulam both render this row. A second hardcoded copy drifts
// the moment a category is added, and the two pages then disagree about what
// "Gulay" means. Everything category-shaped goes through here.
//
// The categories themselves come from getProteinType(), which reads the recipe
// id. Verified 28 Jul 2026: all 47 recipes land in one of these six, so nothing
// is reachable only through "Lahat".

import { getProteinType, type Recipe } from "@/lib/recipes";

export type ProteinFilter = "lahat" | "fish" | "chicken" | "pork" | "beef" | "egg" | "veggie";

export interface ProteinTab {
  key: ProteinFilter;
  /** Full label as shown on the tab row, emoji included. */
  label: string;
  /** Emoji alone, for compact list rows where a tab does not fit. */
  emoji: string;
}

export const PROTEIN_TABS: ProteinTab[] = [
  { key: "lahat", label: "Lahat", emoji: "🍽️" },
  { key: "fish", label: "🐟 Isda", emoji: "🐟" },
  { key: "chicken", label: "🍗 Manok", emoji: "🍗" },
  { key: "pork", label: "🥩 Baboy", emoji: "🥩" },
  { key: "beef", label: "🐄 Beef", emoji: "🐄" },
  { key: "egg", label: "🥚 Itlog", emoji: "🥚" },
  { key: "veggie", label: "🥬 Gulay", emoji: "🥬" },
];

export function matchesProteinFilter(recipe: Recipe, filter: ProteinFilter): boolean {
  return filter === "lahat" || getProteinType(recipe) === filter;
}

/** The emoji for a recipe's own category. Falls back to a plate, never blank. */
export function proteinEmoji(recipe: Recipe): string {
  const type = getProteinType(recipe);
  return PROTEIN_TABS.find((t) => t.key === type)?.emoji ?? "🍽️";
}
