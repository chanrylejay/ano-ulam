// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Commodity Name Mapping & Visibility
// V3 — Smart variant handling, brand hiding, clean display names
// ═══════════════════════════════════════════════════════════

// Maps DA base commodity names → user-friendly display names
// Rule: meat cuts → English, vegetables/spices → Filipino, fish → Filipino

export const commodityNameMap: Record<string, string> = {
  // ═══════════════════════════════════════════════════════════
  // Chan's names, 29 Jul 2026. Keyed on the EXACT DA sheet string.
  // ═══════════════════════════════════════════════════════════
  // Written from his own item-by-item pass over the published sheet, so these
  // are his words, not a translation.
  //
  // Keyed on the FULL DA string on purpose. The Jul 28 parser rewrite started
  // keeping the sheet's size text ("Tomato" -> "Tomato 15-18 pcs/kg"), which
  // broke the old short keys and dropped the named share from 59% to 33%.
  // Exact keys can never miss. getDisplayName() also peels the size text back
  // progressively, so the next time the DA changes its suffixes these names
  // keep working instead of silently falling back to raw sheet text.
  "Beef Brisket Imported": "Beef pitso imported",
  "Chicken Egg (White Medium) 56-60 grams/pc": "Egg Medium",
  "Bangus Medium Medium (3-4 pcs/kg)": "Bangus Medium",
  "Galunggong Local Male Medium (12-14 pcs/kg)": "Galunggong",
  "Sardines (Tamban)": "Tamban",
  "Tilapia Medium (5-6 pcs/kg)": "Tilapia",
  "Calamansi": "Kalamansi",
  "Bell Pepper (Red) Local Medium (151-250gm/pc)": "Bell pepper red",
  "Broccoli Local Medium (8-10 cm diameter/bunch hd)": "Broccoli",
  "Cabbage (Scorpio) 750 gm - 1 kg/head": "Repolyo",
  "Carrots Local 8-10 pcs/kg": "Carrots",
  "Chayote Medium (301-400 g)": "Sayote",
  "White Potato Local 10-12 pcs/kg": "Patatas",
  "Ampalaya 4-5 pcs/kg": "Ampalaya",
  "Chilli (Green) Local Haba/Panigang": "Siling green",
  "Eggplant 3-4 Small Bundles": "Talong",
  "Native Pechay 3-4 Small Bundles": "Pechay",
  "Pole Sitao 3-4 Small Bundles": "Sitaw",
  "Squash Suprema Variety": "Kalabasa",
  "Tomato 15-18 pcs/kg": "Kamatis",
  "Pork Belly (Liempo) Imported": "Liempo Imported",
  "Pork Chop Imported": "Pork Chop Imported",
  "Pork Picnic Shoulder (Kasim) Imported": "Kasim Imported",
  "Chicken Breast Local Unbranded Fresh": "Chicken Breast",
  "Chicken Leg Quarter Imported": "Chicken Legs",
  "Chicken Wing Local Magnolia": "Chicken Wings",
  "Garlic Native/Local": "Bawang",
  "Ginger Local Fresh Loose Medium (150- 300 gm)": "Luya",
  "Red Onion Local 13-15 pcs/kg": "Sibuyas",
  "Beef Rump Imported": "Tapadera / Beef Rump Imported",
  "Beef Rib Set Local": "Beef Ribs Local",
  "Beef Short Ribs Local": "Beef Short Ribs Local",
  "Beef Brisket Local Meat with Bones": "Beef Pitso Local",
  "Beef Sirloin Local": "Beef Sirloin Local",
  "Beef Rump Local Lean Meat/ Tapadera": "Tapadera / Beef Rump Local",
  "Corn (Yellow) Cob Sweet Corn": "Mais Yellow",
  "Corn (White) Cob Glutinous": "Mais na Puti",
  "Salmon Head Imported": "Salmon Head Imported",
  "Squid Imported": "Pusit Imported",
  "Bangus Large Large (1-2 pcs)": "Bangus Large",
  "Tambakol (Yellow-Fin Tuna) Local Medium Fresh or Chilled": "Tambakol / Yellow-Fin",
  "Salmon Belly Imported": "Salmon Belly Imported",
  "Banana (Saba)": "Saging saba",
  "Banana (Latundan) 10-12 pcs/kg": "Saging Latundan",
  "Watermelon": "Pakwan",
  "Papaya Solo Ripe 2-3 pcs/kg": "Papaya",
  "Banana (Lakatan) 8-10 pcs/kg": "Saging Lakatan",
  "Melon": "Melon",
  "Mango (Carabao) Ripe 3-4 pcs/kg": "Mangga Kalabaw",
  "Pomelo": "Suha",
  "Avocado": "Avocado",
  "Pechay Baguio": "Pechay Baguio",
  "Habichuelas/Baguio Beans Local": "Baguio Beans",
  "Celery Medium (501-800 g)": "Kintsay Medium",
  "Lettuce (Green Ice)": "Lettuce",
  "Cauliflower Local Medium (8-10 cm diameter/bunch hd)": "Koliplawer",
  "Mungbean": "Monggo",
  "Salt (Rock)": "Asin",
  "Cooking Oil (Palm) 350 ml/bottle": "Mantika / Palm oil 350ml",
  "Sugar (Brown)": "Asukal brown",
  "Sugar (Washed)": "Asukal washed",
  "Sugar (Refined)": "Asukal white",
  "Cooking Oil (Palm) 1 Liter/bottle": "Mantika / Palm oil 1 liter",
  "Pork Spare Ribs Imported": "Baboy Buto buto Imported",
  "Pork Hind Leg (Pigue) Imported": "Pigue Legs Imported",
  "Pork Spare Ribs Local": "Baboy Buto buto Local",
  "Pork Hind Leg (Pigue) Local": "Pigue Legs Local",
  "Pork Picnic Shoulder (Kasim) Local": "Kasim Local",
  "Pork Chop Local": "Pork Chop Local",
  "Pork Belly (Liempo) Local": "Liempo Local",
  "Chicken Neck Local": "Chicken Neck / Leeg",
  "Chicken Feet Local": "Chicken Feet / Paa",
  "Chicken Drumstick Imported": "Chicken Drumstick Imported",
  "Whole Chicken Imported": "Whole Chicken Imported",
  "Chicken Thigh Imported": "Chicken Thigh Imported",
  "Chicken Breast Imported": "Chicken Breast Imported",
  "Chicken Thigh Local": "Chicken Thigh Hita",
  "Chicken Liver Imported": "Chicken Liver / atay Imported",
  "Chicken Wing Imported": "Chicken Wings / pakpak Imported",
  "Chicken Liver Local": "Chicken Atay",
  "Regular Milled 20-40% bran streak": "Bigas pinakamura",
  "Well Milled 1-19% bran streak": "Bigas maalsa",
  "Premium 5% broken": "Bigas premium",
  "Other Special Rice White Rice": "Bigas Dinorado",
  "Glutinous Rice": "Malagkit",
  "White Onion Local": "Sibuyas puti",
  "Chilli (Red) Local Tingala": "Siling pula",
  "Beef Chuck Local": "Beef Kasim",
  "Beef Flank Local": "Beef Flank Kamto (Pares cut)",
  "Beef Fore Limb Local": "Beef Fore Limb Kenchi",
  "Beef Forequarter Local": "Beef Forequarter Paypay",
  "Beef Loin Local": "Beef Loin Tagiliran",
  "Beef Plate Local": "Beef Plate Belly",
  "Beef Rib Eye Local": "Beef Rib Eye Kostillas",
  "Beef Tenderloin Local": "Beef Tenderloin Lomo",
  "Beef Tongue Local": "Beef Tongue Dila",
  "Alumahan (Indian Mackerel) Medium (4-6 pcs/kg)": "Isda Alumahan / Mackerel",
  "Pampano Imported": "Isda Pampano Imported",
  "Pampano Local": "Isda Pampano Local",
  "Squid (Pusit Bisaya) Local Medium": "Pusit",
  "Tanigue Fresh Whole Round": "Tanigue Mackerel",
  "Bell Pepper (Green) Local Medium (151-250gm/pc)": "Bell Pepper green",
  "Broccoli Imported": "Broccoli Imported",
  "Carrots Imported": "Carrots Imported",
  "Cauliflower Imported": "Cauliflower Imported",
  "Carabeef Meat Local": "Kalabaw Meat",
  "Carabeef Rump Steak Local": "Kalabaw Tapadera",
  "Cooking Oil (Coconut) 1 Liter/bottle": "Mantika Coconut oil 1 liter",
  "Cooking Oil (Spring) 1 000 ml/bottle": "Mantika Spring Oil 1 Liter",
  "Salt (Iodized)": "Iodized Asin",
  "Basmati Rice": "Basmati Rice",

  "Cabbage (Rare Ball) 510 gm - 1 kg/head": "Repolyo",
  "Cabbage (Wonder Ball) 510 gm - 1 kg/head": "Repolyo",
  "Lettuce (Iceberg) Medium (301-450 cm diameter/bunch hd)": "Lettuce",

  // ═══════════════════════════════════════════════════════════
  // SHORT-FORM ALIASES — generated, do not hand-edit
  // ═══════════════════════════════════════════════════════════
  // The DA wrote plain names ("Tomato") until the Jul 28 2026 parser rewrite
  // started keeping its size text ("Tomato 15-18 pcs/kg"). Keying only on
  // today's long strings would mean a silent repeat of that outage the day
  // the sheet changes back or changes again.
  //
  // Each entry below is the same name under the shorter form of its key.
  // Ambiguous peels are deliberately absent: "Bangus Medium ..." and
  // "Bangus Large ..." both shorten to "Bangus" and mean different rows, so
  // no alias is written rather than guessing which one wins.
  "Alumahan (Indian Mackerel)": "Isda Alumahan / Mackerel",
  "Ampalaya": "Ampalaya",
  "Banana (Lakatan)": "Saging Lakatan",
  "Banana (Latundan)": "Saging Latundan",
  "Bell Pepper (Green) Local": "Bell Pepper green",
  "Bell Pepper (Red) Local": "Bell pepper red",
  "Broccoli Local": "Broccoli",
  "Cabbage (Scorpio)": "Repolyo",
  "Carrots Local": "Carrots",
  "Cauliflower Local": "Koliplawer",
  "Celery": "Kintsay Medium",
  "Chayote": "Sayote",
  "Cooking Oil (Palm)": "Mantika / Palm oil 350ml",
  "Cooking Oil (Spring)": "Mantika Spring Oil 1 Liter",
  "Eggplant": "Talong",
  "Galunggong Local Male": "Galunggong",
  "Ginger Local": "Luya",
  "Mango (Carabao) Ripe": "Mangga Kalabaw",
  "Native Pechay": "Pechay",
  "Papaya Solo Ripe": "Papaya",
  "Pole Sitao": "Sitaw",
  "Red Onion Local": "Sibuyas",
  "Squid (Pusit Bisaya) Local": "Pusit",
  "Tambakol (Yellow-Fin Tuna) Local": "Tambakol / Yellow-Fin",
  "Tanigue Fresh": "Tanigue Mackerel",
  "Tilapia": "Tilapia",
  "Tomato": "Kamatis",
  "White Potato Local": "Patatas",

  // ── plain forms, no origin word ──
  // The DA wrote "Beef Brisket" before Jul 28 2026 and "Beef Brisket Imported"
  // after. Both must reach the same name or an old-format sheet shows raw text.
  "Beef Brisket": "Beef pitso",
  "Beef Brisket Meat with Bones": "Beef Pitso",
  "Beef Chuck": "Beef Kasim",
  "Beef Flank": "Beef Flank Kamto (Pares cut)",
  "Beef Fore Limb": "Beef Fore Limb Kenchi",
  "Beef Forequarter": "Beef Forequarter Paypay",
  "Beef Loin": "Beef Loin Tagiliran",
  "Beef Plate": "Beef Plate Belly",
  "Beef Rib Eye": "Beef Rib Eye Kostillas",
  "Beef Rib Set": "Beef Ribs",
  "Beef Rump": "Tapadera / Beef Rump",
  "Beef Rump Lean Meat/ Tapadera": "Tapadera / Beef Rump",
  "Beef Short Ribs": "Beef Short Ribs",
  "Beef Sirloin": "Beef Sirloin",
  "Beef Tenderloin": "Beef Tenderloin Lomo",
  "Beef Tongue": "Beef Tongue Dila",
  "Bell Pepper (Green)": "Bell Pepper green",
  "Bell Pepper (Red)": "Bell pepper red",
  "Broccoli": "Broccoli",
  "Cabbage (Rare Ball)": "Repolyo",
  "Cabbage (Wonder Ball)": "Repolyo",
  "Carabeef Meat": "Kalabaw Meat",
  "Carabeef Rump Steak": "Kalabaw Tapadera",
  "Carrots": "Carrots",
  "Chicken Breast": "Chicken Breast",
  "Chicken Breast Unbranded Fresh": "Chicken Breast",
  "Chicken Drumstick": "Chicken Drumstick",
  "Chicken Feet": "Chicken Feet / Paa",
  "Chicken Leg Quarter": "Chicken Legs",
  "Chicken Neck": "Chicken Neck / Leeg",
  "Chicken Wing": "Chicken Wings / pakpak",
  "Chicken Wing Magnolia": "Chicken Wings",
  "Chilli (Green) Haba/Panigang": "Siling green",
  "Chilli (Red) Tingala": "Siling pula",
  "Galunggong Male": "Galunggong",
  "Garlic Native/": "Bawang",
  "Ginger": "Luya",
  "Habichuelas/Baguio Beans": "Baguio Beans",
  "Lettuce (Iceberg)": "Lettuce",
  "Pampano": "Isda Pampano",
  "Pork Belly (Liempo)": "Liempo",
  "Pork Chop": "Pork Chop",
  "Pork Hind Leg (Pigue)": "Pigue Legs",
  "Pork Picnic Shoulder (Kasim)": "Kasim",
  "Pork Spare Ribs": "Baboy Buto buto",
  "Red Onion": "Sibuyas",
  "Salmon Belly": "Salmon Belly",
  "Salmon Head": "Salmon Head",
  "Squid": "Pusit",
  "Squid (Pusit Bisaya)": "Pusit",
  "Tambakol (Yellow-Fin Tuna)": "Tambakol / Yellow-Fin",
  "White Onion": "Sibuyas puti",
  "White Potato": "Patatas",
  "Whole Chicken": "Whole Chicken",
};

