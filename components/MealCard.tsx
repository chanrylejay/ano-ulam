'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

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
        <Card className="overflow-hidden border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            {/* Title + Price */}
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">{meal.name}</h2>
              <span className="bg-amber-600 text-white text-sm font-bold px-3 py-1 rounded-full shrink-0 ml-2 transition-transform duration-150 hover:scale-105">
                ₱{meal.estimated_cost}
              </span>
            </div>

            {/* Ingredients Grid — 2 columns */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {meal.ingredients?.map((ing, j) => (
                <div key={j} className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  {ing.trend === "down" && (
                    <TrendingDown className="w-3.5 h-3.5 text-green-700" aria-label="Price trending down" />
                  )}
                  {ing.trend === "up" && (
                    <TrendingUp className="w-3.5 h-3.5 text-red-600" aria-label="Price trending up" />
                  )}
                  {ing.trend === "stable" && (
                    <Minus className="w-3.5 h-3.5 text-gray-400" aria-label="Price stable" />
                  )}
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
          </CardContent>
        </Card>
      </article>
    </li>
  );
}