// Pull the ShopSuki catalogue and propose a real price for every packaged
// ingredient the DA sheet does not cover.
//
//   node scripts/fetch-shopsuki.mjs                 pull live, print the proposal
//   node scripts/fetch-shopsuki.mjs --cache <file>  reuse a saved catalogue
//   node scripts/fetch-shopsuki.mjs --save <file>   save the raw catalogue
//   node scripts/fetch-shopsuki.mjs --json          write data/grocery-candidates.json
//
// The raw catalogue is ~2.3 MB and is NOT written into the repo by default;
// only the small proposal file is. What each item is allowed to match, and why
// some items are deliberately not sourced online at all, lives in
// lib/grocery-items.ts.

import fs from "node:fs";
import path from "node:path";
import { GROCERY_ITEMS, candidatesFor } from "../lib/grocery-items.ts";

const BASE = "https://shopsuki.ph";
const PAGE_SIZE = 250;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const argValue = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : process.argv[i + 1];
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Read every page until one comes back short.
 *
 * NEVER stop at a fixed page count. A 40-page cap silently truncated an
 * earlier pull at 10,000 products and lost "Kraft Eden Cheese Sulit Pack", a
 * product Chan could see on the site and had to screenshot. A short page is
 * the only honest end-of-catalogue signal.
 *
 * The catalogue runs past 15,000 products, so the pull is 60+ requests and
 * ShopSuki starts answering 429 near the end. A 429 is the server asking for
 * room, not a failure: it gets a long, escalating wait (and honours
 * Retry-After), while a genuine error stays on a short retry. There is also a
 * courtesy pause between pages — this is someone else's shop, and hammering it
 * to save twenty seconds is not a trade worth making.
 */
async function pullCatalogue() {
  const all = [];
  for (let page = 1; ; page++) {
    let products = null;

    for (let attempt = 1; attempt <= 5 && products === null; attempt++) {
      try {
        const res = await fetch(`${BASE}/products.json?limit=${PAGE_SIZE}&page=${page}`, {
          headers: { "user-agent": UA, accept: "application/json" },
        });

        if (res.status === 429) {
          const retryAfter = Number(res.headers.get("retry-after"));
          const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000 * 2 ** attempt;
          process.stderr.write(`  rate limited on page ${page}, waiting ${Math.round(wait / 1000)}s\n`);
          await sleep(wait);
          continue;
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        products = (await res.json()).products || [];
      } catch (err) {
        if (attempt === 5) throw new Error(`page ${page} failed after 5 tries: ${err.message}`);
        await sleep(500 * attempt);
      }
    }

    if (products === null) {
      throw new Error(`page ${page} still rate limited after 5 waits; try again later`);
    }

    for (const p of products) {
      const variant = (p.variants || [])[0] || {};
      all.push({
        title: p.title,
        type: p.product_type || "",
        vendor: p.vendor || "",
        price: Number(variant.price),
        available: variant.available !== false,
      });
    }

    if (page % 20 === 0) process.stderr.write(`  ...${page} pages, ${all.length} products\n`);
    if (products.length < PAGE_SIZE) return all;
    await sleep(150);
  }
}

const cachePath = argValue("--cache");
const catalogue = cachePath
  ? JSON.parse(fs.readFileSync(cachePath, "utf8"))
  : await pullCatalogue();

console.log("ShopSuki catalogue: " + catalogue.length + " products" + (cachePath ? " (cached)" : ""));

const savePath = argValue("--save");
if (savePath) {
  fs.writeFileSync(savePath, JSON.stringify(catalogue), "utf8");
  console.log("saved raw catalogue to " + savePath);
}

const online = GROCERY_ITEMS.filter((i) => i.source === "shopsuki");
const local = GROCERY_ITEMS.filter((i) => i.source === "palengke");

const proposals = online.map((item) => {
  const hits = candidatesFor(item, catalogue);
  return { item, hits };
});

console.log("");
console.log("PROPOSED PRICES — cheapest product that passes the filters");
console.log("");
for (const { item, hits } of proposals) {
  console.log(item.name + "   (one dish uses " + item.perDish + ")");
  if (!hits.length) {
    console.log("     no candidate passed the filters — check lib/grocery-items.ts");
    console.log("");
    continue;
  }
  hits.slice(0, 4).forEach((h, i) => {
    console.log(
      "     " +
        (i === 0 ? "->" : "  ") +
        " P" +
        h.price.toFixed(2).padStart(7) +
        "  " +
        h.title.slice(0, 52).padEnd(54) +
        "[" +
        h.type +
        "]"
    );
  });
  if (hits.length > 4) console.log("        ... " + (hits.length - 4) + " more");
  console.log("");
}

console.log("STAYING HAND-PRICED — no usable online source");
for (const item of local) {
  console.log("   " + item.name.padEnd(16) + item.perDish.padEnd(20) + item.reason);
}

const missing = proposals.filter((p) => !p.hits.length);
if (missing.length) {
  console.log("");
  console.log("WARNING: " + missing.length + " item(s) matched nothing: " + missing.map((m) => m.item.name).join(", "));
}

if (process.argv.includes("--json")) {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const out = path.join(dir, "grocery-candidates.json");
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        source: "shopsuki.ph public Shopify catalogue",
        note: "Proposals only. Nothing here is wired until Chan confirms the pack.",
        catalogueSize: catalogue.length,
        items: proposals.map(({ item, hits }) => ({
          name: item.name,
          perDish: item.perDish,
          candidates: hits.slice(0, 5),
        })),
        handPriced: local.map((i) => ({ name: i.name, perDish: i.perDish, reason: i.reason })),
      },
      null,
      2
    ),
    "utf8"
  );
  console.log("");
  console.log("wrote " + path.relative(process.cwd(), out));
}
