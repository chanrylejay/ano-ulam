export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDisplayName, isHidden } from "@/lib/commodity-names";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Try to get today's suggestions
    const todaySuggestions = await sql`
      SELECT * FROM daily_suggestions
      WHERE suggestion_date = ${today}
      LIMIT 1
    `;

    if (todaySuggestions.length > 0) {
      const row = todaySuggestions[0];
      const meals = typeof row.meals === "string" ? JSON.parse(row.meals) : row.meals;
      const cheapest =
        typeof row.cheapest_ingredients === "string"
          ? JSON.parse(row.cheapest_ingredients)
          : row.cheapest_ingredients;

      return NextResponse.json({
        suggestion: {
          ...row,
          meals,
          cheapest_ingredients: cheapest
            .filter((item: any) => !isHidden(item.name))
            .map((item: any) => ({
              ...item,
              name: getDisplayName(item.name),
            })),
        },
        isToday: true,
      });
    }

    // If no suggestions for today, get the most recent
    const latestSuggestions = await sql`
      SELECT * FROM daily_suggestions
      ORDER BY suggestion_date DESC
      LIMIT 1
    `;

    if (latestSuggestions.length > 0) {
      const row = latestSuggestions[0];
      const meals = typeof row.meals === "string" ? JSON.parse(row.meals) : row.meals;
      const cheapest =
        typeof row.cheapest_ingredients === "string"
          ? JSON.parse(row.cheapest_ingredients)
          : row.cheapest_ingredients;

      return NextResponse.json({
        suggestion: {
          ...row,
          meals,
          cheapest_ingredients: cheapest
            .filter((item: any) => !isHidden(item.name))
            .map((item: any) => ({
              ...item,
              name: getDisplayName(item.name),
            })),
        },
        isToday: false,
      });
    }

    return NextResponse.json({
      suggestion: null,
      isToday: false,
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
  }
}
