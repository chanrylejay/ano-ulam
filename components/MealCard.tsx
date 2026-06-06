"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RECIPES } from "@/lib/recipes";
import { calculateRecipeNutrition } from "@/lib/nutrition";

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
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  // Client-side recipe lookup by name
  const recipe = RECIPES.find((r) => r.name === meal.name);
  const nutrition = recipe ? calculateRecipeNutrition(recipe) : null;

  const sortedIngredients = sortIngredients(meal.ingredients);
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
            {/* ── Title + Total Price ── */}
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

            {/* ── DA Ingredient Cost Breakdown ── */}
            <div className="mb-3 space-y-0">
              {visibleIngredients.map((ing, j) => {
                const isOptional = !!ing.optional;
                const trend = getTrendArrow(ing.trend);
                return (
                  <div
                    key={`${ing.name}-${j}`}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <span
                      className={`text-base font-bold shrink-0 w-4 text-center ${trend.colorClass}`}
                      aria-hidden="true"
                    >
                      {trend.icon}
                    </span>
                    <div className="flex flex-1 items-baseline gap-2 min-w-0 overflow-hidden">
                      <span
                        className={`font-semibold text-sm leading-snug shrink-0 ${isOptional ? "text-gray-400" : "text-gray-900"}`}
                      >
                        {ing.name}
                      </span>
                      {ing.amount && (
                        <span
                          className={`text-xs leading-snug shrink-0 ${isOptional ? "text-gray-300" : "text-gray-400"}`}
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
                    <span
                      className={`text-sm font-bold shrink-0 tabular-nums ${isOptional ? "text-rose-400" : "text-emerald-700"}`}
                    >
                      {formatPeso(ing.cost)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Servings ── */}
            <p className="text-xs text-gray-500 mb-3">🍽️ {meal.servings || "1-3 katao"}</p>

            {/* ── Bakit? ── */}
            {meal.reason && (
              <div className="bg-amber-50 rounded-lg p-3 mb-3">
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-amber-900">Bakit?</span>{" "}
                  <span className="text-stone-700">{meal.reason}</span>
                </p>
              </div>
            )}

            {/* ── Accordions (only render if recipe found in RECIPES) ── */}
            {recipe && (
              <div className="border-t border-gray-100 mt-1">
                {/* Accordion 1 — Buong Sangkap */}
                <button
                  onClick={() => setShowIngredients(!showIngredients)}
                  className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                  aria-expanded={showIngredients}
                >
                  <span>🧾 Buong Sangkap</span>
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${showIngredients ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {showIngredients && (
                  <div className="pb-3 space-y-1">
                    {/* DA-tracked ingredients — amounts only, no price column */}
                    {recipe.ingredients.map((ing, i) => (
                      <div key={i} className="flex items-center justify-between py-1 text-sm">
                        <span className={ing.optional ? "text-gray-400" : "text-gray-800"}>
                          {ing.name}
                          {ing.optional && (
                            <span className="ml-1.5 text-[10px] text-rose-400 font-medium">
                              ✦ optional
                            </span>
                          )}
                        </span>
                        <span className="text-gray-400 text-xs ml-2 shrink-0">{ing.amount}</span>
                      </div>
                    ))}

                    {/* Pantry Items */}
                    {recipe.pantryItems.length > 0 && (
                      <>
                        <div className="pt-2 pb-1">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                            Pantry items
                          </span>
                          <span className="ml-1.5 text-[9px] text-gray-300">
                            — hindi kasama sa DA price monitoring
                          </span>
                        </div>
                        {recipe.pantryItems.map((item, i) => (
                          <div key={i} className="flex items-center justify-between py-1 text-sm">
                            <span className="text-gray-400">{item.name}</span>
                            <span className="text-gray-300 text-xs ml-2 shrink-0">
                              {item.amount}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Accordion 2 — Paano Magluto? */}
                <button
                  onClick={() => setShowSteps(!showSteps)}
                  className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors border-t border-gray-100"
                  aria-expanded={showSteps}
                >
                  <span>👨‍🍳 Paano Magluto?</span>
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${showSteps ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {showSteps && (
                  <div className="pb-3 space-y-3">
                    {recipe.steps.map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Accordion 3 — Nutrition Facts */}
                <button
                  onClick={() => setShowNutrition(!showNutrition)}
                  className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors border-t border-gray-100"
                  aria-expanded={showNutrition}
                >
                  <span>📊 Nutrition Facts</span>
                  <span
                    className={`text-gray-400 transition-transform duration-200 ${showNutrition ? "rotate-180" : ""}`}
                  >
                    ▾
                  </span>
                </button>

                {showNutrition && nutrition && (
                  <div className="pb-3">
                    <div className="rounded-lg border border-gray-200 overflow-hidden text-sm">
                      {/* Header */}
                      <div className="bg-gray-900 text-white px-3 py-2">
                        <p className="font-black text-base">Nutrition Facts</p>
                        <p className="text-gray-300 text-xs">
                          Per serving (recipe ÷ 2) • Recipe serves 1-3
                        </p>
                      </div>

                      {/* Calories row */}
                      <div className="flex items-center justify-between px-3 py-2 border-b-4 border-gray-900">
                        <span className="font-bold text-gray-900">Calories</span>
                        <span className="font-black text-2xl text-gray-900">
                          {nutrition.calories}
                        </span>
                      </div>

                      {/* Macro rows */}
                      <div className="divide-y divide-gray-100">
                        <div className="flex justify-between px-3 py-1.5">
                          <span className="font-semibold text-gray-800">Protein</span>
                          <span className="text-gray-700 tabular-nums">{nutrition.protein}g</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5">
                          <span className="font-semibold text-gray-800">Fat</span>
                          <span className="text-gray-700 tabular-nums">{nutrition.fat}g</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5">
                          <span className="font-semibold text-gray-800">Carbs</span>
                          <span className="text-gray-700 tabular-nums">{nutrition.carbs}g</span>
                        </div>
                        <div className="flex justify-between px-3 py-1.5 bg-gray-50">
                          <span className="text-gray-500 pl-3">└ Fiber</span>
                          <span className="text-gray-500 tabular-nums">{nutrition.fiber}g</span>
                        </div>
                      </div>

                      {/* Disclaimer */}
                      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          ⚠ Rough estimates based on raw ingredient weights. Actual values may vary
                          depending on cooking method, ingredient brands, and portion size. Not a
                          substitute for clinical or professional nutrition advice.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </article>
    </li>
  );
}
