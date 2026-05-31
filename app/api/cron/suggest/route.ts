export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";
import { isHidden } from "@/lib/commodity-names";
import {
  RECIPES,
  findCheapestMeals,
  type PriceMap,
  type CostResult,
} from "@/lib/recipes";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    const existing = await sql`
      SELECT id FROM daily_suggestions
      WHERE suggestion_date = ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ message: "Suggestions already exist for today" });
    }

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

    const todayPriceMap: PriceMap = {};
    prices.forEach((p: any) => {
      todayPriceMap[p.name] = parseFloat(p.price_prevailing);
    });

    const lastPriceMap: PriceMap = {};
    lastPrices.forEach((p: any) => {
      lastPriceMap[p.name] = parseFloat(p.price_prevailing);
    });

    const cheapestMeals: CostResult[] = findCheapestMeals(
      RECIPES,
      todayPriceMap,
      lastPriceMap,
      8,
    );

    const mealSummaries = cheapestMeals
      .map((result, i) => {
        const ingDetails = result.ingredientCosts
          .filter((ing) => !ing.optional)
          .map((ing) => `${ing.name} ~₱${ing.cost} [${ing.trend}]`)
          .join(", ");

        return `${i + 1}. ${result.recipe.name} (₱${result.totalCost}) — ${ingDetails}`;
      })
      .join("
");

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

    let reasonMap: Record<string, string> = {};
    const fallbackReason = "Abot-kayang ulam para sa pamilya ngayon.";

    try {
      const responseText = await callDeepSeekAPI(prompt, systemPrompt);

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

    const meals = cheapestMeals.map((result) => ({
      name: result.recipe.name,
      estimated_cost: result.totalCost,
      servings: "1-3 katao",
      ingredients: result.ingredientCosts.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        cost: ing.cost,
        trend: ing.trend,
        optional: ing.optional,
      })),
      reason: reasonMap[result.recipe.id] || fallbackReason,
    }));

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
        (a, b) =>
          (parseFloat(a.price_prevailing) || 0) -
          (parseFloat(b.price_prevailing) || 0),
      );
      sorted.slice(0, 3).forEach((item) => {
        cheapestIngredients.push({
          name: item.name,
          category: item.category || category,
          price: parseFloat(item.price_prevailing) || 0,
        });
      });
    });

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
      meals: meals.map((m) => ({
        name: m.name,
        cost: m.estimated_cost,
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
