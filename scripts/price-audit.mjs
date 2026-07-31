// Trace every peso in every recipe back to where the price came from.
//
//   node scripts/price-audit.mjs           readable dump
//   node scripts/price-audit.mjs --json    also write data/price-audit.json
//
// This exists so Chan can check the whole book in one pass and lock it in.
// It rebuilds the cost trail per ingredient (which price, from which source,
// with which adjustment) and then CROSS-CHECKS its own total against the real
// engine's calculateRecipeCostDetailed. If the two ever disagree the audit is
// lying, so a mismatch is reported loudly rather than reconciled quietly.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

import {
  RECIPES, calculateRecipeCostDetailed, pantryItemPrice, PANTRY_SOURCES, pantryRole,
} from "../lib/recipes.ts";
import { parseDAPriceIndex, buildPriceMap, resolvePrice } from "../lib/da-parser.ts";
import { GROCERY_ITEMS, candidatesFor } from "../lib/grocery-items.ts";
import { getDisplayName, isHidden } from "../lib/commodity-names.ts";

const require = createRequire(import.meta.url);
const cheerio = require("cheerio");
const pdfParse = require("pdf-parse");
const ROOT = process.cwd();

// PALENGKE_RATE_OVERRIDES is private to lib/recipes.ts, and duplicating the
// numbers here would let the audit drift from the engine silently. Read them
// out of the source instead, so there is still exactly one home.
function readPalengkeOverrides() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "recipes.ts"), "utf8");
  const block = src.slice(src.indexOf("const PALENGKE_RATE_OVERRIDES"));
  const body = block.slice(block.indexOf("{") + 1, block.indexOf("}"));
  const out = {};
  for (const m of body.matchAll(/"([^"]+)"\s*:\s*([\d.]+)/g)) out[m[1]] = Number(m[2]);
  if (Object.keys(out).length === 0) throw new Error("could not read PALENGKE_RATE_OVERRIDES");
  return out;
}
const OVERRIDES = readPalengkeOverrides();

const groceryByName = new Map(GROCERY_ITEMS.map((i) => [i.name, i]));

// ── today's DA sheet ────────────────────────────────────────
const listing = await (await fetch("https://www.da.gov.ph/price-monitoring/")).text();
const $ = cheerio.load(listing);
let pdfUrl = null;
$('a[href*="Daily-Price-Index"][href$=".pdf"]').each((_, el) => {
  if (pdfUrl) return;
  const href = $(el).attr("href");
  pdfUrl = href.startsWith("http") ? href : "https://www.da.gov.ph" + href;
});
if (!pdfUrl) throw new Error("no Daily Price Index PDF on the DA listing page");

const sheetFile = decodeURIComponent(pdfUrl.split("/").pop());
const text = (await (pdfParse.default || pdfParse)(
  Buffer.from(await (await fetch(pdfUrl)).arrayBuffer())
)).text;
const daRows = parseDAPriceIndex(text);
const daKeys = Array.from(
  new Set(RECIPES.flatMap((r) => r.ingredients.map((i) => i.daKey)).filter(Boolean))
);
const priceMap = buildPriceMap(daKeys, daRows);

