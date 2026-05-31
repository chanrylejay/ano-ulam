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
  if (trend === "down") return <span className="text-green-600 font-bold flex-shrink-0 ml-1">↓</span>;
  if (trend === "up") return <span className="text-red-600 font-bold flex-shrink-0 ml-1">↑</span>;
  return <span className="text-gray-300 font-bold flex-shrink-0 ml-1">→</span>;
}

function formatCost(meal: Meal): string {
  if (meal.estimated_cost) {
    return `₱${meal.estimated_cost}`;
  }
  return "₱?";
}

export function MealCard({ meal, index }: MealCardProps) {
  return (
    <li>
      <article
        aria-label={`${meal.name}, estimated cost ${formatCost(meal)}, serves ${meal.servings}`}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-card-enter"
      >
        <Card className="overflow-hidden border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4 sm:p-5">
            {/* Title + Price */}
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{meal.name}</h2>
              <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0 ml-2">
                {formatCost(meal)}
              </span>
            </div>

            {/* Ingredients — one per row with name + amount + arrow */}
            <div className="space-y-1.5 mb-3">
              {meal.ingredients?.map((ing, j) => (
                <div key={j} className="flex items-center text-sm">
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  {ing.amount && (
                    <span className="text-gray-500 text-xs ml-auto mr-1">{ing.amount}</span>
                  )}
                  {getTrendArrow(ing.trend)}
                  {ing.optional && (
                    <span className="text-gray-400 text-[11px] ml-1">optional</span>
                  )}
                </div>
              ))}
            </div>

            {/* Servings */}
            <p className="text-xs text-gray-500 mb-3">🍽️ {meal.servings || "2-4 na tao"}</p>

            {/* Bakit? */}
            {meal.reason && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-sm text-amber-900 leading-relaxed">
                  <span className="font-bold text-amber-800">Bakit?</span>{" "}
                  <span className="text-amber-800">{meal.reason}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </article>
    </li>
  );
}