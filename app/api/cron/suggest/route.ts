export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";
import { isHidden } from "@/lib/commodity-names";
import {
  RECIPES,
  RECIPE_DA_KEYS,
  selectDailyMeals,
  orderForDisplay,
  type PriceMap,
  type CostResult,
  type DailyPick,
  type MealSlot,
} from "@/lib/recipes";
import { buildPriceMap, type DARecord } from "@/lib/da-parser";

// ═══════════════════════════════════════════════════════════
// PRICE MAP — matching DA commodity names to recipe daKeys
// ═══════════════════════════════════════════════════════════
// Replaces the V2.1.1 suffix stripper on Jul 28 2026.
//
// That version removed a fixed list of trailing suffixes (" Local", " Large",
// " Magnolia" ...) to reduce a DA name down to a recipe daKey. It broke as soon
// as a name did not end in exactly one of those, which is what happened when the
// CSV parser started leaving quote characters on: it tested endsWith(" Large")
// while the mangled name ended in `Large"`.
//
// Word matching is used instead. Measured over the full 17-month DA archive,
// where the department reorganised this document twice: word matching keeps
// 39/47 recipes costable through the Jun-Sep 2025 layout and 20/47 through the
// Mar-May 2025 one. The homepage needs 8. See lib/da-parser.ts.

/**
 * Rows come back from the Neon driver as Record<string, any>, so they are
 * narrowed here rather than asserted. Typing DB output as an exact interface
 * fails the build; typing it as Record<string, unknown> and coercing is the
 * pattern the rest of this project uses.
 */
type DbRow = Record<string, unknown>;

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Neon returns NUMERIC columns as STRINGS in JS, so parseFloat is mandatory.
 * Anything unparseable becomes null rather than NaN, because NaN would sail
 * through a `> 0` check as false but still poison any arithmetic it touched.
 */
