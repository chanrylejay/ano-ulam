// ═══════════════════════════════════════════════════════════
// Ano Ulam? — where each non-DA ingredient gets its price
// ═══════════════════════════════════════════════════════════
// The DA Bantay Presyo sheet covers fresh produce, meat, fish and rice. It has
// never carried a can of liver spread or a sachet of sinigang mix, so those
// prices came out of Chan's head. This file says, for every one of them, where
// a real price comes from instead — and, just as importantly, which ones have
// NO online source and must stay hand-priced.
//
// ── The three rules that decide `source` ────────────────────
//
// 1. PACKAGED goods go to ShopSuki. It is a sari-sari supplier, so its packs
//    are the tingi sizes people actually buy: Knorr Sinigang 11g, not a
//    catering tub.
// 2. FRESH goods do NOT. ShopSuki's produce aisle is delivery-priced and often
//    carries no pack size at all: "White Onion Approx. 500g" at P80.60 works
//    out to P161/kg against the DA's P80/kg, and "Pork Liver" is listed at
//    P118.10 with no weight. Pricing a palengke app off that would break the
//    one promise the app makes. This is the same reason Safe Select and
//    Farm2Metro were rejected (tofu at 37x the palengke price).
// 3. TINGI goods do NOT either, even when a supermarket pack exists. Chan,
//    Jul 30 2026, on bagoong and hotdog: *"Bagoong is a tingi palengke item,
//    and hotdog is a tingi palengke item"*. You buy bagoong by the scoop and
//    hotdog by the piece, so a 250g branded pack is the wrong unit no matter
//    how real its price is.
//
// A `palengke` item is not a gap in the research. It is the correct answer for
// a good that is only ever sold in tingi, and its price stays Chan's.
//
// ── Matching, and the two traps it exists to avoid ──────────
// Terms match on WHOLE WORDS against the product title, and the product's
// `product_type` must be on the allow list. Both are needed:
//   - Substring matching scores "Nissin Instant Noodle Satay" as pork liver
//     ("atay"), "Lupoy Pack" as upo, and "Bagoong Alamang with Gata" as gata.
//   - Type filtering alone still lets "Lucky Me Instant Macaroni" win elbow
//     macaroni, because instant noodles really are filed under Pasta.
// So `reject` exists for the cases where a term legitimately appears on a
// product that is not the thing.
//
// ── Why `pack` is a decision, not the cheapest hit ──────────
// Cheapest-wins is right for DA commodities because everything there is priced
// per kilo. It is WRONG in a grocery aisle, where the cheapest row is usually
// just the smallest pack and the best value per 100g is a 1kg tub nobody buys
// for one dinner (tomato sauce: cheapest pouch P13.60, best value P89.30/kg).
// So the pack is chosen once, by Chan, and recorded here. The fetch script
// reports what is currently cheapest; it never silently reprices the app.
//
// ── WHOLE PACKS ONLY. Never a fraction, never an estimate ───
// Chan, Jul 30 2026: *"find the cheapest and the price needs to be whole since
// we cant say this is tingi"*, and *"for recipes that call 1 cup measurements
// on evap milk or other products dont estimate it, always fall to 1 can only"*.
//
// A grocery item is bought whole. You cannot buy a third of a jar of peanut
// butter or half a pack of macaroni, so the dish carries the whole jar and the
// whole pack. This REPLACES the earlier fraction rule, which charged a share of
// the pack and quietly understated what a cook actually spends at the counter.
//
// It also kills unit conversion. "1 cup" of evaporated milk used to be stored
// as 1.7 cans, an estimate that is both unbuyable and unverifiable. It is one
// can now. Any recipe reaching for a cup of a packaged product gets one pack of
// it, and the amount label says so.
//
// Consequence: a packaged item's stored price is the price of ONE pack and the
// recipe's qty is 1. A fractional qty on a packaged good is now a bug.

export type PriceSource = "shopsuki" | "palengke";

export interface GroceryMatch {
  /** Whole words; any one of them matching the title is a hit. */
  terms: string[];
  /** Only these ShopSuki product_type values may win. */
  types: string[];
  /** Whole words that disqualify a title even when a term matched. */
  reject?: string[];
}

export interface GroceryItem {
  /** Ingredient name exactly as written in lib/recipes.ts. */
  name: string;
  source: PriceSource;
  /**
   * What one dish uses, matching the recipe's own `amount` label. For a
   * ShopSuki item this is always one whole pack — see the whole-packs rule
   * above. For a palengke item it can be a fraction, because tingi is exactly
   * the case where you really can buy half.
   */
  perDish: string;
  /** ShopSuki matching rules. Present when source is "shopsuki". */
  match?: GroceryMatch;
  /** The pack Chan chose. Present when source is "shopsuki". */
  pack?: { title: string; price: number };
  /** Why nothing online is usable. Present when source is "palengke". */
  reason?: string;
}

