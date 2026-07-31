// ═══════════════════════════════════════════════════════════
// Ano Ulam? — "Nasa bahay ko na" (the pantry / fridge)
// ═══════════════════════════════════════════════════════════
// Chan, Jul 29 2026: "this is a new feauture like selecting pantry items or
// items in the fridge, this should be a new section".
//
// He is right that it deserves its own surface, and he is right that it is
// bigger than the roadmap line ("check/uncheck optional and pantry items so
// they stop inflating the total"). That line rests on a premise the code does
// not support: optional ingredients ALREADY do not count toward a total
// (calculateRecipeCost skips them), and pantryItems carry no price at all. So
// nothing is being inflated and there is nothing to switch off.
//
// The feature that IS worth building is the opposite one: SUBTRACT what you
// already own. Bawang appears in 39 of the 47 recipes and Sibuyas in 36, so
// two taps make almost every dish on the site cheaper. That is a real number,
// not a marketing one, and it is why each row shows its recipe count.
//
// WHAT IS TICKABLE, and why the list is not just "everything":
// an ingredient can only be owned in a way that changes a price if it costs
// something in the first place. That means a DA-priced ingredient, or one of
// the seven with a hand-set fallbackPrice (Kangkong, Malunggay, Gabi, Okra,
// Upo, Atay ng baboy, Mais). Toyo, suka, mantika and asin are deliberately
// ABSENT: they are pantryItems, they contribute ₱0 today, and a checkbox that
// changes nothing is theatre. The page says so in plain words instead.

// RELATIVE import, not the usual "@/lib/recipes" alias. The alias needs a
// bundler, and scripts/selection-regression.mjs runs on plain node — that is
// exactly why lib/protein-tabs.ts, which uses the alias, has never been covered
// by the net. The rules below (especially "an owned optional row must not
// change a total") fail silently in the browser, so being testable matters more
// here than matching the import style.
import {
  RECIPES,
  calculateRecipeCost,
  calculateRecipeCostDetailed,
  pantryItemPrice,
  pantryRole,
  type RecipeIngredient,
  type PriceMap,
} from "./recipes.ts";

/**
 * How a Filipino kitchen actually sorts itself, not how a database does.
 *
 * "Panggisa" is the real grouping: bawang, sibuyas, kamatis and luya are the
 * ginisa base and get bought together, even though a taxonomy would file
 * kamatis under vegetables.
 *
 * PANIMPLA LEADS, as of 30 Jul 2026, and it leads on measured impact rather than
 * taste. Oil and pepper stopped being free that day, and the counts flipped:
 * paminta is REQUIRED in 39 dishes and mantika in 38, against bawang's 32 and
 * sibuyas' 35. So the cabinet, not the panggisa, is now the top of this page.
 * Ticking mantika alone takes P10 off 38 dishes; pepper another P2 off 39.
 */
export type PantryGroup =
  | "panimpla"
  | "rekado"
  | "karne"
  | "isda"
  | "gulay"
  | "itlog"
  | "iba";

export const PANTRY_GROUPS: { key: PantryGroup; label: string }[] = [
  { key: "panimpla", label: "Mantika at panimpla" },
  { key: "rekado", label: "Rekado" },
  { key: "karne", label: "Karne" },
  { key: "isda", label: "Isda" },
  { key: "gulay", label: "Gulay" },
  { key: "itlog", label: "Itlog" },
  { key: "iba", label: "Iba pa" },
];

export interface OwnableIngredient {
  /** The display name, which is also the stored key. */
  name: string;
  daKey: string | null;
  fallbackPrice?: number;
  group: PantryGroup;
  /** How many of the 47 recipes list it. */
  recipeCount: number;
  /** How many list it as REQUIRED. Only these can change a total. */
  requiredCount: number;
}

/** localStorage key. Versioned, so a future rename cannot resurrect dead entries. */
export const PANTRY_STORAGE_KEY = "anoulam.pantry.v1";

