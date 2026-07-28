"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { usePathname } from "next/navigation";
import { Calendar } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { HeroDishPhoto, hasDishPhoto } from "@/components/HeroDishPhoto";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { RECIPES } from "@/lib/recipes";
import { PROTEIN_TABS, matchesProteinFilter, type ProteinFilter } from "@/lib/protein-tabs";

interface Ingredient {
  name: string;
  trend: "down" | "up" | "stable";
  optional?: boolean;
  amount?: string;
}

interface Meal {
  name: string;
  estimated_cost: number;
  servings: string;
  ingredients: Ingredient[];
  reason: string;
  /** "mura" = picked on price, "iba" = variety pick. Optional for pre-V2.4 rows. */
  slot?: "mura" | "iba";
}

interface PriceTag {
  name: string;
  label: string;
  price: number;
}

interface PriceItem {
  commodities: { name: string };
  price_prevailing: number;
}

// The tab row and the category rules live in lib/protein-tabs.ts. /ulam renders
// the same row, and a second copy here would let the two pages disagree about
// what "Gulay" means the first time a category changes.

const defaultItemKeys = [
  { key: "Liempo", label: "Baboy" },
  { key: "Paa ng manok", label: "Manok" },
  { key: "Beef litid", label: "Beef" },
  { key: "Itlog", label: "Itlog" },
  { key: "Bangus", label: "Bangus" },
  { key: "Bigas pinakamura", label: "Bigas" },
];

