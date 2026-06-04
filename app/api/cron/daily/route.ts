export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

// ═══════════════════════════════════════════════════════════
// /api/cron/daily — Combined daily pipeline
// Runs ingest THEN suggest sequentially. One cron, no race condition.
// ═══════════════════════════════════════════════════════════

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://ma-anoulam.vercel.app";

export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    // ── Auth: support both manual and Vercel Cron ────────
    const cronSecret =
      request.headers.get("x-cron-secret") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Step 1: Run ingest ───────────────────────────────
    const ingestResponse = await fetch(`${BASE_URL}/api/cron/ingest`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET! },
    });
    const ingestResult = await ingestResponse.json();

    // Allow both success and "already ingested" to proceed
    if (!ingestResponse.ok && ingestResult?.message !== "Prices already ingested for today") {
      return NextResponse.json({ error: "Ingest failed", ingest: ingestResult }, { status: 500 });
    }

    // ── Step 2: Run suggest (only after ingest completes) ─
    const suggestResponse = await fetch(`${BASE_URL}/api/cron/suggest`, {
      method: "POST",
      headers: { "x-cron-secret": process.env.CRON_SECRET! },
    });
    const suggestResult = await suggestResponse.json();

    return NextResponse.json({
      success: true,
      ingest: ingestResult,
      suggest: suggestResult,
    });
  } catch (error) {
    console.error("Daily cron failed:", error);
    return NextResponse.json(
      { error: "Daily cron failed", details: String(error) },
      { status: 500 },
    );
  }
}
