// ═══════════════════════════════════════════════════════════
// Ano Ulam? — DTI e-Presyo SRP bulletin parser (deterministic, no AI)
// ═══════════════════════════════════════════════════════════
// The Department of Trade and Industry publishes Suggested Retail Prices for
// Basic Necessities and Prime Commodities: canned sardines, milk, coffee,
// bread, noodles, salt, luncheon meat, corned beef, vinegar, patis, soy sauce.
// These are the packaged goods the DA's Bantay Presyo sheet never carries.
//
// TWO THINGS TO KNOW BEFORE TRUSTING A NUMBER FROM HERE:
//
// 1. An SRP is a CEILING, not an observed price. A real shelf sits at or below
//    it. Never present an SRP as "the price"; it is the most a store may
//    legally charge. Use it as a sanity bound on an observed price, or as a
//    last resort when nothing observed exists.
// 2. It is republished roughly YEARLY, not daily. The bucket held exactly one
//    2026 bulletin (11 May) and the one before it was 01 Feb 2025. Anything
//    built on this must show its effective date, because that date is old.
//
// ── Why the parser looks like this ──────────────────────────
// The bulletin is a single A3 page laid out in THREE columns, each column
// being (product, unit, SRP). pdf-parse's default text renderer flattens the
// page and joins the columns into each other, so a sardine and a bottle of
// water land on the same text line:
//
//     Saba Philippines Sardines155g   21.50  Wilkins7L90.00
//
// Worse, the section headers interleave too, so "CANNED SARDINES" ends up
// sitting directly above a row of bottled water. Reading the flat text is how
// you confidently file mineral water under canned sardines.
//
// So this parser works on POSITIONED text items instead. Two facts about the
// PDF make that reliable, both verified against the 11 May 2026 sheet:
//
//   - Items arrive in READING ORDER: row by row, left to right across all
//     three columns. (The y coordinate is useless here — every item on the
//     page reports the same y — so reading order is the only ordering signal,
//     and it is a sound one.)
//   - An item carries its own column's field, and MAY carry the next column's
//     product name glued to the end of it: "155g   21.50  Wilkins" is column
//     one's unit and price, followed by column two's product.
//
// Column boundaries are DERIVED from the page, not hardcoded, by clustering
// the x positions. A correct sheet yields exactly 3 clusters per column. If
// the DTI re-lays the page, the cluster count stops being a multiple of three
// and parsing THROWS rather than quietly filing prices under the wrong
// product — the same instinct as the DA parser's health floor.
//
// ── KNOWN LIMIT: the ragged tail of a column ────────────────
// Cells whose label is too long for its box wrap onto a second line, and the
// PDF emits those cells at the END of the column's text run, detached from the
// heading they were printed under. On the 11 May 2026 sheet that affects the
// last ~16 entries of column one: instant noodles, some Fidel salt variants
// and one powdered milk end up carrying whatever heading was last seen
// ("DISTILLED WATER"), which is wrong.
//
// There is no positional signal left to recover the true heading — y is
// constant across the whole page — so this parser does NOT guess. Records
// whose label was reassembled across a wrap are flagged `wrapped: true`;
// treat their `section` as unverified. Every un-wrapped record on the sheet
// files correctly, including the brand-only meat entries ("Bingo", "555",
// "Argentina") that appear under three different headings.
//
// None of the affected rows is a food item ano-ulam prices today. If that ever
// changes, match on the product label, never on the section.

export interface TextItem {
  /** The text run exactly as the PDF emitted it. */
  s: string;
  /** Horizontal position of the run's start, in PDF points. */
  x: number;
}

export interface SRPRecord {
  /** Section heading the product sits under, e.g. "CORNED BEEF". */
  section: string;
  /** Product as printed, e.g. "Angel Filled Milk". */
  product: string;
  /** Pack size as printed, e.g. "370mL". */
  size: string;
  /** Suggested retail price in pesos. A CEILING, not an observed price. */
  srp: number;
  /**
   * The label was reassembled from a wrapped cell, so `section` is UNVERIFIED.
   * See the known-limit note at the top of this file.
   */
  wrapped: boolean;
}