function formatPeso(amount: number): string {
  return new Intl.NumberFormat("fil-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDotEmoji(price: number): string {
  return price <= 100 ? "🟢" : "🔴";
}

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [priceTags, setPriceTags] = useState<PriceTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataDate, setDataDate] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<ProteinFilter>("lahat");

  const pathname = usePathname();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [suggestionsRes, pricesRes] = await Promise.all([
        fetch("/api/suggestions"),
        fetch("/api/prices"),
      ]);

      if (suggestionsRes.ok) {
        const sugData = await suggestionsRes.json();
        if (sugData.suggestion?.meals) {
          setMeals(sugData.suggestion.meals);
          setDataDate(sugData.suggestion.suggestion_date || "");
        }
      }

      if (pricesRes.ok) {
        const priceData = await pricesRes.json();
        if (priceData.prices) {
          const tags: PriceTag[] = [];
          for (const item of defaultItemKeys) {
            const found = (priceData.prices as PriceItem[]).find((p) => {
              const apiName = p.commodities.name.toLowerCase().trim();
              const targetName = item.key.toLowerCase().trim();
              return (
                apiName === targetName ||
                apiName.includes(targetName) ||
                targetName.includes(apiName)
              );
            });
            if (found) {
              tags.push({ name: item.key, label: item.label, price: found.price_prevailing });
            }
          }
          setPriceTags(tags);
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

  // ── Filter meals by protein type ──────────────────────────
  // The cached row carries only a name, so the category comes from looking the
  // dish back up in RECIPES.
  const filteredMeals =
    activeFilter === "lahat"
      ? meals
      : meals.filter((meal) => {
          const recipe = RECIPES.find((r) => r.name === meal.name);
          if (!recipe) return false;
          return matchesProteinFilter(recipe, activeFilter);
        });

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  // ── The headline pick ───────────────────────────────────
  // Always from the FULL list, never the filtered one. "Rekomendasyon ngayon"
  // is the day's answer; it must not change because someone tapped Isda.
  // The cron already shuffles display order by date, so this is not
  // permanently the cheapest dish — that was the exact thing Chan was tired
  // of seeing (Ginataang Kalabasa, every single day).
  const featuredMeal = meals.length > 0 ? meals[0] : null;
  const featuredRecipe = featuredMeal
    ? RECIPES.find((r) => r.name === featuredMeal.name)
    : undefined;
  const showHeroPhoto = hasDishPhoto(featuredRecipe?.id);

  if (error && meals.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <div className="max-w-sm space-y-4 text-center">
          <div className="text-5xl">😕</div>
          <p className="text-xl font-bold text-amber-900">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-700"
          >
            Subukan Muli
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        {/* Mirrors the real header's shape, so nothing jumps when data lands. */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg">
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pb-6 pt-16 text-center">
            <div className="absolute left-4 top-4 h-8 w-56 max-w-[70%] animate-pulse rounded-xl bg-white/20" />
            <div className="flex flex-col items-center space-y-3">
              <div className="h-16 w-[440px] max-w-full animate-pulse rounded-lg bg-white/20" />
              <div className="h-5 w-56 max-w-full animate-pulse rounded bg-white/15" />
            </div>
            <div className="flex w-full flex-col items-center space-y-2">
              <div className="h-3 w-40 animate-pulse rounded bg-white/15" />
              <div className="h-8 w-64 max-w-full animate-pulse rounded bg-white/25" />
              <div className="h-4 w-32 animate-pulse rounded bg-white/15" />
            </div>
            <div className="flex w-full items-center justify-center gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white/30" />
                  <div className="h-4 w-20 animate-pulse rounded bg-white/15" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-2xl space-y-3 px-4 py-5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex justify-between">
                <div className="h-6 w-40 rounded bg-gray-100" />
                <div className="h-7 w-16 rounded-full bg-gray-100" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between gap-3">
                    <div className="h-4 w-24 rounded bg-gray-50" />
                    <div className="h-4 w-12 rounded bg-gray-50" />
                  </div>
                ))}
              </div>
              <div className="h-4 w-32 rounded bg-gray-50" />
              <div className="h-14 rounded-lg bg-gray-50" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 pb-6 pt-14">
          {/*
            Small on purpose. Chan: "the date is too big i think". It is
            orientation, not a headline.
          */}
          <div className="absolute left-4 top-3.5 flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-xs">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap font-medium">{formattedDate}</span>
          </div>

          {/*
            Two layouts, picked by whether today's dish actually has a photo.

            WITH a photo: title left, plate right, both as large as the width
            allows. On a phone these two share 358px, so neither can be huge on
            its own — the plate is drawn oversized and allowed to hang off the
            right edge, which is how the mockup makes it read big while
            spending less room.

            WITHOUT a photo (46 of the 47 dishes today): a lone left-aligned
            title with dead space beside it looks broken, so it centres full
            width and gets to be properly big instead.
          */}
          {showHeroPhoto ? (
            /*
              Every number below is measured, not guessed. In this font at this
              weight, the line "ma, Ano" renders at exactly fontSize x 4.3, so
              the title's width is a known function of its size and the plate
              gets whatever is left. Re-measure before changing any of it.

              The row's HEIGHT is what the plate fills, because the plate is
              absolutely positioned and contributes none of its own. Set it too
              tall and a band of empty orange appears above and below the text
              (208px row against a 116px text block was the gap Chan spotted on
              mobile). Set it too short and the plate lands on the ticker.
            */
            <div className="relative flex h-40 w-full items-center sm:h-56 md:h-[19rem]">
              {/*
                pr reserves the plate's side so text can never flow under it.
                Each value clears the plate's VISIBLE width (its size minus the
                bleed) at that breakpoint, with a few px of slack.
              */}
              <section className="relative z-10 min-w-0 pr-[44%] text-left sm:pr-[34%] md:pr-[38%]">
                {/*
                  The break is FORCED, not left to wrapping, so the wordmark is
                  two lines at every width rather than depending on the viewport.

                  leading is 0.95, not the 0.88 it was: at 0.88 the two lines
                  nearly touched and the whole thing read as compressed.
                */}
                <h1 className="mb-2.5 font-black leading-[0.95] tracking-tight">
                  <span className="block text-[2.625rem] sm:text-6xl md:text-8xl">ma, Ano</span>
                  <span className="block text-[2.625rem] sm:text-6xl md:text-8xl">ulam?</span>
                </h1>
                <p className="text-sm text-white/90 sm:text-lg">Anong murang ulam ngayon</p>
              </section>
              <HeroDishPhoto recipeId={featuredRecipe?.id} name={featuredMeal?.name ?? ""} />
            </div>
          ) : (
            <section className="flex flex-col items-center text-center">
              <h1 className="mb-2 text-[3.6rem] font-black leading-[0.85] tracking-tight sm:text-7xl md:text-[7rem] md:leading-none">
                ma, Ano ulam?
              </h1>
              <p className="text-base text-white/90 sm:text-xl">Anong murang ulam ngayon</p>
            </section>
          )}

          {/*
            The ticker stays plain text on the gradient. Jam's mockup wraps it
            in a translucent pill, which makes it a fourth panel in a header
            that already had enough of them.
          */}
          <nav
            className="relative -mx-4 w-[calc(100%+2rem)] px-4"
            aria-label="Pangunahing presyo ngayon"
          >
            <div className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-6 bg-gradient-to-r from-orange-500/90 to-transparent sm:hidden" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-6 bg-gradient-to-l from-red-500/90 to-transparent sm:hidden" />

            <div className="scrollbar-hide flex items-center gap-4 overflow-x-auto px-1 sm:hidden">
              {priceTags.map((tag) => (
                <div
                  key={tag.label}
                  className="flex shrink-0 items-center gap-1.5"
                  aria-label={`${tag.label} ${formatPeso(tag.price)}`}
                >
                  <span className="text-sm shrink-0" aria-hidden="true">
                    {getDotEmoji(tag.price)}
                  </span>
                  <span className="whitespace-nowrap text-sm text-white/90">
                    <span className="font-semibold">{tag.label}</span>{" "}
                    <span className="font-black">{formatPeso(tag.price)}</span>
                  </span>
                </div>
              ))}
              <a
                href="/prices"
                className="shrink-0 whitespace-nowrap text-sm font-bold text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white/80"
              >
                More Prices →
              </a>
            </div>

            <div className="hidden items-center justify-center gap-x-6 gap-y-2 sm:flex">
              {priceTags.map((tag) => (
                <div
                  key={tag.label}
                  className="flex items-center gap-1.5"
                  aria-label={`${tag.label} ${formatPeso(tag.price)}`}
                >
                  <span className="text-sm shrink-0" aria-hidden="true">
                    {getDotEmoji(tag.price)}
                  </span>
                  <span className="whitespace-nowrap text-sm text-white/90">
                    <span className="font-semibold">{tag.label}</span>{" "}
                    <span className="font-black">{formatPeso(tag.price)}</span>
                  </span>
                </div>
              ))}
              <a
                href="/prices"
                className="whitespace-nowrap text-sm font-bold text-white underline decoration-white/40 underline-offset-2 transition-colors hover:decoration-white/80"
              >
                More Prices →
              </a>
            </div>
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto max-w-2xl px-4 py-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {/* ── Filter Tabs ── */}
        {meals.length > 0 && (
          <div className="scrollbar-hide -mx-4 mb-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
            {PROTEIN_TABS.map((tab) => {
              const isActive = activeFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700 border border-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Empty state ── */}
        {meals.length === 0 && !error && (
          <Card className="border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-5xl">🍳</div>
              <p className="mb-2 text-xl font-bold text-amber-900">Wala pang data ngayon.</p>
              <p className="text-lg text-amber-700">Babalik kami bukas ng 10AM!</p>
              {/*
                The five-day outage in Jul 2026 left this card as the entire
                site. The recipes never depend on the daily run, so there is
                always somewhere to go from here.
              */}
              <a
                href="/ulam"
                className="mt-5 inline-block rounded-xl bg-amber-600 px-5 py-3 font-bold text-white transition-colors hover:bg-amber-700"
              >
                🍲 Tingnan ang {RECIPES.length} recipe
              </a>
            </CardContent>
          </Card>
        )}

        {/* ── Filtered empty state ── */}
        {meals.length > 0 && filteredMeals.length === 0 && (
          <Card className="border-gray-200 bg-white">
            <CardContent className="p-10 text-center">
              <div className="mb-3 text-4xl">🔍</div>
              <p className="font-semibold text-gray-700">
                Walang {PROTEIN_TABS.find((t) => t.key === activeFilter)?.label} ngayon.
              </p>
              <p className="mt-1 text-sm text-gray-500">Wala sa listahan ng murang ulam ngayon.</p>
              <a
                href="/ulam"
                className="mt-4 inline-block rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
              >
                Tingnan lahat ng ulam →
              </a>
            </CardContent>
          </Card>
        )}

        {/* ── Meal cards ── */}
        {filteredMeals.length > 0 && (
          <ul className="space-y-3" aria-label="Meal suggestions">
            {filteredMeals.map((meal, i) => (
              <MealCard key={meal.name} meal={meal} index={i} />
            ))}
          </ul>
        )}

        {/* ── Bottom nav buttons ── */}
        {meals.length > 0 && (
          <div className="flex flex-col gap-3 pb-8 pt-4">
            {/*
              The 8 cards above are today's picks. 47 recipes exist, and until
              this link there was no way to reach the other 39 at all.
            */}
            <a
              href="/ulam"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-lg font-bold text-white shadow-sm transition-all hover:shadow-md"
            >
              🍲 Lahat ng Ulam ({RECIPES.length})
            </a>
            {pathname !== "/prices" && (
              <a
                href="/prices"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 text-lg font-bold text-white shadow-sm transition-all hover:shadow-md"
              >
                🛒 See All Prices
              </a>
            )}
            {pathname !== "/about" && (
              <a
                href="/about"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50"
              >
                ℹ️ About Ma, Ano Ulam?
              </a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