export const GROCERY_ITEMS: GroceryItem[] = [
  // ── Packaged: priced from ShopSuki ───────────────────────
  {
    name: "Tomato sauce",
    source: "shopsuki",
    perDish: "1 pack",
    match: { terms: ["tomato sauce"], types: ["Seasonings", "Canned Vegetables"] },
    pack: { title: "Ram Tomato Sauce Filipino Style 115g", price: 13.6 },
  },
  {
    name: "Sinigang mix",
    source: "shopsuki",
    perDish: "1 pack",
    match: { terms: ["sinigang"], types: ["Seasonings"] },
    pack: { title: "Knorr Sinigang Sa Sampalok Mix Original 11g", price: 8.45 },
  },
  {
    name: "Gata",
    source: "shopsuki",
    perDish: "1 pack (Chan: 1 pack is enough)",
    match: {
      terms: ["coconut milk", "coconut cream", "gata"],
      types: ["Seasonings", "Baking Needs"],
      reject: ["bagoong", "alamang", "adobo", "sauce", "vinegar"],
    },
    // Chan's brand is Coco Mama, but ShopSuki only carries it at 400ml, about
    // double the pack he means. Goodnom 225ml is the closest real size and the
    // best value per 100ml of any gata on the site.
    pack: { title: "Goodnom Fresh Gata 225ml", price: 35.75 },
  },
  {
    name: "Liver spread",
    source: "shopsuki",
    perDish: "1 can",
    match: { terms: ["liver spread"], types: ["Canned Meat", "Bread Fill"] },
    pack: { title: "Purefoods Star Nutri-Meats Liver Spread 85g", price: 24.35 },
  },
  {
    name: "Grated cheese",
    source: "shopsuki",
    perDish: "1 pack",
    match: {
      terms: ["cheese"],
      types: ["Bread Fill", "Creams (Chilled)", "Creams"],
      reject: ["flavored", "flavour", "curls", "ball", "ring", "sauce", "powder"],
    },
    // Chan's own pick from the ShopSuki screenshots, over the P13.95 Danes.
    pack: { title: "Kraft Eden Cheese Sulit Pack 45g", price: 17.6 },
  },
  {
    name: "Peanut butter",
    source: "shopsuki",
    perDish: "1 jar",
    match: { terms: ["peanut butter"], types: ["Bread Fill", "Nuts & Preserves"] },
    pack: { title: "Totsie's Peanut Butter Chunky 140g", price: 55.75 },
  },
  {
    name: "Elbow macaroni",
    source: "shopsuki",
    perDish: "1 pack",
    // Instant noodle cups are filed under Pasta and would win on price.
    match: {
      terms: ["elbow", "macaroni"],
      types: ["Pasta"],
      reject: ["instant", "cup", "mac and cheese", "lucky me", "nissin", "payless"],
    },
    // Ram Salad Macaroni ties at P26.10, but sopas asks for elbow.
    pack: { title: "Ram Elbow Premium Macaroni 200g", price: 26.1 },
  },
  {
    name: "Evaporated milk",
    source: "shopsuki",
    perDish: "1 can",
    // Evaporada is filed under "Creams", not "Milk". "Filled milk" is a
    // cheaper substitute product, not evaporated milk.
    match: { terms: ["evaporada", "evaporated"], types: ["Creams"], reject: ["filled"] },
    pack: { title: "Alaska Evaporada 140ml", price: 20.25 },
  },

  // ── Tingi and fresh: Chan's price stands ─────────────────
  {
    name: "Bagoong alamang",
    source: "palengke",
    perDish: "1/2 pack",
    reason: "Chan: tingi palengke item, bought by the scoop, not by the branded jar",
  },
  {
    name: "Hotdog",
    source: "palengke",
    perDish: "2 pcs",
    reason: "Chan: tingi palengke item, bought by the piece, not by the 250g pack",
  },
  {
    name: "Okra",
    source: "palengke",
    perDish: "1 tali",
    reason: "sold by the tali; no online seller lists a tali",
  },
  {
    name: "Kangkong",
    source: "palengke",
    perDish: "1 tali",
    reason: "sold by the tali; no online seller lists a tali",
  },
  {
    name: "Malunggay",
    source: "palengke",
    perDish: "1 tali",
    reason: "sold by the tali; no online seller lists a tali",
  },
  {
    name: "Upo",
    source: "palengke",
    perDish: "1 pc",
    reason: "sold whole by the piece; no online listing",
  },
  {
    name: "Mais",
    source: "palengke",
    perDish: "1 pc on the cob",
    reason: "ShopSuki carries canned kernels only, which is a different ingredient",
  },
  {
    name: "Gabi",
    source: "palengke",
    perDish: "1/4 kg",
    reason: "ShopSuki lists 'Gabi Violet' at P37.20 with no weight given",
  },
  {
    name: "Atay ng baboy",
    source: "palengke",
    perDish: "1/4 kg",
    reason: "ShopSuki lists 'Pork Liver' at P118.10 with no weight given",
  },
];

/**
 * Price of one whole pack for a ShopSuki-sourced ingredient.
 *
 * Multiply by the recipe's `qty`, never by an extra fraction: the recipe's
 * amount label ("1/3 jar") is already carried in `qty`.
 */
export const GROCERY_PRICE: Record<string, number> = Object.fromEntries(
  GROCERY_ITEMS.filter((i) => i.pack).map((i) => [i.name, i.pack!.price])
);

/** Whole-word test; the reason substring matching is banned is at the top. */
export function matchesTerm(title: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z])${escaped}($|[^a-z])`, "i").test(title);
}

export interface CatalogueProduct {
  title: string;
  type: string;
  price: number;
  available?: boolean;
}

/** Every catalogue product that could legitimately price this item, cheapest first. */
export function candidatesFor(item: GroceryItem, catalogue: CatalogueProduct[]): CatalogueProduct[] {
  const spec = item.match;
  if (!spec) return [];
  return catalogue
    .filter((p) => {
      if (p.available === false) return false;
      if (!spec.types.includes(p.type)) return false;
      if (!spec.terms.some((t) => matchesTerm(p.title, t))) return false;
      if (spec.reject?.some((t) => matchesTerm(p.title, t))) return false;
      return true;
    })
    .sort((a, b) => a.price - b.price);
}