// ═══════════════════════════════════════════════════════════
// HIDDEN COMMODITIES — not shown on price dashboard
// ═══════════════════════════════════════════════════════════

export const hiddenCommodities: string[] = [
  // ═══════════════════════════════════════════════════════════
  // Only DELIBERATE hides live here now (29 Jul 2026)
  // ═══════════════════════════════════════════════════════════
  // Everything that used to be listed to kill a duplicate is gone. Origin and
  // brand duplicates are settled by lib/price-competition.ts, which reads the
  // actual prices every day and keeps the cheapest.
  //
  // That is not a tidy-up, it is a correctness fix: this list was hiding the
  // CHEAP side. "Garlic Imported" sat in here at ₱151.19 while local garlic
  // showed at ₱355.45, on an app whose whole promise is the cheapest price.
  //
  // What remains are things Chan does not want on a murang-ulam page at all:
  // feed-grade corn, ₱500+ beef cuts, premium fish, offal, specialty rice.

  // Rice — imported/specialty
  "Jasponica/Japonica Rice",
  "Basmati Rice",

  // Corn — feed/grits
  "Corn Grits (White Food Grade)",
  "Corn Grits (Yellow Food Grade)",
  "Corn Cracked (Yellow Feed Grade)",
  "Corn Grits (Feed Grade)",

  // Fish — premium or uncommon, not weeknight food
  "Alumahan (Indian Mackerel)",
  "Bonito (Frigate Tuna)",
  "Mackerel",
  "Pampano",
  "Squid (Pusit Bisaya)",
  "Tanigue",

  // Beef — cuts far past what a murang-ulam app is for
  "Beef Fore Limb",
  "Beef Forequarter",
  "Beef Loin",
  "Beef Rib Eye",
  "Beef Striploin",
  "Beef Tenderloin",
  "Beef Tongue",
  "Beef Sirloin",

  // Carabeef / Lamb / Duck
  "Carabeef Forequarter",
  "Carabeef Meat",
  "Carabeef Rump Steak",
  "Carabeef Trimmings",
  "Lamb Meat",
  "Duck Meat",
  "Peckin Duck",

  // Pork and poultry offcuts
  "Pork Boston Shoulder",
  "Pork Fore Shank",
  "Pork Hind Shank",
  "Pork Head",
  "Pork Loin",
  "Pork Offals",
  "Pork Rind/Skin",
  "Chicken Rind/Skin",

  // Off the list on sight, 29 Jul 2026: "remove this two items from the list"
  "Lettuce (Romaine)",
  "Tiger Chillies",

  // Oils that are a different product, not a duplicate
  "Cooking Oil (Coconut)",
  "Cooking Oil (Minola)",
  "Cooking Oil (Palm Olein Jolly Brand)",
  "Salt (Iodized)",
];

