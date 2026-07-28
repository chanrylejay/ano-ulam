import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { sql } from "@/lib/db";
import { callDeepSeekWithUsage } from "@/lib/deepseek";
import {
  parseDAPriceIndex,
  parseDeepSeekCsv,
  MIN_HEALTHY_PRICES,
  type DARecord,
} from "@/lib/da-parser";

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

export async function GET(request: NextRequest) {
  return POST(request);
}

/**
 * The prompt used ONLY on the DeepSeek fallback path.
 *
 * Differences from the old one, both learned the hard way on Jul 28 2026:
 *  - it forbids commas and quotes inside fields, so the CSV cannot be mangled
 *    at the source (parseCsvLine handles it either way, belt and braces)
 *  - it names every section and says not to stop early, because v4-flash was
 *    quitting after the fish section
 */
function buildExtractionPrompt(pdfText: string): string {
  return `Extract EVERY commodity price row from this DA Daily Price Index document.
The document has roughly 200 rows across these sections: rice, corn, legumes, fish, beef,
pork, other livestock, poultry, lowland vegetables, highland vegetables, spices, fruits and
other basic commodities. Output rows from ALL sections. Do not stop early. Do not summarise.

Return ONLY a CSV with these columns, no header row:
name,category,specification,price

Rules:
- category must be one of: rice, corn, fish, beef, pork, poultry, eggs, lowland-vegetables, highland-vegetables, spices, fruits, other
- NEVER put a comma inside any field. Replace any comma in a name or specification with a space.
- NEVER use quote characters.
- price is a plain number in pesos. Use 0 for n/a.
- Skip cigarettes and tobacco.
- One line per commodity row, including every Local and Imported variant.

Example lines:
Tilapia,fish,Medium (5-6 pcs/kg),153.24
Beef Brisket Local,beef,Meat with Bones,440.92
Chicken Leg Quarter Imported,poultry,,157.50

Document text:
${pdfText.substring(0, 16000)}`;
}

const EXTRACTION_SYSTEM_PROMPT =
  "You are a data extraction specialist for Philippine agricultural price reports. Return ONLY CSV data, no markdown, no headers, no explanation.";

