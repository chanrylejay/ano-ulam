// Hunt the defect class Chan found by hand: a recipe whose ingredient list does
// not support the dish it claims to be.
//
//   node scripts/draft-check.mjs --drafts <recipe-drafts.json> [--json]
//
// He found these in eight dishes before giving up and asking for a sweep. The
// checks below are that sweep. Each one is deliberately narrow, because a noisy
// checker is worse than none: it trains you to skim the output.
//
// IMPORTANT: every check reads ingredients AND pantryItems AND the steps. The
// first version of the review page showed only `ingredients`, which hid the oil,
// flour, butter and toyo that were there all along and produced six false
// complaints. A recipe check that ignores the pantry repeats that mistake.

import fs from "node:fs";
import path from "node:path";

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

/**
 * A dish name is a promise. "Garlic Butter Hotdog" promises butter; if no butter
 * appears anywhere the recipe is not that dish.
 *
 * `needs` is a list of alternatives — any one satisfies the promise — because a
 * Filipino kitchen has several names for the same thing (mantikilya IS butter,
 * gata IS coconut milk).
 */
const NAME_PROMISES = [
  { word: /\bbutter\b/i,        needs: [/mantikilya|butter/i], label: "butter" },
  { word: /\bgochujang\b/i,     needs: [/gochujang/i], label: "gochujang" },
  { word: /\bkimchi\b/i,        needs: [/kimchi/i], label: "kimchi" },
  { word: /\bcheese|cheesy\b/i, needs: [/cheese|keso|quickmelt|parmesan/i], label: "cheese" },
  { word: /\bmushroom\b/i,      needs: [/mushroom|kabute/i], label: "mushroom" },
  { word: /\btuna\b/i,          needs: [/tuna/i], label: "tuna" },
  { word: /\bsardinas|sardine\b/i, needs: [/sardinas|sardine/i], label: "sardinas" },
  { word: /\btuyo\b/i,          needs: [/tuyo/i], label: "tuyo" },
  { word: /\btokwa|tofu\b/i,    needs: [/tokwa|tofu/i], label: "tokwa" },
  { word: /\bcorn\b/i,          needs: [/mais|corn/i], label: "corn" },
  { word: /\bginataan|gata\b/i, needs: [/gata|coconut|niyog/i], label: "gata" },
  { word: /\bcurry\b/i,         needs: [/curry/i], label: "curry powder" },
  { word: /\bmiso\b/i,          needs: [/miso/i], label: "miso" },
  { word: /\btausi\b/i,         needs: [/tausi|black bean/i], label: "tausi" },
  { word: /\bsalted egg\b/i,    needs: [/maalat|salted/i], label: "salted egg" },
  { word: /\bpeanut|kare-kare\b/i, needs: [/peanut|mani/i], label: "peanut" },
  { word: /\bbagoong|binagoongan\b/i, needs: [/bagoong|alamang/i], label: "bagoong" },
  { word: /\bpineapple|pininyahang\b/i, needs: [/pinya|pineapple/i], label: "pineapple" },
  { word: /\bhotdog\b/i,        needs: [/hotdog|hot dog/i], label: "hotdog" },
  // Making longganisa from giniling plus casing IS the dish. The promise is
  // satisfied by the casing just as well as by a bought sausage.
  { word: /\blongganisa\b/i,    needs: [/longganisa/i, /casing/i], label: "longganisa" },
  { word: /\bmalunggay\b/i,     needs: [/malunggay/i], label: "malunggay" },
  { word: /\bkangkong\b/i,      needs: [/kangkong/i], label: "kangkong" },
  { word: /\bsisig\b/i,         needs: [/kalamansi|suka|mayonesa|sibuyas/i], label: "an acid or mayo (sisig)" },
  // Adobong PUTI, and adobo sa asin, are adobo WITHOUT soy sauce. That is what
  // puti means, and salt is the whole point of the variant.
  { word: /\badobo|adobong\b/i, needs: [/toyo|soy/i], label: "toyo (adobo)",
    unless: /\bputi\b|\basin\b/i },
  { word: /\bsinigang|sinampalukang\b/i, needs: [/sampalo[kc]|kamias|sinigang|bayabas|santol|tamarind/i], label: "a souring agent (sinigang)" },
  { word: /\bpaksiw\b/i,        needs: [/suka|vinegar/i], label: "suka (paksiw)" },
  { word: /\bcreamy|cream\b/i,  needs: [/cream|gata|evaporada|evaporated|milk|gatas|mayonesa|keso|cheese/i], label: "something creamy" },
  // NO "crispy needs a coating" rule. It flagged five dishes and was wrong on
  // all five: crispy pata is boiled then deep fried, adobo flakes crisp by
  // frying shredded meat, and tokwa crisps on its own. Nothing is battered. A
  // rule with a 100% false-positive rate is not tuned, it is deleted.
];