/**
 * ORDER IS LOAD-BEARING. Two DA names contain another category's word:
 *
 *   "Eggplant"                  contains "egg"      -> talong filed under Itlog
 *   "Chicken Egg (White Medium)" contains "chicken" -> itlog filed under Karne
 *
 * The first one actually shipped in the first draft of this file and was caught
 * by printing the grouped list instead of trusting it. So the colliding
 * vegetables are matched first, then eggs, and only then the meats.
 */
function groupFor(name: string, daKey: string | null): PantryGroup {
  const key = (daKey || name).toLowerCase();
  const label = name.toLowerCase();

  if (/eggplant|talong/.test(key) || label === "talong") return "gulay";
  if (/chicken egg|^itlog$/.test(key) || label === "itlog") return "itlog";
  if (/garlic|onion|ginger|tomato|calamansi|chilli|siling/.test(key)) return "rekado";
  if (/pork|beef|chicken|liempo|kasim|atay/.test(key)) return "karne";
  if (/tilapia|bangus|galunggong|tamban|sardines/.test(key)) return "isda";
  if (
    /potato|carrot|cabbage|pechay|squash|chayote|sitao|ampalaya|broccoli|bell pepper|corn/.test(
      key,
    ) ||
    /kangkong|malunggay|okra|upo|gabi|sitaw|repolyo|kalabasa|sayote|mais/.test(label)
  ) {
    return "gulay";
  }
  return "iba";
}

/** An ingredient can only be "owned" usefully if it costs money. */
function costsMoney(ing: RecipeIngredient): boolean {
  return ing.daKey !== null || ing.fallbackPrice !== undefined;
}

/**
 * Every ingredient a person could already have at home, built from the recipes
 * themselves so it can never drift out of sync with them.
 *
 * Keyed on the DISPLAY name rather than the daKey on purpose. "Pork" and
 * "Ground Pork" share one daKey but are not the same thing in a fridge, and a
 * user ticking a list is thinking in names.
 */
export const OWNABLE_INGREDIENTS: OwnableIngredient[] = (() => {
  const found = new Map<string, OwnableIngredient>();

  for (const recipe of RECIPES) {
    const seenInThisRecipe = new Set<string>();
    for (const ing of recipe.ingredients) {
      if (!costsMoney(ing)) continue;
      // A recipe listing the same ingredient twice must still count once.
      if (seenInThisRecipe.has(ing.name)) continue;
      seenInThisRecipe.add(ing.name);

      const existing = found.get(ing.name);
      if (existing) {
        existing.recipeCount++;
        if (!ing.optional) existing.requiredCount++;
        continue;
      }
      found.set(ing.name, {
        name: ing.name,
        daKey: ing.daKey,
        fallbackPrice: ing.fallbackPrice,
        group: groupFor(ing.name, ing.daKey),
        recipeCount: 1,
        requiredCount: ing.optional ? 0 : 1,
      });
    }

    // Priced pantry goods are tickable too, and they are the biggest ticks on
    // the page. Chan, 30 Jul 2026, on why: he wants the homepage to say prices
    // are high and to send people straight here, and oil at P10 across 38 dishes
    // is the largest single saving available.
    //
    // A pantry good is never optional: PANTRY_PRICES only holds goods a dish
    // genuinely buys, and the free ones (asin, tubig, laurel) are absent from it
    // rather than marked. So requiredCount always increments.
    for (const item of recipe.pantryItems) {
      // Only a CHARGED good is worth a checkbox. An optional one costs nothing
      // to begin with, so ticking it could never move a total.
      if (pantryRole(recipe, item.name) !== "charged") continue;
      if (seenInThisRecipe.has(item.name)) continue;
      seenInThisRecipe.add(item.name);

      const existing = found.get(item.name);
      if (existing) {
        existing.recipeCount++;
        existing.requiredCount++;
        continue;
      }
      found.set(item.name, {
        name: item.name,
        daKey: null,
        fallbackPrice: pantryItemPrice(item.name),
        group: "panimpla",
        recipeCount: 1,
        requiredCount: 1,
      });
    }
  }

  // Impact order. The whole point of the page is that two taps change almost
  // everything, and that only reads if the big ones are at the top.
  // Array.from, not a spread: tsconfig targets es5, and spreading a Map
  // iterator is the TS2802 trap. RECIPE_DA_KEYS dodges it the same way.
  return Array.from(found.values()).sort(
    (a, b) => b.requiredCount - a.requiredCount || b.recipeCount - a.recipeCount ||
      a.name.localeCompare(b.name),
  );
})();

