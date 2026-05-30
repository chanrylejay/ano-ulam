import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function fetchPDFText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const pdfParse = await import("pdf-parse");
  const data = await pdfParse.default(buffer);
  return data.text;
}

async function findLatestPDFUrl(): Promise<string | null> {
  try {
    const response = await fetch("https://www.da.gov.ph/price-monitoring/");
    if (!response.ok) {
      throw new Error(`Failed to fetch DA page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const pdfLinks: string[] = [];
    $('a[href*="Daily-Price-Index"][href$=".pdf"]').each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        const fullUrl = href.startsWith("http") ? href : `https://www.da.gov.ph${href}`;
        pdfLinks.push(fullUrl);
      }
    });

    return pdfLinks.length > 0 ? pdfLinks[0] : null;
  } catch (error) {
    console.error("Error finding PDF URL:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = request.headers.get("x-cron-secret");
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if we already have data for today
    const existingPrices = await sql`
      SELECT id FROM prices WHERE price_date = ${today} LIMIT 1
    `;

    if (existingPrices.length > 0) {
      return NextResponse.json({ message: "Prices already ingested for today" });
    }

    // Find latest PDF URL
    const pdfUrl = await findLatestPDFUrl();
    if (!pdfUrl) {
      return NextResponse.json({ error: "Could not find Daily Price Index PDF" }, { status: 404 });
    }

    // Fetch and extract PDF text
    let pdfText: string;
    try {
      pdfText = await fetchPDFText(pdfUrl);
    } catch (pdfError) {
      console.error("PDF extraction error:", pdfError);
      return NextResponse.json(
        { error: "Failed to extract PDF content", details: String(pdfError) },
        { status: 500 },
      );
    }

    // Send to DeepSeek for parsing
    const prompt = `Extract all commodity prices from this DA Daily Price Index document. Return as a JSON object with a "commodities" array. Each object should have:
- name (commodity name)
- category (one of: rice, corn, fish, beef, pork, poultry, eggs, lowland-vegetables, highland-vegetables, spices, fruits, other)
- specification (size/grade if mentioned, otherwise empty string)
- price_prevailing (numeric price in pesos per kg, or null if marked as n/a or unavailable)

Document text:
${pdfText.substring(0, 8000)}`;

    const systemPrompt = `You are a data extraction specialist for Philippine agricultural price reports. You accurately extract commodity name, category, specification, and prevailing prices from Department of Agriculture Daily Price Index documents. Always return valid JSON.`;

    const responseText = await callDeepSeekAPI(prompt, systemPrompt);
    const parsed = JSON.parse(responseText);

    if (!parsed.commodities || !Array.isArray(parsed.commodities)) {
      throw new Error("Invalid response format from AI");
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of parsed.commodities) {
      if (!item.name) {
        skippedCount++;
        continue;
      }

      const specification = item.specification || "";
      const category = item.category || "other";

      // Check if commodity exists
      let commodityResult = await sql`
        SELECT id FROM commodities
        WHERE name = ${item.name} AND specification = ${specification}
        LIMIT 1
      `;

      let commodityId: string;

      if (commodityResult.length === 0) {
        // Insert new commodity
        const insertResult = await sql`
          INSERT INTO commodities (name, category, specification)
          VALUES (${item.name}, ${category}, ${specification})
          RETURNING id
        `;
        commodityId = insertResult[0].id;
      } else {
        commodityId = commodityResult[0].id;
      }

      // Insert price
      try {
        await sql`
          INSERT INTO prices (commodity_id, price_date, price_prevailing)
          VALUES (${commodityId}, ${today}, ${item.price_prevailing || null})
        `;
        insertedCount++;
      } catch (insertError: any) {
        if (insertError.code !== "23505") {
          console.error("Error inserting price:", insertError);
        }
        skippedCount++;
      }
    }

    // Trigger meal suggestion generation
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    try {
      await fetch(`${baseUrl}/api/cron/suggest`, {
        method: "POST",
        headers: {
          "x-cron-secret": process.env.CRON_SECRET || "",
        },
      });
    } catch (suggestError) {
      console.error("Error triggering suggestions:", suggestError);
    }

    return NextResponse.json({
      success: true,
      pdfUrl,
      commoditiesExtracted: parsed.commodities.length,
      pricesInserted: insertedCount,
      pricesSkipped: skippedCount,
    });
  } catch (error) {
    console.error("Error in cron ingest:", error);
    return NextResponse.json(
      { error: "Failed to ingest prices", details: String(error) },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
