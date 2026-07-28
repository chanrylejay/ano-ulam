// ═══════════════════════════════════════════════════════════
// Ano Ulam? — DA Daily Price Index parser (deterministic, no AI)
// ═══════════════════════════════════════════════════════════
// Reads the DA Bantay Presyo PDF text directly in code.
//
// WHY THIS EXISTS (Jul 28 2026): the pipeline used to hand the whole PDF to
// DeepSeek and ask it to type out a CSV. After the Jul 23 migration to
// deepseek-v4-flash — a REASONING model — the max_tokens budget was consumed
// entirely by hidden reasoning and the API returned an EMPTY string. The site
// showed zero meals for five days. Measured: 8192 tokens in, 8192 reasoning
// tokens, 0 characters of answer. Raising the budget fixes the output but takes
// 82s, and Vercel Hobby kills the function at 60s.
//
// Reading the sheet in code takes about 1 second and costs nothing.
// This is the same lesson as the hardcoded recipe engine, one step upstream:
// deterministic code for structured data, AI for prose only.

export interface DARecord {
  name: string;
  specification: string;
  category: string;
  price: number | null;
}

/**
 * Section headers across every DA layout we have seen (archive back to Mar 2025).
 * The DA reorganises this document roughly every 6-9 months, so all three known
 * eras are listed. Longest header wins, so "CORN PRODUCTS" beats bare "CORN".
 *
 *   Era 1 (Mar-May 2025): 3 pages, combined "LIVESTOCK & POULTRY", unit column
 *   Era 2 (Jun-Sep 2025): 7 pages, lettered sections, numbered rows
 *   Era 3 (Oct 2025 - now): 8 pages, split meat sections, comma naming
 */
const SECTIONS: Array<[string, string]> = [
  ["IMPORTED COMMERCIAL RICE", "rice"],
  ["LOCAL COMMERCIAL RICE", "rice"],
  ["CORN PRODUCTS", "corn"],
  ["CORN", "corn"],
  ["LEGUMES", "lowland-vegetables"],
  ["FISH PRODUCTS", "fish"],
  ["FISH", "fish"],
  ["BEEF MEAT PRODUCTS", "beef"],
  ["PORK MEAT PRODUCTS", "pork"],
  ["OTHER LIVESTOCK MEAT", "other"],
  ["POULTRY PRODUCTS", "poultry"],
  ["LIVESTOCK & POULTRY", "poultry"],
  ["LOWLAND VEGETABLES", "lowland-vegetables"],
  ["HIGHLAND VEGETABLES", "highland-vegetables"],
  ["SPICES", "spices"],
  ["FRUITS", "fruits"],
  ["OTHER BASIC COMMODITIES", "other"],
];

/** Page furniture that repeats on every page and is never data. */
const BOILERPLATE: RegExp[] = [
  /^Page \d+ of \d+$/,
  /^COMMODITY SPECIFICATION$/,
  /^COMMODITY$/,
  /^SPECIFICATION$/,
  /^PREVAILING$/,
  /^RETAIL PRICE PER$/,
  /^UNIT \(P\/UNIT\)$/,
  /^PRICE \(P\/UNIT\)$/,
  /^PRICE PER UNIT$/,
  /^Department of Agriculture$/,
  /^DAILY PRICE INDEX$/,
  /^National Capital Region \(NCR\)$/,
  /^\(.*\d{4}\)$/,
  /^Prevailing Retail Price of Agri-fishery/,
];

/**
 * A data row ends with either a price (1,234.56) or the literal "n/a".
 * Lazy prefix so each row claims the smallest label that reaches its own price.
 */
const RECORD = /(.+?)\s+(n\/a|\d{1,3}(?:,\d{3})*\.\d{2})(?=\s|$)/g;

/**
 * Eggs sit inside the POULTRY section in the DA sheet but the app treats them
 * as their own category, matching lib/recipes.ts and the /prices filters.
 */
function refineCategory(name: string, sectionCategory: string): string {
  if (/\begg\b/i.test(name)) return "eggs";
  if (/^carabeef|^lamb\b/i.test(name)) return "other";
  return sectionCategory;
}