export async function POST(request: NextRequest) {
  try {
    // ── Auth ─────────────────────────────────────────────────────────
    // SECURITY FIX (Jul 28 2026): this value was read and then NEVER COMPARED,
    // so /api/cron/ingest was callable by anyone on the internet. The repo is
    // public, so the route was discoverable from source. Each anonymous call
    // could spend real DeepSeek credit and overwrite a day of production prices.
    const cronSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!process.env.CRON_SECRET || cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];

    // ── Already ingested? ────────────────────────────────────────────
    const existingPrices = await sql`
      SELECT id FROM prices WHERE price_date = ${today} LIMIT 1
    `;

    if (existingPrices.length > 0) {
      return NextResponse.json({ message: "Prices already ingested for today" });
    }

    // ── Find and read the PDF ────────────────────────────────────────
    const pdfUrl = await findLatestPDFUrl();
    if (!pdfUrl) {
      return NextResponse.json({ error: "Could not find Daily Price Index PDF" }, { status: 404 });
    }

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

    // ── PRIMARY: read the sheet in code ──────────────────────────────
    // ~1 second, no cost, no network. See lib/da-parser.ts for why this
    // replaced the DeepSeek call as the primary path.
    let items: DARecord[] = parseDAPriceIndex(pdfText);
    let extractionMethod = "deterministic";
    let fallbackNote: string | null = null;

    const pricedCount = (rows: DARecord[]) =>
      rows.filter((r) => r.price !== null && r.price > 0).length;

    // ── FALLBACK: only if the code parse came back thin ──────────────
    // A thin parse means DA probably reorganised the document again (they did
    // so twice between Mar 2025 and Oct 2025). DeepSeek reads a changed layout
    // more flexibly, so it is worth one attempt before giving up.
    if (pricedCount(items) < MIN_HEALTHY_PRICES) {
      const before = pricedCount(items);
      console.warn(
        `Deterministic parse returned only ${before} priced rows (expected >= ${MIN_HEALTHY_PRICES}). ` +
          `The DA document layout may have changed. Trying the DeepSeek fallback.`,
      );

      try {
        const ai = await callDeepSeekWithUsage(
          buildExtractionPrompt(pdfText),
          EXTRACTION_SYSTEM_PROMPT,
          // 40s leaves ~20s of the 60s function budget for the DB writes and
          // the response. Be honest about the odds: a full extraction measured
          // ~82s on Jul 28 2026, so on Hobby this will usually abort. It is here
          // so that IF the layout changes and DeepSeek is fast enough that day,
          // the site self-heals; when it is not, it fails cleanly and the
          // watchdog emails Chan instead of the site silently going blank.
          { maxTokens: 32000, temperature: 0, timeoutMs: 40_000 },
        );

        if (!ai.content) {
          // The exact failure that blanked the site for five days.
          throw new Error(
            `DeepSeek returned an empty answer (finish_reason=${ai.finishReason}, ` +
              `reasoning_tokens=${ai.reasoningTokens}).`,
          );
        }

        const aiItems = parseDeepSeekCsv(ai.content);
        if (pricedCount(aiItems) > before) {
          items = aiItems;
          extractionMethod = "deepseek-fallback";
          fallbackNote = `code parse gave ${before} rows, DeepSeek gave ${pricedCount(aiItems)}`;
        } else {
          fallbackNote = `DeepSeek gave ${pricedCount(aiItems)} rows, no better than the code parse`;
        }
      } catch (aiError) {
        console.error("DeepSeek fallback failed:", aiError);
        fallbackNote = `DeepSeek fallback failed: ${String(aiError)}`;
      }
    }

    const priced = items.filter((r) => r.price !== null && r.price > 0);

    // ── THE GUARD ────────────────────────────────────────────────────
    // Refuse to publish a bad day. Writing a thin result would overwrite good
    // production data and blank the homepage, which is exactly what happened
    // Jul 23-28 2026. Failing loudly here leaves yesterday's prices in place,
    // so visitors keep seeing real meals while the problem gets fixed.
    if (priced.length < MIN_HEALTHY_PRICES) {
      const detail =
        `Extraction produced only ${priced.length} priced rows, below the ${MIN_HEALTHY_PRICES} ` +
        `minimum. Nothing was written; existing prices are untouched. ` +
        `method=${extractionMethod}${fallbackNote ? `; ${fallbackNote}` : ""}`;
      console.error("INGEST REFUSED: " + detail);
      return NextResponse.json(
        {
          error: "Extraction below health floor, refused to write",
          details: detail,
          pdfUrl,
          pricedRows: priced.length,
          minimumRequired: MIN_HEALTHY_PRICES,
        },
        { status: 500 },
      );
    }

    const commoditiesJson = JSON.stringify(priced);

    // ── BATCH INSERT: commodities, one query ─────────────────────────
    await sql`
      INSERT INTO commodities (name, category, specification)
      SELECT DISTINCT ON (name, category)
        elem->>'name' AS name,
        elem->>'category' AS category,
        COALESCE(elem->>'specification', '') AS specification
      FROM jsonb_array_elements(${commoditiesJson}::jsonb) AS elem
      ON CONFLICT (name, category) DO NOTHING
    `;

    // ── BATCH INSERT: prices, one query ──────────────────────────────
    const priceResult = await sql`
      INSERT INTO prices (commodity_id, price_date, price_prevailing)
      SELECT
        c.id,
        ${today}::date,
        (elem->>'price')::numeric
      FROM jsonb_array_elements(${commoditiesJson}::jsonb) AS elem
      JOIN commodities c
        ON c.name = elem->>'name'
        AND c.category = elem->>'category'
      WHERE elem->>'price' IS NOT NULL
        AND (elem->>'price')::numeric > 0
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      pdfUrl,
      extractionMethod,
      fallbackNote,
      commoditiesExtracted: priced.length,
      pricesInserted: priceResult.length,
    });
  } catch (error) {
    console.error("Error in cron ingest:", error);
    return NextResponse.json(
      { error: "Failed to ingest prices", details: String(error) },
      { status: 500 },
    );
  }
}
