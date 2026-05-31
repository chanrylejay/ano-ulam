'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';

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

function getDishEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("manok") || lower.includes("chicken")) return "🍗";
  if (lower.includes("baboy") || lower.includes("pork") || lower.includes("liempo") || lower.includes("lechon")) return "🐷";
  if (lower.includes("bangus") || lower.includes("tilapia") || lower.includes("isda") || lower.includes("fish") || lower.includes("tuna") || lower.includes("galunggong")) return "🐟";
  if (lower.includes("gulay") || lower.includes("pinakbet") || lower.includes("chopsuey") || lower.includes("monggo") || lower.includes("ampalaya") || lower.includes("talong") || lower.includes("sitaw") || lower.includes("kalabasa") || lower.includes("repolyo")) return "🥬";
  if (lower.includes("itlog") || lower.includes("egg")) return "🥚";
  return "🍽️";
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
          <CardContent className="p-3.5">
            {/* Title + Price */}
            <div className="flex items-start justify-between mb-2.5">
              <h2 className="text-lg font-bold text-gray-900">
                {getDishEmoji(meal.name)} {meal.name}
              </h2>
              <span className="text-base font-bold text-amber-800 shrink-0 ml-2 pt-0.5">
                ₱{meal.estimated_cost}
              </span>
            </div>

            {/* Ingredients Grid — 2 columns */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {meal.ingredients?.map((ing, j) => (
                <div key={j} className="flex items-center gap-1 text-sm">
                  <span className="font-medium text-gray-800">{ing.name}</span>
                  {ing.trend === "down" && (
                    <TrendingDown className="w-3.5 h-3.5 text-green-700 flex-shrink-0" aria-label="Price trending down" />
                  )}
                  {ing.trend === "up" && (
                    <TrendingUp className="w-3.5 h-3.5 text-red-600 flex-shrink-0" aria-label="Price trending up" />
                  )}
                  {ing.optional && <span className="text-gray-400 text-xs">(optional)</span>}
                </div>
              ))}
            </div>

            {/* Servings */}
            <p className="text-xs text-gray-500 mb-2.5">🍽️ {meal.servings || "2-4 na tao"}</p>

            {/* Bakit? — friendly tip, no warning box */}
            {meal.reason && (
              <div className="bg-amber-50 rounded-lg p-3">
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