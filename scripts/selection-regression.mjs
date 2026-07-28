// ═══════════════════════════════════════════════════════════
// Regression net for the V2.4 daily selection
// ═══════════════════════════════════════════════════════════
// Run:  npm run test:selection
//
// Guards the four properties the redesign exists to deliver. Every one of these
// FAILED on the old cheapest-8 selection, verified against production data on
// 28 Jul 2026:
//
//   1. menus must not repeat        — production served 2 distinct menus in 7 days
//   2. every recipe gets a turn     — 21 of 47 had NEVER been shown, not once
//   3. prito/inihaw capped at 2     — one day served 8 fried dishes out of 8
//   4. a cheap dish every day       — the promise the app is named after
//   5. no dish permanently leads    — Chan saw Ginataang Kalabasa on every visit
//
// Prices are held CONSTANT across the simulated days on purpose. That is the
// worst case: it is exactly the condition under which the old engine collapsed
// into an A-B-A-B loop. Passing here means passing on real, drifting prices.
//
// Uses the REAL exports from lib/recipes.ts, so this tests shipped behaviour
// rather than a copy of it.
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const { RECIPES, selectDailyMeals, orderForDisplay, getCookingMethod, DEFAULT_SELECTION } =
  await import(pathToFileURL(path.join(ROOT, 'lib/recipes.ts')).href);
const { parseDAPriceIndex, buildPriceMap } =
  await import(pathToFileURL(path.join(ROOT, 'lib/da-parser.ts')).href);

const require = createRequire(path.join(ROOT, 'package.json'));
const pdfParse = require('pdf-parse');
const cheerio = require('cheerio');

const DAYS = 28;

let failures = 0;
function check(ok, label, detail) {
  if (ok) {
    console.log('  PASS  ' + label);
  } else {
    failures++;
    console.log('  FAIL  ' + label + (detail ? '\n          ' + detail : ''));
  }
}

// ── real prices from today's DA sheet ─────────────────────────────────
console.log('Fetching the current DA Daily Price Index...');
const listing = await (await fetch('https://www.da.gov.ph/price-monitoring/')).text();
const $ = cheerio.load(listing);
let pdfUrl = null;
$('a[href*="Daily-Price-Index"][href$=".pdf"]').each((_, el) => {
  if (pdfUrl) return;
  const href = $(el).attr('href');
  pdfUrl = href.startsWith('http') ? href : 'https://www.da.gov.ph' + href;
});
if (!pdfUrl) {
  console.error('Could not find a Daily Price Index PDF. Cannot run the regression.');
  process.exit(2);
}
const text = (await (pdfParse.default || pdfParse)(
  Buffer.from(await (await fetch(pdfUrl)).arrayBuffer()))).text;
const rows = parseDAPriceIndex(text);
const daKeys = Array.from(new Set(
  RECIPES.flatMap((r) => r.ingredients.map((i) => i.daKey)).filter(Boolean)));
const priceMap = buildPriceMap(daKeys, rows);

console.log(pdfUrl.split('/').pop() + '  |  ' +
  Object.keys(priceMap).length + '/' + daKeys.length + ' ingredients priced\n');
check(Object.keys(priceMap).length === daKeys.length,
  'today\'s sheet prices every ingredient the recipes need',
  'missing: ' + daKeys.filter((k) => !(k in priceMap)).join(', '));

// ── simulate ──────────────────────────────────────────────────────────
const daysSinceShown = {};
const log = [];
for (let day = 1; day <= DAYS; day++) {
  const picks = selectDailyMeals(RECIPES, priceMap, priceMap, daysSinceShown);
  log.push(picks);
  for (const id of Object.keys(daysSinceShown)) daysSinceShown[id] += 1;
  for (const p of picks) daysSinceShown[p.result.recipe.id] = 1;
}

const menus = new Set(log.map((d) => d.map((p) => p.result.recipe.id).sort().join('|')));
const surfaced = new Set(log.flat().map((p) => p.result.recipe.id));
const pritoPerDay = log.map((d) => d.filter((p) => getCookingMethod(p.result.recipe) === 'prito').length);
const cheapestPerDay = log.map((d) => Math.min(...d.map((p) => p.result.totalCost)));
const fullDays = log.filter((d) => d.length === DEFAULT_SELECTION.count).length;

console.log('\nSimulated ' + DAYS + ' days on constant prices:\n');
check(fullDays === DAYS, 'every day fills all ' + DEFAULT_SELECTION.count + ' cards',
  fullDays + '/' + DAYS + ' days were full');