// ── per-ingredient trail ────────────────────────────────────
function trace(recipe, ing, engineRow) {
  // The engine rewrites `amount` to "3/4 kg" when it bumps a small main
  // protein, so a changed label is the tell that normalisation fired.
  const bumped = engineRow.amount !== ing.amount;
  const qty = bumped ? 0.75 : ing.qty;

  let source, detail, unitPrice, adjustment = null;

  if (ing.daKey && priceMap[ing.daKey] !== undefined) {
    const overridden = qty <= 0.2 && OVERRIDES[ing.daKey] !== undefined;
    unitPrice = overridden ? OVERRIDES[ing.daKey] : priceMap[ing.daKey];
    source = "DA";
    detail = ing.daKey;
    if (overridden) {
      // The override is a FIXED palengke rate, not a markup. It lands above
      // the DA rate for garlic and below it for onion, and both are correct:
      // the DA quotes a wholesale kilo, the override quotes what one ulo or
      // one piece really costs at the stall.
      const da = priceMap[ing.daKey];
      const direction = OVERRIDES[ing.daKey] > da ? "above" : "below";
      adjustment =
        `fixed palengke rate P${OVERRIDES[ing.daKey]}/kg, used for buys of 0.2 kg or less ` +
        `(${direction} today's DA kilo price of P${da.toFixed(2)})`;
    }
  } else if (ing.fallbackPrice !== undefined) {
    unitPrice = ing.fallbackPrice;
    const item = groceryByName.get(ing.name);
    if (item?.source === "shopsuki") {
      source = "ShopSuki";
      detail = item.pack.title;
    } else if (item?.source === "palengke") {
      source = "Chan";
      detail = item.reason;
    } else {
      source = "UNTRACED";
      detail = "has a hand price but no entry in lib/grocery-items.ts";
    }
  } else {
    source = "NO PRICE";
    detail = "neither a DA key nor a fallback price";
    unitPrice = 0;
  }

  if (bumped) {
    adjustment =
      (adjustment ? adjustment + "; " : "") +
      `main protein rounded up from ${ing.qty} kg to 0.75 kg (family portion)`;
  }

  return {
    name: ing.name,
    amount: engineRow.amount,
    originalAmount: ing.amount,
    qty,
    unit: ing.unit,
    optional: ing.optional,
    source,
    detail,
    unitPrice,
    adjustment,
    cost: engineRow.cost,
  };
}

const audit = [];
const problems = [];

// Where each priced pantry good's number came from. Explicit rather than
// inferred, because "traced to a source" is the one claim this file makes.
const PANTRY_SOURCE_KIND = {
  Mantika: "Chan",
  "Atsuete oil": "Chan",
  Asin: "Chan",
  // The 19 that stopped being free on 30 Jul 2026.
  "Mang Tomas sauce": "ShopSuki", "Lumpia wrapper": "ShopSuki",
  "Sweet chili sauce": "ShopSuki", Mayonnaise: "ShopSuki", "Oyster sauce": "ShopSuki",
  Breadcrumbs: "ShopSuki", "Banana ketchup": "ShopSuki", "Green peas": "ShopSuki",
  Raisins: "ShopSuki", "Atsuete powder": "ShopSuki", Laurel: "ShopSuki",
  Tanglad: "ShopSuki", "Puso ng saging": "ShopSuki",
  Bawang: "DA", Kalamansi: "DA", Luya: "DA", "Bell pepper": "DA",
  "Siling labuyo": "DA", Kintsay: "DA",
  Paminta: "Chan",
  "Pamintang buo": "Chan",
  Harina: "Chan",
  Flour: "Chan",
  Cornstarch: "Chan",
  Toyo: "ShopSuki",
  Patis: "ShopSuki",
  Suka: "ShopSuki",
  Margarine: "ShopSuki",
  Mantikilya: "ShopSuki",
  "Chicken broth cube": "ShopSuki",
  "Knorr chicken cube": "ShopSuki",
  Asukal: "DA",
  "Asukal na pula": "DA",
};

