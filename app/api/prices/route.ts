export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "asc";

    const today = new Date().toISOString().split("T")[0];

    // Try to get today's prices
    let prices = await sql`
      SELECT
        p.id,
        p.price_date,
        p.price_prevailing,
        p.created_at,
        c.id as commodity_id,
        c.name,
        c.category,
        c.specification
      FROM prices p
      JOIN commodities c ON p.commodity_id = c.id
      WHERE p.price_date = ${today}
      ${category && category !== "all" ? sql`AND c.category = ${category}` : sql``}
    `;

    // If no prices for today, get the most recent available date
    if (prices.length === 0) {
      const latestDates = await sql`
        SELECT price_date FROM prices
        ORDER BY price_date DESC
        LIMIT 1
      `;

      if (latestDates.length > 0) {
        const latestDate = latestDates[0].price_date;
        prices = await sql`
          SELECT
            p.id,
            p.price_date,
            p.price_prevailing,
            p.created_at,
            c.id as commodity_id,
            c.name,
            c.category,
            c.specification
          FROM prices p
          JOIN commodities c ON p.commodity_id = c.id
          WHERE p.price_date = ${latestDate}
          ${category && category !== "all" ? sql`AND c.category = ${category}` : sql``}
        `;
      }
    }

    // Filter out null prices and sort
    let filteredPrices = prices.filter((p) => p.price_prevailing !== null);

    if (sort === "desc") {
      filteredPrices.sort((a, b) => (b.price_prevailing || 0) - (a.price_prevailing || 0));
    } else {
      filteredPrices.sort((a, b) => (a.price_prevailing || 0) - (b.price_prevailing || 0));
    }

    return NextResponse.json({
      prices: filteredPrices,
      date: filteredPrices[0]?.price_date || today,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
