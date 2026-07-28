// ═══════════════════════════════════════════════════════════
// Ingredient coverage sweep — run this before a recipe pass
// ═══════════════════════════════════════════════════════════
// Run:  npm run check:ingredients
//
// Reads EVERY DA Daily Price Index sheet in the current layout era and answers
// one question: which required recipe ingredients does the DA sometimes fail to
// price, and which dishes disappear when that happens?
//
// A required ingredient with no price excludes the whole recipe (see
// hasRequiredPrices). That guard is deliberate — a missing Galunggong price once
// read as free and ranked the dish cheapest. The cost is that one absent
// commodity can silently delete several dishes for the day.
//
// Known example, measured 28 Jul 2026: on 3 of the 28 February 2026 sheets the
// DA published no Cabbage (Scorpio) price, which removed Sopas, Nilagang Baboy,
// Beef Nilaga and Ginisang Repolyo at Manok — all sabaw or ginisa.
//
// The output is the shopping list: give the worst offenders a `fallbackPrice` in
// lib/recipes.ts and they stop taking dishes down with them. hasRequiredPrices
// honours a fallback on daKey ingredients, so a value is all that is needed.
//
// Runs entirely in Node — the PDFs are fetched and parsed locally and never
// reach an AI model. Costs a few minutes and some bandwidth, nothing else.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

const ROOT = path.resolve(process.cwd());
const { RECIPES } = await import(pathToFileURL(path.join(ROOT, 'lib/recipes.ts')).href);
const { parseDAPriceIndex, resolvePrice } =
  await import(pathToFileURL(path.join(ROOT, 'lib/da-parser.ts')).href);
const require = createRequire(path.join(ROOT, 'package.json'));
const pdfParse = require('pdf-parse');
const cheerio = require('cheerio');

// The DA reorganised this document in Oct 2025. Older layouts are a different
// shape and the parser handles them separately; coverage there is not comparable.
const ERA_START = new Date(Date.UTC(2025, 9, 1));

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const listing = await (await fetch('https://www.da.gov.ph/price-monitoring/')).text();
const $ = cheerio.load(listing);
const sheets = [];
$('a[href*="Daily-Price-Index"][href$=".pdf"]').each((_, el) => {
  const href = $(el).attr('href');
  if (!href) return;
  const url = href.startsWith('http') ? href : 'https://www.da.gov.ph' + href;
  const m = url.split('/').pop().match(/Daily-Price-Index-([A-Za-z]+)-(\d{1,2})-(\d{4})/i);
  if (!m) return;
  const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[1].toLowerCase());
  if (mi < 0) return;
  const d = new Date(Date.UTC(+m[3], mi, +m[2]));
  if (d < ERA_START) return;
  sheets.push({ url, d, label: url.split('/').pop().replace('.pdf', '').replace('Daily-Price-Index-', '') });
});
sheets.sort((a, b) => a.d - b.d);

// every REQUIRED daKey and the dishes that depend on it
const dependants = {};
for (const recipe of RECIPES) {
  for (const ing of recipe.ingredients) {
    if (ing.optional || !ing.daKey) continue;
    if (!dependants[ing.daKey]) dependants[ing.daKey] = new Set();
    dependants[ing.daKey].add(recipe.name);
  }
}
const requiredKeys = Object.keys(dependants);

console.log('Sweeping ' + sheets.length + ' DA sheets (' + sheets[0]?.label + ' to ' + sheets[sheets.length - 1]?.label + ')');
console.log(requiredKeys.length + ' required ingredients across ' + RECIPES.length + ' recipes\n');

const missCount = {};
const missDates = {};
let read = 0, failed = 0, sheetsWithGaps = 0;

for (const sheet of sheets) {
  let rows;
  try {
    const buf = Buffer.from(await (await fetch(sheet.url)).arrayBuffer());
    rows = parseDAPriceIndex((await (pdfParse.default || pdfParse)(buf)).text);
  } catch {
    failed++;
    continue;
  }
  read++;
  const missing = requiredKeys.filter((k) => resolvePrice(k, rows) === undefined);
  if (missing.length) sheetsWithGaps++;
  for (const key of missing) {
    missCount[key] = (missCount[key] || 0) + 1;
    if (!missDates[key]) missDates[key] = [];
    missDates[key].push(sheet.label);
  }
  if (read % 25 === 0) console.log('  ...' + read + '/' + sheets.length);
}

console.log('\n' + '='.repeat(64));
console.log('sheets read            : ' + read + (failed ? '   (unreadable: ' + failed + ')' : ''));
console.log('sheets with a gap      : ' + sheetsWithGaps +
  '  (' + (read ? (100 * sheetsWithGaps / read).toFixed(1) : '0') + '%)');
console.log('='.repeat(64));

const ranked = Object.entries(missCount).sort((a, b) => b[1] - a[1]);
if (!ranked.length) {
  console.log('\nEvery required ingredient was priced on every sheet. No fallbacks needed.');
} else {
  console.log('\nGIVE THESE A fallbackPrice IN lib/recipes.ts, worst first:\n');
  for (const [key, n] of ranked) {
    const dishes = Array.from(dependants[key]);
    console.log('  ' + key);
    console.log('    unpriced on ' + n + '/' + read + ' sheets (' + (100 * n / read).toFixed(1) + '%)');
    console.log('    takes down ' + dishes.length + ' dish(es): ' + dishes.join(', '));
    console.log('    dates: ' + missDates[key].slice(0, 8).join(' · ') +
      (missDates[key].length > 8 ? '  (+' + (missDates[key].length - 8) + ' more)' : ''));
    console.log('');
  }
}

const outPath = path.join(ROOT, 'ingredient-coverage.json');
fs.writeFileSync(outPath, JSON.stringify({
  sweptAt: sheets[sheets.length - 1]?.label ?? null,
  sheetsRead: read,
  sheetsWithGaps,
  ingredients: ranked.map(([key, n]) => ({
    daKey: key,
    unpricedSheets: n,
    pctOfSheets: +(100 * n / read).toFixed(1),
    dishesAffected: Array.from(dependants[key]),
    dates: missDates[key],
  })),
}, null, 2), 'utf8');
console.log('Full result written to ingredient-coverage.json');
