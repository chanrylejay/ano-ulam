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
import fs from 'fs';

const ROOT = path.resolve(process.cwd());
const {
  RECIPES, selectDailyMeals, orderForDisplay, getCookingMethod, DEFAULT_SELECTION,
  calculateRecipeCost, calculateRecipeCostDetailed, pantryCost, pantryItemPrice,
} = await import(pathToFileURL(path.join(ROOT, 'lib/recipes.ts')).href);
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
// This bar was P120 until 30 Jul 2026, when Chan ruled that oil, pepper and
// flour are bought, not free. That put P12 on 35 of the 47 dishes and pushed the
// worst day's cheapest dish from P113 to P124.
//
// The bar moved to P135 for that reason and ONLY that reason: the engine picks
// exactly the same dishes as before, the floor under every price simply rose.
// Evidence: the run immediately before the change reported P113 on the same
// sheet, and menus stayed 28/28 with 47/47 recipes surfaced across the change.
// If this check ever fails again, do NOT raise the number to make it pass —
// establish first whether the engine got worse or the prices got truer.
check(Math.max(...cheapestPerDay) <= 135,
  'every day still opens with a dish at or under P135',
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

// ── no rotation pick before the third card ────────────────────────
// Chan: "dont put it in first place to third place so they will not be shocked
// when a dish with 200+ price show up, upon opening the app". The app is named
// after cheap food, so the opening cards have to deliver that before the page
// starts showing variety. Silent if it breaks — the page still renders, it just
// greets people with the most expensive dish of the day.
const bySlot = (p) => p.slot;
let earliestIba = 99;
let worstOpener = 0;
for (let i = 0; i < log.length; i++) {
  const dateKey = '2026-09-' + String((i % 28) + 1).padStart(2, '0');
  const ordered = orderForDisplay(log[i], dateKey, bySlot);
  const idx = ordered.findIndex((p) => p.slot === 'iba');
  if (idx !== -1 && idx < earliestIba) earliestIba = idx;
  worstOpener = Math.max(worstOpener, ordered[0].result.totalCost);
}
check(earliestIba >= 2,
  'no "maiba naman" pick lands in the first two cards',
  'earliest was position ' + (earliestIba + 1));
// P150 until 30 Jul 2026, when the pantry stopped being free. Raised to P175
// only after ISOLATING the cause rather than assuming it: the worst opener is
// Lumpiang Shanghai at P157, and the same card costs P145 with the pantry
// stripped back out — under the old bar. The engine picks the same dishes; the
// prices under it rose by up to P30.
//
// The isolation is the point. Two bars moved today and both were checked this
// way. If this fails again, run the same test before touching the number: a bar
// raised to make a red check green is how a real regression ships.
check(worstOpener <= 175,
  'the card that opens the page is always genuinely cheap',
  'dearest opener across the simulation was P' + worstOpener);

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

// ── servings bands: the scaler must survive every real label ──────────
// Phase 4. Every failure below is SILENT in the browser: the page still
// renders, it just shows a base amount beside a scaled price, which sends
// somebody to the palengke with the wrong list.
const SV = await import(pathToFileURL(path.join(ROOT, 'lib/servings.ts')).href);

const ingredientLabels = new Set();
const pantryLabels = new Set();
for (const r of RECIPES) {
  for (const i of r.ingredients) ingredientLabels.add(i.amount);
  for (const p of r.pantryItems) pantryLabels.add(p.amount);
}
const allLabels = [...new Set([...ingredientLabels, ...pantryLabels])];

const unparsed = allLabels.filter((l) => !SV.canScaleAmount(l));
check(unparsed.length === 0,
  'every amount label in the 47 recipes can be scaled (' + allLabels.length + ' distinct)',
  'cannot parse: ' + unparsed.map((l) => JSON.stringify(l)).join(', '));

// A scaled amount must never render a decimal. The first version of the
// scaler rounded to quarters, which turned "1/3 cup" doubled into "3/4 cup";
// it is 2/3. The arithmetic is exact rational now, and this pins it.
const decimals = [];
for (const l of allLabels) {
  for (const b of SV.SERVING_BANDS) {
    const out = SV.scaleAmount(l, b.multiplier);
    if (/\d\.\d/.test(out) || out.trim() === '' || /\s\s/.test(out)) {
      decimals.push(JSON.stringify(l) + ' x' + b.multiplier + ' -> ' + JSON.stringify(out));
    }
  }
}
check(decimals.length === 0,
  'no band produces a decimal or malformed amount',
  decimals.slice(0, 3).join(' | '));

check(SV.scaleAmount('1/3 cup', 2) === '2/3 cup' && SV.scaleAmount('1/2 kg', 3) === '1 1/2 kg' &&
      SV.scaleAmount('1 cup', 3) === '3 cups' && SV.scaleAmount('1 ulo', 6) === '6 ulo',
  'fractions stay exact and only English units take a plural',
  '1/3 cup x2 = ' + SV.scaleAmount('1/3 cup', 2) + ', 1 cup x3 = ' + SV.scaleAmount('1 cup', 3));

// The base band has to be a true no-op, or every existing visitor who never
// touches the picker silently gets different numbers than they did yesterday.
const drifted = allLabels.filter((l) => SV.scaleAmount(l, 1) !== l);
check(drifted.length === 0 && SV.scaleCost(87, 1) === 87 && SV.BASE_BAND.multiplier === 1,
  'the base band changes nothing at all',
  'drifted: ' + drifted.join(', '));

check(SV.SERVING_BANDS.every((b, i) => b.multiplier === i + 1) &&
      new Set(SV.SERVING_BANDS.map((b) => b.key)).size === SV.SERVING_BANDS.length,
  'bands are whole multiples 1..' + SV.SERVING_BANDS.length + ' with unique keys');

check(SV.bandByKey('gone-in-a-future-version').key === SV.BASE_BAND.key,
  'a stored band key that no longer exists falls back to the base');

// ── pantry: what you already own ──────────────────────────────────────
// Phase 4. Same silent-failure class as the bands: a wrong number here still
// renders, it just quietly under-prices a dish or files an ingredient where
// nobody will look for it.
const PT = await import(pathToFileURL(path.join(ROOT, 'lib/pantry.ts')).href);

// THE load-bearing rule. Optional ingredients were never added to a total
// (calculateRecipeCost skips them), so subtracting an owned optional would
// take away money that was never there and under-price the dish.
const sampleRows = [
  { name: 'Tilapia', cost: 115, optional: false },
  { name: 'Kalamansi', cost: 3, optional: true },
  { name: 'Bawang', cost: 7, optional: false },
];
const asSet = (...names) => new Set(names);
check(PT.ownedDiscount(sampleRows, asSet('Kalamansi')) === 0,
  'owning an OPTIONAL ingredient changes no total',
  'got ' + PT.ownedDiscount(sampleRows, asSet('Kalamansi')));
check(PT.ownedDiscount(sampleRows, asSet('Bawang')) === 7 &&
      PT.ownedDiscount(sampleRows, asSet('Bawang', 'Kalamansi')) === 7 &&
      PT.ownedDiscount(sampleRows, asSet()) === 0,
  'owning a REQUIRED ingredient takes exactly its cost off');

// Nothing tickable may be free, or the checkbox is theatre.
const freeItems = PT.OWNABLE_INGREDIENTS.filter((i) => i.daKey === null && i.fallbackPrice === undefined);
check(freeItems.length === 0,
  'every ingredient on /pantry can actually change a price',
  'these cost nothing: ' + freeItems.map((i) => i.name).join(', '));

// Eggplant contains "egg" and "Chicken Egg" contains "chicken". Both mis-filed
// in the first draft of lib/pantry.ts.
const grouped = PT.PANTRY_GROUPS.reduce((n, g) => n + PT.ownableByGroup(g.key).length, 0);
check(grouped === PT.OWNABLE_INGREDIENTS.length,
  'every ownable ingredient lands in exactly one pantry group',
  grouped + ' grouped vs ' + PT.OWNABLE_INGREDIENTS.length + ' total');
check(PT.OWNABLE_INGREDIENTS.find((i) => i.name === 'Talong')?.group === 'gulay' &&
      PT.OWNABLE_INGREDIENTS.find((i) => i.name === 'Itlog')?.group === 'itlog',
  'Talong files under Gulay and Itlog under Itlog (the substring collisions)',
  'Talong=' + PT.OWNABLE_INGREDIENTS.find((i) => i.name === 'Talong')?.group +
  ' Itlog=' + PT.OWNABLE_INGREDIENTS.find((i) => i.name === 'Itlog')?.group);

// An empty pantry must be a perfect no-op, or every existing visitor sees
// different numbers than they did yesterday for no reason.
check(PT.recipesAffected(new Set()) === 0 && PT.ownedDiscount(sampleRows, new Set()) === 0,
  'an empty pantry changes nothing at all');

// The page's whole argument is that the top rows change nearly everything.
const topTwo = PT.OWNABLE_INGREDIENTS.slice(0, 2).map((i) => i.name);
const reach = PT.recipesAffected(new Set(topTwo));
check(reach >= RECIPES.length * 0.6,
  'the two highest-impact ingredients reach most of the book (' + reach + '/' + RECIPES.length + ')',
  'only ' + reach + ' via ' + topTwo.join(' + '));

check(PT.typicalCostByName(priceMap).size > 0,
  'typical per-dish costs compute from a real price map');

// ── the two bugs found by the 29 Jul 2026 DA sheet audit ──────────────
const CN = await import(pathToFileURL(path.join(ROOT, 'lib/commodity-names.ts')).href);

// BUG 1: the Jul 28 parser rewrite started keeping the DA's size text on every
// name ("Tomato" -> "Tomato 15-18 pcs/kg"). getDisplayName matched exactly, so
// it stopped hitting, and the share of items showing a name Chan chose fell
// from 59% to 33% — live, for real visitors, silently.
// Measured on the PRODUCTS a visitor actually sees, not on raw sheet rows.
// Since 29 Jul 2026 the page shows one winner per product, so counting rows
// would count losers nobody can see and under-report the real coverage.
const namedValues = new Set(Object.values(CN.commodityNameMap));
const CPnames = await import(pathToFileURL(path.join(ROOT, 'lib/price-competition.ts')).href);
const shownProducts = CPnames.competeOnPrice(rows).filter((p) => !CN.isHidden(p.winner.name));
const unnamed = shownProducts.filter((p) => !namedValues.has(CN.getDisplayName(p.winner.name)) &&
  !namedValues.has(p.label) && !namedValues.has(p.label + ' Imported') && !namedValues.has(p.label + ' Local'));
const namedPct = shownProducts.length
  ? Math.round(((shownProducts.length - unnamed.length) / shownProducts.length) * 100) : 0;
check(namedPct >= 90,
  'at least 90% of the products on /prices show a name Chan chose (' + namedPct + '%)',
  'unnamed: ' + unnamed.slice(0, 8).map((p) => p.winner.name).join(' | '));

// The lookup has to survive the sheet changing its mind again, in EITHER
// direction: long names today, short names before Jul 28.
check(CN.getDisplayName('Tomato 15-18 pcs/kg') === 'Kamatis' &&
      CN.getDisplayName('Tomato') === 'Kamatis',
  'a name resolves whether the DA writes the long form or the short one',
  'long=' + CN.getDisplayName('Tomato 15-18 pcs/kg') + ' short=' + CN.getDisplayName('Tomato'));

// Deliberately specific names must not be swallowed by the peeling.
check(CN.getDisplayName('Bangus Medium Medium (3-4 pcs/kg)') !==
      CN.getDisplayName('Bangus Large Large (1-2 pcs)'),
  'peeling never collapses two sizes into one name',
  'both resolve to ' + CN.getDisplayName('Bangus Medium Medium (3-4 pcs/kg)'));

// BUG 2: a DISPLAY rule was moving a PRICE. The hide list removed the cheapest
// chicken variant from /api/prices, but the cron reads the PDF itself, so the
// homepage and /ulam costed three dishes differently.
const visibleOnly = rows.filter((r) => !CN.isHidden(r.name));
const mapAll = buildPriceMap(daKeys, rows);
const mapVisible = buildPriceMap(daKeys, visibleOnly);
const movedByHiding = daKeys.filter((k) => mapAll[k] !== mapVisible[k]);
// The hide list DOES still move prices — that is why the costing pages must ask
// for the unfiltered sheet. This check pins that they still do.
const ulamSrc = fs.readFileSync(path.join(ROOT, 'app/ulam/page.tsx'), 'utf8');
const pantrySrc = fs.readFileSync(path.join(ROOT, 'app/pantry/page.tsx'), 'utf8');
check(ulamSrc.includes('/api/prices?all=1') && pantrySrc.includes('/api/prices?all=1'),
  'the pages that COST dishes fetch the unfiltered sheet (?all=1)',
  'hiding currently moves ' + movedByHiding.length + ' ingredient price(s): ' + movedByHiding.join(', '));
check(!/fetch\("\/api\/prices"/.test(ulamSrc) && !/fetch\("\/api\/prices"/.test(pantrySrc),
  'no costing page reads the tidied price list by accident');

// ── one product, one row, cheapest wins ───────────────────────────────
// Chan's rule, 29 Jul 2026. Every failure here is silent money: the page would
// advertise a price nobody can actually pay, or quietly show the dearer row.
const CP = await import(pathToFileURL(path.join(ROOT, 'lib/price-competition.ts')).href);
const products = CP.competeOnPrice(rows);

check(products.length < rows.length,
  'the sheet collapses to fewer products than rows (' + rows.length + ' -> ' + products.length + ')');

const originLabels = products.filter((p) => /\b(imported|local|native)\b/i.test(p.label));
check(originLabels.length === 0,
  'no product label says Imported, Local or Native',
  originLabels.slice(0, 5).map((p) => p.label).join(' | '));

// Eggs are the deliberate exception. Chan: "egg sizes is important in palengke".
const sizeLabels = products.filter((p) =>
  /\b(small|medium|large)\b\s*$/i.test(p.label) && !/\b(egg|itlog)\b/i.test(p.label));
check(sizeLabels.length === 0,
  'no product label ends in a pack size, except eggs',
  sizeLabels.slice(0, 5).map((p) => p.label).join(' | '));

const eggProducts = products.filter((p) => /\b(egg|itlog)\b/i.test(p.label));
check(eggProducts.length > 0 && eggProducts.every((p) => /\b(small|medium|large)\b/i.test(p.label)),
  'eggs keep their size, because that is the thing being bought',
  eggProducts.map((p) => p.label).join(' | ') || 'no egg product found');

const labelCounts = new Map();
for (const p of products) labelCounts.set(p.label, (labelCounts.get(p.label) || 0) + 1);
const duped = Array.from(labelCounts.entries()).filter((e) => e[1] > 1);
check(duped.length === 0,
  'no two products share a label (that would be the duplicate rows all over again)',
  duped.map((e) => e[0] + ' x' + e[1]).join(', '));

const notCheapest = products.filter((p) => p.variants.some((v) => v.price < p.winner.price));
check(notCheapest.length === 0,
  'the winner really is the cheapest row in its group',
  notCheapest.slice(0, 3).map((p) => p.label).join(', '));

// THE invariant. If a recipe pays a price the page never shows, the page lies.
const shownPrices = products.map((p) => p.winner.price);
const unshown = daKeys.filter((k) => {
  const paid = priceMap[k];
  return paid !== undefined && !shownPrices.some((s) => Math.abs(s - paid) < 0.005);
});
check(unshown.length === 0,
  'every price a recipe pays is a price the page actually shows',
  'not shown: ' + unshown.join(', '));

// The specific wins Chan asked for, by name rather than by position.
const findLabel = (l) => products.find((p) => p.label === l);
check(findLabel('Bawang') && findLabel('Bawang').variants.length > 1 &&
      findLabel('Bawang').winner.price === Math.min(...findLabel('Bawang').variants.map((v) => v.price)),
  'imported and local garlic compete, and the cheap one wins',
  findLabel('Bawang') ? 'P' + findLabel('Bawang').winner.price : 'no Bawang product');

const breast = findLabel('Chicken Breast');
check(breast && breast.variants.length >= 3,
  'the branded chicken rows compete instead of being hidden on sight',
  breast ? breast.variants.length + ' variant(s)' : 'no Chicken Breast product');

// No recipe lookup may name a seller any more, or the engine goes back to
// deliberately buying the dearer row while the page shows the cheaper one.
const recipesSrc = fs.readFileSync(path.join(ROOT, 'lib/recipes.ts'), 'utf8');
// "Native Pechay" is deliberately allowed: there, Native is the variety that
// distinguishes it from Pechay Baguio, not a seller. Only Local and Imported
// make the engine prefer one seller over a cheaper one.
const originKeys = daKeys.filter((k) => /\b(Imported|Local)\b/i.test(k));
check(originKeys.length === 0,
  'no recipe lookup names a seller (Local / Imported)',
  originKeys.join(', '));
check(!/PALENGKE_RATE_OVERRIDES[\s\S]{0,200}Native\/Local/.test(recipesSrc),
  'the palengke overrides were renamed with their daKeys');

// ── shapes the DA has really used, from the 55-day history sweep ──────
// Today's sheet is one format. The archive holds at least two more, and the
// competition has to survive all of them, because the day the DA changes its
// mind is the day this silently breaks in production instead of here.
//
// Every string below is a real row copied out of the database.
const HISTORICAL_ROWS = [
  // post-Jul-28: pack text kept on the end
  { name: 'Beef Brisket Imported', price: 380 },
  { name: 'Beef Brisket Local Meat with Bones', price: 442.26 },
  { name: 'Tomato 15-18 pcs/kg', price: 116.93 },
  { name: 'Red Onion Local 13-15 pcs/kg', price: 109.6 },
  { name: 'Red Onion Imported Large', price: 83.33 },
  // pre-Jul-28: plain short names
  { name: 'Beef Brisket', price: 382.86 },
  { name: 'Tomato', price: 110 },
  { name: 'Red Onion', price: 105 },
  // a brand spelled without "Fresh" (2026-07-14)
  { name: 'Chicken Breast Local Unbranded', price: 220 },
  { name: 'Chicken Breast Imported', price: 227.5 },
  // origin in the MIDDLE of the name (2026-06-24)
  { name: 'Tambakol (Yellow-Fin Tuna) Imported Medium Frozen', price: 291.02 },
];
const historical = CP.competeOnPrice(HISTORICAL_ROWS);

const histOrigin = historical.filter((p) => /\b(imported|local|native|unbranded)\b/i.test(p.label));
check(histOrigin.length === 0,
  'no historical sheet format leaves a seller word in a label',
  histOrigin.map((p) => p.label).join(' | '));

const brisket = historical.filter((p) => /brisket|pitso/i.test(p.label));
check(brisket.length === 1 && brisket[0].winner.price === 380,
  'the long and short spellings of one product become ONE product',
  brisket.map((p) => p.label + ' P' + p.winner.price).join(' | '));

const onion = historical.filter((p) => /onion|sibuyas/i.test(p.label));
check(onion.length === 1 && onion[0].winner.price === 83.33,
  'three onion spellings collapse to one row at the cheapest price',
  onion.map((p) => p.label + ' P' + p.winner.price).join(' | '));

// ── the homepage ticker ───────────────────────────────────────────────
// A ticker key that matches nothing shows NOTHING: no error, no gap, the item
// just vanishes from the row. Three of the six were silently empty on
// 29 Jul 2026 and had been for a while, because a short ticker looks exactly
// like a full one to anybody who does not know how many items to expect.
const homeSrc = fs.readFileSync(path.join(ROOT, 'app/page.tsx'), 'utf8');
const tickerBlock = homeSrc.slice(
  homeSrc.indexOf('const defaultItemKeys'),
  homeSrc.indexOf('];', homeSrc.indexOf('const defaultItemKeys')));
const tickerKeys = Array.from(tickerBlock.matchAll(/key:\s*"([^"]+)",\s*label:\s*"([^"]+)"/g))
  .map((m) => ({ key: m[1], label: m[2] }));

const shownLabels = products.filter((p) => !CN.isHidden(p.winner.name)).map((p) => p.label);
const deadKeys = tickerKeys.filter((item) => {
  const target = item.key.toLowerCase().trim();
  return !shownLabels.some((n) => {
    const low = n.toLowerCase().trim();
    return low === target || low.includes(target) || target.includes(low);
  });
});
check(tickerKeys.length > 0 && deadKeys.length === 0,
  'every homepage ticker item finds a real product (' + tickerKeys.length + ' items)',
  'these show nothing: ' + deadKeys.map((k) => k.label + ' -> "' + k.key + '"').join(', '));

// ═══════════════════════════════════════════════════════════
// GROCERY PRICES — whole packs, and one home for the number
// ═══════════════════════════════════════════════════════════
// Chan's rule, 30 Jul 2026: a packaged good is bought whole, so a dish carries
// the whole jar. A fractional qty on a ShopSuki item means someone reintroduced
// the old share-of-the-pack model, which understates what a cook really pays.
// The second check stops lib/recipes.ts and lib/grocery-items.ts drifting
// apart: the price has one home, and a silent divergence is exactly the kind of
// thing nobody notices by looking at the app.
const GI = await import(pathToFileURL(path.join(ROOT, 'lib/grocery-items.ts')).href);

const packaged = new Map(GI.GROCERY_ITEMS.filter((i) => i.pack).map((i) => [i.name, i]));
const fractional = [];
const mismatched = [];
for (const recipe of RECIPES) {
  for (const ingredient of recipe.ingredients) {
    const item = packaged.get(ingredient.name);
    if (!item) continue;
    if (!Number.isInteger(ingredient.qty)) {
      fractional.push(recipe.name + ': ' + ingredient.name + ' qty=' + ingredient.qty);
    }
    if (ingredient.fallbackPrice !== item.pack.price) {
      mismatched.push(
        ingredient.name + ' is P' + ingredient.fallbackPrice + ' in recipes.ts but P' +
        item.pack.price + ' in grocery-items.ts');
    }
  }
}

check(fractional.length === 0,
  'every packaged grocery item is charged as a whole pack (' + packaged.size + ' items)',
  'fractional quantities: ' + fractional.join(' | '));

check(mismatched.length === 0,
  'recipe prices match the chosen ShopSuki packs',
  Array.from(new Set(mismatched)).join(' | '));

// ═══════════════════════════════════════════════════════════
// PRICED PANTRY — oil and pepper are bought, and charged once
// ═══════════════════════════════════════════════════════════
// Chan's ruling, 30 Jul 2026. Two things can go wrong and neither is visible by
// looking at the app: a priced pantry good could stop reaching the total, or it
// could be counted twice by also being listed as a free pantry item.
const pantryPriced = RECIPES.filter((r) => pantryCost(r) > 0);
check(pantryPriced.length >= 40,
  'the priced pantry reaches almost every dish (' + pantryPriced.length + '/' + RECIPES.length + ')',
  'only ' + pantryPriced.length + ' dishes pay anything for oil, pepper or flour');

const doubleCharged = [];
const missingFromTotal = [];
for (const recipe of RECIPES) {
  const detailed = calculateRecipeCostDetailed(recipe, priceMap, priceMap);
  const lines = detailed.ingredientCosts.map((c) => c.name);
  for (const item of recipe.pantryItems) {
    const price = pantryItemPrice(item.name);
    if (price === undefined) continue;
    // Exactly one line, and it must carry the price.
    const hits = lines.filter((n) => n === item.name).length;
    if (hits !== 1) doubleCharged.push(recipe.name + ': ' + item.name + ' appears ' + hits + ' times');
  }
  const plain = calculateRecipeCost(recipe, priceMap);
  if (Math.abs(plain - detailed.totalCost) > 1) {
    missingFromTotal.push(recipe.name + ': quick P' + plain + ' vs detailed P' + detailed.totalCost);
  }
}

check(doubleCharged.length === 0,
  'each priced pantry good is listed exactly once per dish',
  doubleCharged.join(' | '));

check(missingFromTotal.length === 0,
  'the quick and detailed cost functions agree once the pantry is priced',
  missingFromTotal.join(' | '));

// A palengke item must NOT carry a chosen pack: that is the whole point of the
// tingi split Chan drew for bagoong and hotdog.
const strayPacks = GI.GROCERY_ITEMS.filter((i) => i.source === 'palengke' && i.pack);
check(strayPacks.length === 0,
  'no tingi item is priced from a supermarket pack',
  'these should not have a pack: ' + strayPacks.map((i) => i.name).join(', '));

console.log('\n' + '─'.repeat(58));
console.log('  distinct menus     ' + menus.size + '/' + DAYS + '        (old engine: 2)');
console.log('  recipes surfaced   ' + surfaced.size + '/' + RECIPES.length + '        (old engine: 16)');
console.log('  worst prito day    ' + Math.max(...pritoPerDay) + '           (old engine: 4)');
console.log('  dearest cheapest   P' + Math.max(...cheapestPerDay));
console.log('─'.repeat(58));
console.log(failures === 0 ? '\nALL CHECKS PASSED\n' : '\n' + failures + ' CHECK(S) FAILED\n');
process.exit(failures === 0 ? 0 : 1);