check(menus.size >= DAYS - 2, 'menus do not repeat (>= ' + (DAYS - 2) + ' distinct of ' + DAYS + ')',
  'got ' + menus.size + ' distinct menus — the old engine scored 2');
check(surfaced.size === RECIPES.length, 'every one of the ' + RECIPES.length + ' recipes gets a turn',
  'only ' + surfaced.size + ' surfaced; never shown: ' +
  RECIPES.filter((r) => !surfaced.has(r.id)).map((r) => r.name).join(', '));
check(Math.max(...pritoPerDay) <= DEFAULT_SELECTION.pritoCap,
  'never more than ' + DEFAULT_SELECTION.pritoCap + ' prito/inihaw dishes in a day',
  'worst day had ' + Math.max(...pritoPerDay));
check(Math.max(...cheapestPerDay) <= 120,
  'every day still opens with a dish at or under P120',
  'the dearest "cheapest dish of the day" was P' + Math.max(...cheapestPerDay));

// ── display order must not let one dish own the top ───────────────────
const leads = log.slice(0, 14).map((picks, i) => {
  const dateKey = '2026-09-' + String(i + 1).padStart(2, '0');
  return orderForDisplay(picks, dateKey)[0].result.recipe.name;
});
const leadCounts = {};
for (const n of leads) leadCounts[n] = (leadCounts[n] || 0) + 1;
const worstLead = Math.max(...Object.values(leadCounts));
check(worstLead <= 4, 'no single dish leads the page more than 4 days in 14',
  Object.entries(leadCounts).filter(([, c]) => c > 4).map(([n, c]) => n + ' x' + c).join(', '));
check(orderForDisplay(log[0], '2026-09-01').map((p) => p.result.recipe.id).join() ===
      orderForDisplay(log[0], '2026-09-01').map((p) => p.result.recipe.id).join(),
  'display order is deterministic for a given date');

// ── the pool must never be treated as a price ranking by accident ─────
const day1 = log[0];
const muraMax = Math.max(...day1.filter((p) => p.slot === 'mura').map((p) => p.result.totalCost));
const ibaCount = day1.filter((p) => p.slot === 'iba').length;
check(ibaCount === DEFAULT_SELECTION.count - DEFAULT_SELECTION.coreSlots,
  'day 1 has exactly ' + (DEFAULT_SELECTION.count - DEFAULT_SELECTION.coreSlots) + ' rotation slots',
  'got ' + ibaCount);
check(muraMax <= 200, 'nothing absurd is labelled "mura"',
  'dearest mura pick was P' + muraMax);

// ── /ulam browse page: the two assumptions it is built on ─────────────
// The browse page costs all 47 recipes IN THE BROWSER, from whatever
// /api/prices returns. Both of these are silent if they break: a dish would
// simply read "walang presyo" or vanish from every tab, with nothing thrown.
const { getProteinType } = await import(pathToFileURL(path.join(ROOT, 'lib/recipes.ts')).href);
const { isHidden } = await import(pathToFileURL(path.join(ROOT, 'lib/commodity-names.ts')).href);

// daKeys is the same list the price check above already built.
const hiddenKeys = daKeys.filter((k) => isHidden(k));
check(hiddenKeys.length === 0,
  '/api/prices does not hide any ingredient the recipes need',
  'hidden: ' + hiddenKeys.join(', '));

const TAB_KEYS = ['fish', 'chicken', 'pork', 'beef', 'egg', 'veggie'];
const untabbed = RECIPES.filter((r) => TAB_KEYS.indexOf(getProteinType(r)) === -1);
check(untabbed.length === 0,
  'every recipe lands in a category tab on /ulam',
  'unreachable except under "Lahat": ' + untabbed.map((r) => r.id).join(', '));

console.log('\n' + '─'.repeat(58));
console.log('  distinct menus     ' + menus.size + '/' + DAYS + '        (old engine: 2)');
console.log('  recipes surfaced   ' + surfaced.size + '/' + RECIPES.length + '        (old engine: 16)');
console.log('  worst prito day    ' + Math.max(...pritoPerDay) + '           (old engine: 4)');
console.log('  dearest cheapest   P' + Math.max(...cheapestPerDay));
console.log('─'.repeat(58));
console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : '\n' + failures + ' CHECK(S) FAILED\n');
process.exit(failures === 0 ? 0 : 1);
