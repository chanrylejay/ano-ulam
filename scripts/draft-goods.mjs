// Work out what stands between the researched drafts and shipping them.
//
//   node scripts/draft-goods.mjs --drafts <recipe-drafts.json> [--json]
//
// For every draft ingredient it answers one question: can the app price this
// today? The answer is one of
//   DA      a DA key that resolves on today's sheet
//   priced  a good already in lib/grocery-items.ts or a recipe fallback
//   notes   Chan has given a price but it was never wired, because no live
//           recipe needed the good
//   free    a pantry good that is deliberately not charged
//   NEEDS   nobody has priced it
//
// A draft with a NEEDS ingredient that is REQUIRED cannot ship: hasRequiredPrices
// drops the whole dish and it silently never appears.
//
// Goods are DEDUPLICATED before counting. The drafts spell one good several ways
// ("Spam", "Spam o ham", "SPAM o luncheon meat"), which inflated an earlier count
// from 94 real goods to 124.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  RECIPES, calculateRecipeCost, calculateRecipeCostDetailed, pantryItemPrice, pantryCost, pantryRole,
} from "../lib/recipes.ts";
import { GROCERY_ITEMS } from "../lib/grocery-items.ts";
import { parseDAPriceIndex, resolvePrice, buildPriceMap } from "../lib/da-parser.ts";

const require = createRequire(import.meta.url);
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");
const ROOT = process.cwd();

const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
};
const draftsPath = argValue("--drafts");
if (!draftsPath) {
  console.error("pass --drafts <recipe-drafts.json>");
  process.exit(1);
}
const drafts = JSON.parse(fs.readFileSync(draftsPath, "utf8"));