for (const recipe of RECIPES) {
  const detailed = calculateRecipeCostDetailed(recipe, priceMap, priceMap);
  const rows = recipe.ingredients.map((ing, i) => trace(recipe, ing, detailed.ingredientCosts[i]));

  // Oil, pepper and the sauces stopped being free on 30 Jul 2026. They are real
  // lines on a card now, so they are real lines here too — and the self-check
  // below caught their absence loudly rather than letting the audit drift 12
  // pesos under the engine on all 47 dishes, which is exactly its job.
  for (const item of recipe.pantryItems) {
    if (pantryRole(recipe, item.name) !== "charged") continue;
    const price = pantryItemPrice(item.name);
    if (price === undefined) continue;
    rows.push({
      name: item.name,
      amount: item.amount,
      originalAmount: item.amount,
      qty: 1,
      unit: "pcs",
      optional: false,
      source: PANTRY_SOURCE_KIND[item.name] || "UNTRACED",
      detail: PANTRY_SOURCES[item.name] || "priced but not recorded in PANTRY_SOURCES",
      unitPrice: price,
      adjustment: "flat tingi price for one dish, never price x amount",
      cost: price,
    });
  }

  // The audit must agree with the engine, to the peso.
  const mine = rows
    .filter((r) => !r.optional)
    .reduce((sum, r) => sum + r.unitPrice * r.qty, 0);
  const drift = Math.abs(Math.round(mine) - detailed.totalCost);
  if (drift > 1) {
    problems.push(
      `${recipe.name}: audit says P${Math.round(mine)}, engine says P${detailed.totalCost}`
    );
  }
  for (const r of rows) {
    if (r.source === "UNTRACED" || r.source === "NO PRICE") {
      problems.push(`${recipe.name}: "${r.name}" — ${r.detail}`);
    }
  }

  audit.push({
    id: recipe.id,
    name: recipe.name,
    servings: recipe.servings,
    total: detailed.totalCost,
    ingredients: rows,
    // Only the genuinely free ones. A priced pantry good is a charged line
    // above, and listing it here as well is the duplicate the meal card had.
    pantry: recipe.pantryItems
      .filter((p) => pantryRole(recipe, p.name) === "free")
      .map((p) => ({ name: p.name, amount: p.amount })),
  });
}

// ── report ──────────────────────────────────────────────────
const SOURCE_LABEL = {
  DA: "DA",
  ShopSuki: "SHOP",
  Chan: "CHAN",
  UNTRACED: "????",
  "NO PRICE": "????",
};

console.log("ANO ULAM — full price audit");
console.log("  DA sheet:  " + sheetFile);
console.log("  recipes:   " + audit.length);
console.log("  DA keys:   " + Object.keys(priceMap).length + "/" + daKeys.length + " priced today");
console.log("");

for (const r of audit.sort((a, b) => a.total - b.total)) {
  console.log("─".repeat(74));
  console.log(r.name + "   P" + r.total + "   (" + r.servings + ")");
  for (const i of r.ingredients) {
    console.log(
      "  " +
        SOURCE_LABEL[i.source].padEnd(5) +
        i.name.slice(0, 22).padEnd(23) +
        i.amount.padEnd(13) +
        ("P" + i.cost).padStart(6) +
        (i.optional ? "  optional" : "")
    );
    if (i.source === "DA" || i.source === "ShopSuki") {
      console.log("        " + i.detail + "  @ P" + i.unitPrice.toFixed(2) + "/" + (i.unit === "kg" ? "kg" : i.unit));
    }
    if (i.adjustment) console.log("        ADJUSTED: " + i.adjustment);
  }
  if (r.pantry.length) {
    console.log("  FREE  " + r.pantry.map((p) => p.name + " (" + p.amount + ")").join(", "));
  }
}

const counts = { DA: 0, ShopSuki: 0, Chan: 0 };
const distinct = { DA: new Set(), ShopSuki: new Set(), Chan: new Set() };
for (const r of audit) {
  for (const i of r.ingredients) {
    if (counts[i.source] !== undefined) {
      counts[i.source]++;
      distinct[i.source].add(i.name);
    }
  }
}

console.log("");
console.log("─".repeat(74));
console.log("WHERE THE PRICES COME FROM");
console.log("  DA Bantay Presyo   " + String(counts.DA).padStart(3) + " lines   " + distinct.DA.size + " distinct goods");
console.log("  ShopSuki           " + String(counts.ShopSuki).padStart(3) + " lines   " + distinct.ShopSuki.size + " distinct goods");
console.log("  Chan's own price   " + String(counts.Chan).padStart(3) + " lines   " + distinct.Chan.size + " distinct goods");

if (problems.length) {
  console.log("");
  console.log("PROBLEMS (" + problems.length + ")");
  for (const p of problems) console.log("  " + p);
} else {
  console.log("");
  console.log("No untraced prices. Every peso has a source, and the audit agrees with the engine.");
}