/** Page furniture: column captions, the title block, the version stamp. */
const BOILERPLATE: RegExp[] = [
  /^BASIC NECESSITIES$/i,
  /^PRIME COMMODITIES$/i,
  /^BASIC NECESSITIES AND PRIME COMMODITIES$/i,
  /^SUGGESTED RETAIL PRICES$/i,
  /^UNIT$/i,
  /^SRP$/i,
  /^effective\b/i,
  /^NOTE:/i,
  /^v\d+\.\d+$/i,
];

/** Always two decimals on this sheet, which is what makes prices unambiguous. */
const PRICE = /\d{1,3}(?:,\d{3})*\.\d{2}/;
const PRICE_G = new RegExp(PRICE.source, "g");

/**
 * A pack size is a number plus a weight/volume unit ("155g", "6.6L", "350ml"),
 * or a candle gauge ("#16", "#20x2"), or a battery size ("AA", "D").
 * Anchored to the END because it is peeled off the tail of a product label.
 */
const TRAILING_SIZE = /\s*(\d+(?:\.\d+)?\s*(?:kgs?|kg|g|mL|ml|ML|L)|#[\w.x]+|AA|AAA|D|C)\s*$/;

function isBoilerplate(text: string): boolean {
  const t = text.trim();
  return t.length === 0 || BOILERPLATE.some((re) => re.test(t));
}

/**
 * Group x positions into columns of (product, unit, SRP).
 *
 * Throws when the count is not a multiple of three. A wrong grouping does not
 * produce fewer prices, it produces prices attached to the wrong products,
 * which is invisible downstream. Failing here is the whole point.
 */
export function deriveBands(xs: number[], gap = 25): number[][] {
  const sorted = Array.from(new Set(xs)).sort((a, b) => a - b);
  if (sorted.length === 0) throw new Error("DTI: no positioned text on the page");

  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] > gap) clusters.push([]);
    clusters[clusters.length - 1].push(sorted[i]);
  }

  if (clusters.length % 3 !== 0) {
    throw new Error(
      `DTI: found ${clusters.length} x-clusters, expected a multiple of 3 ` +
        `(product/unit/SRP per column). The bulletin layout changed; ` +
        `re-check the parser before trusting any price from it.`
    );
  }
  return clusters;
}

/** Which of the derived clusters does this x belong to? */
function bandOf(x: number, clusters: number[][]): number {
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (x >= c[0] && x <= c[c.length - 1]) return i;
  }
  // Between two clusters: attach to the nearer one on the left, matching the
  // left-aligned layout of every column on this sheet.
  for (let i = clusters.length - 1; i >= 0; i--) {
    if (x > clusters[i][clusters[i].length - 1]) return i;
  }
  return 0;
}

/**
 * True when `next` continues a product label that wrapped onto a second line,
 * rather than starting a new one. Without this, "Ho-Mi (Instant Mami Chicken &
 * Garlic," followed by "Instant Mami Beef Brisket)" reads as a section header
 * plus a product.
 */