/** Collapse the spellings the drafts use for one good. */
export function canonGood(raw) {
  let s = raw.toLowerCase().trim();
  s = s.replace(/\(.*?\)/g, " ");        // drop parentheticals
  s = s.split(/\s+o\s+/)[0];             // "spam o ham" -> "spam"
  s = s.replace(/\bna de lata\b|\bde lata\b|\bbottled\b/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  const ALIAS = {
    spam: "luncheon meat",
    evaporada: "evaporated milk",
    "gatas na evaporada": "evaporated milk",
    mozzarella: "quickmelt cheese",
    quickmelt: "quickmelt cheese",
    "cream of mushroom soup": "cream of mushroom",
    spaghetti: "pasta",
    penne: "pasta",
    fusilli: "pasta",
    "hilaw na langka": "langka",
    "katas ng kimchi": "kimchi",
    "bulaklak ng saging": "puso ng saging",
    "tuwalya ng baka": "laman-loob ng baka",
    "baga at puso ng baboy": "laman-loob ng baboy",
    "maskara at tenga ng baboy": "maskara ng baboy",
    "green papaya": "papaya (hilaw)",
    papaya: "papaya (hilaw)",
    "pineapple juice": "pineapple",
    "pineapple chunks": "pineapple",
    "pinya, pira-piraso at ang katas": "pineapple",
    mais: "mais de lata",
  };
  return ALIAS[s] || s;
}

/**
 * Prices Chan has given that live only in memory/ano-ulam-manual-prices.md,
 * because no LIVE recipe used the good. Wiring these costs nothing.
 */
const PRICED_IN_NOTES = {
  tokwa: "P5 per pc",
  hipon: "P350/kg (BFAR Jan 2026, medium)",
  misua: "P22 per 100g",
  sotanghon: "P10 per pack",
  patola: "P80/kg",
  labanos: "P70/kg",
  "talbos ng kamote": "P20 per tali",
  sitsaro: "P200 per 250g",
  "luyang dilaw": "P10 per small pc",
};

/** Goods the DA sheet carries under an English name the drafts did not use. */
const DA_ALIAS = {
  togue: "Mungbean",
  munggo: "Mungbean",
  pechay: "Pechay",
  repolyo: "Cabbage",
  sayote: "Chayote",
  ampalaya: "Ampalaya",
  kalabasa: "Squash",
  pusit: "Squid",
  alimasag: "Crab",
  dilis: "Dilis",
  tinapa: "Tinapa",
  bulalo: "Beef Brisket",
  harina: "Flour",
};

// ── today's sheet ───────────────────────────────────────────
const listing = await (await fetch("https://www.da.gov.ph/price-monitoring/")).text();
const $ = cheerio.load(listing);
let pdfUrl = null;
$('a[href*="Daily-Price-Index"][href$=".pdf"]').each((_, el) => {
  if (pdfUrl) return;
  const h = $(el).attr("href");
  pdfUrl = h.startsWith("http") ? h : "https://www.da.gov.ph" + h;
});
if (!pdfUrl) throw new Error("no Daily Price Index PDF on the DA listing page");
const daRows = parseDAPriceIndex(
  (await (pdfParse.default || pdfParse)(Buffer.from(await (await fetch(pdfUrl)).arrayBuffer()))).text
);

// The engine needs a price map, over every daKey the LIVE book and the DRAFTS
// between them reach for.
const priceMap = buildPriceMap(
  Array.from(new Set([
    ...RECIPES.flatMap((r) => r.ingredients.map((i) => i.daKey)),
    ...drafts.flatMap((d) => (d.ingredients || []).map((i) => i.daKey)),
  ].filter(Boolean))),
  daRows,
);

const priced = new Set(GROCERY_ITEMS.map((i) => canonGood(i.name)));
const free = new Set();
for (const r of RECIPES) {
  for (const p of r.pantryItems) free.add(canonGood(p.name));
  for (const i of r.ingredients) if (i.daKey === null) priced.add(canonGood(i.name));
}

function classify(ing) {
  if (ing.daKey && resolvePrice(ing.daKey, daRows) !== undefined) {
    return { status: "DA", detail: ing.daKey };
  }
  const c = canonGood(ing.name);
  if (priced.has(c)) return { status: "priced", detail: "" };
  if (free.has(c)) return { status: "free", detail: "" };
  if (PRICED_IN_NOTES[c]) return { status: "notes", detail: PRICED_IN_NOTES[c] };
  const alias = DA_ALIAS[c];
  if (alias) {
    const p = resolvePrice(alias, daRows);
    if (p !== undefined) return { status: "DA", detail: alias + " at P" + p.toFixed(2) + "/kg" };
  }
  return { status: "NEEDS", detail: "" };
}

/**
 * Every non-DA price the app can already put on a good, gathered once.
 *
 * Sources, in the order they win: a pack Chan chose in lib/grocery-items.ts, a
 * fallbackPrice already sitting on a live recipe, a price he gave that was never
 * wired, or a DA row under an English name the drafts did not use.
 */
const knownPrice = (() => {
  const map = new Map();

  for (const item of GROCERY_ITEMS) {
    if (item.pack) map.set(canonGood(item.name), item.pack.price);
  }
  for (const recipe of RECIPES) {
    for (const ing of recipe.ingredients) {
      if (ing.daKey === null && ing.fallbackPrice !== undefined) {
        map.set(canonGood(ing.name), ing.fallbackPrice);
      }
    }
  }
  // Prices Chan gave that never reached the code, because no live recipe used
  // the good. Parsed from the strings so there is still one home for them.
  const NOTES_NUMBERS = {
    tokwa: 5, hipon: 350, misua: 22, sotanghon: 10,
    patola: 80, labanos: 70, "talbos ng kamote": 20, sitsaro: 200,
    "luyang dilaw": 10,
  };
  for (const [good, price] of Object.entries(NOTES_NUMBERS)) {
    if (!map.has(good)) map.set(good, price);
  }
  for (const [good, alias] of Object.entries(DA_ALIAS)) {
    if (map.has(good)) continue;
    const price = resolvePrice(alias, daRows);
    if (price !== undefined) map.set(good, price);
  }

  return (name) => map.get(canonGood(name));
})();

/**
 * Cost a draft with the REAL engine, not a copy of it.
 *
 * A draft has the same shape as a Recipe, so attaching the prices we know and
 * handing it to calculateRecipeCostDetailed gives numbers that cannot disagree
 * with a meal card. It also picks up the palengke overrides, the 3/4 kg protein
 * bump and the newly-priced pantry for free.
 *
 * A dish missing a required price gets NO TOTAL, only its known lines. The
 * detailed function happily sums an unpriced ingredient as zero, and presenting
 * that partial figure as the price is the Galunggong P0 bug — a missing price
 * once read as free and ranked the dish cheapest.
 */
function costDraft(draft) {
  const priced = {
    id: draft.id,
    name: draft.name,
    servings: "1-3 katao",
    ingredients: (draft.ingredients || []).map((ing) => ({
      name: ing.name,
      daKey: ing.daKey ?? null,
      qty: ing.qty,
      unit: ing.unit,
      amount: ing.amount,
      optional: !!ing.optional,
      fallbackPrice: ing.daKey ? undefined : knownPrice(ing.name),
    })),
    steps: draft.steps || [],
    pantryItems: draft.pantryItems || [],
  };

  const complete = Number.isFinite(calculateRecipeCost(priced, priceMap));
  const detail = calculateRecipeCostDetailed(priced, priceMap, priceMap);
  const costs = new Map();
  for (const row of detail.ingredientCosts) costs.set(row.name, row.cost);

  return { complete, total: complete ? detail.totalCost : null, costs };
}

// ── per draft ───────────────────────────────────────────────
const goods = new Map();
const out = drafts.map((d) => {
  const costed = costDraft(d);
  // pantryRole only reads recipe.pantryItems, so this stand-in is enough to ask
  // the real function rather than re-deriving the rules here.
  const pantryView = { pantryItems: d.pantryItems || [] };
  const ingredients = (d.ingredients || []).map((ing) => {
    const { status, detail } = classify(ing);
    if (status === "NEEDS" || status === "notes") {
      const c = canonGood(ing.name);
      if (!goods.has(c)) {
        goods.set(c, { good: c, status, detail, req: 0, opt: 0, dishes: [], spellings: new Set() });
      }
      const g = goods.get(c);
      ing.optional ? g.opt++ : g.req++;
      if (!g.dishes.includes(d.name)) g.dishes.push(d.name);
      g.spellings.add(ing.name);
    }
    return {
      name: ing.name,
      amount: ing.amount,
      optional: !!ing.optional,
      status,
      detail,
      // An unpriced good must never render as P0. The engine sums it as zero,
      // and "free" is exactly how the Galunggong bug once made a dish look
      // cheapest. null means "no price", which the page shows as a dash.
      cost: status === "NEEDS" ? null
        : costed.costs.has(ing.name) ? costed.costs.get(ing.name) : null,
    };
  });

  const blockers = ingredients.filter((i) => i.status === "NEEDS" && !i.optional);
  const notesOnly = ingredients.filter((i) => i.status === "notes" && !i.optional);
  return {
    id: d.id,
    name: d.name,
    protein: d.protein,
    method: d.method,
    source: d.source,
    ingredients,
    // The pantry is half the recipe. Leaving it out of the review page produced
    // six false complaints about missing oil, flour and butter that were all
    // there. It travels with the draft from here on.
    // The pantry, split the way a card shows it: charged goods carry a price,
    // the genuinely free ones do not.
    pantry: (d.pantryItems || [])
      .filter((p) => pantryRole(pantryView, p.name) === "free")
      .map((p) => ({ name: p.name, amount: p.amount })),
    pricedPantry: (d.pantryItems || [])
      .map((p) => ({ p, role: pantryRole(pantryView, p.name) }))
      .filter(({ role }) => role === "charged" || role === "optional")
      .map(({ p, role }) => ({
        name: p.name,
        amount: p.amount,
        cost: role === "charged" ? pantryItemPrice(p.name) : null,
        optional: role === "optional",
      })),
    pantryTotal: pantryCost({ pantryItems: d.pantryItems || [] }),
    total: costed.total,
    complete: costed.complete,
    steps: d.steps || [],
    blockers: blockers.map((b) => b.name),
    needsWiringOnly: blockers.length === 0 && notesOnly.length > 0,
    ready: blockers.length === 0 && notesOnly.length === 0,
  };
});

const goodsList = Array.from(goods.values())
  .map((g) => ({ ...g, spellings: Array.from(g.spellings) }))
  .sort((a, b) => b.req - a.req || b.dishes.length - a.dishes.length);

const ready = out.filter((d) => d.ready).length;
const wiring = out.filter((d) => d.needsWiringOnly).length;
const blocked = out.filter((d) => d.blockers.length).length;

// Duplicate ids are a real defect in the drafts, not a pricing problem.
const seen = new Map();
for (const d of out) seen.set(d.id, (seen.get(d.id) || 0) + 1);
const dupes = Array.from(seen.entries()).filter(([, n]) => n > 1).map(([id]) => id);

console.log("RESEARCHED DRAFTS: " + out.length);
console.log("  ready now                 " + ready);
console.log("  need only wiring          " + wiring + "   (you priced the good already, it was never put in the code)");
console.log("  blocked on an unpriced good " + blocked);
console.log("  duplicate ids             " + dupes.length + (dupes.length ? "  " + dupes.join(", ") : ""));
console.log("");
console.log("GOODS TO PRICE: " + goodsList.filter((g) => g.status === "NEEDS" && g.req > 0).length +
  " required, " + goodsList.filter((g) => g.status === "NEEDS" && g.req === 0).length + " optional only, " +
  goodsList.filter((g) => g.status === "notes").length + " already in your notes");
console.log("");
for (const g of goodsList.filter((g) => g.status === "NEEDS" && g.req > 0)) {
  console.log("  " + g.good.slice(0, 26).padEnd(28) + String(g.req).padStart(3) + " req  " +
    String(g.opt || "").padStart(2) + "   " + g.dishes[0].slice(0, 34));
}

if (process.argv.includes("--json")) {
  const dir = path.join(ROOT, "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "draft-audit.json");
  fs.writeFileSync(
    file,
    JSON.stringify({ counts: { total: out.length, ready, wiring, blocked }, dupes, drafts: out, goods: goodsList }, null, 2),
    "utf8"
  );
  console.log("");
  console.log("wrote " + path.relative(ROOT, file));
}
