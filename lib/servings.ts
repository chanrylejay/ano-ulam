// ═══════════════════════════════════════════════════════════
// Ano Ulam? — servings bands ("ilan kayo?")
// ═══════════════════════════════════════════════════════════
// Every recipe in lib/recipes.ts is written for "1-3 katao". Seven people in
// the viral Facebook thread asked for bigger portions, and the one commenter
// who said he would pay for this was feeding a family of four plus workers
// plus his mother. A dormer asking for 1-2 portions is the same feature seen
// from the other end.
//
// Chan's call (Jul 29 2026): keep 1-3 as the base, and offer the rest as
// two-number bands rather than a single number, because that is how a Filipino
// household actually counts ("mga lima kami"). He picked six bands.
//
// The bands are deliberately +2 apart so every multiplier is a whole number.
// That is not decoration: it means a 1/2 kg becomes 1 kg or 1 1/2 kg, never
// 1.37 kg. Quantities people can actually carry to the palengke.

export interface ServingBand {
  /** Stored on the phone, so it must stay stable once shipped. */
  key: string;
  /** How many people, as written on the pill. */
  people: string;
  /** Full label, e.g. for the servings line inside a card. */
  label: string;
  /** Everything scales by this. The base band is 1. */
  multiplier: number;
}

export const SERVING_BANDS: ServingBand[] = [
  { key: "1-3", people: "1-3", label: "1-3 katao", multiplier: 1 },
  { key: "3-5", people: "3-5", label: "3-5 katao", multiplier: 2 },
  { key: "5-7", people: "5-7", label: "5-7 katao", multiplier: 3 },
  { key: "7-9", people: "7-9", label: "7-9 katao", multiplier: 4 },
  { key: "9-11", people: "9-11", label: "9-11 katao", multiplier: 5 },
  { key: "11-13", people: "11-13", label: "11-13 katao", multiplier: 6 },
];

/** What every recipe is written for. Selecting this changes nothing. */
export const BASE_BAND: ServingBand = SERVING_BANDS[0];

/** localStorage key. Versioned so a future band change cannot resurrect a dead key. */
export const SERVINGS_STORAGE_KEY = "anoulam.servings.v1";

export function bandByKey(key: string | null | undefined): ServingBand {
  if (!key) return BASE_BAND;
  return SERVING_BANDS.find((b) => b.key === key) ?? BASE_BAND;
}

// ═══════════════════════════════════════════════════════════
// COST
// ═══════════════════════════════════════════════════════════

/**
 * Scale a peso total.
 *
 * LINEAR, and that is a deliberate decision, not laziness.
 *
 * The obvious alternative is to multiply each ingredient's QUANTITY and re-run
 * the cost engine. That produces a different and WORSE number, because of the
 * palengke overrides in lib/recipes.ts: those apply only while qty <= 0.2 kg.
 * Bawang is 0.04 kg per recipe and costs ₱7 as "1 ulo" instead of ₱355/kg. Six
 * times that is 0.24 kg, which crosses the threshold, so re-costing would price
 * six heads of garlic at ₱85 instead of ₱42.
 *
 * ₱42 is the true number. A palengke sells bawang by the ulo at the same price
 * per ulo whether you buy one or six; the 0.2 kg threshold marks "this is a
 * by-piece item", NOT "this is a small purchase". So the per-unit rate holds at
 * every band, which is exactly what linear scaling does.
 *
 * The one thing linear scaling cannot model is a real bulk discount. We have no
 * data for that and this project's canon forbids inventing prices, so we do not
 * pretend to know it.
 */
export function scaleCost(cost: number, multiplier: number): number {
  if (!Number.isFinite(cost)) return cost;
  return Math.round(cost * multiplier);
}

// ═══════════════════════════════════════════════════════════
// AMOUNT LABELS
// ═══════════════════════════════════════════════════════════
// The `amount` on an ingredient is a hand-written label ("1/2 kg", "1 ulo",
// "1-2 pcs"), not a number, so it cannot just be multiplied.
//
// MEASURED, not assumed. Across the 47 recipes there are 23 distinct ingredient
// labels and 28 distinct pantry labels, and every one of the 51 has the shape
//
//     <number-or-fraction> [ - <number-or-fraction> ] <unit words>
//
// so the parser below covers 100% of the real data rather than most of it.
// scripts/selection-regression.mjs asserts that every label still parses, so a
// new recipe written in a new shape fails the net instead of silently showing
// a base amount next to a scaled price.
//
// TWO BUGS THIS CODE EXISTS TO AVOID, both found by running the scaler over the
// real labels instead of trusting it:
//
//   1. Rounding to a fixed grid is lossy. An early version snapped to quarters,
//      which turned "1/3 cup" doubled into "3/4 cup". It is 2/3. Thirds are
//      real: the pantry uses them. So the maths below is EXACT rational
//      arithmetic — multiply the numerator, reduce the fraction, never round.
//   2. Pluralising the FIRST word is wrong. "1 thumb-sized piece" needs the
//      last word, not the first. So does "1 cup" -> "3 cups", which an earlier
//      version rendered as "3 cup".

