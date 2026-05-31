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
  { key: "Pork liempo", label: "Baboy" },
  { key: "Chicken legs", label: "Manok" },
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
          style={{ minHeight: "42vh" }}
        >
          <div
            className="max-w-2xl mx-auto px-4 pt-10 pb-8 flex flex-col h-full items-center text-center"
            style={{ minHeight: "42vh" }}
          >
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="h-20 w-80 bg-white/20 rounded-lg animate-pulse" />
              <div className="h-5 w-56 bg-white/15 rounded animate-pulse" />
              <div className="h-4 w-44 bg-white/10 rounded animate-pulse mt-4" />
            </div>
            <div className="flex flex-wrap justify-center gap-1.5 mt-auto">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-5 w-16 bg-white/15 rounded-full animate-pulse" />
              ))}
              <div className="h-6 w-16 bg-white/25 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-3.5 space-y-2.5 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-6 w-40 bg-gray-100 rounded" />
                <div className="h-6 w-16 bg-gray-100 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex gap-2">
                    <div className="h-4 w-20 bg-gray-50 rounded" />
                    <div className="h-4 w-6 bg-gray-50 rounded" />
                  </div>
                ))}
              </div>
              <div className="h-4 w-32 bg-gray-50 rounded" />
              <div className="h-12 bg-gray-50 rounded-lg" />
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <header
        className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg flex flex-col"
        style={{ minHeight: "42vh" }}
      >
        <div className="max-w-2xl mx-auto w-full px-4 pt-12 pb-8 flex flex-col flex-1 items-center text-center">
          <div className="flex-1 flex flex-col items-center justify-center">
            <h1 className="text-7xl md:text-[10rem] md:leading-none font-black mb-2 tracking-tight">
              ma, Ano ulam?
            </h1>
            <p className="text-lg text-white/90 mb-6">Anong murang ulam ngayon</p>
            <p className="text-sm text-white/70">{formattedDate}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-1 mt-auto pt-6">
            {priceTags.map((tag) => (
              <span
                key={tag.label}
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                  tag.price <= 100 ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {tag.label} {formatPeso(tag.price)}
                {tag.price <= 100 ? " ↓" : " ↑"}
              </span>
            ))}
            <a
              href="/prices"
              aria-label="View all commodity prices"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white text-amber-700 shadow-md hover:shadow-lg transition-shadow"
            >
              More →
            </a>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="max-w-2xl mx-auto px-4 py-6 space-y-3"
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

      <Footer />
    </div>
  );
}