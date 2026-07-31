"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { RECIPES, pantryRole } from "@/lib/recipes";
import { calculateRecipeNutrition } from "@/lib/nutrition";
import { BASE_BAND, scaleAmount, scaleCost, type ServingBand } from "@/lib/servings";
import { ownedDiscount } from "@/lib/pantry";

/** Module-level so the default prop is referentially stable across renders. */
const NOTHING_OWNED: ReadonlySet<string> = new Set<string>();

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
  /**
   * Why this dish is on the page today.
   *   "mura" — picked on price
   *   "iba"  — picked because it has waited longest, price ignored
   * Optional so older cached rows written before V2.4 still render.
   */
  slot?: "mura" | "iba";
}

interface MealCardProps {
  meal: Meal;
  index: number;
  /**
   * Today's DA sheet cannot price a required ingredient, so there is no honest
   * total to show. The recipe still renders; the cost does not. Defaults false,
   * so the homepage is unaffected.
   */
  unpriced?: boolean;
  /**
   * How many people this card is costed for. Defaults to the base band, so any
   * caller that has not adopted the picker renders exactly as it did before.
   */
  band?: ServingBand;
  /**
   * Ingredient names the person already has at home. Their cost comes off the
   * total and their rows are struck through. Defaults to nothing owned, so any
   * caller that has not adopted the pantry renders exactly as it did before.
   */
  owned?: ReadonlySet<string>;
}

function formatPeso(amount: number | undefined, multiplier: number): string {
  if (amount === undefined || amount === null || Number.isNaN(amount)) return "";
  return `₱${scaleCost(amount, multiplier)}`;
}

