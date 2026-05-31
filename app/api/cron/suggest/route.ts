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
- name: Filipino dish name in Tagalog (e.g., "Tinolang Manok", "Adobong Baboy", "Sinigang na Bangus")
- estimated_cost: total cost for ONE meal (for 2-4 servings). Calculate based on ACTUAL household quantity needed, NOT 1kg each:
  * Meat/Fish: 1/2 kg to 1 kg
  * Vegetables: 1/4 kg, 1/2 kg, "1 tali", or "2-3 pcs"
  * Garlic/Onion/Ginger: "1-2 pcs", "2-3 cloves", or "1 small piece"
  * Do NOT show "1/8 kg" to users — convert to "2-3 pcs" or "1 ulo"
  * Rice: 1 kg if included
  * Pantry staples like toyo, suka, patis, paminta, and cooking oil are assumed available unless the dish depends on them
  * IMPORTANT: If Bawang is ₱383/kg but you only need 2-3 cloves (~₱48), use ₱48 in the cost calculation
  * Total cost must reflect what a family actually spends sa palengke for ONE meal, not 1 kg x price for every ingredient
- servings: "2-4 na tao"
- ingredients: array of objects, each with:
  - name: ingredient name in Filipino (use the names from the price list)
  - amount: realistic palengke amount as a human-readable string. Examples: "1 kg", "1/2 kg", "1/4 kg", "2-3 pcs", "1 ulo", "1 tali", "1-2 pcs", "2-3 cloves", "1 small piece". Do NOT use "1/8 kg".
  - trend: "down", "up", or "stable" (from the price data)
  - optional: true or false (vegetables and non-essential items are usually optional, set to true for optional ingredients)
- reason: 1-2 sentences in natural Tagalog explaining WHY this dish is suggested based on cheap/current ingredients. Reference specific price trends. Example: "Mura ang manok ngayon at sayote lang ang gulay na kailangan. Konti lang ang luya, bawang, at sibuyas kaya sulit ito."

Current prices (with trends):
${priceListWithTrends}

AUTHENTIC FILIPINO RECIPES — IMPORTANT RECIPE CORRECTNESS RULES:
- Tinolang Manok uses: chicken, luya, sayote OR papaya (not both), malunggay OR dahon ng sili. It does NOT use kamatis.
- Adobo uses: meat (pork/chicken), bawang, toyo, suka, paminta, dahon ng laurel. Basic. Do NOT add random vegetables (no carrots, no potatoes, no bell pepper).
- Sinigang uses: protein (meat/fish) + souring ingredient (sampalok mix or bayabas or kamias) + common vegetables (kangkong OR sitaw, labanos, okra, kamatis, sibuyas). Choose vegetables that make sense together.
- Nilaga uses: beef/pork, repolyo, pechay, patatas, sibuyas, luya or black pepper.
- Pinakbet uses: pork (liempo/pigue), kalabasa, talong, okra, sitaw, ampalaya, kamatis, bagoong (pantry).
- Paksiw uses: fish (bangus/galunggong), suka, luya, sibuyas, sili. Simple. No vegetables.
- Ginisang Munggo uses: munggo, bawang, sibuyas, optional leafy vegetable (malunggay or ampalaya leaves) or small amount of pork/chicken. Optional kamatis.
- Tortang Talong uses: talong and itlog. Simple. Optional giniling is a bonus.
- Use ONLY authentic Filipino recipe ingredients. Do NOT add ingredients that don't belong in the dish.
- DO NOT include pantry staples in the ingredients array (toyo, suka, patis, paminta, mantika, asin, asukal, dahon ng laurel, bagoong, sampalok mix) — these are always available in a Filipino kitchen.
- Keep it simple — 3-6 ingredients per dish max.

Requirements:
1. Focus on common Filipino dishes that families actually cook daily
2. Use the CHEAPEST available ingredients — prioritize items marked [down]
3. Every ingredient MUST include the "amount" field with a realistic palengke amount
4. The "reason" field must explain the suggestion in natural Tagalog based on current prices
5. Use Filipino ingredient names from the price list above
6. Mix different proteins across the 5 meals (don't repeat the same meat/fish)
7. IMPORTANT: Always use Filipino ingredient names. For chicken parts: "Paa ng manok" (leg quarter), "Dibdib ng manok" (breast), "Binti ng manok" (drumstick), "Hita ng manok" (thigh), "Pakpak ng manok" (wings). For pork: "Liempo" (belly), "Kasim" (shoulder), "Pigue" (hind leg). Never use English names like "Chicken legs" or "Pork belly" — always use the Filipino names from the price list.

Return as a valid JSON object with a "meals" array.`;

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
