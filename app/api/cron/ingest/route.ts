import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { sql } from "@/lib/db";
import { callDeepSeekAPI } from "@/lib/deepseek";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    // Send to DeepSeek for CSV parsing
    const prompt = `Extract all commodity prices from this DA Daily Price Index document.
Return ONLY a CSV with these columns, no header row:
name,category,specification,price

Rules:
- category must be one of: rice, corn, fish, beef, pork, poultry, eggs, lowland-vegetables, highland-vegetables, spices, fruits, other
- price is numeric pesos per kg, use 0 if n/a
- Skip cigarettes and tobacco
- No quotes unless the value contains a comma
- One line per commodity

Example lines:
Tilapia,fish,Medium,180
Galunggong,fish,Medium,200
Bangus,fish,Large,220

Document text:
${pdfText.substring(0, 8000)}`;

    const systemPrompt = `You are a data extraction specialist for Philippine agricultural price reports. Return ONLY CSV data, no markdown, no headers, no explanation.`;

    const responseText = await callDeepSeekAPI(prompt, systemPrompt);

    // Parse CSV into objects
    const lines = responseText
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const parsed = {
      commodities: lines
        .map((line) => {
          const parts = line.split(",");
          if (parts.length < 4) return null;
          const price = parseFloat(parts[parts.length - 1]);
          const specification = parts[parts.length - 2]?.trim() || "";
          const category = parts[parts.length - 3]?.trim() || "other";
          const name = parts
            .slice(0, parts.length - 3)
            .join(",")
            .trim();
          return {
            name,
            category,
            specification,
            price_prevailing: isNaN(price) || price === 0 ? null : price,
          };
        })
        .filter(Boolean),
    };

    if (!parsed.commodities || !Array.isArray(parsed.commodities)) {
      throw new Error("Invalid response format from AI");
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const item of parsed.commodities) {
      if (!item || !item.name) {
        skippedCount++;
        continue;
      }

      const specification = item.specification || "";
      const category = item.category || "other";

      try {
        // Single upsert - no SELECT needed
        const commodityResult = await sql`
          INSERT INTO commodities (name, category, specification)
          VALUES (${item.name}, ${category}, ${specification})
          ON CONFLICT (name, category) DO UPDATE SET specification = EXCLUDED.specification
          RETURNING id
        `;

        const commodityId = commodityResult[0].id;

        if (item.price_prevailing !== null) {
          await sql`
            INSERT INTO prices (commodity_id, price_date, price_prevailing)
            VALUES (${commodityId}, ${today}, ${item.price_prevailing})
            ON CONFLICT DO NOTHING
          `;
          insertedCount++;
        } else {
          skippedCount++;
        }
      } catch (err: any) {
        console.error("Error inserting:", item.name, err.message);
        skippedCount++;
      }
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
