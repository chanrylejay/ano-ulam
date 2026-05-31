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
    let prices;

    if (category && category !== "all") {
      prices = await sql`
        SELECT
          p.id,
          p.price_date,
          p.price_prevailing,
          c.id as commodity_id,
          c.name,
          c.category,
          c.specification
        FROM prices p
        JOIN commodities c ON p.commodity_id = c.id
        WHERE p.price_date = ${today}
          AND c.category = ${category}
      `;
    } else {
      prices = await sql`
        SELECT
          p.id,
          p.price_date,
          p.price_prevailing,
          c.id as commodity_id,
          c.name,
          c.category,
          c.specification
        FROM prices p
        JOIN commodities c ON p.commodity_id = c.id
        WHERE p.price_date = ${today}
      `;
    }

    // If no prices for today, get the most recent available date
    if (prices.length === 0) {
      const latestDates = await sql`
        SELECT DISTINCT price_date FROM prices
        ORDER BY price_date DESC
        LIMIT 1
      `;

      if (latestDates.length > 0) {
        const latestDate = latestDates[0].price_date;

        if (category && category !== "all") {
          prices = await sql`
            SELECT
              p.id,
              p.price_date,
              p.price_prevailing,
              c.id as commodity_id,
              c.name,
              c.category,
              c.specification
            FROM prices p
            JOIN commodities c ON p.commodity_id = c.id
            WHERE p.price_date = ${latestDate}
              AND c.category = ${category}
          `;
        } else {
          prices = await sql`
            SELECT
              p.id,
              p.price_date,
              p.price_prevailing,
              c.id as commodity_id,
              c.name,
              c.category,
              c.specification
            FROM prices p
            JOIN commodities c ON p.commodity_id = c.id
            WHERE p.price_date = ${latestDate}
          `;
        }
      }
    }

    // Filter out null prices, convert to numbers, and sort
    let filteredPrices = (prices || [])
      .filter((p: any) => p.price_prevailing !== null)
      .map((p: any) => ({
        ...p,
        price_prevailing: parseFloat(p.price_prevailing),
      }));

    if (sort === "desc") {
      filteredPrices.sort(
        (a: any, b: any) => (b.price_prevailing || 0) - (a.price_prevailing || 0),
      );
    } else {
      filteredPrices.sort(
        (a: any, b: any) => (a.price_prevailing || 0) - (b.price_prevailing || 0),
      );
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
