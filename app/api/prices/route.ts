export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDisplayName, isHidden } from "@/lib/commodity-names";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const sort = searchParams.get("sort") || "asc";

    // Always get the latest available date
    const latestDate = await sql`
      SELECT DISTINCT price_date FROM prices
      ORDER BY price_date DESC
      LIMIT 1
    `;

    if (latestDate.length === 0) {
      return NextResponse.json({ prices: [], date: null });
    }

    const priceDate = latestDate[0].price_date;

    // Get ALL prices for that date
    const allPrices = await sql`
      SELECT
        p.id,
        p.price_date,
        p.price_prevailing,
        p.commodity_id,
        c.name,
        c.category,
        c.specification
      FROM prices p
      JOIN commodities c ON p.commodity_id = c.id
      WHERE p.price_date = ${priceDate}
        AND p.price_prevailing IS NOT NULL
      ORDER BY p.price_prevailing ASC
    `;

    // Filter hidden items, apply name mapping, convert types
    let filtered = allPrices
      .filter((p: any) => !isHidden(p.name))
      .map((p: any) => ({
        id: p.id,
        price_date: p.price_date,
        price_prevailing: parseFloat(p.price_prevailing),
        commodity_id: p.commodity_id,
        commodities: {
          name: getDisplayName(p.name),
          original_name: p.name,
          category: p.category,
          specification: p.specification,
        },
      }));

    if (category && category !== "all") {
      filtered = filtered.filter((p: any) => p.commodities.category === category);
    }

    if (sort === "desc") {
      filtered.sort((a: any, b: any) => b.price_prevailing - a.price_prevailing);
    }

    return NextResponse.json({
      prices: filtered,
      date: priceDate,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