export function ownableByGroup(group: PantryGroup): OwnableIngredient[] {
  return OWNABLE_INGREDIENTS.filter((i) => i.group === group);
}

/**
 * What each ingredient typically costs INSIDE ONE DISH, averaged over the
 * recipes that require it.
 *
 * This is deliberately NOT the per-kilo price. Bawang is ₱355/kg on today's DA
 * sheet, but a recipe uses 0.04 kg and the palengke override prices that as one
 * ulo at ₱7. "₱355/kg" on the row would be true and useless; "~₱7 kada ulam" is
 * the number that actually decides whether ticking it is worth a tap.
 *
 * Built only from exported engine functions, so the pantry page can never
 * disagree with a meal card about what an ingredient costs.
 */
export function typicalCostByName(priceMap: PriceMap): Map<string, number> {
  const sums = new Map<string, { total: number; count: number }>();

  for (const recipe of RECIPES) {
    // Infinity means a required ingredient has no price today, and this
    // project's canon treats a partial total as worse than no total.
    if (!Number.isFinite(calculateRecipeCost(recipe, priceMap))) continue;

    const detail = calculateRecipeCostDetailed(recipe, priceMap, priceMap);
    for (const row of detail.ingredientCosts) {
      if (row.optional || !(row.cost > 0)) continue;
      const current = sums.get(row.name) ?? { total: 0, count: 0 };
      current.total += row.cost;
      current.count++;
      sums.set(row.name, current);
    }
  }

  const averages = new Map<string, number>();
  sums.forEach(({ total, count }, name) => averages.set(name, Math.round(total / count)));
  return averages;
}

/**
 * How many of the 47 recipes get cheaper given a set of owned names.
 *
 * Counts REQUIRED appearances only, because an owned optional ingredient
 * changes no total: calculateRecipeCost never added it.
 */
export function recipesAffected(owned: ReadonlySet<string>): number {
  if (owned.size === 0) return 0;
  let count = 0;
  for (const recipe of RECIPES) {
    const inIngredients = recipe.ingredients.some((ing) => !ing.optional && owned.has(ing.name));
    // A priced pantry good lowers the total too, so owning oil really does make
    // the dish cheaper and must be counted here.
    const inPantry = recipe.pantryItems.some(
      (item) => pantryRole(recipe, item.name) === "charged" && owned.has(item.name));
    if (inIngredients || inPantry) count++;
  }
  return count;
}

/** The shape both the homepage cards and /ulam already have to hand. */
export interface CostedRow {
  name: string;
  cost?: number;
  optional?: boolean;
}

/**
 * What an owned set takes off ONE dish's total, at base servings.
 *
 * OPTIONAL ROWS ARE SKIPPED, and that is the load-bearing line in this file.
 * calculateRecipeCost never added an optional ingredient to the total, so
 * subtracting an owned one would take away money that was never there and
 * quietly under-price the dish. This was the single easiest bug to write here.
 *
 * Driven by the already-costed rows rather than by re-costing, so a meal card
 * and the browse page can never disagree about what your fridge saved you.
 */
export function ownedDiscount(rows: CostedRow[], owned: ReadonlySet<string>): number {
  if (owned.size === 0) return 0;

  let saved = 0;
  for (const row of rows) {
    if (row.optional) continue;
    if (!owned.has(row.name)) continue;
    if (typeof row.cost === "number" && Number.isFinite(row.cost)) saved += row.cost;
  }
  return saved;
}

/**
 * Whether a row should render as "meron ka na".
 *
 * An owned OPTIONAL row is still struck through, because the person really does
 * own it and hiding that would look like a bug. It just cannot change the
 * total, which is why the strike-through and the discount ask different
 * questions of the same row.
 */
export function isOwnedRow(row: CostedRow, owned: ReadonlySet<string>): boolean {
  return owned.has(row.name);
}
