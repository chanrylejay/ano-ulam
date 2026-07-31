"use client";

// ═══════════════════════════════════════════════════════════
// /pantry — "Anong meron ka sa bahay?"
// ═══════════════════════════════════════════════════════════
// Tick what you already own; every price on the site drops.
//
// FORM: a receipt-style checklist, not a card grid. This project's canon
// already settled that shape for /prices (pattern 19), and this is the same
// kind of surface: one scannable column of names and numbers where the job is
// finding your item fast, not admiring it. 38 rows in cards would be four
// screens of scrolling and no easier to read.
//
// The rows are sorted by how many recipes REQUIRE each ingredient, so the two
// taps that change almost everything (Sibuyas in 35, Bawang in 32) sit at the
// very top of the first group. That ordering is the whole argument for the
// feature, made visible instead of explained.
//
// Computed in the browser from RECIPES plus /api/prices, the same pattern
// /ulam and the nutrition panel use. No new endpoint, no new table, no AI.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useOwnedIngredients } from "@/components/Pantry";
import { RECIPES, RECIPE_DA_KEYS, type PriceMap } from "@/lib/recipes";
import { buildPriceMap, type DARecord } from "@/lib/da-parser";
import {
  PANTRY_GROUPS,
  ownableByGroup,
  recipesAffected,
  typicalCostByName,
} from "@/lib/pantry";

interface PriceApiItem {
  price_prevailing: number;
  commodities: {
    name: string;
    original_name?: string;
    category?: string;
    specification?: string;
  };
}

/** The three almost every Filipino kitchen already has. */
const COMMON_THREE = ["Sibuyas", "Bawang", "Kamatis"];