/** Abbreviations and Filipino unit words that never take an -s. */
const NEVER_PLURAL = new Set([
  "kg", "g", "ml", "l", "tsp", "tbsp", "oz", "lb",
  "ulo", "piraso", "tali", "katao", "salop",
]);

interface Fraction {
  numerator: number;
  denominator: number;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "1/2" -> 1/2, "3" -> 3/1, anything else -> null. */
function parseValue(token: string): Fraction | null {
  const fraction = /^(\d+)\/(\d+)$/.exec(token);
  if (fraction) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return null;
    return { numerator: Number(fraction[1]), denominator };
  }
  if (/^\d+$/.test(token)) return { numerator: Number(token), denominator: 1 };
  return null;
}

function scaleFraction(value: Fraction, multiplier: number): Fraction {
  const numerator = value.numerator * multiplier;
  const divisor = gcd(numerator, value.denominator) || 1;
  return { numerator: numerator / divisor, denominator: value.denominator / divisor };
}

/** 1/2 -> "1/2", 3/2 -> "1 1/2", 3/1 -> "3". Exact, never rounded. */
function renderValue(value: Fraction): string {
  const { numerator, denominator } = value;
  if (denominator === 1) return String(numerator);

  const whole = Math.floor(numerator / denominator);
  const remainder = numerator - whole * denominator;
  if (remainder === 0) return String(whole);

  const fraction = remainder + "/" + denominator;
  return whole === 0 ? fraction : whole + " " + fraction;
}

function isPlural(value: Fraction): boolean {
  return value.numerator > value.denominator;
}

/**
 * Pluralise the unit's LAST word: "thumb-sized piece" -> "thumb-sized pieces".
 * Words already ending in -s, abbreviations and Filipino units are left alone.
 */
function pluralize(unit: string, value: Fraction): string {
  if (!isPlural(value)) return unit;

  const words = unit.split(" ");
  const last = words[words.length - 1];
  if (NEVER_PLURAL.has(last.toLowerCase())) return unit;
  if (last.toLowerCase().endsWith("s")) return unit;

  words[words.length - 1] = last + "s";
  return words.join(" ");
}

const AMOUNT = /^(\d+(?:\/\d+)?)(?:\s*-\s*(\d+(?:\/\d+)?))?\s+(.+)$/;

/** Whether the scaler understands a label. Used by the regression net. */
export function canScaleAmount(amount: string): boolean {
  const match = AMOUNT.exec(amount.trim());
  if (!match) return false;
  if (parseValue(match[1]) === null) return false;
  if (match[2] !== undefined && parseValue(match[2]) === null) return false;
  return true;
}

/**
 * "1/2 kg" x3 -> "1 1/2 kg" · "1 ulo" x4 -> "4 ulo" · "1-2 pcs" x2 -> "2-4 pcs".
 *
 * A label the parser does not understand is returned UNCHANGED. That is the
 * safe direction: showing the base amount is merely unhelpful, whereas showing
 * a mangled one would send somebody to the palengke with the wrong list.
 */
export function scaleAmount(amount: string, multiplier: number): string {
  if (multiplier === 1) return amount;

  const match = AMOUNT.exec(amount.trim());
  if (!match) return amount;

  const low = parseValue(match[1]);
  if (low === null) return amount;

  const highToken = match[2];
  const unit = match[3];

  if (highToken === undefined) {
    const scaled = scaleFraction(low, multiplier);
    return renderValue(scaled) + " " + pluralize(unit, scaled);
  }

  const high = parseValue(highToken);
  if (high === null) return amount;

  const scaledLow = scaleFraction(low, multiplier);
  const scaledHigh = scaleFraction(high, multiplier);
  return (
    renderValue(scaledLow) + "-" + renderValue(scaledHigh) + " " + pluralize(unit, scaledHigh)
  );
}