// ═══════════════════════════════════════════════════════════
// BRAND PATTERNS — auto-hidden (any item containing these)
// ═══════════════════════════════════════════════════════════

// Brand rows are NOT hidden any more. Chan: "for the brand meats Unbranded
// Fresh, Magnolia -- please also pick the cheaper ... pick the cheapest here
// only one should be displayed". They compete in lib/price-competition.ts, and
// on today's sheet Unbranded Fresh chicken breast wins at ₱222.46 against three
// rivals. Hiding them on sight would have thrown that win away.
const BRAND_PATTERNS: string[] = [];

// Suffixes to strip from DA names for cleaner display
const STRIP_SUFFIXES = [
  " Imported",
  " Local",
];

// ═══════════════════════════════════════════════════════════
// DEFAULT HOMEPAGE PRICE TAGS
// ═══════════════════════════════════════════════════════════

export const defaultItems = [
  { key: "Pork Belly (Liempo)", label: "Baboy" },
  { key: "Chicken Leg Quarter", label: "Manok" },
  { key: "Beef Brisket", label: "Beef" },
  { key: "Chicken Egg (White Medium)", label: "Itlog" },
  { key: "Bangus", label: "Bangus" },
  { key: "Tilapia", label: "Tilapia" },
  { key: "Regular Milled 20-40% bran streak", label: "Bigas" },
  { key: "Red Onion Local", label: "Sibuyas" },
  { key: "Garlic Native/Local", label: "Bawang" },
  { key: "Banana (Saba)", label: "Saging" },
  { key: "Cooking Oil (Palm)", label: "Mantika" },
  { key: "Calamansi", label: "Kalamansi" },
  { key: "Chilli (Red) Local", label: "Sili" },
];

