// ═══════════════════════════════════════════════════════════
// Ano Ulam? — one product, one row, the cheapest wins
// ═══════════════════════════════════════════════════════════
// Chan, 29 Jul 2026: "i want the system to display only the most cheaper,
// system should compare which is cheaper local or imported? then display the
// cheaper so no duplicates" ... "sizes dont realy matter in palengke" ...
// "when going into palengke you will really not hear the word imported there
// instead we are picking the most affordable".
//
// So the DA sheet's 158 rows collapse to the ~120 things you can actually buy.
// The seller (Local, Imported, Magnolia, Bounty Fresh, Unbranded Fresh) and the
// pack size are sorting noise, not the product. Whichever row is cheapest today
// is the one shown, under a plain Filipino name with no origin word on it.
//
// WHY THIS REPLACED A HAND-WRITTEN HIDE LIST: the old lib/commodity-names.ts
// killed duplicates by naming each loser individually. That list could only be
// as current as the last time somebody edited it, and it was hiding the wrong
// side — imported garlic was hidden at ₱151 while local showed at ₱355, on an
// app whose entire promise is the cheapest price. A rule that reads the prices
// cannot go stale that way.
//
// The winner CAN change from day to day, and that is the rule working. If local
// garlic drops below imported next week, the local row simply starts winning.

import { getDisplayName, commodityNameMap } from "./commodity-names.ts";

/**
 * Every name Chan actually chose.
 *
 * Needed because getDisplayName() ALWAYS returns something: when it finds no
 * entry it hands back a tidied version of the raw DA string. That fallback is
 * fine to show, but it must never outrank a real name. Without this set, a
 * group whose cheapest row happens to be unnamed ("Garlic Imported") would be
 * labelled "Garlic" while "Bawang" sat unused on the losing row.
 */
const CHOSEN_NAMES = new Set(Object.values(commodityNameMap));

export interface PriceRow {
  /** The raw DA sheet name. */
  name: string;
  price: number;
}

export interface Product<T extends PriceRow> {
  /** Canonical key. Internal; never shown. */
  key: string;
  /** What the page shows. No "Local", no "Imported", no pack size. */
  label: string;
  /** The cheapest row, and the only one that survives. */
  winner: T;
  /** Everything that competed, cheapest first. Includes the winner. */
  variants: T[];
}

// "Unbranded" appears bare on some sheets and as "Unbranded Fresh" on others,
// so it is matched on its own. Found by sweeping the 55 days of history: on
// 2026-07-14 the DA wrote "Chicken Breast Local Unbranded" and the label came
// out still carrying both words.
const BRANDS = /\b(Magnolia|Bounty Fresh|Unbranded(\s+Fresh)?|Fully Dressed)\b/gi;

/** Origin words, matched ANYWHERE rather than only at the end. */
const ORIGIN_ANYWHERE = /\b(Imported|Local|Native)\b/gi;

/**
 * Trailing pack text: counts, weights, bundle sizes. Removed one at a time.
 * NOT a general cleanup — each pattern is anchored to the END so it can only
 * ever remove trailing noise, never a word from the middle of a product name.
 */
const PACK_TEXT: RegExp[] = [
  /\s*\([^)]*\d[^)]*\)\s*$/, // "(3-4 pcs/kg)", "(301-400 g)"
  /\s*\d[\d\s.,\-]*(?:gm?|kg|g|ml|cm)\b.*$/i, // "750 gm - 1 kg/head"
  /\s*\d[\d\s.,\-]*(?:pcs?|pieces?)\b.*$/i, // "8-10 pcs/kg", "56-60 grams/pc"
  /\s*\d[\d\s.,\-]*(?:Small|Large|Medium)?\s*Bundles?\b.*$/i, // "3-4 Small Bundles"
  /\s*\b(Fresh or Chilled|Whole Round|Fresh Loose)\b.*$/i,
];

/**
 * What PRODUCT is this row, ignoring who sold it and how it was packed.
 *
 * Size words go too. Chan: "on sizes can we also pick the cheapest, example
 * bangus medium is cheaper - then display it and just name it Bangus, sizes
 * dont realy matter in palengke." So "Bangus Medium" and "Bangus Large" are one
 * product with two prices, and the cheaper one wins.
 *
 * Variety words in brackets are deliberately KEPT: "Chilli (Green)" and
 * "Chilli (Red)" are siling green and siling pula, and "Banana (Saba)" is not
 * "Banana (Lakatan)". Where two varieties really are one thing to a shopper,
 * Chan says so by giving them the same name, and mergeByName() below handles it.
 */
