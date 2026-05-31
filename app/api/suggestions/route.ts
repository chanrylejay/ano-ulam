export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDisplayName, isHidden } from "@/lib/commodity-names";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // ⬇️ NEW: Cache-busting headers
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
    };

    // Try to get today's suggestions
    const todaySuggestions = await sql`
      SELECT * FROM daily_suggestions
      WHERE suggestion_date = ${today}
      ORDER BY id DESC
      LIMIT 1
    `;
    // ⬆️ CHANGED: Added "ORDER BY id DESC" to get the LATEST row

    if (todaySuggestions.length > 0) {
      const row = todaySuggestions[0];
      const meals = typeof row.meals === "string" ? JSON.parse(row.meals) : row.meals;
      const cheapest =
        typeof row.cheapest_ingredients === "string"
          ? JSON.parse(row.cheapest_ingredients)
          : row.cheapest_ingredients;

      return NextResponse.json(
        {
          suggestion: {
            ...row,
            meals,
            cheapest_ingredients: (cheapest || [])
              .filter((item: any) => !isHidden(item.name))
              .map((item: any) => ({
                ...item,
                name: getDisplayName(item.name),
              })),
          },
          isToday: true,
        },
        { headers },
      );
      // ⬆️ CHANGED: Added ", { headers }" and "(cheapest || [])"
    }

    // If no suggestions for today, get the most recent
    const latestSuggestions = await sql`
      SELECT * FROM daily_suggestions
      ORDER BY id DESC
      LIMIT 1
    `;
    // ⬆️ CHANGED: "ORDER BY id DESC" instead of "ORDER BY suggestion_date DESC"

    if (latestSuggestions.length > 0) {
      const row = latestSuggestions[0];
      const meals = typeof row.meals === "string" ? JSON.parse(row.meals) : row.meals;
      const cheapest =
        typeof row.cheapest_ingredients === "string"
          ? JSON.parse(row.cheapest_ingredients)
          : row.cheapest_ingredients;

      return NextResponse.json(
        {
          suggestion: {
            ...row,
            meals,
            cheapest_ingredients: (cheapest || [])
              .filter((item: any) => !isHidden(item.name))
              .map((item: any) => ({
                ...item,
                name: getDisplayName(item.name),
              })),
          },
          isToday: false,
        },
        { headers },
      );
      // ⬆️ CHANGED: Added ", { headers }" and "(cheapest || [])"
    }

    return NextResponse.json(
      {
        suggestion: null,
        isToday: false,
      },
      { headers },
    );
    // ⬆️ CHANGED: Added ", { headers }"
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
