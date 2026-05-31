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

const defaultItemKeys = [
  { key: "Liempo", label: "Baboy" },
  { key: "Paa ng manok", label: "Manok" },
  { key: "Beef litid", label: "Beef" },
  { key: "Itlog", label: "Itlog" },
  { key: "Bangus", label: "Bangus" },
  { key: "Tilapia", label: "Tilapia" },
  { key: "Bigas pinakamura", label: "Bigas" },
  { key: "Sibuyas pula", label: "Sibuyas" },
  { key: "Bawang", label: "Bawang" },
  { key: "Saging saba", label: "Saging" },
  { key: "Mantika", label: "Mantika" },
  { key: "Kalamansi", label: "Kalamansi" },
  { key: "Sili pula", label: "Sili" },
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
} {
  if (price <= 100) {
    return {
      arrowChar: "▼",
      badgeClass: "bg-emerald-500",
    };
  }

  return {
    arrowChar: "▲",
    badgeClass: "bg-rose-500",
  };
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">😕</div>
          <p className="text-amber-900 font-bold text-xl">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchData();
            }}
            className="inline-flex items-center gap-2 bg-amber-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-amber-700 transition-colors"
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
        <div
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 shadow-lg"
          style={{ minHeight: "40vh" }}
        >
          <div
            className="max-w-2xl mx-auto px-4 pt-9 pb-6 flex flex-col h-full items-center text-center"
            style={{ minHeight: "40vh" }}
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="h-20 w-80 max-w-full bg-white/20 rounded-lg animate-pulse" />
              <div className="h-5 w-56 max-w-full bg-white/15 rounded animate-pulse" />
              <div className="h-4 w-44 max-w-full bg-white/10 rounded animate-pulse mt-4" />
            </div>

            <div className="w-full mt-auto pt-5 overflow-hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[58px] min-w-[86px] bg-white/15 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <main className="max-w-2xl mx-auto px-4 py-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-6 w-40 bg-gray-100 rounded" />
                <div className="h-7 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="flex justify-between gap-3">
                    <div className="h-4 w-24 bg-gray-50 rounded" />
                    <div className="h-4 w-12 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-4 w-32 bg-gray-50 rounded" />
              <div className="h-14 bg-gray-50 rounded-lg" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg flex flex-col overflow-hidden"
        style={{ minHeight: "40vh" }}
      >
        <div className="max-w-2xl mx-auto w-full px-4 pt-9 pb-5 flex flex-col flex-1 items-center text-center">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-[4.7rem] sm:text-7xl md:text-[8rem] md:leading-none font-black mb-2 tracking-tight leading-[0.85]">
              ma, Ano ulam?
            </h1>

            <p className="text-lg sm:text-xl text-white/90 mb-5">Anong murang ulam ngayon</p>

            <p className="text-sm text-white/75">{formattedDate}</p>
          </div>

          <div className="w-full mt-auto pt-5 relative">
            <div className="pointer-events-none absolute left-0 top-5 bottom-1 w-8 bg-gradient-to-r from-orange-500/80 to-transparent z-10 sm:hidden" />
            <div className="pointer-events-none absolute right-0 top-5 bottom-1 w-10 bg-gradient-to-l from-red-500/90 to-transparent z-10 sm:hidden" />

            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide justify-start sm:flex-wrap sm:justify-center">
              {priceTags.map((tag) => {
                const tone = getPriceTone(tag.price);

                return (
                  <div
                    key={tag.label}
                    className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl min-w-[88px] shadow-md bg-white/15 backdrop-blur-sm ring-1 ring-white/20"
                    aria-label={`${tag.label} ${formatPeso(tag.price)}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-white leading-tight opacity-90">
                        {tag.label}
                      </span>
                      <span className="text-sm font-extrabold text-white leading-tight">
                        {formatPeso(tag.price)}
                      </span>
                    </div>
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full ${tone.badgeClass}`}>
                      <span className="text-white text-[10px] font-black">
                        {tone.arrowChar}
                      </span>
                    </span>
                      {tone.arrowChar}
                    </span>
                  </div>
                );
              })}

              <a
                href="/prices"
                aria-label="View all commodity prices"
                className="shrink-0 flex flex-col items-center justify-center px-4 py-2.5 rounded-2xl min-w-[112px] bg-white text-amber-700 shadow-lg hover:shadow-xl transition-all font-extrabold text-sm ring-2 ring-amber-200/70 hover:ring-amber-300"
              >
                <span className="leading-tight">More</span>
                <span className="leading-tight">Prices →</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-2xl mx-auto px-4 py-5 space-y-3"
        aria-live="polite"
        aria-atomic="false"
      >
        {meals.length === 0 && !error && (
          <Card className="border-gray-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="text-center p-12">
              <div className="text-5xl mb-4">🍳</div>
              <p className="text-amber-900 font-bold text-xl mb-2">Wala pang data ngayon.</p>
              <p className="text-amber-700 text-lg">Babalik kami bukas ng 8AM!</p>
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
          <div className="flex flex-col gap-3 pt-4 pb-8">
            {pathname !== "/prices" && (
              <a
                href="/prices"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 rounded-xl shadow-sm hover:shadow-md transition-all text-lg"
              >
                🛒 Tingnan ang Presyo
              </a>
            )}

            {pathname !== "/about" && (
              <a
                href="/about"
                className="flex items-center justify-center gap-2 bg-white text-amber-700 font-medium py-3 rounded-xl border border-gray-200 hover:bg-amber-50 transition-all text-sm"
              >
                ℹ️ Tungkol sa Ano Ulam?
              </a>
            )}
          </div>
        )}
      </main>

      <p className="text-center text-xs text-gray-400 py-4 px-4">
        Data mula sa{" "}
        <a
          href="https://da.gov.ph/price-monitoring/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-amber-600 transition-colors"
        >
          DA Bantay Presyo
        </a>
      </p>

      <Footer />
    </div>
  );
}
