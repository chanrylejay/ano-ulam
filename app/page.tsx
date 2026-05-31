"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

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

export default function HomePage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [priceTags, setPriceTags] = useState<PriceTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataDate, setDataDate] = useState<string>("");

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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setIsLoading(true);

      // Fetch suggestions and prices in parallel
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
          // Match default items to actual prices
          const tags: PriceTag[] = [];
          for (const item of defaultItemKeys) {
            const found = priceData.prices.find(
              (p: any) => p.commodities.name.toLowerCase() === item.key.toLowerCase(),
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
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }

  const today = new Date();
  const formattedDate = format(today, "EEEE, MMMM d, yyyy");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🍚</div>
          <p className="text-amber-700 font-medium">Naghahanap ng masusustansyang ulam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white px-4 pt-8 pb-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-1">ma, Ano Ulam?</h1>
          <p className="text-lg text-white/90 mb-1">Anong murang ulam ngayon</p>
          <p className="text-xs text-white/70 mb-4">{formattedDate}</p>

          {/* Price Tags */}
          <div className="flex flex-wrap gap-2">
            {priceTags.map((tag) => (
              <span
                key={tag.label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  tag.price <= 100 ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
                }`}
              >
                {tag.label} ₱{Math.round(tag.price)}
              </span>
            ))}
            <a
              href="/prices"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              More →
            </a>
          </div>
        </div>
      </header>

      {/* Meal Cards */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* No Data State */}
        {meals.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🍳</div>
            <p className="text-amber-900 font-bold text-xl mb-2">Wala pang data ngayon.</p>
            <p className="text-amber-700 text-lg">Babalik kami bukas ng 8AM!</p>
          </div>
        )}

        {/* Meal Cards */}
        {meals.map((meal, i) => (
          <div
            key={i}
            className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden"
          >
            <div className="p-4">
              {/* Title + Price */}
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">{meal.name}</h2>
                <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0 ml-2">
                  ₱{meal.estimated_cost}
                </span>
              </div>

              {/* Ingredients Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {meal.ingredients?.map((ing, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium text-gray-800">{ing.name}</span>
                    {ing.trend === "down" && <span className="text-green-600 font-bold">↓</span>}
                    {ing.trend === "up" && <span className="text-red-500 font-bold">↑</span>}
                    {ing.optional && <span className="text-gray-400 text-xs">(optional)</span>}
                  </div>
                ))}
              </div>

              {/* Servings */}
              <p className="text-xs text-gray-500 mb-3">🍽️ {meal.servings || "2-4 na tao"}</p>

              {/* Bakit? */}
              {meal.reason && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <p className="text-sm text-amber-900">
                    <span className="font-bold">Bakit?</span> {meal.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Bottom Buttons */}
        {meals.length > 0 && (
          <div className="flex flex-col gap-3 pt-4 pb-8">
            <a
              href="/prices"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl shadow-sm hover:shadow-md transition-all text-lg"
            >
              🛒 Tingnan ang Presyo
            </a>
            <a
              href="/about"
              className="flex items-center justify-center gap-2 bg-white text-amber-700 font-medium py-3 rounded-xl border border-amber-200 hover:bg-amber-50 transition-all text-sm"
            >
              ℹ️ About Ano Ulam?
            </a>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white/80 py-4">
        <p className="text-center text-xs text-amber-600">
          Data mula sa{" "}
          <a
            href="https://www.da.gov.ph/price-monitoring/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
          >
            Department of Agriculture Bantay Presyo
          </a>
        </p>
      </footer>
    </div>
  );
}
