"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { usePathname } from "next/navigation";
import { MealCard } from "@/components/MealCard";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";

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

// Homepage shows only key prices at a glance.
// Full list is on /prices.
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
              tags.push({
                name: item.key,
                label: item.label,
                price: found.price_prevailing,
              });
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

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

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
        <div className="min-h-[340px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg sm:min-h-[380px] md:min-h-[400px]">
          <div className="mx-auto flex min-h-[340px] max-w-3xl flex-col items-center justify-between px-4 pb-6 pt-9 text-center sm:min-h-[380px] md:min-h-[400px]">
            <div className="flex flex-1 flex-col items-center justify-center space-y-3">
              <div className="h-20 w-[520px] max-w-full animate-pulse rounded-lg bg-white/20" />
              <div className="h-5 w-56 max-w-full animate-pulse rounded bg-white/15" />
              <div className="mt-2 h-4 w-44 max-w-full animate-pulse rounded bg-white/10" />
            </div>

            <div className="flex w-full items-center justify-center gap-5 pt-4">
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
      <header className="min-h-[340px] overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg sm:min-h-[380px] md:min-h-[400px]">
        <div className="mx-auto flex min-h-[340px] w-full max-w-3xl flex-col items-center justify-between px-4 pb-6 pt-9 text-center sm:min-h-[380px] md:min-h-[400px]">
          <section className="flex flex-1 flex-col items-center justify-center">
            <h1 className="mb-2 text-[4.2rem] font-black leading-[0.85] tracking-tight sm:text-7xl md:text-[8rem] md:leading-none">
              ma, Ano ulam?
            </h1>

            <p className="mb-4 text-base text-white/90 sm:text-xl">Anong murang ulam ngayon</p>

            <p className="text-sm text-white/70">{formattedDate}</p>
          </section>

          <nav className="relative w-full pt-5" aria-label="Pangunahing presyo ngayon">
            <div className="pointer-events-none absolute bottom-0 left-0 top-5 z-10 w-6 bg-gradient-to-r from-orange-500/90 to-transparent sm:hidden" />
            <div className="pointer-events-none absolute bottom-0 right-0 top-5 z-10 w-6 bg-gradient-to-l from-red-500/90 to-transparent sm:hidden" />

            <div className="scrollbar-hide -mx-4 flex items-center gap-4 overflow-x-auto px-4 pb-1 sm:hidden">
              {priceTags.map((tag) => (
                <div
                  key={tag.label}
                  className="flex shrink-0 items-center gap-1.5"
                  aria-label={`${tag.label} ${formatPeso(tag.price)}`}
                >
                  <span className="text-sm shrink-0" aria-hidden="true">
                    {getDotEmoji(tag.price)}
                  </span>
                  <span className="whitespace-nowrap text-sm text-white/85">
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
                  <span className="whitespace-nowrap text-sm text-white/85">
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
        className="mx-auto max-w-2xl space-y-3 px-4 py-5"
        aria-live="polite"
        aria-atomic="false"
      >
        {meals.length === 0 && !error && (
          <Card className="border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-12 text-center">
              <div className="mb-4 text-5xl">🍳</div>
              <p className="mb-2 text-xl font-bold text-amber-900">Wala pang data ngayon.</p>
              <p className="text-lg text-amber-700">Babalik kami bukas ng 8AM!</p>
            </CardContent>
          </Card>
        )}

        {meals.length > 0 && (
          <ul className="space-y-3" aria-label="Meal suggestions">
            {meals.map((meal, i) => (
              <MealCard key={i} meal={meal} index={i} />
            ))}
          </ul>
        )}

        {meals.length > 0 && (
          <div className="flex flex-col gap-3 pb-8 pt-4">
            {pathname !== "/prices" && (
              <a
                href="/prices"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 py-4 text-lg font-bold text-white shadow-sm transition-all hover:shadow-md"
              >
                🛒 Tingnan ang Presyo
              </a>
            )}

            {pathname !== "/about" && (
              <a
                href="/about"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-amber-700 transition-all hover:bg-amber-50"
              >
                ℹ️ Tungkol sa Ano Ulam?
              </a>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