/** Everything the recipe mentions anywhere: priced goods, pantry goods, steps. */
function haystack(d) {
  const parts = [];
  for (const i of d.ingredients || []) parts.push(i.name);
  for (const p of d.pantryItems || []) parts.push(p.name);
  for (const s of d.steps || []) parts.push(s);
  return parts.join(" | ");
}

const findings = [];
const add = (d, kind, detail) => findings.push({ dish: d.name, method: d.method, kind, detail });

for (const d of drafts) {
  const hay = haystack(d);
  const shopping = [...(d.ingredients || []), ...(d.pantryItems || [])].map((x) => x.name).join(" | ");

  // 1. The name promises something the recipe never uses.
  for (const p of NAME_PROMISES) {
    if (!p.word.test(d.name)) continue;
    if (p.unless && p.unless.test(d.name)) continue;
    if (p.needs.some((re) => re.test(hay))) continue;
    add(d, "name-promise", "the name says " + p.label + " but nothing in the recipe is " + p.label);
  }

  // 2. Fried or sauteed with no fat to cook in. Read the SHOPPING list only:
  //    a step saying "iprito" is not oil you bought.
  const dryHeat = /air fry|inihaw|ihaw|grill|insarabasab|tinuom|binalot/i.test(d.name + " " + (d.steps || []).join(" "));
  if ((d.method === "prito" || d.method === "ginisa") && !dryHeat &&
      !/mantika|mantikilya|oil|butter/i.test(shopping)) {
    add(d, "no-fat", d.method + " dish with no oil or butter on the list");
  }

  // 3. A sabaw dish with nothing to make broth from.
  const steamed = /tinuom|binalot|dahon ng saging|pinaputok/i.test(d.name + " " + shopping);
  if (d.method === "sabaw" && !steamed &&
      !/tubig|water|sabaw|broth|cube|hugas bigas|buko|niyog|gata/i.test(shopping)) {
    add(d, "no-liquid", "sabaw dish with no water or broth on the list");
  }

  // 4. Nothing to season with at all.
  if (!/asin|salt|toyo|patis|soy|bagoong|cube|magic sarap/i.test(shopping)) {
    add(d, "no-seasoning", "no salt, toyo, patis or broth cube anywhere");
  }

  // 5. Thin enough that it is probably underspecified rather than simple.
  const total = (d.ingredients || []).length + (d.pantryItems || []).length;
  if (total < 5) add(d, "thin", "only " + total + " items in total (ingredients + pantry)");

  // 6. Steps that reference a good the recipe never bought. Checked for a short
  //    list of expensive, unmissable goods only, to keep the noise down.
  for (const [re, label] of [
    [/\bgata\b/i, "gata"], [/\bkeso|cheese\b/i, "cheese"], [/\bmantikilya\b/i, "butter"],
    [/\bharina\b/i, "harina"], [/\bcornstarch\b/i, "cornstarch"], [/\bitlog\b/i, "itlog"],
  ]) {
    const inSteps = (d.steps || []).some(
      (s) => re.test(s) && !/ihain|kasama ng|isahog sa kanin|serve/i.test(s));
    if (inSteps && !re.test(shopping)) {
      add(d, "step-only", "the steps use " + label + " but it is not on the list");
    }
  }
}

// ── report ──────────────────────────────────────────────────
const byKind = new Map();
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind).push(f);
}

const TITLES = {
  "name-promise": "THE NAME PROMISES AN INGREDIENT THAT IS NOT THERE",
  "step-only": "THE STEPS USE SOMETHING THAT WAS NEVER BOUGHT",
  "no-fat": "FRIED OR SAUTEED WITH NO OIL ON THE LIST",
  "no-liquid": "SABAW WITH NO LIQUID ON THE LIST",
  "no-seasoning": "NOTHING TO SEASON WITH",
  thin: "PROBABLY UNDERSPECIFIED",
};

console.log("CHECKED " + drafts.length + " DRAFTS");
console.log("");
const order = ["name-promise", "step-only", "no-fat", "no-liquid", "no-seasoning", "thin"];
for (const kind of order) {
  const list = byKind.get(kind) || [];
  console.log((TITLES[kind] || kind) + "   " + list.length);
  for (const f of list) console.log("   " + f.dish.slice(0, 40).padEnd(42) + f.detail);
  console.log("");
}

const dishes = new Set(findings.map((f) => f.dish));
console.log("─".repeat(74));
console.log(dishes.size + " of " + drafts.length + " drafts have at least one finding.");
console.log((drafts.length - dishes.size) + " drafts pass every check.");

if (process.argv.includes("--json")) {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "draft-check.json");
  fs.writeFileSync(file, JSON.stringify({ findings }, null, 2), "utf8");
  console.log("wrote " + path.relative(process.cwd(), file));
}