/** The cached row can carry the cost as a number OR as a "₱123" string. */
function parseCost(meal: Meal): number | null {
  if (meal.estimated_cost === undefined || meal.estimated_cost === null) return null;
  const cost = Number(String(meal.estimated_cost).replace(/[₱,]/g, ""));
  return Number.isFinite(cost) ? cost : null;
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

export function MealCard({
  meal,
  index,
  unpriced = false,
  band = BASE_BAND,
  owned = NOTHING_OWNED,
}: MealCardProps) {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);

  // Client-side recipe lookup by name
  const recipe = RECIPES.find((r) => r.name === meal.name);
  const recipeForPantry = recipe;
  const nutrition = recipe ? calculateRecipeNutrition(recipe) : null;

  const sortedIngredients = sortIngredients(meal.ingredients);

  /**
   * The name of the first row that is a pantry good, or null when the dish has
   * none. The "common ingredients" divider renders in front of it.
   */
  const firstCommonName = (() => {
    if (!recipeForPantry) return null;
    const pantryNames = new Set(recipeForPantry.pantryItems.map((p) => p.name));
    const hit = sortIngredients(meal.ingredients).find((ing) => pantryNames.has(ing.name));
    return hit ? hit.name : null;
  })();
  const visibleIngredients = sortedIngredients.filter((ing) => {
    if (ing.optional && (!ing.cost || ing.cost === 0)) return false;
    return true;
  });

  // ── The fridge, applied to this dish ──────────────────────────────
  const baseCost = parseCost(meal);
  const discount = ownedDiscount(meal.ingredients, owned);
  // Floored at zero. Owning everything means the dish costs you nothing to shop
  // for today, never a negative amount.
  const effectiveBase = baseCost === null ? null : Math.max(0, baseCost - discount);
  const saved = baseCost === null ? 0 : Math.min(discount, baseCost);
  const ownedInThisDish = meal.ingredients.filter((ing) => owned.has(ing.name)).length;
  const costLabel =
    effectiveBase === null ? "₱?" : `₱${scaleCost(effectiveBase, band.multiplier)}`;

  return (
    <li>
      <article
        aria-label={`${meal.name}, ${unpriced ? "walang presyo ngayon" : `estimated cost ${costLabel}`}, serves ${band.label}`}
        style={{ animationDelay: `${index * 80}ms` }}
        className="animate-card-enter"
      >
        <Card className="overflow-hidden border-amber-100 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 w-full max-w-2xl mx-auto">
          <CardContent className="p-5 sm:p-6">
            {/* ── Title + Total Price ── */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                {/*
                  Rotation picks are chosen for variety, not price, so they say
                  so. Without this a ₱255 dish sits next to a ₱70 one with
                  nothing to explain why, and the page quietly stops meaning
                  "murang ulam".

                  Deliberately NOT a pill. It was a bordered uppercase badge and
                  Chan's verdict was "the badge is ugly" — the box is what made
                  it shout. A quiet kicker line does the same job without
                  competing with the dish name underneath it.
                */}
                {meal.slot === "iba" && (
                  <span className="mb-0.5 block text-xs font-semibold text-amber-600">
                    Maiba naman
                  </span>
                )}
                <h2 className="text-lg sm:text-xl font-bold text-gray-950 leading-tight">
                  {meal.name}
                </h2>
              </div>
              {/*
                The DA sheet cannot always price every required ingredient. On the
                browse page those dishes still get a card, but never a number:
                this project's canon treats a rendered ₱0 as a lie (it once made a
                Galunggong dish rank cheapest).
              */}
              {unpriced ? (
                <span className="bg-gray-100 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap border border-gray-200">
                  Walang presyo
                </span>
              ) : (
                /*
                  Three things deliberately do not move together here.

                  The NUMBER scales with the servings band and drops with the
                  fridge. The COLOUR is read from the base per-1-3-katao cost
                  AFTER the fridge but BEFORE the servings scale, because "mura"
                  is a property of the dish and of what you already own, not of
                  how many mouths are being fed. Colouring the scaled total
                  would turn every card red at the bigger bands and destroy the
                  signal completely.

                  ₱0 is allowed here, and only here. This project's canon bans a
                  rendered ₱0 because a MISSING price once read as free and
                  ranked a dish cheapest. This ₱0 has the opposite cause: you own
                  every ingredient, so the dish really does cost you nothing to
                  shop for today. Different fact, honest number.
                */
                <span
                  className={`${getCostBadgeColor(effectiveBase ?? Number.NaN)} text-white text-sm font-bold px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap`}
                >
                  {costLabel}
                </span>
              )}
            </div>

            {/* ── DA Ingredient Cost Breakdown ── */}
            {unpriced && (
              <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-500">
                Walang presyo ang DA ngayon para sa isa sa mga kailangang sangkap, kaya walang
                total. Nasa ibaba pa rin ang buong recipe.
              </p>
            )}
            <div className="mb-3 space-y-0">
              {visibleIngredients.map((ing, j) => {
                const isOptional = !!ing.optional;
                const isOwned = owned.has(ing.name);
                const trend = getTrendArrow(ing.trend);

                /*
                  "common ingredients*" divider, Chan's layout of 30 Jul 2026:
                  *"i think we should have pantry items section before the
                  optional items, pantry sections, pantry section still should
                  have price"*.

                  It marks where the dish's own ingredients end and the cabinet
                  staples begin, and it goes in FRONT of the first pantry row so
                  the optionals that follow sit under it too.

                  Membership comes from the recipe's own pantryItems rather than
                  a flag on the row, because the homepage renders CACHED cron
                  output whose rows carry no such flag. Reading the recipe works
                  for both the live page and the cached one.
                */
                const startsCommon = firstCommonName !== null && ing.name === firstCommonName;

                return (
                  <div key={`wrap-${ing.name}-${j}`}>
                    {startsCommon && (
                      <p className="mt-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Common ingredients
                      </p>
                    )}
                  <div
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
                        className={`font-semibold text-sm leading-snug shrink-0 ${
                          isOwned
                            ? "text-gray-400 line-through decoration-gray-300"
                            : isOptional
                              ? "text-gray-400"
                              : "text-gray-900"
                        }`}
                      >
                        {ing.name}
                      </span>
                      {ing.amount && (
                        <span
                          className={`text-xs leading-snug shrink-0 ${
                            isOwned
                              ? "text-gray-300 line-through decoration-gray-200"
                              : isOptional
                                ? "text-gray-300"
                                : "text-gray-400"
                          }`}
                        >
                          {scaleAmount(ing.amount, band.multiplier)}
                        </span>
                      )}
                      {isOptional && (
                        <span className="rounded-full bg-rose-50 px-1.5 py-px text-[10px] font-medium text-rose-400 ring-1 ring-rose-100 shrink-0">
                          optional
                        </span>
                      )}
                    </div>
                    {isOwned ? (
                      /*
                        Two shades, because one would be a lie.

                        An owned REQUIRED ingredient really did come off the
                        total, so it gets the emerald that means "you saved
                        this". An owned OPTIONAL one never counted toward the
                        total in the first place, so it stays grey. It is still
                        struck through, because the person genuinely owns it,
                        but a green badge claiming a saving it never made is
                        exactly how a total stops adding up in front of someone.
                        Caught in the browser: ticking Bawang struck two rows in
                        Tortang Talong and moved the price by ₱0, which looked
                        broken while being perfectly correct.
                      */
                      <span
                        className={`shrink-0 whitespace-nowrap text-xs font-semibold ${
                          isOptional ? "text-gray-400" : "text-emerald-700"
                        }`}
                      >
                        meron ka na
                      </span>
                    ) : (
                      <span
                        className={`text-sm font-bold shrink-0 tabular-nums ${isOptional ? "text-gray-300" : "text-emerald-700"}`}
                      >
                        {/*
                          An OPTIONAL row shows no price at all. Chan, 30 Jul
                          2026: *"optional items should have no price and not
                          counted on total"*.

                          It never counted toward the total, and printing a peso
                          figure next to something the total ignores invites the
                          reader to add it up themselves and get a number the
                          card does not agree with. A dash says "bring it if you
                          want" without pretending to be part of the bill.
                        */}
                        {isOptional ? "—" : formatPeso(ing.cost, band.multiplier)}
                      </span>
                    )}
                  </div>
                  </div>
                );
              })}
            </div>

            {/* ── Servings ── */}
            <p className="text-xs text-gray-500 mb-3">🍽️ {band.label}</p>

            {/*
              What the fridge did to THIS dish. Without this line the total
              silently disagrees with the rows above it, and a number that does
              not add up in front of you reads as a bug even when it is right.
            */}
            {!unpriced && saved > 0 && (
              <p className="-mt-1.5 mb-3 text-xs font-medium text-emerald-700">
                🧺 Meron ka na ng {ownedInThisDish} sangkap · nakatipid ka ng ₱
                {scaleCost(saved, band.multiplier)}
              </p>
            )}

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
                {/*
                  The "Buong Sangkap" accordion and its pantry list are GONE,
                  removed 30 Jul 2026 at Chan's request: *"we will remove the
                  buong sangkap section dropdown, and the pantry items, since
                  were gonna introduce to user ticking of items on their pantry
                  and to display accurate prices"*.

                  It stopped earning its space once the priced list above became
                  the whole shopping list. Oil, pepper, asin and the sauces are
                  real lines there now, ticking them lives on /pantry, and a
                  second copy of the same goods under a "free" heading was the
                  duplicate this file kept having to work around.
                */}
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
                        {/*
                          Per-serving macros do NOT move with the band. More
                          people means more food AND more servings, so the ratio
                          holds; only the number of servings changes.
                        */}
                        <p className="text-gray-300 text-xs">
                          Per serving • Recipe serves {band.people}
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
