export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getDisplayName, isHidden } from "@/lib/commodity-names";
import { competeOnPrice } from "@/lib/price-competition";

// Match /api/suggestions. force-dynamic alone did NOT stop this route serving a
// stale day on 28 Jul 2026; the edge reported a cache MISS while the response
// was still a day behind the database.
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

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
      return NextResponse.json({ prices: [], date: null }, { headers: NO_STORE_HEADERS });
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

    /*
      COSTING and DISPLAY are different questions, and answering them with the
      same list split the prices on 29 Jul 2026.

      The hide list exists so /prices stays readable: brand duplicates, luxury
      cuts, feed-grade corn. But the daily cron reads the DA PDF itself and sees
      every row, so once the hide list removed the cheapest chicken variant, the
      homepage and /ulam began pricing the same dish differently — Chicken
      Breast at ₱222.46 against ₱227.50, and three dishes disagreed. A rule
      about what is worth showing must never change what something costs.

      `?all=1` therefore returns the unfiltered sheet. Anything that BUILDS A
      PRICE MAP asks for it; only the human-facing /prices list gets the tidy
      version.
    */
    const showAll = searchParams.get("all") === "1";

    const shaped = allPrices.map((p: any) => ({
      id: p.id,
      price_date: p.price_date,
      price_prevailing: parseFloat(p.price_prevailing),
      commodity_id: p.commodity_id,
      name: p.name,
      price: parseFloat(p.price_prevailing),
      category: p.category,
      specification: p.specification,
    }));

    /*
      ONE PRODUCT, ONE ROW, CHEAPEST WINS.

      Chan, 29 Jul 2026: "i want the system to display only the most cheaper,
      system should compare which is cheaper local or imported? then display the
      cheaper so no duplicates".

      So the display list is the winners of lib/price-competition.ts: origin,
      brand and pack size are collapsed away and whichever row is cheapest today
      is the one shown, under a plain name with no "Local" or "Imported" on it.

      The COSTING list (?all=1) deliberately skips all of this and returns every
      row. The cost engine does its own cheapest-match, and handing it a
      pre-filtered list is exactly what split the prices on 29 Jul 2026.
    */
    let filtered: any[];
    if (showAll) {
      filtered = shaped.map((p: any) => ({
        id: p.id,
        price_date: p.price_date,
        price_prevailing: p.price_prevailing,
        commodity_id: p.commodity_id,
        commodities: {
          name: getDisplayName(p.name),
          original_name: p.name,
          category: p.category,
          specification: p.specification,
        },
      }));
    } else {
      filtered = competeOnPrice(shaped)
        // Hiding is decided on the WINNER, after the contest. Deciding before it
        // would let a hide rule knock out the cheap row and hand the page to a
        // dearer one, which is the bug this whole change exists to remove.
        .filter((product) => !isHidden(product.winner.name))
        .map((product) => {
          const w: any = product.winner;
          return {
            id: w.id,
            price_date: w.price_date,
            price_prevailing: w.price_prevailing,
            commodity_id: w.commodity_id,
            commodities: {
              name: product.label,
              original_name: w.name,
              category: w.category,
              specification: w.specification,
            },
            /** How many rows this beat. Lets the UI say "3 variants compared". */
            beat: product.variants.length - 1,
          };
        })
        .sort((a: any, b: any) => a.price_prevailing - b.price_prevailing);
    }

    if (category && category !== "all") {
      filtered = filtered.filter((p: any) => p.commodities.category === category);
    }

    if (sort === "desc") {
      filtered.sort((a: any, b: any) => b.price_prevailing - a.price_prevailing);
    }

    return NextResponse.json(
      {
        prices: filtered,
        date: priceDate,
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
