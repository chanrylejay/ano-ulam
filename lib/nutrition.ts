// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Nutrition Lookup Table & Calculator
// V2.2 — Per-100g raw ingredient macros (USDA FoodData Central)
// ═══════════════════════════════════════════════════════════

import type { Recipe } from "./recipes";

export interface RecipeNutrition {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface NutritionPer100g {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

// Gram weights for ingredients measured in pieces
const EGG_MEDIUM_GRAMS = 44;
const MAIS_GRAMS = 100;

// ═══════════════════════════════════════════════════════════
// NUTRITION TABLE — per 100g raw/uncooked
// Keys: ingredient name checked FIRST, then daKey
// This ensures "Ground Pork" (263 cal) beats daKey
// "Pork Picnic Shoulder (Kasim)" (186 cal) for accuracy
// ═══════════════════════════════════════════════════════════

const NUTRITION_TABLE: Record<string, NutritionPer100g> = {
  // ── Chicken ──────────────────────────────────────────────
  "Chicken Leg Quarter": { calories: 184, protein: 17.2, fat: 12.3, carbs: 0, fiber: 0 },
  "Chicken Breast": { calories: 120, protein: 22.5, fat: 2.6, carbs: 0, fiber: 0 },
  "Chicken Wing": { calories: 191, protein: 17.5, fat: 12.9, carbs: 0, fiber: 0 },

  // ── Pork ─────────────────────────────────────────────────
  "Ground Pork": { calories: 263, protein: 16.9, fat: 21.2, carbs: 0, fiber: 0 },
  "Pork Picnic Shoulder (Kasim)": { calories: 186, protein: 17.6, fat: 12.4, carbs: 0, fiber: 0 },
  "Pork Belly (Liempo)": { calories: 518, protein: 9.3, fat: 53.0, carbs: 0, fiber: 0 },
  "Pork Chop": { calories: 212, protein: 18.0, fat: 15.0, carbs: 0, fiber: 0 },
  "Atay ng baboy": { calories: 134, protein: 21.4, fat: 3.7, carbs: 2.5, fiber: 0 },

  // ── Beef ─────────────────────────────────────────────────
  "Beef Brisket": { calories: 314, protein: 16.3, fat: 27.5, carbs: 0, fiber: 0 },

  // ── Fish ─────────────────────────────────────────────────
  Tilapia: { calories: 96, protein: 20.1, fat: 1.7, carbs: 0, fiber: 0 },
  Bangus: { calories: 148, protein: 20.5, fat: 6.7, carbs: 0, fiber: 0 },
  Galunggong: { calories: 115, protein: 21.4, fat: 3.2, carbs: 0, fiber: 0 },
  "Sardines (Tamban)": { calories: 134, protein: 19.8, fat: 6.1, carbs: 0, fiber: 0 },

  // ── Eggs ─────────────────────────────────────────────────
  Itlog: { calories: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0 },
  "Chicken Egg (White Medium)": { calories: 143, protein: 12.6, fat: 9.5, carbs: 0.7, fiber: 0 },

  // ── Lowland Vegetables ───────────────────────────────────
  Kamatis: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  Tomato: { calories: 18, protein: 0.9, fat: 0.2, carbs: 3.9, fiber: 1.2 },
  Talong: { calories: 25, protein: 1.0, fat: 0.2, carbs: 5.9, fiber: 3.0 },
  Eggplant: { calories: 25, protein: 1.0, fat: 0.2, carbs: 5.9, fiber: 3.0 },
  Sitaw: { calories: 47, protein: 2.8, fat: 0.4, carbs: 8.4, fiber: 3.6 },
  "Pole Sitao": { calories: 47, protein: 2.8, fat: 0.4, carbs: 8.4, fiber: 3.6 },
  Kalabasa: { calories: 34, protein: 1.0, fat: 0.1, carbs: 8.6, fiber: 1.5 },
  Squash: { calories: 34, protein: 1.0, fat: 0.1, carbs: 8.6, fiber: 1.5 },
  Pechay: { calories: 13, protein: 1.5, fat: 0.2, carbs: 2.2, fiber: 1.0 },
  "Native Pechay": { calories: 13, protein: 1.5, fat: 0.2, carbs: 2.2, fiber: 1.0 },
  Ampalaya: { calories: 17, protein: 1.0, fat: 0.2, carbs: 3.7, fiber: 2.8 },
  Okra: { calories: 33, protein: 1.9, fat: 0.2, carbs: 7.5, fiber: 3.2 },
  Kangkong: { calories: 19, protein: 2.6, fat: 0.2, carbs: 3.1, fiber: 2.1 },
  Upo: { calories: 14, protein: 0.6, fat: 0.1, carbs: 3.4, fiber: 0.5 },
  Malunggay: { calories: 64, protein: 9.4, fat: 1.4, carbs: 8.3, fiber: 2.0 },
  Gabi: { calories: 112, protein: 1.5, fat: 0.2, carbs: 26.5, fiber: 4.1 },
  Mais: { calories: 86, protein: 3.2, fat: 1.2, carbs: 18.7, fiber: 2.0 },

  // ── Highland Vegetables ───────────────────────────────────
  Repolyo: { calories: 25, protein: 1.3, fat: 0.1, carbs: 5.8, fiber: 2.5 },
  "Cabbage (Scorpio)": { calories: 25, protein: 1.3, fat: 0.1, carbs: 5.8, fiber: 2.5 },
  Patatas: { calories: 77, protein: 2.0, fat: 0.1, carbs: 17.5, fiber: 2.2 },
  "White Potato Local": { calories: 77, protein: 2.0, fat: 0.1, carbs: 17.5, fiber: 2.2 },
  Carrots: { calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 },
  "Carrots Local": { calories: 41, protein: 0.9, fat: 0.2, carbs: 9.6, fiber: 2.8 },
  "Bell Pepper": { calories: 20, protein: 0.9, fat: 0.2, carbs: 4.6, fiber: 1.7 },
  "Bell Pepper (Red) Local": { calories: 20, protein: 0.9, fat: 0.2, carbs: 4.6, fiber: 1.7 },
  Broccoli: { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6 },
  "Broccoli Local": { calories: 34, protein: 2.8, fat: 0.4, carbs: 6.6, fiber: 2.6 },
  Sayote: { calories: 19, protein: 0.8, fat: 0.1, carbs: 4.5, fiber: 1.7 },
  Chayote: { calories: 19, protein: 0.8, fat: 0.1, carbs: 4.5, fiber: 1.7 },

  // ── Aromatics ─────────────────────────────────────────────
  Bawang: { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1, fiber: 2.1 },
  "Garlic Native/Local": { calories: 149, protein: 6.4, fat: 0.5, carbs: 33.1, fiber: 2.1 },
  Sibuyas: { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
  "Red Onion Local": { calories: 40, protein: 1.1, fat: 0.1, carbs: 9.3, fiber: 1.7 },
  Luya: { calories: 80, protein: 1.8, fat: 0.8, carbs: 17.8, fiber: 2.0 },
  "Ginger Local": { calories: 80, protein: 1.8, fat: 0.8, carbs: 17.8, fiber: 2.0 },
  Kalamansi: { calories: 37, protein: 0.5, fat: 0.1, carbs: 9.0, fiber: 1.5 },
  Calamansi: { calories: 37, protein: 0.5, fat: 0.1, carbs: 9.0, fiber: 1.5 },
  "Siling haba": { calories: 27, protein: 1.5, fat: 0.4, carbs: 5.3, fiber: 3.4 },
  "Chilli (Green) Local": { calories: 27, protein: 1.5, fat: 0.4, carbs: 5.3, fiber: 3.4 },
};

// ═══════════════════════════════════════════════════════════
// LOOKUP — name first, then daKey
// ═══════════════════════════════════════════════════════════

function lookupNutrition(name: string, daKey: string | null): NutritionPer100g | undefined {
  return NUTRITION_TABLE[name] ?? (daKey ? NUTRITION_TABLE[daKey] : undefined);
}

// ═══════════════════════════════════════════════════════════
// UNIT CONVERTER — qty + unit → grams
// ═══════════════════════════════════════════════════════════

function toGrams(qty: number, unit: "kg" | "pcs", name: string): number {
  if (unit === "kg") return qty * 1000;
  if (name === "Itlog" || name === "Chicken Egg (White Medium)") return qty * EGG_MEDIUM_GRAMS;
  if (name === "Mais") return qty * MAIS_GRAMS;
  return qty * 50; // safe default for unknown pcs items
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// Returns per-serving macros (total ÷ 2, recipe serves 1-3)
// Required ingredients only — same rule as cost calculation
// ═══════════════════════════════════════════════════════════

export function calculateRecipeNutrition(recipe: Recipe): RecipeNutrition {
  let calories = 0;
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  let fiber = 0;

  for (const ing of recipe.ingredients) {
    if (ing.optional) continue;

    const nutrition = lookupNutrition(ing.name, ing.daKey);
    if (!nutrition) continue;

    const grams = toGrams(ing.qty, ing.unit, ing.name);
    const factor = grams / 100;

    calories += nutrition.calories * factor;
    protein += nutrition.protein * factor;
    fat += nutrition.fat * factor;
    carbs += nutrition.carbs * factor;
    fiber += nutrition.fiber * factor;
  }

  // Per serving = total ÷ 2 (recipe serves 1-3, middle estimate)
  return {
    calories: Math.round(calories / 2),
    protein: Math.round((protein / 2) * 10) / 10,
    fat: Math.round((fat / 2) * 10) / 10,
    carbs: Math.round((carbs / 2) * 10) / 10,
    fiber: Math.round((fiber / 2) * 10) / 10,
  };
}
