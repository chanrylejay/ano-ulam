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
  { key: "Pork liempo", label: "Baboy" },
  { key: "Chicken legs", label: "Manok" },
  { key: "Beef litid", label: "Beef" },
  { key: "Itlog", label: "Itlog" },
  { key: "Bangus", label: "Bangus" },
  { key: "Tilapia", label: "Tilapia" },
  { key: "Bigas pinakamura", label: "Bigas" },
  { key: "Sibuyas pula", label: "Sibuyas" },
  { key: "Bawang", label: "Bawang" },
];

function formatPeso(amount: number): string {
  return new Intl.NumberFormat("fil-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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
            const found = (priceData.prices as PriceItem[]).find(
              (p) => p.commodities.name.toLowerCase() === item.key.toLowerCase(),
            );
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

  // Error state — network/server failure
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

  // Loading state — skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        {/* Skeleton Header */}
        <div
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 px-4 pt-10 pb-8 shadow-lg"
          style={{ minHeight: "38vh" }}
        >
          <div className="max-w-2xl mx-auto flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-center space-y-3">
              <div className="h-12 w-72 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-5 w-48 bg-white/15 rounded animate-pulse" />
              <div className="h-4 w-36 bg-white/10 rounded animate-pulse mb-5" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-white/15 rounded-full animate-pulse" />
              ))}
              <div className="h-6 w-16 bg-white/10 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        {/* Skeleton Cards */}
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-amber-200 p-4 space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-6 w-40 bg-amber-100 rounded" />
                <div className="h-6 w-16 bg-amber-100 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex gap-2">
                    <div className="h-4 w-20 bg-amber-50 rounded" />
                    <div className="h-4 w-6 bg-amber-50 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-4 w-32 bg-amber-50 rounded" />
              <div className="h-16 bg-amber-50/60 rounded-lg" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header — ~35-40% of mobile screen height */}
      <header
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-4 pt-10 pb-8 shadow-lg"
        style={{ minHeight: "38vh" }}
      >
        <div className="max-w-2xl mx-auto flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-5xl font-extrabold mb-1 tracking-tight">ma, Ano Ulam?</h1>
            <p className="text-lg text-white/95 mb-1">Anong murang ulam ngayon</p>
            <p className="text-xs text-white/85 mb-5">{formattedDate}</p>
          </div>

          {/* Price Tags */}
          <div className="flex flex-wrap gap-1.5">
            {priceTags.map((tag) => (
              <span
                key={tag.label}
                role="status"
                aria-label={`${tag.label}: ${formatPeso(tag.price)} per kilogram. ${tag.price <= 150 ? "Affordable" : "Expensive"}.`}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                  tag.price <= 150
                    ? "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200"
                    : "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
                }`}
              >
                {tag.label} {formatPeso(tag.price)}
              </span>
            ))}
            <a
              href="/prices"
              aria-label="View all commodity prices"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 text-white hover:bg-white/25 transition-colors"
            >
              More →
            </a>
          </div>
        </div>
      </header>

      {/* Meal Cards — no section title */}
      <main id="main-content" className="max-w-2xl mx-auto px-4 py-6 space-y-4" aria-live="polite" aria-atomic="false">
        {/* Empty state */}
        {meals.length === 0 && !error && (
          <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="text-center p-12">
              <div className="text-5xl mb-4">🍳</div>
              <p className="text-amber-900 font-bold text-xl mb-2">Wala pang data ngayon.</p>
              <p className="text-amber-700 text-lg">Babalik kami bukas ng 8AM!</p>
            </CardContent>
          </Card>
        )}

        {/* Meal cards */}
        {meals.length > 0 && (
          <ul className="space-y-4" aria-label="Meal suggestions">
            {meals.map((meal, i) => (
              <MealCard key={i} meal={meal} index={i} />
            ))}
          </ul>
        )}

        {/* Bottom Buttons — conditionally hidden based on current page */}
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
                className="flex items-center justify-center gap-2 bg-white text-amber-700 font-medium py-3 rounded-xl border border-amber-200 hover:bg-amber-50 transition-all text-sm"
              >
                ℹ️ About Ano Ulam?
              </a>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}