export default function PantryPage() {
  const { owned, toggle, addMany, clear, ready } = useOwnedIngredients();
  const [rawPrices, setRawPrices] = useState<DARecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // ?all=1 — the unfiltered sheet, so this page's per-dish costs match the
      // meal cards exactly. See the comment in app/api/prices/route.ts.
      const res = await fetch("/api/prices?all=1", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const items: PriceApiItem[] = data.prices || [];
        setRawPrices(
          items.map((p) => ({
            // original_name is the raw DA name, which is what a daKey matches.
            name: p.commodities.original_name || p.commodities.name || "",
            specification: p.commodities.specification || "",
            category: p.commodities.category || "other",
            price: Number.isFinite(p.price_prevailing) ? p.price_prevailing : null,
          })),
        );
      }
    } catch {
      setError("Hindi maka-connect sa server. Subukan muli.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const priceMap = useMemo<PriceMap>(
    () => buildPriceMap(RECIPE_DA_KEYS, rawPrices),
    [rawPrices],
  );

  const typical = useMemo(() => typicalCostByName(priceMap), [priceMap]);
  const affected = recipesAffected(owned);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="text-5xl">😕</div>
          <p className="text-xl font-bold text-amber-900">{error}</p>
          <button
            onClick={fetchPrices}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Subukan Muli
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 pb-10">
      <header className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 pb-8 pt-12 text-white shadow-lg">
        <a
          href="/"
          className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          ← Home
        </a>

        {/* Same restrained header as /ulam. Both are working surfaces, not
            destinations, and a tall gradient here would push the first row
            under the fold on the one page that exists to be scanned. */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-1.5 text-4xl font-black leading-none tracking-tight sm:text-5xl">
            Anong meron ka?
          </h1>
          <p className="text-sm text-white/85">
            I-check ang nasa bahay mo na. Bababa ang presyo ng lahat ng ulam.
          </p>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-5" aria-live="polite">
        {/*
          Sticky, because the count IS the feedback. Ticking Bawang on row two
          and watching "mas mura ang 39 ulam" appear is the moment the feature
          explains itself; if that line scrolls away, ticking row twenty feels
          like it does nothing.
        */}
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-amber-100/80 bg-amber-50/95 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm">
              {owned.size === 0 ? (
                <span className="text-gray-600">Wala pang naka-check.</span>
              ) : (
                <>
                  <span className="font-bold text-gray-900">
                    {owned.size} sangkap
                  </span>
                  <span className="text-gray-600">
                    {" "}
                    · mas mura ang{" "}
                    <span className="font-bold text-emerald-700 tabular-nums">
                      {affected}
                    </span>{" "}
                    sa {RECIPES.length} ulam
                  </span>
                </>
              )}
            </p>
            {owned.size > 0 && (
              <button
                onClick={clear}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-white hover:text-gray-900"
              >
                Alisin lahat
              </button>
            )}
          </div>
        </div>

        {/*
          The empty state teaches rather than apologises. Almost every kitchen
          has these three, they are the highest-impact ticks on the page, and
          one tap shows what the whole feature does.
        */}
        {ready && owned.size === 0 && (
          <Card className="mb-4 border-amber-200 bg-white">
            <CardContent className="p-4">
              <p className="mb-3 text-sm leading-relaxed text-gray-700">
                Karaniwan may bawang, sibuyas at kamatis sa bawat kusina. Subukan mo ito
                para makita agad ang pagbaba.
              </p>
              <button
                onClick={() => addMany(COMMON_THREE)}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700"
              >
                Meron ako ng bawang, sibuyas at kamatis
              </button>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="h-5 w-5 shrink-0 rounded bg-gray-100" />
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="ml-auto h-4 w-12 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        )}

        {!isLoading &&
          PANTRY_GROUPS.map((group) => {
            const items = ownableByGroup(group.key);
            if (items.length === 0) return null;

            return (
              <section key={group.key} className="mb-5">
                <h2 className="mb-2 px-0.5 text-sm font-bold text-gray-900">
                  {group.label}
                  <span className="ml-1.5 font-medium text-gray-400">{items.length}</span>
                </h2>

                <ul className="space-y-1.5">
                  {items.map((item) => {
                    const isOwned = owned.has(item.name);
                    const cost = typical.get(item.name);

                    return (
                      <li key={item.name}>
                        {/*
                          A real <label> around a real checkbox. The product
                          register is explicit that standard affordances beat
                          invented ones, and this hands us keyboard access,
                          screen-reader state and the native tap target for
                          free. The row is the hit area, not just the box.
                        */}
                        <label
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors duration-150 ${
                            isOwned
                              ? "border-amber-300 bg-amber-50"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isOwned}
                            onChange={() => toggle(item.name)}
                            className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 accent-amber-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
                          />

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                isOwned ? "text-amber-900" : "text-gray-900"
                              }`}
                            >
                              {item.name}
                            </span>
                            <span className="block text-xs text-gray-500">
                              {item.requiredCount > 0
                                ? `nasa ${item.requiredCount} ulam`
                                : `opsyonal sa ${item.recipeCount} ulam`}
                            </span>
                          </span>

                          {/*
                            The typical cost INSIDE one dish, not the per-kilo
                            price. Bawang is ₱355/kg but a recipe uses one ulo,
                            so "₱355" would be true and useless here. This is
                            the number that decides whether the tap is worth it.
                          */}
                          {cost !== undefined ? (
                            <span
                              className={`shrink-0 text-right text-sm font-bold tabular-nums ${
                                isOwned ? "text-emerald-700" : "text-gray-700"
                              }`}
                            >
                              ~₱{cost}
                              <span className="block text-[10px] font-medium text-gray-400">
                                kada ulam
                              </span>
                            </span>
                          ) : (
                            <span className="shrink-0 text-xs text-gray-400">
                              walang presyo
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}

        {/*
          Why toyo and suka are not on this list. Leaving them off without
          saying so reads as an omission; saying so turns it into a fact about
          how the price is built. Nobody should tick a box that cannot move a
          number.
        */}
        {!isLoading && (
          <p className="mt-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs leading-relaxed text-gray-500">
            Wala rito ang toyo, suka, asin, mantika at asukal. Hindi sila sinusubaybayan ng
            DA price monitoring, kaya hindi sila kasama sa presyo kahit kailan. Walang
            mababawas kung i-check mo sila.
          </p>
        )}

        <div className="flex flex-col gap-3 pt-6">
          <a
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-lg font-bold text-white shadow-sm transition-all hover:shadow-md"
          >
            🍚 Murang ulam ngayon
          </a>
          <a
            href="/ulam"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50"
          >
            🍲 Lahat ng {RECIPES.length} ulam
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