function toPrice(value: unknown): number | null {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function toDARecords(prices: DbRow[]): DARecord[] {
  return prices.map((p) => ({
    name: asString(p.name),
    specification: asString(p.specification),
    category: asString(p.category, "other"),
    price: toPrice(p.price_prevailing),
  }));
}

function buildNormalizedPriceMap(prices: DbRow[]): PriceMap {
  return buildPriceMap(RECIPE_DA_KEYS, toDARecords(prices));
}

// ═══════════════════════════════════════════════════════════
// POST /api/cron/suggest
// Recipe DB + Cost Engine + DeepSeek "Bakit?" only
// Supports both manual (x-cron-secret) and Vercel Cron (Bearer)
// ═══════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth: support both manual and Vercel Cron ────────
    const cronSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // ── Duplicate check ──────────────────────────────────
    const existing = await sql`
      SELECT id FROM daily_suggestions
      WHERE suggestion_date = ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({
        message: "Suggestions already exist for today",
      });
    }

    // ── Fetch today's prices ─────────────────────────────
    const prices = await sql`
      SELECT
        p.price_prevailing,
        c.name,
        c.category,
        c.specification
      FROM prices p
      JOIN commodities c ON p.commodity_id = c.id
      WHERE p.price_date = ${today}
        AND p.price_prevailing IS NOT NULL
    `;

    if (prices.length === 0) {
      return NextResponse.json({ error: "No price data available for today" }, { status: 400 });
    }

    // ── Fetch last available date's prices ────────────────
    const lastPrices = await sql`
      SELECT
        c.name,
        p.price_prevailing
      FROM prices p
      JOIN commodities c ON p.commodity_id = c.id
      WHERE p.price_date = (
        SELECT DISTINCT price_date FROM prices
        WHERE price_date < ${today}
        ORDER BY price_date DESC
        LIMIT 1
      )
      AND p.price_prevailing IS NOT NULL
    `;

    // ── Recent history for rotation ──────────────────────
    // V2.4: was "yesterday's 8 ids". Remembering ONE day is what created the
    // two-day loop, because day N could not repeat day N-1 but was free to
    // repeat day N-2. Production served 2 distinct menus across 16-22 Jul 2026.
    // Now we read back several days and pass how long each dish has waited.
    const HISTORY_DAYS = 8;
    const recentRows = await sql`
      SELECT DISTINCT ON (suggestion_date)
        suggestion_date,
        meals
      FROM daily_suggestions
      WHERE suggestion_date < ${today}
      ORDER BY suggestion_date DESC, generated_at DESC NULLS LAST, id DESC
      LIMIT ${HISTORY_DAYS}
    `;

    const nameToId: Record<string, string> = {};
    for (const recipe of RECIPES) nameToId[recipe.name] = recipe.id;

    const daysSinceShown: Record<string, number> = {};
    const todayMs = new Date(`${today}T00:00:00Z`).getTime();

    for (const row of recentRows as DbRow[]) {
      let mealsValue: unknown = row.meals;
      if (typeof mealsValue === "string") {
        try {
          mealsValue = JSON.parse(mealsValue);
        } catch {
          continue; // rotation is best-effort; a bad row must not break the day
        }
      }
      if (!Array.isArray(mealsValue)) continue;

      const rowDate = new Date(`${String(row.suggestion_date).slice(0, 10)}T00:00:00Z`).getTime();
      const daysAgo = Math.max(1, Math.round((todayMs - rowDate) / 86400000));

      for (const meal of mealsValue as Array<Record<string, unknown>>) {
        const id = nameToId[asString(meal?.name)];
        if (!id) continue;
        // keep the most RECENT sighting
        if (daysSinceShown[id] === undefined || daysAgo < daysSinceShown[id]) {
          daysSinceShown[id] = daysAgo;
        }
      }
    }

    // ── Build NORMALIZED price maps ──────────────────────
    // Word matching against the recipe daKeys; see lib/da-parser.ts
    const todayPriceMap: PriceMap = buildNormalizedPriceMap(prices);
    const lastPriceMap: PriceMap = buildNormalizedPriceMap(lastPrices);

    // ── Run the V2.4 selector ────────────────────────────
    // 5 price-driven "mura" slots + 3 "iba naman ngayon" rotation slots,
    // prito/inihaw capped at 2. See lib/recipes.ts for why.
    const picks: DailyPick[] = selectDailyMeals(
      RECIPES,
      todayPriceMap,
      lastPriceMap,
      daysSinceShown,
    );
    let cheapestMeals: CostResult[] = picks.map((p) => p.result);
    const slotById: Record<string, MealSlot> = {};
    for (const p of picks) slotById[p.result.recipe.id] = p.slot;

    // No "retry without rotation" fallback is needed any more. selectDailyMeals
    // relaxes its own constraints in order (rested -> whole cheap pool -> ignore
    // protein caps -> ignore the prito cap) and always fills the page when the
    // price data can cost that many recipes at all. The old retry existed only
    // because excludeIds could starve the pool outright.

    // ── THE GUARD ────────────────────────────────────────
    // Never write an empty meals list. On Jul 27 2026 this route did exactly
    // that: the price data was too thin to cost a single recipe, it wrote
    // `meals: []`, and the homepage rendered zero meal cards for anyone who
    // visited. Failing here instead leaves the previous day's row as the newest,
    // and /api/suggestions already falls back to it with isToday:false, so
    // visitors keep seeing real ulam while the underlying problem is fixed.
    if (cheapestMeals.length === 0) {
      const pricedKeys = Object.keys(todayPriceMap).length;
      const detail =
        `Cost engine could not price a single recipe from ${prices.length} price rows ` +
        `(${pricedKeys}/${RECIPE_DA_KEYS.length} recipe ingredients had a price). ` +
        `Nothing was written; the previous suggestion row stays live.`;
      console.error("SUGGEST REFUSED: " + detail);
      return NextResponse.json(
        {
          error: "No meals could be costed, refused to write an empty day",
          details: detail,
          priceRows: prices.length,
          ingredientsPriced: pricedKeys,
          ingredientsNeeded: RECIPE_DA_KEYS.length,
        },
        { status: 500 },
      );
    }

    // ── Build summary for DeepSeek "Bakit?" prompt ───────
    const mealSummaries = cheapestMeals
      .map((result, i) => {
        const ingDetails = result.ingredientCosts
          .filter((ing) => !ing.optional)
          .map((ing) => `${ing.name} ~₱${ing.cost} [${ing.trend}]`)
          .join(", ");

        return `${i + 1}. ${result.recipe.name} (₱${result.totalCost}) — ${ingDetails}`;
      })
      .join("\n");

    const prompt = `Ikaw ay isang Filipino nanay na nagtitipid sa palengke. Para sa bawat ulam na nasa ibaba, sumulat ng 1-2 pangungusap na nagpapaliwanag kung BAKIT ito ang pinili ngayong araw. I-reference ang specific na presyo o trend ng sangkap kung natural. Gamitin ang natural na Tagalog — parang kinukuwento mo sa kapitbahay.

Mga ulam ngayon:
${mealSummaries}

RULES:
- Isang "reason" lang per ulam, 1-2 sentences max
- Huwag sabihin na libre ang sangkap
- Huwag sabihing ₱0 ang kahit anong required ingredient
- Natural Tagalog, hindi formal
- Return VALID JSON only

Return format:
{ "reasons": [{ "id": "recipe-id-here", "reason": "..." }, ...] }

Recipe IDs: ${cheapestMeals.map((r) => r.recipe.id).join(", ")}`;

    const systemPrompt =
      "Ikaw ay isang Filipino nanay na mahilig magtipid sa palengke. Laging sumagot ng valid JSON.";

    // ── Call DeepSeek for "Bakit?" reasons only ──────────
    let reasonMap: Record<string, string> = {};
    const fallbackReason = "Abot-kayang ulam para sa pamilya ngayon.";

    try {
      // Prose only, and a small prompt, so the reasoning budget stays modest.
      // Capped well under the extraction budget because this route also has to
      // finish inside Vercel Hobby's 60s limit. If it throws, the catch below
      // falls back to a generic reason and the meals still ship.
      const responseText = await callDeepSeekAPI(prompt, systemPrompt, {
        maxTokens: 8000,
        timeoutMs: 35_000,
        temperature: 0.7,
      });

      const cleanedText = responseText
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();

      const parsed = JSON.parse(cleanedText);

      if (parsed.reasons && Array.isArray(parsed.reasons)) {
        parsed.reasons.forEach((r: any) => {
          if (r.id && r.reason) {
            reasonMap[r.id] = r.reason;
          }
        });
      }
    } catch (aiError) {
      console.error("DeepSeek reason generation failed:", aiError);
    }

    // ── Build final meals array for frontend ─────────────
    // Page order is a date-seeded shuffle, NOT cheapest-first. Sorting by price
    // meant the single cheapest dish permanently owned the top of the page;
    // Chan saw Ginataang Kalabasa every time he opened the site. The order is
    // stable all day for every visitor and different tomorrow.
    const meals = orderForDisplay(cheapestMeals, today).map((result) => ({
      name: result.recipe.name,
      estimated_cost: result.totalCost,
      servings: "1-3 katao",
      // "mura" = picked on price, "iba" = picked because it has waited longest.
      // The card labels the second kind "Iba naman ngayon" so a pricier rotation
      // pick is never passed off as a value pick.
      slot: slotById[result.recipe.id] || "mura",
      ingredients: result.ingredientCosts.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        cost: ing.cost,
        trend: ing.trend,
        optional: ing.optional,
      })),
      reason: reasonMap[result.recipe.id] || fallbackReason,
    }));

    // ── Build cheapest ingredients for DB column ─────────
    const filteredPrices = prices.filter((p: any) => !isHidden(p.name));
    const categorizedPrices: Record<string, any[]> = {};
    filteredPrices.forEach((p: any) => {
      const cat = p.category || "other";
      if (!categorizedPrices[cat]) categorizedPrices[cat] = [];
      categorizedPrices[cat].push(p);
    });

    const cheapestIngredients: any[] = [];
    Object.entries(categorizedPrices).forEach(([category, items]) => {
      const sorted = [...items].sort(
        (a, b) => (parseFloat(a.price_prevailing) || 0) - (parseFloat(b.price_prevailing) || 0),
      );
      sorted.slice(0, 3).forEach((item) => {
        cheapestIngredients.push({
          name: item.name,
          category: item.category || category,
          price: parseFloat(item.price_prevailing) || 0,
        });
      });
    });

    // ── Save to database ─────────────────────────────────
    await sql`
      INSERT INTO daily_suggestions (suggestion_date, meals, cheapest_ingredients)
      VALUES (
        ${today},
        ${JSON.stringify(meals)},
        ${JSON.stringify(cheapestIngredients.slice(0, 15))}
      )
    `;

    return NextResponse.json({
      success: true,
      mealsCount: meals.length,
      // Telemetry for the cron response, so a bad rotation is visible without
      // opening the database.
      historyDaysRead: recentRows.length,
      recipesOnCooldown: Object.keys(daysSinceShown).length,
      muraSlots: meals.filter((m) => m.slot === "mura").length,
      ibaSlots: meals.filter((m) => m.slot === "iba").length,
      meals: meals.map((m) => ({
        name: m.name,
        cost: m.estimated_cost,
        slot: m.slot,
      })),
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: String(error) },
      { status: 500 },
    );
  }
}