/**
 * Normalise a commodity label to the naming style already stored in the
 * `commodities` table and expected by lib/commodity-names.ts, which is:
 * commas removed, whitespace collapsed. "Bangus, Large" becomes "Bangus Large".
 */
function normaliseName(label: string): string {
  return label
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse the text of a DA Daily Price Index PDF into commodity records.
 *
 * Rows priced "n/a" come back with `price: null` and MUST NOT be inserted.
 * A missing price once made Galunggong look free and rank cheapest; the engine
 * guards that in hasRequiredPrices(), and this keeps the bad value out entirely.
 *
 * Duplicate names are collapsed to the CHEAPEST occurrence. The sheet lists the
 * same rice varieties under both IMPORTED and LOCAL COMMERCIAL RICE, and the DB
 * key is (name, category), so without this one of the pair is dropped
 * arbitrarily by ON CONFLICT DO NOTHING. Cheapest is both deterministic and what
 * "Bigas pinakamura" means to a user.
 */
export function parseDAPriceIndex(rawText: string): DARecord[] {
  // The footer notes list market names and unit rules, full of data-shaped numbers.
  const body = rawText.split(/Note\(s\):/)[0];

  const cleaned = body
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0 && !BOILERPLATE.some((re) => re.test(line)))
    .join(" ");

  // Locate every section header. Longest first so short aliases cannot shadow
  // a longer header that starts with the same words.
  const hits: Array<{ header: string; category: string; at: number }> = [];
  const byLength = [...SECTIONS].sort((a, b) => b[0].length - a[0].length);

  for (const [header, category] of byLength) {
    let from = 0;
    let at = cleaned.indexOf(header, from);
    while (at >= 0) {
      const overlaps = hits.some((h) => at >= h.at && at < h.at + h.header.length);
      if (!overlaps) hits.push({ header, category, at });
      from = at + header.length;
      at = cleaned.indexOf(header, from);
    }
  }

  if (hits.length === 0) return [];
  hits.sort((a, b) => a.at - b.at);

  const records: DARecord[] = [];

  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].at + hits[i].header.length;
    const end = i + 1 < hits.length ? hits[i + 1].at : cleaned.length;
    const chunk = cleaned.slice(start, end);

    // A fresh regex per chunk. Two reasons: a /g regex carries lastIndex
    // between calls, and matchAll() needs downlevelIteration which this project
    // does not set (tsconfig target is es5 — the TS2802 trap).
    const rowRe = new RegExp(RECORD.source, "g");
    let match: RegExpExecArray | null = rowRe.exec(chunk);

    for (; match !== null; match = rowRe.exec(chunk)) {
      let label = match[1].trim();

      // Era 2 numbers every row: "41 Imported Beef Chuck".
      label = label.replace(/^\d{1,3}\s+/, "");
      // Era 1 carries a unit column before the price: "Bangus Large kg 227.05".
      label = label.replace(/\s+(kg|pc|pcs|liter|ml)$/i, "");
      label = label.trim();

      if (label.length < 3) continue;

      const name = normaliseName(label);
      if (!name) continue;

      const priceToken = match[2];
      records.push({
        name,
        specification: "",
        category: refineCategory(name, hits[i].category),
        price: priceToken === "n/a" ? null : parseFloat(priceToken.replace(/,/g, "")),
      });
    }
  }

  // Collapse duplicates to the cheapest priced occurrence.
  const best = new Map<string, DARecord>();
  for (const rec of records) {
    const key = `${rec.name}||${rec.category}`;
    const seen = best.get(key);
    if (!seen) {
      best.set(key, rec);
      continue;
    }
    if (seen.price === null && rec.price !== null) best.set(key, rec);
    else if (seen.price !== null && rec.price !== null && rec.price < seen.price) best.set(key, rec);
  }

  return Array.from(best.values());
}

// ═══════════════════════════════════════════════════════════
// CSV parsing for the DeepSeek fallback path
// ═══════════════════════════════════════════════════════════

/**
 * Split one CSV line, respecting quoted fields.
 *
 * The old code used a bare line.split(","). DA commodity names contain commas
 * ("Bangus, Large"), DeepSeek correctly quotes those fields, and the naive split
 * shifted every field one slot along. That is how the live `commodities` table
 * ended up with names like `"Galunggong, Local",fish` and categories like
 * `"Male` and `"Cob`.
 */
