// ═══════════════════════════════════════════════════════════
// Ano Ulam? — external health watchdog
// ═══════════════════════════════════════════════════════════
// Runs on GitHub Actions, NOT on Vercel. That separation is the whole point:
// between Jul 23 and Jul 28 2026 the site served zero meals for five days and
// nothing raised a hand, because the only thing that could have noticed was the
// broken app itself. A checker that lives inside the thing it checks is not a
// checker.
//
// Looks at the live site exactly as a visitor would, and exits non-zero with a
// written report when something is wrong. The workflow turns that into a GitHub
// issue, which GitHub emails to the repo owner.

import fs from "fs";

const SITE = process.env.SITE_URL || "https://ma-anoulam.vercel.app";

/**
 * Thresholds, with the reasoning, so a future change is a decision not a guess.
 * Measured over the DA archive: a healthy day parses 140-165 commodity rows,
 * and the display filters in lib/commodity-names.ts cut that to roughly 55-60
 * shown. The homepage always asks the engine for 8 meals.
 */
const MIN_MEALS = 1; // below this the homepage is visibly empty
const EXPECTED_MEALS = 8;
const MIN_PRICES = 25; // generous floor; a healthy day shows 55-60
const MAX_DATA_AGE_DAYS = 3; // DA publishes late, so 1-2 days behind is normal

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(isoDate, todayStr) {
  const a = new Date(`${String(isoDate).slice(0, 10)}T00:00:00Z`).getTime();
  const b = new Date(`${todayStr}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86400000);
}

async function getJson(path) {
  const res = await fetch(SITE + path, { headers: { "cache-control": "no-cache" } });
  if (!res.ok) throw new Error(`${path} returned HTTP ${res.status}`);
  return res.json();
}

const problems = [];
const facts = [];

// ── 1. the homepage loads at all ──────────────────────────────────────
try {
  const res = await fetch(SITE + "/", { headers: { "cache-control": "no-cache" } });
  if (!res.ok) problems.push(`Homepage returned HTTP ${res.status}.`);
  else facts.push(`Homepage: HTTP ${res.status}`);
} catch (e) {
  problems.push(`Homepage is unreachable: ${e.message}`);
}

// ── 2. are there meals on it ──────────────────────────────────────────
const today = manilaToday();
try {
  const data = await getJson("/api/suggestions");
  const suggestion = data?.suggestion;

  if (!suggestion) {
    problems.push("The suggestions API returned no suggestion row at all.");
  } else {
    const meals = Array.isArray(suggestion.meals) ? suggestion.meals : [];
    const date = String(suggestion.suggestion_date || "").slice(0, 10);
    const age = daysBetween(date, today);

    facts.push(`Suggestion row: dated ${date}, ${meals.length} meals, isToday=${data.isToday}`);

    if (meals.length < MIN_MEALS) {
      problems.push(
        `**The homepage has no ulam on it.** The newest suggestion row (dated ${date}) ` +
          `contains ${meals.length} meals. Visitors see an empty page.`,
      );
    } else if (meals.length < EXPECTED_MEALS) {
      problems.push(
        `Only ${meals.length} of the usual ${EXPECTED_MEALS} meals are showing (row dated ${date}).`,
      );
    }

    if (age !== null && age > MAX_DATA_AGE_DAYS) {
      problems.push(
        `The meal data is **${age} days old** (dated ${date}, today is ${today}). ` +
          `The daily pipeline has probably not run successfully since then.`,
      );
    }
  }
} catch (e) {
  problems.push(`The suggestions API failed: ${e.message}`);
}

// ── 3. are there prices ───────────────────────────────────────────────
try {
  const data = await getJson("/api/prices");
  const prices = Array.isArray(data?.prices) ? data.prices : [];
  const date = String(data?.date || "").slice(0, 10);
  const age = daysBetween(date, today);

  facts.push(`Prices: ${prices.length} shown, dated ${date}`);

  if (prices.length < MIN_PRICES) {
    problems.push(
      `Only ${prices.length} commodity prices are on the site (expected 55-60). ` +
        `The DA sheet was probably read incorrectly.`,
    );
  }
  if (age !== null && age > MAX_DATA_AGE_DAYS) {
    problems.push(`Price data is **${age} days old** (dated ${date}).`);
  }
} catch (e) {
  problems.push(`The prices API failed: ${e.message}`);
}

// ── report ────────────────────────────────────────────────────────────
const healthy = problems.length === 0;
const stamp = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Manila",
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date());

const body = [
  healthy ? "Ano Ulam looks healthy." : "**Ano Ulam needs attention.**",
  "",
  `Checked ${stamp} Manila time, from GitHub Actions, against ${SITE}`,
  "",
  ...(healthy ? [] : ["### What is wrong", ...problems.map((p) => `- ${p}`), ""]),
  "### What the check saw",
  ...facts.map((f) => `- ${f}`),
  "",
  ...(healthy
    ? []
    : [
        "### Where to look",
        "1. Vercel dashboard, Cron tab, for the last `/api/cron/daily` run and its response.",
        "2. If ingest refused, the response says how many rows it parsed and why it stopped.",
        "3. `lib/da-parser.ts` holds the DA sheet reader. A sudden drop to near zero rows",
        "   usually means the department reorganised the PDF again.",
      ]),
]
  .join("\n")
  .trim();

console.log(body);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `healthy=${healthy}\n`);
}
fs.writeFileSync("watchdog-report.md", body + "\n", "utf8");

process.exit(healthy ? 0 : 1);