export function canonicalProduct(daName: string): string {
  let s = daName.replace(BRANDS, " ").replace(/\b(Imported|Local|Native)\b/gi, " ");

  for (let i = 0; i < 12; i++) {
    let next = s;
    for (const pattern of PACK_TEXT) {
      const shorter = next.replace(pattern, "").trim();
      if (shorter && shorter !== next) {
        next = shorter;
        break;
      }
    }
    if (next === s) break;
    s = next;
  }

  // A bare trailing size word, now that its origin neighbour is gone. Eggs are
  // exempt: a medium and a large egg are two different things to buy, so they
  // must stay two products rather than merging into a cheapest-egg row.
  if (!SIZE_IS_THE_PRODUCT.test(s)) {
    for (let i = 0; i < 3; i++) s = s.replace(/\s*\b(Small|Medium|Large)\b\s*$/i, " ").trim();
  }

  s = s.replace(/\//g, " ").replace(/\s+/g, " ").trim();

  // "Bangus Medium Medium" -> "Bangus Medium" -> "Bangus"
  s = s
    .split(" ")
    .filter((w, i, all) => i === 0 || w.toLowerCase() !== all[i - 1].toLowerCase())
    .join(" ");

  return s.toLowerCase();
}

/**
 * Take the seller and the pack size off a label.
 *
 * Both words are gone from the page by Chan's instruction: "when going into
 * palengke you will really not hear the word imported there", and "sizes dont
 * realy matter in palengke... just name it Bangus". Since the sizes now compete
 * as one product, a label reading "Bangus Medium" would be describing the row
 * that happened to win today rather than the thing you are buying.
 *
 * Only a TRAILING size word goes. "Sibuyas puti" and "Bigas premium" keep every
 * word, because those are the product, not the packaging.
 */
export function stripOrigin(label: string): string {
  const out = label.replace(/\s*\b(imported|local|native)\b\s*$/i, "").trim();
  if (SIZE_IS_THE_PRODUCT.test(out)) return out;

  let shortened = out;
  for (let i = 0; i < 3; i++) {
    const shorter = shortened.replace(/\s*\b(small|medium|large)\b\s*$/i, "").trim();
    if (!shorter || shorter === shortened) break;
    shortened = shorter;
  }
  return shortened;
}

/**
 * Where the size is NOT packaging but the thing you are buying.
 *
 * Chan, 29 Jul 2026: "the Egg - i think show it Size, egg sizes is important in
 * palengke". He is right, and it is the one place the general rule is wrong: a
 * medium egg and a large egg are different purchases at different prices, in a
 * way that a medium and a large bangus are not to a shopper who just wants
 * bangus. So eggs keep their size in the label AND stay separate products, and
 * everything else still collapses.
 */
const SIZE_IS_THE_PRODUCT = /\b(egg|itlog)\b/i;

/**
 * Tidy a raw DA string enough to show when Chan has not named it.
 *
 * Origin words are removed from ANYWHERE in the string, not just the end. The
 * 55-day history sweep found sheets that write them mid-name — "Tambakol
 * (Yellow-Fin Tuna) Imported Medium Frozen" — where trailing-only stripping
 * left the word sitting in the middle of the label.
 */
function tidy(daName: string): string {
  const cleaned = daName
    .replace(BRANDS, " ")
    .replace(ORIGIN_ANYWHERE, " ")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^[,\s]+|[,\s]+$/g, "");
  return stripOrigin(cleaned);
}

/**
 * Collapse the sheet to one row per product.
 *
 * `nameOf` returns the display name for a raw DA string; it defaults to the
 * project's own map. It is injectable so the regression net can drive this with
 * fixtures instead of the live map.
 */
export function competeOnPrice<T extends PriceRow>(
  rows: T[],
  nameOf: (daName: string) => string = getDisplayName,
): Product<T>[] {
  const priced = rows.filter((r) => Number.isFinite(r.price) && r.price > 0);

  // ── group by canonical product ──
  const byKey = new Map<string, T[]>();
  for (const row of priced) {
    const key = canonicalProduct(row.name);
    const bucket = byKey.get(key);
    if (bucket) bucket.push(row);
    else byKey.set(key, [row]);
  }

  // ── merge groups Chan named the same thing ──
  // Three cabbage cultivars are all "Repolyo" to him, and canonicalProduct
  // cannot know that, because "(Scorpio)" and "(Wonder Ball)" look exactly like
  // the variety brackets that MUST stay apart on bananas and chillies. His name
  // is the only authority on which is which, so it decides here.
  /** A name Chan actually chose for this row, or null. */
  const chosenName = (daName: string): string | null => {
    const name = nameOf(daName);
    return CHOSEN_NAMES.has(name) ? stripOrigin(name) : null;
  };

  // forEach, not for..of: tsconfig targets es5 and iterating a Map is the
  // TS2802 trap this project's platform notes name. Same reason RECIPE_DA_KEYS
  // uses Array.from.
  const keyToName = new Map<string, string>();
  byKey.forEach((group, key) => {
    for (const row of group) {
      const named = chosenName(row.name);
      if (named) {
        keyToName.set(key, named);
        break;
      }
    }
  });

  const merged = new Map<string, T[]>();
  byKey.forEach((group, key) => {
    const name = keyToName.get(key);
    const target = name ? "name:" + name.toLowerCase() : key;
    const bucket = merged.get(target);
    if (bucket) bucket.push.apply(bucket, group);
    else merged.set(target, group.slice());
  });

  // ── cheapest wins ──
  const products: Product<T>[] = [];
  merged.forEach((variants: T[], key: string) => {
    const sorted = variants.slice().sort((a: T, b: T) => a.price - b.price);
    const winner = sorted[0];

    // A name Chan chose always beats a fallback, whichever row won on price.
    // Otherwise a group whose cheapest row happens to be unnamed would show the
    // raw sheet text ("Garlic") while the real name ("Bawang") sat on a loser.
    // Within the chosen names, cheapest-first order decides.
    const chosen = sorted.map((r: T) => chosenName(r.name)).filter(Boolean) as string[];
    const label = chosen[0] || tidy(winner.name);

    products.push({ key, label, winner, variants: sorted });
  });

  return products;
}
