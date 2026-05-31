'use client';

import { Card, CardContent } from '@/components/ui/card';

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
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "₱?";
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

function getTrendIcon(trend: string): string {
  if (trend === "down") return "⬇️";
  if (trend === "up") return "⬆️";
  return "→";
}

function getTrendClass(trend: string): string {
  if (trend === "down") return "text-emerald-600";
  if (trend === "up") return "text-amber-600";
  return "text-gray-300";
}

function sortIngredients(ingredients: Ingredient[] = []): Ingredient[] {
  return [...ingredients].sort((a, b) => {
    if (!!a.optional === !!b.optional) return 0;
    return a.optional ? 1 : -1;
  });
}

export function MealCard({ meal, index }: MealCardProps) {
  const sortedIngredients = sortIngredients(meal.ingredients);

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
            <div className="flex items-start justify-between gap-3 mb-5">
              <h2 className="text-lg sm:text-xl font-bold text-gray-950 leading-tight">
                {meal.name}
              </h2>
              <span className={`${getCostBadgeColor(meal.estimated_cost)} text-white text-sm font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap`}>
                {formatCost(meal)}
              </span>
            </div>

            {/* Ingredient cost breakdown */}
            <div className="mb-4 divide-y divide-gray-50">
              {sortedIngredients.map((ing, j) => {
                const isOptional = !!ing.optional;

                return (
                  <div key={`${ing.name}-${j}`} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-base leading-none ${getTrendClass(ing.trend)}`} aria-hidden="true">
                            {getTrendIcon(ing.trend)}
                          </span>
                          <span className={`font-semibold leading-snug ${isOptional ? "text-gray-500" : "text-gray-900"}`}>
                            {ing.name}
                          </span>
                        </div>

                        <div className="pl-7 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          {ing.amount && (
                            <span className={`text-sm ${isOptional ? "text-gray-400" : "text-gray-500"}`}>
                              {ing.amount}
                            </span>
                          )}
                          {isOptional && (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500 ring-1 ring-rose-100">
                              optional
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right pt-0.5">
                        <span className={`text-sm font-bold whitespace-nowrap ${isOptional ? "text-rose-500" : "text-emerald-600"}`}>
                          {formatPeso(ing.cost)}
                        </span>
                      </div>
                    </div>
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