export function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'; // escaped "" inside a quoted field
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);

  return fields.map((f) => f.trim());
}

/** Parse DeepSeek's `name,category,specification,price` CSV into records. */
export function parseDeepSeekCsv(responseText: string): DARecord[] {
  const lines = responseText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const records: DARecord[] = [];

  for (const line of lines) {
    const parts = parseCsvLine(line);
    if (parts.length < 4) continue;

    const price = parseFloat(parts[parts.length - 1]);
    const specification = parts[parts.length - 2] || "";
    const category = parts[parts.length - 3] || "other";
    // Anything before the last three fields is the name, commas and all.
    const name = normaliseName(parts.slice(0, parts.length - 3).join(" "));
    if (!name) continue;

    records.push({
      name,
      specification,
      category,
      price: Number.isNaN(price) || price === 0 ? null : price,
    });
  }

  return records;
}

// ═══════════════════════════════════════════════════════════
// Matching DA names to recipe daKeys
// ═══════════════════════════════════════════════════════════

/**
 * Words that describe a variant rather than identify the commodity. A daKey may
 * still USE one deliberately ("Red Onion Local"), so these are treated as a
 * preference, not a hard requirement — see resolvePrice below.
 */
const QUALIFIER_WORDS = new Set([
  "local",
  "imported",
  "native",
  "fresh",
  "frozen",
  "unbranded",
  "large",
  "medium",
  "small",
  "male",
  "female",
]);

function toWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[(),/]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Find the price for a recipe daKey among parsed rows, matching on WORDS rather
 * than an exact string.
 *
 * Exact matching pins the app to whatever the DA sheet looks like today. Measured
 * against the 17-month archive: exact matching survives none of the two historical
 * reorganisations, word matching keeps 39/47 recipes working through the Jun-Sep
 * 2025 layout and 20/47 through the Mar-May 2025 one. The homepage needs 8.
 *
 * Qualifiers are a preference: "Red Onion Local" prefers a row that actually says
 * Local and will not silently price itself off imported onions, but if NO row in
 * the sheet carries the qualifier (older layouts omitted them) it falls back to
 * the core-word match rather than returning nothing.
 */
export function resolvePrice(daKey: string, rows: DARecord[]): number | undefined {
  const keyWords = toWords(daKey);
  const core = keyWords.filter((w) => !QUALIFIER_WORDS.has(w));
  const qualifiers = keyWords.filter((w) => QUALIFIER_WORDS.has(w));
  if (core.length === 0) return undefined;

  const priced = rows.filter((r) => r.price !== null && r.price > 0);

  const candidates = priced.filter((r) => {
    const words = toWords(r.name);
    return core.every((w) => words.includes(w));
  });
  if (candidates.length === 0) return undefined;

  let pool = candidates;
  if (qualifiers.length > 0) {
    const exact = candidates.filter((r) => {
      const words = toWords(r.name);
      return qualifiers.every((w) => words.includes(w));
    });
    if (exact.length > 0) pool = exact;
  }

  return pool.reduce((cheapest, r) =>
    (r.price as number) < (cheapest.price as number) ? r : cheapest,
  ).price as number;
}

/** Build the full daKey → price map the cost engine consumes. */
export function buildPriceMap(daKeys: string[], rows: DARecord[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const key of daKeys) {
    const price = resolvePrice(key, rows);
    if (price !== undefined) map[key] = price;
  }
  return map;
}

// ═══════════════════════════════════════════════════════════
// Health floors — the guards that would have caught the Jul 2026 outage
// ═══════════════════════════════════════════════════════════

/**
 * A healthy DA sheet yields 140-165 priced rows (measured across the whole
 * archive). Anything under this means the read went wrong, and writing it would
 * overwrite good data with a broken day. The ingest refuses instead.
 */
export const MIN_HEALTHY_PRICES = 100;

/** Below this the DeepSeek fallback is attempted before giving up. */
export const MIN_ACCEPTABLE_PRICES = 100;