// ── the three source catalogues, so the whole shelf is checkable ──────
// Not just the goods the recipes reach for: Chan asked to see everything each
// source carries, which is also how you notice a good we SHOULD be using.
// 1. DA — every row on today's sheet, priced or not, with the app's own
//    display name so this list matches what /prices shows.
//
//    A recipe's daKey is WORD-matched against rows, never equal to one, so
//    "does this row feed a recipe" cannot be answered by string equality: on
//    today's sheet that test found 2 rows out of 29 keys. Ask the real resolver
//    instead — a row that alone can satisfy a key is a candidate for it, and
//    the candidate whose price is the one that won is what actually priced the
//    ingredient. Re-deriving the matching here would let the audit drift from
//    the engine, which is the one thing an audit may never do.
const daCatalogue = daRows.map((row) => {
  const serves = daKeys.filter((key) => resolvePrice(key, [row]) !== undefined);
  const priced = serves.filter((key) => priceMap[key] === row.price);
  return {
    name: row.name,
    display: getDisplayName(row.name),
    category: row.category,
    specification: row.specification,
    price: row.price,
    servesIngredients: serves,
    pricedIngredients: priced,
    hiddenOnSite: isHidden(row.name),
  };
});

// 2. DTI — reuse the saved parse rather than re-downloading the bulletin.
let dtiCatalogue = null;
const dtiPath = path.join(ROOT, "data", "dti-srp.json");
if (fs.existsSync(dtiPath)) {
  const dti = JSON.parse(fs.readFileSync(dtiPath, "utf8"));
  dtiCatalogue = {
    effective: dti.effective,
    note: dti.note,
    records: dti.records,
  };
}

// 3. ShopSuki — the catalogue is 16,000+ rows, almost all of it soap and
//    candy. What is worth checking is every product that PASSES an item's
//    filters, because that is the shortlist the chosen pack came out of.
let shopsukiCatalogue = null;
const shopArg = process.argv.indexOf("--shopsuki");
if (shopArg !== -1 && process.argv[shopArg + 1]) {
  const catalogue = JSON.parse(fs.readFileSync(process.argv[shopArg + 1], "utf8"));
  shopsukiCatalogue = {
    totalProducts: catalogue.length,
    items: GROCERY_ITEMS.filter((i) => i.source === "shopsuki").map((item) => ({
      name: item.name,
      chosen: item.pack,
      candidates: candidatesFor(item, catalogue).map((c) => ({
        title: c.title,
        type: c.type,
        price: c.price,
      })),
    })),
  };
  console.log("");
  console.log("SHOPSUKI SHORTLISTS (every product that passes each item's filters)");
  for (const it of shopsukiCatalogue.items) {
    console.log("  " + it.name + "  -> " + it.chosen.title + "  P" + it.chosen.price);
    console.log("     " + it.candidates.length + " candidates considered");
  }
}

console.log("");
console.log("SOURCE CATALOGUES");
console.log("  DA sheet today     " + daCatalogue.length + " rows, " +
  daCatalogue.filter((d) => d.price !== null).length + " priced, " +
  daCatalogue.filter((d) => d.pricedIngredients.length).length + " actually price an ingredient");
console.log("  DTI SRP bulletin   " +
  (dtiCatalogue ? dtiCatalogue.records.length + " entries, effective " + dtiCatalogue.effective
                : "not fetched yet — run npm run fetch:dti -- --json"));
console.log("  ShopSuki           " +
  (shopsukiCatalogue ? shopsukiCatalogue.totalProducts + " products in the catalogue"
                     : "pass --shopsuki <catalogue.json> to include"));

if (process.argv.includes("--json")) {
  const dir = path.join(ROOT, "data");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "price-audit.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        sheet: sheetFile,
        recipes: audit,
        problems,
        sources: { da: daCatalogue, dti: dtiCatalogue, shopsuki: shopsukiCatalogue },
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("");
  console.log("wrote " + path.relative(ROOT, out));
}

process.exit(problems.length ? 1 : 0);
