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

export function MealCard({ meal, index }: MealCardProps) {
  return (
    <li>
      <article
        aria-label={`${meal.name}, estimated cost ₱${meal.estimated_cost}, serves ${meal.servings}`}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-card-enter"
      >
        <Card className="overflow-hidden border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-3.5">
            {/* Title + Price */}
            <div className="flex items-start justify-between mb-2.5">
              <h2 className="text-lg font-bold text-gray-900">{meal.name}</h2>
              <span className="bg-amber-500 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0 ml-2">
                ₱{meal.estimated_cost}
              </span>
            </div>

            {/* Ingredients Grid — 2 columns */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {meal.ingredients?.map((ing, j) => (
                <div key={j} className="flex items-center gap-1 text-sm">
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  {ing.trend === "down" && (
                    <span className="text-green-600 font-bold flex-shrink-0">↓</span>
                  )}
                  {ing.trend === "up" && (
                    <span className="text-red-600 font-bold flex-shrink-0">↑</span>
                  )}
                  {ing.amount && (
                    <span className="text-gray-400 text-xs">{ing.amount}</span>
                  )}
                  {ing.optional && <span className="text-gray-400 text-xs">(optional)</span>}
                </div>
              ))}
            </div>

            {/* Servings */}
            <p className="text-xs text-gray-500 mb-2.5">🍽️ {meal.servings || "2-4 na tao"}</p>

            {/* Bakit? */}
            {meal.reason && (
              <div className="bg-amber-50 rounded-lg p-3 border-transparent">
                <p className="text-sm text-amber-900">
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