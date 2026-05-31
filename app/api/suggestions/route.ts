export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDisplayName, isHidden } from "@/lib/commodity-names";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

function parseJsonField(value: any) {
  if (!value) return [];
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return value;
}

function normalizeSuggestionRow(row: any) {
  const meals = parseJsonField(row.meals);
  const cheapest = parseJsonField(row.cheapest_ingredients);

  return {
    ...row,
    meals,
    cheapest_ingredients: (cheapest || [])
      .filter((item: any) => item?.name && !isHidden(item.name))
      .map((item: any) => ({
        ...item,
        name: getDisplayName(item.name),
      })),
  };
}

function getManilaDateString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function GET() {
  try {
    const manilaToday = getManilaDateString();
    const utcToday = new Date().toISOString().split("T")[0];

    // First priority: newest row for Manila today OR UTC today.
    // This protects against Vercel UTC date behavior while the cron still uses UTC.
    const todaysSuggestions = await sql`
      SELECT * FROM daily_suggestions
      WHERE suggestion_date::date IN (${manilaToday}::date, ${utcToday}::date)
      ORDER BY generated_at DESC NULLS LAST, id DESC
      LIMIT 1
    `;

    if (todaysSuggestions.length > 0) {
      return NextResponse.json(
        {
          suggestion: normalizeSuggestionRow(todaysSuggestions[0]),
          isToday: true,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    // Fallback: newest row overall.
    const latestSuggestions = await sql`
      SELECT * FROM daily_suggestions
      ORDER BY generated_at DESC NULLS LAST, suggestion_date DESC, id DESC
      LIMIT 1
    `;

    if (latestSuggestions.length > 0) {
      return NextResponse.json(
        {
          suggestion: normalizeSuggestionRow(latestSuggestions[0]),
          isToday: false,
        },
        { headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(
      {
        suggestion: null,
        isToday: false,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions", details: String(error) },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
