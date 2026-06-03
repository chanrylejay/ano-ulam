"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Ingredient {
  name: string;
  trend: "down" | "up" | "stable";
  optional?: boolean;
  amount?: string;
  cost?: number;
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

function formatPeso(amount?: number): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "";
  return `₱${Math.round(amount)}`;
}

function formatCost(meal: Meal): string {
  if (meal.estimated_cost !== undefined && meal.estimated_cost !== null) {
    const cost = String(meal.estimated_cost).replace(/[₱,]/g, "");
    return `₱${cost}`;
  }
  return "₱?";
}

function getCostBadgeColor(cost: number): string {
  const n = typeof cost === "number" ? cost : parseFloat(String(cost).replace(/[₱,]/g, ""));
  if (isNaN(n)) return "bg-amber-500";
  if (n <= 150) return "bg-emerald-500";
  if (n <= 220) return "bg-amber-500";
  return "bg-rose-500";
}

function getTrendArrow(trend: string): { icon: string; colorClass: string } {
  if (trend === "down") return { icon: "↓", colorClass: "text-emerald-700" };
  if (trend === "up") return { icon: "↑", colorClass: "text-rose-500" };
  return { icon: "→", colorClass: "text-gray-300" };
}

function sortIngredients(ingredients: Ingredient[] = []): Ingredient[] {
  return [...ingredients].sort((a, b) => {
    if (!!a.optional === !!b.optional) return 0;
    return a.optional ? 1 : -1;
  });
}

export function MealCard({ meal, index }: MealCardProps) {
  const sortedIngredients = sortIngredients(meal.ingredients);

  // Hide optional ingredients with no price data (₱0 or undefined)
  // These are items where the DA price is missing — showing ₱0 is misleading
  const visibleIngredients = sortedIngredients.filter((ing) => {
    if (ing.optional && (!ing.cost || ing.cost === 0)) return false;
    return true;
  });

  return (
    <li>
      <article
        aria-label={`${meal.name}, estimated cost ${formatCost(meal)}, serves ${meal.servings || "1-3 katao"}`}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-card-enter"
      >
        <Card className="overflow-hidden border-amber-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-2xl mx-auto">
          <CardContent className="p-5 sm:p-6">
            {/* Title + Total Price */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 leading-tight">
                {meal.name}
              </h2>
              <span
                className={`${getCostBadgeColor(meal.estimated_cost)} text-white text-sm font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap`}
              >
                {formatCost(meal)}
              </span>
            </div>

            {/* Ingredient rows — compact single-line each */}
            <div className="mb-3 space-y-0">
              {visibleIngredients.map((ing, j) => {
                const isOptional = !!ing.optional;
                const trend = getTrendArrow(ing.trend);

                return (
                  <div
                    key={`${ing.name}-${j}`}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    {/* Trend arrow */}
                    <span
                      className={`text-base font-bold shrink-0 w-4 text-center ${trend.colorClass}`}
                      aria-hidden="true"
                    >
                      {trend.icon}
                    </span>

                    {/* Name + amount + optional badge */}
                    <div className="flex flex-1 items-baseline gap-2 min-w-0 overflow-hidden">
                      <span
                        className={`font-semibold text-sm leading-snug shrink-0 ${
                          isOptional ? "text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {ing.name}
                      </span>

                      {ing.amount && (
                        <span
                          className={`text-xs leading-snug shrink-0 ${
                            isOptional ? "text-gray-300" : "text-gray-400"
                          }`}
                        >
                          {ing.amount}
                        </span>
                      )}

                      {isOptional && (
                        <span className="rounded-full bg-rose-50 px-1.5 py-px text-[10px] font-medium text-rose-400 ring-1 ring-rose-100 shrink-0">
                          optional
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <span
                      className={`text-sm font-bold shrink-0 tabular-nums ${
                        isOptional ? "text-rose-400" : "text-emerald-700"
                      }`}
                    >
                      {formatPeso(ing.cost)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Servings */}
            <p className="text-xs text-gray-500 mb-3">🍽️ {meal.servings || "1-3 katao"}</p>

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
