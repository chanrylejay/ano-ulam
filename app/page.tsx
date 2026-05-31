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

// Homepage intentionally shows only the key prices.
// The full commodity list stays on /prices.
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

function getPriceTone(price: number): {
  arrowChar: string;
  badgeClass: string;
  label: string;
} {
  if (price <= 100) {
    return {
      arrowChar: "▼",
      badgeClass: "bg-emerald-500 shadow-emerald-950/30",
      label: "mura",
    };
  }

  return {
    arrowChar: "▲",
    badgeClass: "bg-rose-500 shadow-rose-950/30",
    label: "mahal",
  };
}

function PriceTile({ tag }: { tag: PriceTag }) {
  const tone = getPriceTone(tag.price);

  return (
    <div
      className="flex h-[50px] items-center justify-between gap-2 rounded-2xl bg-white/20 px-3 py-2 shadow-md ring-1 ring-white/35 backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/25 hover:ring-white/45"
      aria-label={`${tag.label} ${formatPeso(tag.price)} ${tone.label}`}
    >
      <div className="min-w-0 text-left">
        <span className="block truncate text-[11px] font-bold leading-tight text-white/95">
          {tag.label}
        </span>
        <span className="block text-sm font-black leading-tight text-white">
          {formatPeso(tag.price)}
        </span>
      </div>

      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-sm ${tone.badgeClass}`}
        aria-hidden="true"
      >
        <span className="text-[10px] font-black leading-none text-white">
          {tone.arrowChar}
        </span>
      </span>
    </div>
  );
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
        <div className="min-h-[390px] bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg sm:min-h-[440px] md:min-h-[460px]">
          <div className="mx-auto flex min-h-[390px] max-w-5xl flex-col items-center justify-between px-4 pb-6 pt-9 text-center sm:min-h-[440px] md:min-h-[460px]">
            <div className="flex flex-1 flex-col items-center justify-center space-y-3">
              <div className="h-20 w-[620px] max-w-full animate-pulse rounded-lg bg-white/20" />
              <div className="h-5 w-56 max-w-full animate-pulse rounded bg-white/15" />
              <div className="mt-2 h-4 w-44 max-w-full animate-pulse rounded bg-white/10" />
            </div>

            <div className="w-full max-w-[760px] pt-4">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[50px] animate-pulse rounded-2xl bg-white/20"
                  />
                ))}
              </div>
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
      <header className="min-h-[390px] overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg sm:min-h-[440px] md:min-h-[460px]">
        <div className="mx-auto flex min-h-[390px] w-full max-w-5xl flex-col items-center justify-between px-4 pb-6 pt-9 text-center sm:min-h-[440px] md:min-h-[460px]">
          <section className="flex flex-1 flex-col items-center justify-center">
            <h1 className="mb-2 text-[4.2rem] font-black leading-[0.85] tracking-tight sm:text-7xl md:text-[8rem] md:leading-none">
              ma, Ano ulam?
            </h1>

            <p className="mb-4 text-base text-white/90 sm:text-xl">Anong murang ulam ngayon</p>

            <p className="text-sm text-white/75">{formattedDate}</p>
          </section>

          <section className="relative w-full pt-4" aria-label="Pangunahing presyo ngayon">
            <div className="pointer-events-none absolute bottom-1 left-0 top-4 z-10 w-8 bg-gradient-to-r from-orange-500/80 to-transparent sm:hidden" />
            <div className="pointer-events-none absolute bottom-1 right-0 top-4 z-10 w-10 bg-gradient-to-l from-red-500/90 to-transparent sm:hidden" />

            <div className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:hidden">
              {priceTags.map((tag) => (
                <div key={tag.label} className="min-w-[108px] shrink-0">
                  <PriceTile tag={tag} />
                </div>
              ))}

              <a
                href="/prices"
                aria-label="View all commodity prices"
                className="flex h-[50px] min-w-[112px] shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-amber-700 shadow-lg ring-2 ring-amber-200/80 transition-all hover:shadow-xl hover:ring-amber-300"
              >
                <span className="leading-tight">More</span>
                <span className="leading-tight">Prices →</span>
              </a>
            </div>

            <div className="mx-auto hidden max-w-[760px] grid-cols-7 gap-2.5 sm:grid">
              {priceTags.map((tag) => (
                <PriceTile key={tag.label} tag={tag} />
              ))}

              <a
                href="/prices"
                aria-label="View all commodity prices"
                className="flex h-[50px] flex-col items-center justify-center rounded-2xl bg-white px-3 py-2 text-sm font-extrabold text-amber-700 shadow-lg ring-2 ring-amber-200/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:ring-amber-300"
              >
                <span className="leading-tight">More</span>
                <span className="leading-tight">Prices →</span>
              </a>
            </div>
          </section>
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

      <p className="px-4 py-4 text-center text-xs text-gray-400">
        Data mula sa{" "}
        <a
          href="https://da.gov.ph/price-monitoring/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline transition-colors hover:text-amber-600"
        >
          DA Bantay Presyo
        </a>
      </p>

      <Footer />
    </div>
  );
}
