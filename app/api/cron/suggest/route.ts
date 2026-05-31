export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";
import { getDisplayName, isHidden } from "@/lib/commodity-names";

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if suggestions already exist for today
    const existing = await sql`
      SELECT id FROM daily_suggestions
      WHERE suggestion_date = ${today}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ message: "Suggestions already exist for today" });
    }

    // Get today's prices with commodity details
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

    // Get last week's prices for comparison
    const lastWeekPrices = await sql`
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

    // Build price trend map
    const lastWeekMap: Record<string, number> = {};
    lastWeekPrices.forEach((p: any) => {
      lastWeekMap[p.name] = parseFloat(p.price_prevailing);
    });

    // Filter hidden items and build price list with trends
    const filteredPrices = prices.filter((p: any) => !isHidden(p.name));

    const priceListWithTrends = filteredPrices
      .map((p: any) => {
        const currentPrice = parseFloat(p.price_prevailing);
        const lastPrice = lastWeekMap[p.name];
        let trend = "stable";
        if (lastPrice) {
          if (currentPrice < lastPrice) trend = "down";
          else if (currentPrice > lastPrice) trend = "up";
        }
        const displayName = getDisplayName(p.name);
        return `${displayName} (${p.category}): ₱${currentPrice}/kg [${trend}]`;
      })
      .join("\n");

    // Group by category and find cheapest
    const categorizedPrices: Record<string, any[]> = {};
    filteredPrices.forEach((p: any) => {
      const cat = p.category || "other";
      if (!categorizedPrices[cat]) categorizedPrices[cat] = [];
      categorizedPrices[cat].push(p);
    });

    const cheapestIngredients: any[] = [];
    Object.entries(categorizedPrices).forEach(([category, items]) => {
      const sorted = [...items].sort(
        (a, b) => (a.price_prevailing || 0) - (b.price_prevailing || 0),
      );
      sorted.slice(0, 3).forEach((item) => {
        cheapestIngredients.push({
          name: item.name,
          category: item.category || category,
          price: item.price_prevailing || 0,
        });
      });
    });

    const prompt = `Based on these current market prices in the Philippines (with price trends vs last week), suggest 5 budget-friendly Filipino meals.

For each meal, provide:
- name: Filipino dish name in Tagalog
- estimated_cost: total cost for the dish in pesos (just the number, for 2-4 servings)
- servings: "2-4 na tao"
- ingredients: array of objects, each with:
  - name: ingredient name in Filipino (use the names from the price list)
  - trend: "down", "up", or "stable" (from the price data)
  - optional: true or false (vegetables and non-essential items are usually optional)
- reason: 1-2 sentences in Tagalog explaining WHY this dish is suggested today based on current prices. Example: "Mura ang manok ngayon, bumaba presyo ng Bawang at Sibuyas this week."

Current prices (with trends):
${priceListWithTrends}

Requirements:
1. Focus on common Filipino dishes that families actually cook daily
2. Use the CHEAPEST available ingredients — prioritize items marked [down]
3. Assume basic pantry staples (toyo, suka, patis, paminta, mantika) are already available — do NOT include them in ingredients
4. Keep it simple — 3-6 ingredients per dish max
5. The "reason" field must reference specific ingredient prices or trends
6. Use Filipino ingredient names from the list above
7. Mix different proteins across the 5 meals (don't repeat the same meat)

Return as a JSON object with a "meals" array.`;

    const systemPrompt = `You are a Filipino nanay who knows how to cook budget-friendly meals for the family. You shop at the palengke and always pick the cheapest, freshest ingredients. You speak Tagalog naturally. Always return valid JSON.`;

    const responseText = await callDeepSeekAPI(prompt, systemPrompt);

    const cleanedText = responseText
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (!parsed.meals || !Array.isArray(parsed.meals)) {
      throw new Error("Invalid response format from AI - no meals array");
    }

    // Save to database
    await sql`
      INSERT INTO daily_suggestions (suggestion_date, meals, cheapest_ingredients)
      VALUES (${today}, ${JSON.stringify(parsed.meals)}, ${JSON.stringify(cheapestIngredients.slice(0, 15))})
    `;

    return NextResponse.json({
      success: true,
      mealsCount: parsed.meals.length,
      ingredientsCount: cheapestIngredients.length,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate suggestions", details: String(error) },
      { status: 500 },
    );
  }
}