// ═══════════════════════════════════════════════════════════
// SMART HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Trailing noise the DA appends to a commodity name: pack sizes, piece counts,
 * weights, bundle counts.
 *
 * Peeled off ONE STEP AT A TIME, longest form first, so a name that is already
 * in the map wins before anything is removed. That ordering is what keeps
 * "Bangus Medium" and "Bangus Large" as two different rows instead of
 * collapsing both to "Bangus".
 */
const NOISE_PATTERNS: RegExp[] = [
  /\s*\([^)]*\d[^)]*\)\s*$/,                     // "(3-4 pcs/kg)", "(301-400 g)"
  /\s*\d[\d\s.,\-]*(?:gm?|kg|g|ml|cm)\b.*$/i,    // "750 gm - 1 kg/head"
  /\s*\d[\d\s.,\-]*(?:pcs?|pieces?)\b.*$/i,      // "8-10 pcs/kg", "56-60 grams/pc"
  /\s*\d[\d\s.,\-]*(?:Small|Large|Medium)?\s*Bundles?\b.*$/i, // "3-4 Small Bundles"
  /\s*\b(Fresh or Chilled|Whole Round|Fresh Loose)\b.*$/i,
  /\s*\b(Small|Medium|Large)\b\s*$/,             // a bare trailing size word
];

