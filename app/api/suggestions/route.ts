export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

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
      return NextResponse.json({
        suggestion: todaySuggestions[0],
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
      return NextResponse.json({
        suggestion: latestSuggestions[0],
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
