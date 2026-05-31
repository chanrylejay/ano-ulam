'use client';

import { Card, CardContent } from '@/components/ui/card';

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

interface MealCardProps {
  meal: Meal;
  index: number;
}

function getTrendArrow(trend: string) {
  if (trend === "down") return <span className="text-emerald-600 font-bold flex-shrink-0 ml-1">{"\u2193"}</span>;
  if (trend === "up") return <span className="text-rose-600 font-bold flex-shrink-0 ml-1">{"\u2191"}</span>;
  return <span className="text-gray-200 font-bold flex-shrink-0 ml-1">{"\u2192"}</span>;
}

function formatCost(meal: Meal): string {
  if (meal.estimated_cost) {
    const cost = String(meal.estimated_cost).replace(/[₱,]/g, "");
    return `₱${cost}`;
  }
  return "₱?";
}

function getCostBadgeColor(cost: number): string {
  const n = typeof cost === "number" ? cost : parseFloat(String(cost).replace(/[₱,]/g, ""));
  if (isNaN(n)) return "bg-amber-500";
  if (n <= 150) return "bg-emerald-500";
  if (n <= 200) return "bg-amber-500";
  return "bg-rose-500";
}

export function MealCard({ meal, index }: MealCardProps) {
  return (
    <li>
      <article
        aria-label={`${meal.name}, estimated cost ${formatCost(meal)}, serves ${meal.servings}`}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-card-enter"
      >
        <Card className="overflow-hidden border-amber-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-2xl mx-auto">
          <CardContent className="p-5 sm:p-6">
            {/* Title + Price */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 leading-tight">{meal.name}</h2>
              <span className={`${getCostBadgeColor(meal.estimated_cost)} text-white text-sm font-bold px-3 py-1.5 rounded-full shrink-0 ml-2 whitespace-nowrap`}>
                {formatCost(meal)}
              </span>
            </div>

            {/* Ingredients — grid: name left, amount near right, arrow far right */}
            <div className="mb-3">
              {meal.ingredients?.map((ing, j) => (
                <div
                  key={j}
                  className="grid items-center py-1.5 text-sm border-b border-gray-50 last:border-0"
                  style={{ gridTemplateColumns: "1fr auto auto", gap: "0.5rem" }}
                >
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  {ing.amount && (
                    <span className="text-gray-500 text-sm whitespace-nowrap">{ing.amount}</span>
                  )}
                  <span className="flex-shrink-0 w-5 text-center">
                    {getTrendArrow(ing.trend)}
                  </span>
                  {ing.optional && (
                    <span className="text-gray-400 text-[11px] col-span-full pl-1">optional</span>
                  )}
                </div>
              ))}
            </div>

            {/* Servings */}
            <p className="text-xs text-gray-500 mb-3">{"\uD83C\uDF7D\uFE0F"} {meal.servings || "2-4 na tao"}</p>

            {/* Bakit? */}
            {meal.reason && (
              <div className="bg-amber-50 rounded-lg p-3" style={{ border: "none" }}>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-amber-900">Bakit?</span>{" "}
                  <span className="text-stone-700">{meal.reason}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </article>
    </li>
  );
}