function isContinuation(prev: string, next: string): boolean {
  const p = prev.trim();
  const n = next.trim();
  if (/[,&\-–/(]$/.test(p)) return true;
  // A lowercase word, or a bracketed qualifier like "(20pcs./pack)", never
  // begins a label of its own.
  if (/^[a-z(]/.test(n)) return true;
  // An open parenthesis that never closed has to close on the next line.
  const opens = (p.match(/\(/g) || []).length;
  const closes = (p.match(/\)/g) || []).length;
  return opens > closes;
}

/** Per-column accumulator: a product is emitted once it has both size and price. */
interface ColumnState {
  section: string;
  name: string | null;
  size: string | null;
  /** Did this label arrive across more than one text run (a wrapped cell)? */
  wrapped: boolean;
}

/**
 * Parse a DTI BNPC SRP bulletin from positioned PDF text items.
 *
 * `items` must be in the order the PDF emitted them (reading order); sorting
 * them by position first will silently scramble the output.
 */
export function parseSrpBulletin(items: TextItem[]): SRPRecord[] {
  const usable = items.filter((it) => !isBoilerplate(it.s));
  const clusters = deriveBands(usable.map((it) => it.x));
  const columnCount = clusters.length / 3;

  const cols: ColumnState[] = [];
  for (let i = 0; i < columnCount; i++) {
    cols.push({ section: "", name: null, size: null, wrapped: false });
  }

  const out: SRPRecord[] = [];

  /** A name arrived for column c: it either wraps, closes a header, or starts a product. */
  const pushName = (c: number, text: string): void => {
    const st = cols[c];
    const name = text.trim();
    if (!name) return;
    if (st.name !== null && st.size === null) {
      // Nothing priced the pending label yet, so it was either a heading or
      // the first half of a label that wrapped.
      if (isContinuation(st.name, name)) {
        st.name = st.name.trim() + " " + name;
        st.wrapped = true;
        return;
      }
      st.section = st.name.trim();
    }
    st.name = name;
    st.size = null;
    st.wrapped = false;
  };

  const pushSize = (c: number, text: string): void => {
    const size = text.trim();
    if (size) cols[c].size = size;
  };

  const pushPrice = (c: number, value: number): void => {
    const st = cols[c];
    if (st.name === null) return; // a price with no product is unusable
    out.push({
      section: st.section,
      product: st.name.replace(/\s+/g, " ").trim(),
      size: (st.size || "").replace(/\s+/g, " ").trim(),
      srp: value,
      wrapped: st.wrapped,
    });
    st.name = null;
    st.size = null;
    st.wrapped = false;
  };

  for (const item of usable) {
    const band = bandOf(item.x, clusters);
    const col = Math.floor(band / 3);
    const field = band % 3; // 0 = product, 1 = unit, 2 = SRP

    const text = item.s.replace(/\s+/g, " ");
    const prices = Array.from(text.matchAll(PRICE_G));

    if (prices.length === 0) {
      if (field === 0) pushName(col, text);
      else if (field === 1) pushSize(col, text);
      continue;
    }

    // The first price on this run closes THIS column's row. Everything before
    // it belongs to this column; everything after it is the next column's
    // product label, glued on by the PDF's text layout.
    const first = prices[0];
    const before = text.slice(0, first.index);
    const after = text.slice(first.index! + first[0].length);

    if (field === 0) {
      // "Fidel Refined (Blue) - Luzon  250g  11.75  Manila Wax Sperma White"
      const sizeMatch = before.match(TRAILING_SIZE);
      if (sizeMatch) {
        pushName(col, before.slice(0, sizeMatch.index));
        pushSize(col, sizeMatch[1]);
      } else {
        pushName(col, before);
      }
    } else if (field === 1) {
      pushSize(col, before); // "155g   21.50  Wilkins" -> "155g"
    }
    // field === 2: `before` is empty, the run starts with the price.

    pushPrice(col, Number(first[0].replace(/,/g, "")));

    const trailing = after.trim();
    if (trailing && col + 1 < columnCount) pushName(col + 1, trailing);
  }

  return out;
}

/**
 * Pick the newest bulletin out of an S3 ListObjectsV2 XML response.
 *
 * The bucket is publicly listable, so nothing here hardcodes a URL that will
 * rot the next time DTI publishes. The date lives only in the filename
 * ("11 MAY 2026"), never in S3 metadata, and the bucket holds backup copies of
 * old bulletins whose LastModified is NEWER than their contents.
 */
export function newestBulletin(listXml: string): { key: string; effective: string } | null {
  const MONTHS: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
  };

  let best: { key: string; effective: string; ms: number } | null = null;
  const keys = Array.from(listXml.matchAll(/<Key>([^<]+)<\/Key>/g), (m) => m[1]);

  for (const key of keys) {
    if (!/\.pdf$/i.test(key)) continue;
    const m = key.toUpperCase().match(/(\d{1,2})\s+([A-Z]{3})[A-Z]*\.?\s*(\d{4})/);
    if (!m) continue;
    const month = MONTHS[m[2]];
    if (month === undefined) continue;
    const ms = Date.UTC(Number(m[3]), month, Number(m[1]));
    if (!best || ms > best.ms) {
      best = { key, effective: new Date(ms).toISOString().slice(0, 10), ms };
    }
  }

  return best ? { key: best.key, effective: best.effective } : null;
}
