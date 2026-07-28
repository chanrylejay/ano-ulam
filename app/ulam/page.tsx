"use client";

// ═══════════════════════════════════════════════════════════
// /ulam — the full recipe index (V2 Phase 2)
// ═══════════════════════════════════════════════════════════
// The homepage shows 8 dishes. All 47 already exist with costs, steps and
// nutrition, and production data showed 21 of them had NEVER been surfaced.
// A student emailed asking for sinigang, caldereta, menudo and sisig — all four
// were in the engine the whole time and all four were on the never-shown list.
// This page makes every dish reachable.
//
// Everything here is computed in the browser from RECIPES plus /api/prices.
// No new endpoint, no new table, no AI call — the same pattern the nutrition
// panel uses. The price map is built with the SAME buildPriceMap() the suggest
// cron uses, over the SAME RECIPE_DA_KEYS, so a dish costs the same amount here
// as it does on the homepage.

import { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { Footer } from "@/components/Footer";
import {
  RECIPES,
  RECIPE_DA_KEYS,
  calculateRecipeCost,
  calculateRecipeCostDetailed,
  type PriceMap,
  type Recipe,
  type CostResult,
} from "@/lib/recipes";
import { buildPriceMap, type DARecord } from "@/lib/da-parser";
import {
  PROTEIN_TABS,
  matchesProteinFilter,
  proteinEmoji,
  type ProteinFilter,
} from "@/lib/protein-tabs";

interface PriceApiItem {
  price_prevailing: number;
  commodities: {
    name: string;
    original_name?: string;
    category?: string;
    specification?: string;
  };
}

type SortKey = "mura" | "az";

interface RecipeRow {
  recipe: Recipe;
  /** null when the DA has no price for a required ingredient today. */
  cost: number | null;
  detail: CostResult | null;
}

function costColor(cost: number): string {
  if (cost <= 150) return "text-emerald-600";
  if (cost <= 220) return "text-amber-600";
  return "text-rose-600";
}

export default function UlamPage() {
  const [rawPrices, setRawPrices] = useState<DARecord[]>([]);
  const [todayNames, setTodayNames] = useState<string[]>([]);
  const [priceDate, setPriceDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<ProteinFilter>("lahat");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("mura");
  const [openId, setOpenId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [pricesRes, suggestionsRes] = await Promise.all([
        fetch("/api/prices", { cache: "no-store" }),
        fetch("/api/suggestions", { cache: "no-store" }),
      ]);

      if (pricesRes.ok) {
        const data = await pricesRes.json();
        const items: PriceApiItem[] = data.prices || [];
        setRawPrices(
          items.map((p) => ({
            // original_name is the raw DA name, which is what a daKey matches.
            // The display name has had " Local"/" Imported" stripped off it and
            // would quietly cost a dish off the wrong variant.
            name: p.commodities.original_name || p.commodities.name || "",
            specification: p.commodities.specification || "",
            category: p.commodities.category || "other",
            price: Number.isFinite(p.price_prevailing) ? p.price_prevailing : null,
          })),
        );
        setPriceDate(data.date || "");
      }

      // Best-effort: the "Ngayon" badge is a nicety, never a blocker.
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        const meals = data.suggestion?.meals;
        if (Array.isArray(meals)) {
          setTodayNames(meals.map((m: { name?: string }) => m?.name || "").filter(Boolean));
        }
      }
    } catch {
      setError("Hindi maka-connect sa server. Subukan muli.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const priceMap = useMemo<PriceMap>(
    () => buildPriceMap(RECIPE_DA_KEYS, rawPrices),
    [rawPrices],
  );

  const rows = useMemo<RecipeRow[]>(() => {
    return RECIPES.map((recipe) => {
      // calculateRecipeCost returns Infinity when a required ingredient has no
      // price. Only then is calculateRecipeCostDetailed safe to call — on its
      // own it would happily sum the priced ingredients and report a total that
      // is too low.
      const cost = calculateRecipeCost(recipe, priceMap);
      const priced = Number.isFinite(cost) && cost > 0;
      if (!priced) return { recipe, cost: null, detail: null };

      // No yesterday on this page, so today's map is passed twice and every
      // trend reads "stable". Honest: we do not know the direction here.
      const detail = calculateRecipeCostDetailed(recipe, priceMap, priceMap);
      return { recipe, cost: detail.totalCost, detail };
    });
  }, [priceMap]);

  const tabCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const t of PROTEIN_TABS) {
      counts[t.key] = rows.filter((r) => matchesProteinFilter(r.recipe, t.key)).length;
    }
    return counts;
  }, [rows]);

  const visible = useMemo<RecipeRow[]>(() => {
    let list = rows.filter((r) => matchesProteinFilter(r.recipe, tab));

    const q = query.trim().toLowerCase();
    if (q) list = list.filter((r) => r.recipe.name.toLowerCase().includes(q));

    const byName = (a: RecipeRow, b: RecipeRow) => a.recipe.name.localeCompare(b.recipe.name);

    return [...list].sort((a, b) => {
      if (sort === "az") return byName(a, b);
      // Unpriced dishes have no number to compete on, so they sink rather than
      // sort as if they were free.
      if (a.cost === null && b.cost === null) return byName(a, b);
      if (a.cost === null) return 1;
      if (b.cost === null) return -1;
      return a.cost - b.cost;
    });
  }, [rows, tab, query, sort]);

  const pricedCount = rows.filter((r) => r.cost !== null).length;

  /** Name lookup for the "nasa listahan ngayon" badge. */
  const onMenuTodayByName = useMemo<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const name of todayNames) map[name] = true;
    return map;
  }, [todayNames]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="text-5xl">😕</div>
          <p className="text-xl font-bold text-amber-900">{error}</p>
          <button
            onClick={fetchData}
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
      <header className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 pb-14 pt-10 text-white shadow-lg">
        <a
          href="/"
          className="absolute left-4 top-4 rounded-lg px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          ← Home
        </a>

        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-3 text-5xl font-black leading-none tracking-tight sm:text-6xl md:text-[4rem] md:leading-none">
            Lahat ng Ulam
          </h1>
          <p className="text-white/85">
            {RECIPES.length} recipe, kumpleto ang sangkap at hakbang.
          </p>
          {priceDate && (
            <span className="mt-3 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm">
              Presyo ng {format(new Date(priceDate), "MMMM d, yyyy")}
            </span>
          )}
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-6" aria-live="polite">
        {/* ── Search ── */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hanapin ang ulam... (hal. Sinigang, Sisig)"
            aria-label="Hanapin ang ulam"
            className="w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-12 pr-4 text-base shadow-sm transition-colors focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
        </div>

        {/* ── Category tabs ── */}
        <div className="scrollbar-hide -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {PROTEIN_TABS.map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={isActive}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-600 text-white shadow-sm"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700"
                }`}
              >
                {t.label}{" "}
                <span className={isActive ? "text-white/80" : "text-gray-500"}>
                  {tabCounts[t.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Count + sort ── */}
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {visible.length} ulam
            {pricedCount < rows.length && !isLoading && (
              <span className="text-gray-500">
                {" "}
                · {rows.length - pricedCount} walang presyo ngayon
              </span>
            )}
          </p>
          <div className="flex shrink-0 gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setSort("mura")}
              aria-pressed={sort === "mura"}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sort === "mura" ? "bg-amber-500 text-white" : "text-gray-600 hover:text-amber-700"
              }`}
            >
              Mura muna
            </button>
            <button
              onClick={() => setSort("az")}
              aria-pressed={sort === "az"}
              className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                sort === "az" ? "bg-amber-500 text-white" : "text-gray-600 hover:text-amber-700"
              }`}
            >
              A-Z
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardContent className="divide-y divide-gray-100 p-0">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex animate-pulse items-center justify-between px-4 py-3.5">
                  <div className="h-4 w-44 rounded bg-gray-100" />
                  <div className="h-4 w-14 rounded bg-gray-100" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ── The index ── */}
        {!isLoading && visible.length > 0 && (
          <ul className="space-y-2" aria-label="Lahat ng recipe">
            {visible.map((row) => {
              const isOpen = openId === row.recipe.id;
              const onMenuToday = onMenuTodayByName[row.recipe.name] === true;

              return [
                <li key={row.recipe.id}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : row.recipe.id)}
                    aria-expanded={isOpen}
                    className={`flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-colors hover:bg-amber-50/60 ${
                      isOpen ? "border-amber-300 bg-amber-50/60" : "border-gray-200"
                    }`}
                  >
                    <span className="shrink-0 text-lg" aria-hidden="true">
                      {proteinEmoji(row.recipe)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-gray-900">
                        {row.recipe.name}
                      </span>
                      {onMenuToday && (
                        <span className="mt-0.5 inline-block rounded-full bg-emerald-50 px-2 py-px text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
                          Nasa listahan ngayon
                        </span>
                      )}
                    </span>
                    {row.cost === null ? (
                      <span className="shrink-0 text-xs font-medium text-gray-400">
                        walang presyo
                      </span>
                    ) : (
                      <span
                        className={`shrink-0 text-sm font-bold tabular-nums ${costColor(row.cost)}`}
                      >
                        ₱{row.cost}
                      </span>
                    )}
                    <span
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                </li>,

                // MealCard renders its own <li>, so it sits beside the row in
                // the same list rather than nesting inside it.
                isOpen ? (
                  <MealCard
                    key={`${row.recipe.id}-card`}
                    index={0}
                    unpriced={row.cost === null}
                    meal={{
                      name: row.recipe.name,
                      estimated_cost: row.cost ?? 0,
                      servings: row.recipe.servings,
                      // Unpriced dishes pass no cost rows at all. Rendering ₱0
                      // beside every ingredient would read as "free", which is
                      // the exact bug the price guard exists to prevent.
                      ingredients: row.detail ? row.detail.ingredientCosts : [],
                      reason: "",
                    }}
                  />
                ) : null,
              ];
            })}
          </ul>
        )}

        {/* ── Nothing matched ── */}
        {!isLoading && visible.length === 0 && (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-10 text-center">
              <div className="mb-3 text-4xl">🔍</div>
              <p className="font-semibold text-gray-700">Walang nahanap na ulam.</p>
              <p className="mt-1 text-sm text-gray-400">Subukan ang ibang salita o kategorya.</p>
            </CardContent>
          </Card>
        )}

        {/* ── Bottom nav ── */}
        <div className="flex flex-col gap-3 pt-6">
          <a
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-lg font-bold text-white shadow-sm transition-all hover:shadow-md"
          >
            🍚 Murang ulam ngayon
          </a>
          <a
            href="/prices"
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50"
          >
            🛒 Presyo ngayon
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