/**
 * Get a clean, user-friendly display name for a DA commodity.
 *
 * WHY THIS IS MORE THAN AN EXACT LOOKUP (fixed 29 Jul 2026):
 * the Jul 28 parser rewrite started keeping the DA's size text on the end of
 * every name. `Tomato` became `Tomato 15-18 pcs/kg`, so the exact match stopped
 * hitting and the share of items showing a name Chan chose fell from 59% to
 * 33%. Real visitors were reading "Chicken Egg (White Medium) 56-60 grams/pc"
 * on /prices instead of "Itlog". The map was never wrong; the lookup simply
 * could not reach it.
 *
 * So the name is peeled back progressively and the map is consulted at every
 * step. Exact entries still win first, which is what lets a deliberately
 * specific name ("Bangus Large") beat the generic one.
 */
export function getDisplayName(daName: string): string {
  const attempt = (candidate: string): string | undefined => {
    const trimmed = candidate.trim();
    if (!trimmed) return undefined;
    if (commodityNameMap[trimmed]) return commodityNameMap[trimmed];

    // Same candidate without an origin suffix, e.g. "Carrots Local" -> "Carrots".
    for (const suffix of STRIP_SUFFIXES) {
      if (trimmed.endsWith(suffix)) {
        const bare = trimmed.slice(0, -suffix.length).trim();
        if (commodityNameMap[bare]) return commodityNameMap[bare];
      }
    }
    return undefined;
  };

  const exact = attempt(daName);
  if (exact) return exact;

  // Peel one layer of trailing noise at a time, asking the map after each.
  let cleaned = daName.trim();
  for (let pass = 0; pass < NOISE_PATTERNS.length * 2; pass++) {
    let shortened = cleaned;
    for (const pattern of NOISE_PATTERNS) {
      const next = shortened.replace(pattern, "").trim();
      if (next && next !== shortened) {
        shortened = next;
        break;
      }
    }
    if (shortened === cleaned) break;
    cleaned = shortened;

    const hit = attempt(cleaned);
    if (hit) return hit;
  }

  // Nothing matched. Return the tidied name rather than the raw DA string: it
  // is still the better thing to show, and it makes an unmapped item obvious.
  for (const suffix of STRIP_SUFFIXES) {
    if (cleaned.endsWith(suffix)) return cleaned.slice(0, -suffix.length).trim();
  }
  return cleaned;
}

/**
 * Check if a commodity should be hidden from the price dashboard.
 * Hides: explicit list items + brand variant patterns
 */
export function isHidden(daName: string): boolean {
  const lower = daName.toLowerCase();

  // Brand variant check (Magnolia, Bounty Fresh, Unbranded Fresh, Fully Dressed)
  for (const brand of BRAND_PATTERNS) {
    if (lower.includes(brand.toLowerCase())) return true;
  }

  // Explicit hidden list check
  for (const hidden of hiddenCommodities) {
    if (lower.includes(hidden.toLowerCase())) return true;
  }

  return false;
}
