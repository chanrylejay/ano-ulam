export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";

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

    // Group by category and find cheapest
    const categorizedPrices: Record<string, typeof prices> = {};
    prices.forEach((p) => {
      const cat = p.category || "other";
      if (!categorizedPrices[cat]) categorizedPrices[cat] = [];
      categorizedPrices[cat].push(p);
    });

    // Get top 3 cheapest per category
    const cheapestIngredients: Array<{
      name: string;
      category: string;
      price: number;
      specification?: string;
    }> = [];
    Object.entries(categorizedPrices).forEach(([category, items]) => {
      const sorted = [...items].sort(
        (a, b) => (a.price_prevailing || 0) - (b.price_prevailing || 0),
      );
      sorted.slice(0, 3).forEach((item) => {
        cheapestIngredients.push({
          name: item.name || "Unknown",
          category: item.category || category,
          price: item.price_prevailing || 0,
          specification: item.specification || undefined,
        });
      });
    });

    // Prepare price list for DeepSeek
    const priceList = prices
      .map((p) => `${p.name} (${p.category}): ₱${p.price_prevailing}/kg`)
      .join("\n");

    const prompt = `Based on these current market prices in the Philippines, suggest 5 budget-friendly Filipino meals. For each meal, provide:
- name (Filipino dish name in Tagalog)
- description (1 sentence in English describing the dish)
- estimated_cost (total cost for 4 servings in pesos, just the number)
- ingredients (array with name, amount, and current_price for each ingredient)
- steps (3-5 simple cooking steps in English)

Current prices:
${priceList}

Requirements:
1. Focus on common Filipino dishes that families actually cook
2. Use the cheapest available ingredients from the list
3. Assume basic pantry staples (salt, pepper, soy sauce, vinegar, garlic, onion, cooking oil) are already available
4. Keep recipes simple and practical for home cooking
5. Make sure the meal name is in Tagalog/Filipino

Return as a JSON object with a "meals" array.`;

    const systemPrompt = `You are a Filipino home cooking expert specializing in budget-friendly meal planning. You have deep knowledge of traditional Filipino dishes and know how to make delicious meals using affordable ingredients available in Philippine public markets.`;

    const responseText = await callDeepSeekAPI(prompt, systemPrompt);
    const parsed = JSON.parse(responseText);

    // Save to database
    await sql`
      INSERT INTO daily_suggestions (suggestion_date, meals, cheapest_ingredients)
      VALUES (${today}, ${JSON.stringify(parsed.meals || [])}, ${JSON.stringify(cheapestIngredients.slice(0, 15))})
    `;

    return NextResponse.json({
      success: true,
      mealsCount: parsed.meals?.length || 0,
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
