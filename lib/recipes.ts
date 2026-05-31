// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Recipe Database & Cost Engine
// V2 Balanced Recommendation Engine
// 47 Filipino recipes with DA price mapping + smarter variety rules
// ═══════════════════════════════════════════════════════════

export interface RecipeIngredient {
  /** Display name (Filipino) */
  name: string;
  /** DA commodity key — null if not tracked by DA */
  daKey: string | null;
  /** Quantity needed */
  qty: number;
  /** Unit: kg or pcs */
  unit: "kg" | "pcs";
  /** Human-readable amount for display */
  amount: string;
  /** Required or optional */
  optional: boolean;
  /** Fallback price per unit when daKey is null */
  fallbackPrice?: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: string;
  ingredients: RecipeIngredient[];
}

export interface PriceMap {
  [daKey: string]: number;
}

export interface CostResult {
  recipe: Recipe;
  totalCost: number;
  ingredientCosts: {
    name: string;
    amount: string;
    cost: number;
    trend: "down" | "up" | "stable";
    optional: boolean;
  }[];
}

type Unit = "kg" | "pcs";

type RawIngredient = [
  name: string,
  daKey: string | null,
  qty: number,
  unit: Unit,
  amount: string,
  optional?: boolean,
  fallbackPrice?: number,
];

function ing(
  name: string,
  daKey: string | null,
  qty: number,
  unit: Unit,
  amount: string,
  optional = false,
  fallbackPrice?: number,
): RecipeIngredient {
  return { name, daKey, qty, unit, amount, optional, fallbackPrice };
}

function recipe(id: string, name: string, ingredients: RawIngredient[]): Recipe {
  return {
    id,
    name,
    servings: "2-4 na tao",
    ingredients: ingredients.map((x) => ing(...x)),
  };
}

// ═══════════════════════════════════════════════════════════
// RECIPES (47 dishes)
// Notes:
// - Optional ingredients are displayed but not counted in base cost.
// - Missing required DA prices now exclude a recipe from recommendations.
// - Main chicken/fish portions are normalized by the cost engine, not manually duplicated here.
// ═══════════════════════════════════════════════════════════

export const RECIPES: Recipe[] = [
  recipe("adobong-manok", "Adobong Manok", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
    ["Bawang", "Garlic Native/Local", 0.06, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs", true],
    ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "2 pcs", true],
  ]),

  recipe("sinigang-na-baboy", "Sinigang na Baboy", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Gabi", null, 0.25, "kg", "1 pc", false, 50],
    ["Kangkong", null, 0.175, "kg", "1 tali", false, 100],
    ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
    ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
    ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),

  recipe("kare-kare", "Kare-Kare", [
    ["Beef litid", "Beef Brisket", 0.5, "kg", "1/2 kg"],
    ["Talong", "Eggplant", 0.2, "kg", "1 pc"],
    ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
    ["Pechay", "Native Pechay", 0.2, "kg", "1 tali"],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4 cloves"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
  ]),

  recipe("tinolang-manok", "Tinolang Manok", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
    ["Sayote", "Chayote", 0.4, "kg", "1 pc"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Malunggay", null, 0.04, "kg", "1 tali", true, 250],
  ]),

  recipe("lechon-kawali", "Lechon Kawali", [
    ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves"],
  ]),

  recipe("lumpiang-shanghai", "Lumpiang Shanghai", [
    ["Giniling (Kasim)", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4 cloves"],
    ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
  ]),

  recipe("pork-sisig", "Pork Sisig", [
    ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
    ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
    ["Siling green", "Chilli (Green) Local", 0.02, "kg", "2-4 pcs"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs"],
    ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
  ]),

  recipe("nilagang-baboy", "Nilagang Baboy", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
    ["Mais", null, 1, "pcs", "1 pc", true, 18],
  ]),

  recipe("chicken-afritada", "Chicken Afritada", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
  ]),

  recipe("pork-menudo", "Pork Menudo", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Atay ng baboy", null, 0.25, "kg", "1/4 kg", true, 225],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
  ]),

  recipe("ginataang-kalabasa", "Ginataang Kalabasa", [
    ["Kalabasa", "Squash", 0.5, "kg", "1/2 kg"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
    ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),

  recipe("tortang-talong", "Tortang Talong", [
    ["Talong", "Eggplant", 0.4, "kg", "2-3 pcs"],
    ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
    ["Sibuyas", "Red Onion Local", 0.065, "kg", "1 pc", true],
    ["Bawang", "Garlic Native/Local", 0.015, "kg", "2-3 cloves", true],
    ["Giniling (Kasim)", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
  ]),

  recipe("pinakbet", "Pinakbet", [
    ["Kalabasa", "Squash", 0.25, "kg", "1/4 kg"],
    ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
    ["Talong", "Eggplant", 0.275, "kg", "1-2 pcs"],
    ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
    ["Ampalaya", "Ampalaya", 0.2, "kg", "1 pc", true],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
  ]),

  recipe("giniling-na-baboy", "Giniling na Baboy", [
    ["Giniling (Kasim)", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.175, "kg", "1 pc"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("ginisang-sayote", "Ginisang Sayote", [
    ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
    ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("pritong-tilapia", "Pritong Tilapia", [
    ["Tilapia", "Tilapia", 0.75, "kg", "3/4 kg"],
    ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
  ]),

  recipe("ginisang-repolyo-at-manok", "Ginisang Repolyo at Manok", [
    ["Repolyo", "Cabbage (Scorpio)", 0.5, "kg", "1/2 head"],
    ["Dibdib ng manok", "Chicken Breast", 0.625, "kg", "1/2 kg"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("sopas", "Sopas", [
    ["Dibdib ng manok", "Chicken Breast", 0.25, "kg", "1/4 kg"],
    ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("ginisang-ampalaya", "Ginisang Ampalaya", [
    ["Ampalaya", "Ampalaya", 0.4, "kg", "1-2 pcs"],
    ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
    ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Giniling (Kasim)", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
  ]),

  recipe("chicken-caldereta", "Chicken Caldereta", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
  ]),

  recipe("beef-nilaga", "Beef Nilaga", [
    ["Beef litid", "Beef Brisket", 0.5, "kg", "1/2 kg"],
    ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
    ["Mais", null, 1, "pcs", "1 pc", true, 18],
  ]),

  recipe("ginataang-sitaw-at-kalabasa", "Ginataang Sitaw at Kalabasa", [
    ["Kalabasa", "Squash", 0.5, "kg", "1/2 kg"],
    ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),

  recipe("ginisang-pechay-at-baboy", "Ginisang Pechay at Baboy", [
    ["Pechay", "Native Pechay", 0.325, "kg", "1-2 tali"],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
    ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("ginisang-sayote-at-manok", "Ginisang Sayote at Manok", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
    ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
    ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
  ]),

  recipe("ginisang-sayote-at-baboy", "Ginisang Sayote at Baboy", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
    ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("pritong-manok", "Pritong Manok", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
  ]),

  recipe("beef-broccoli", "Beef Broccoli", [
    ["Beef litid", "Beef Brisket", 0.5, "kg", "1/2 kg"],
    ["Broccoli", "Broccoli Local", 0.4, "kg", "1 head"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc", true],
  ]),

  recipe("ginisang-upo", "Ginisang Upo", [
    ["Upo", null, 0.7, "kg", "1 pc", false, 50],
    ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
  ]),

  recipe("ginataang-tilapia", "Ginataang Tilapia", [
    ["Tilapia", "Tilapia", 0.625, "kg", "2-3 pcs"],
    ["Pechay", "Native Pechay", 0.2, "kg", "1 tali"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),

  recipe("pritong-bangus", "Pritong Bangus", [
    ["Bangus", "Bangus", 0.75, "kg", "3/4 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo", true],
  ]),

  recipe("sarciadong-tilapia", "Sarciadong Tilapia", [
    ["Tilapia", "Tilapia", 0.625, "kg", "2-3 pcs"],
    ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "1-2 pcs"],
  ]),

  recipe("pritong-galunggong", "Pritong Galunggong", [
    ["Galunggong", "Galunggong", 0.625, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
    ["Bawang", "Garlic Native/Local", 0.025, "kg", "3-4 cloves", true],
  ]),

  recipe("sarciadong-galunggong", "Sarciadong Galunggong", [
    ["Galunggong", "Galunggong", 0.5, "kg", "1/2 kg"],
    ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "1-2 pcs"],
  ]),

  recipe("pritong-tamban", "Pritong Tamban", [
    ["Tamban", "Sardines (Tamban)", 0.5, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
    ["Bawang", "Garlic Native/Local", 0.025, "kg", "3-4 cloves", true],
  ]),

  recipe("tortang-giniling", "Tortang Giniling", [
    ["Giniling (Kasim)", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
    ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Patatas", "White Potato Local", 0.175, "kg", "1 pc", true],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc", true],
  ]),

  recipe("pritong-pork-chop", "Pritong Pork Chop", [
    ["Pork chop", "Pork Chop", 0.5, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
    ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
  ]),

  recipe("pritong-liempo", "Pritong Liempo", [
    ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
    ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
  ]),

  recipe("pritong-pakpak-ng-manok", "Pritong Pakpak ng Manok", [
    ["Pakpak ng manok", "Chicken Wing", 0.625, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
  ]),

  recipe("adobong-baboy", "Adobong Baboy", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs", true],
    ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "2 pcs", true],
  ]),

  recipe("pork-mechado", "Pork Mechado", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
  ]),

  recipe("beef-mechado", "Beef Mechado", [
    ["Beef litid", "Beef Brisket", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs", true],
  ]),

  recipe("pork-caldereta", "Pork Caldereta", [
    ["Kasim", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
  ]),

  recipe("beef-caldereta", "Beef Caldereta", [
    ["Beef litid", "Beef Brisket", 0.5, "kg", "1/2 kg"],
    ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
    ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
  ]),

  recipe("chicken-inasal", "Chicken Inasal", [
    ["Paa ng manok", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
  ]),

  recipe("inihaw-na-liempo", "Inihaw na Liempo", [
    ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
  ]),

  recipe("inihaw-na-bangus", "Inihaw na Bangus", [
    ["Bangus", "Bangus", 0.75, "kg", "3/4 kg"],
    ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
    ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),

  recipe("sinigang-na-bangus", "Sinigang na Bangus", [
    ["Bangus", "Bangus", 0.625, "kg", "1/2 kg"],
    ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
    ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ["Kangkong", null, 0.175, "kg", "1 tali", false, 100],
    ["Gabi", null, 0.25, "kg", "1 pc", false, 50],
    ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
    ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
    ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
  ]),
];

// ═══════════════════════════════════════════════════════════
// SMART COST ENGINE
// ═══════════════════════════════════════════════════════════

function getProteinType(recipe: Recipe): "fish" | "chicken" | "pork" | "beef" | "egg" | "veggie" | "other" {
  const id = recipe.id;

  if (
    id.includes("manok") ||
    id.includes("chicken") ||
    id.includes("inasal") ||
    id.includes("pakpak") ||
    id.includes("afritada") ||
    id.includes("sopas") ||
    id.includes("repolyo-at-manok")
  ) return "chicken";

  if (
    id.includes("baboy") ||
    id.includes("pork") ||
    id.includes("liempo") ||
    id.includes("lechon") ||
    id.includes("sisig") ||
    id.includes("lumpia") ||
    id.includes("giniling") ||
    id.includes("menudo") ||
    id.includes("mechado") ||
    id.includes("caldereta") ||
    id.includes("inihaw-na-liempo")
  ) return "pork";

  if (id.includes("beef") || id.includes("kare-kare") || id.includes("broccoli")) return "beef";

  if (
    id.includes("bangus") ||
    id.includes("tilapia") ||
    id.includes("galunggong") ||
    id.includes("tamban") ||
    id.includes("sarciadong")
  ) return "fish";

  if (id.includes("tortang-talong") || id.includes("ampalaya") || id.includes("tortang-giniling")) return "egg";

  if (
    id.includes("pinakbet") ||
    id.includes("ginataang-kalabasa") ||
    id.includes("upo") ||
    id.includes("sayote") ||
    id.includes("pechay")
  ) return "veggie";

  return "other";
}

function getMainIngredientKey(recipe: Recipe): string {
  const required = recipe.ingredients.find((ing) => !ing.optional);
  if (!required) return recipe.id;

  const key = (required.daKey || required.name).toLowerCase();

  if (key.includes("galunggong")) return "galunggong";
  if (key.includes("tilapia")) return "tilapia";
  if (key.includes("bangus")) return "bangus";
  if (key.includes("tamban") || key.includes("sardines")) return "tamban";
  if (key.includes("chicken leg") || key.includes("paa ng manok")) return "chicken-leg";
  if (key.includes("chicken breast") || key.includes("dibdib")) return "chicken-breast";
  if (key.includes("chicken wing") || key.includes("pakpak")) return "chicken-wing";
  if (key.includes("pork belly") || key.includes("liempo")) return "liempo";
  if (key.includes("pork chop")) return "pork-chop";
  if (key.includes("pork picnic") || key.includes("kasim")) return "kasim";
  if (key.includes("beef")) return "beef";
  if (key.includes("eggplant") || key.includes("talong")) return "talong";
  if (key.includes("ampalaya")) return "ampalaya";
  if (key.includes("squash") || key.includes("kalabasa")) return "kalabasa";
  if (key.includes("upo")) return "upo";
  if (key.includes("sayote") || key.includes("chayote")) return "sayote";
  if (key.includes("pechay")) return "pechay";

  return key;
}

function isMainProteinIngredient(recipe: Recipe, ing: RecipeIngredient): boolean {
  if (ing.optional) return false;
  const protein = getProteinType(recipe);
  const key = (ing.daKey || ing.name).toLowerCase();

  if (protein === "chicken") return key.includes("chicken");
  if (protein === "fish") {
    return (
      key.includes("bangus") ||
      key.includes("tilapia") ||
      key.includes("galunggong") ||
      key.includes("tamban") ||
      key.includes("sardines")
    );
  }
  return false;
}

function normalizeIngredientForCost(recipe: Recipe, ing: RecipeIngredient): RecipeIngredient {
  // Family-realistic adjustment:
  // Main chicken/fish dishes should not look artificially cheap at 1/2 kg.
  // Sopas and mixed ginisa chicken dishes remain as-is because protein is not the main bulk.
  const excludedSmallProteinRecipes = new Set([
    "sopas",
    "ginisang-repolyo-at-manok",
    "ginisang-sayote-at-manok",
  ]);

  if (
    !excludedSmallProteinRecipes.has(recipe.id) &&
    isMainProteinIngredient(recipe, ing) &&
    ing.unit === "kg" &&
    ing.qty < 0.75
  ) {
    return {
      ...ing,
      qty: 0.75,
      amount: "3/4 kg",
    };
  }

  return ing;
}

function hasRequiredPrices(recipe: Recipe, priceMap: PriceMap): boolean {
  return recipe.ingredients.every((ing) => {
    if (ing.optional) return true;
    if (ing.daKey === null) return ing.fallbackPrice !== undefined;
    const price = priceMap[ing.daKey];
    return typeof price === "number" && Number.isFinite(price) && price > 0;
  });
}

function getIngredientCost(recipe: Recipe, ing: RecipeIngredient, priceMap: PriceMap): number {
  const normalized = normalizeIngredientForCost(recipe, ing);

  if (normalized.daKey && priceMap[normalized.daKey] !== undefined) {
    return priceMap[normalized.daKey] * normalized.qty;
  }

  if (normalized.fallbackPrice !== undefined) {
    return normalized.fallbackPrice * normalized.qty;
  }

  return 0;
}

function getIngredientTrend(
  ing: RecipeIngredient,
  todayPrices: PriceMap,
  lastPrices: PriceMap,
): "down" | "up" | "stable" {
  if (!ing.daKey) return "stable";

  const today = todayPrices[ing.daKey];
  const last = lastPrices[ing.daKey];

  if (today === undefined || last === undefined) return "stable";
  if (today < last) return "down";
  if (today > last) return "up";
  return "stable";
}

export function calculateRecipeCost(recipe: Recipe, priceMap: PriceMap): number {
  if (!hasRequiredPrices(recipe, priceMap)) return Number.POSITIVE_INFINITY;

  let total = 0;
  for (const ing of recipe.ingredients) {
    if (!ing.optional) total += getIngredientCost(recipe, ing, priceMap);
  }

  return Math.round(total);
}

export function calculateRecipeCostDetailed(
  recipe: Recipe,
  todayPrices: PriceMap,
  lastPrices: PriceMap,
): CostResult {
  let totalCost = 0;

  const ingredientCosts = recipe.ingredients.map((originalIng) => {
    const ing = normalizeIngredientForCost(recipe, originalIng);
    const cost = getIngredientCost(recipe, ing, todayPrices);

    if (!ing.optional) totalCost += cost;

    return {
      name: ing.name,
      amount: ing.amount,
      cost: Math.round(cost),
      trend: getIngredientTrend(ing, todayPrices, lastPrices),
      optional: ing.optional,
    };
  });

  return {
    recipe,
    totalCost: Math.round(totalCost),
    ingredientCosts,
  };
}

function getProteinLimit(protein: string): number {
  switch (protein) {
    case "fish": return 2;
    case "chicken": return 2;
    case "pork": return 2;
    case "beef": return 1;
    case "egg": return 1;
    case "veggie": return 1;
    default: return 1;
  }
}

function chooseBalancedMeals(allResults: CostResult[], count: number): CostResult[] {
  const selected: CostResult[] = [];
  const proteinCount: Record<string, number> = {};
  const mainIngredientUsed = new Set<string>();

  // Pass 1: strict balanced selection
  for (const result of allResults) {
    if (selected.length >= count) break;

    const protein = getProteinType(result.recipe);
    const mainKey = getMainIngredientKey(result.recipe);
    const limit = getProteinLimit(protein);
    const current = proteinCount[protein] || 0;

    if (current >= limit) continue;
    if (mainIngredientUsed.has(mainKey)) continue;

    selected.push(result);
    proteinCount[protein] = current + 1;
    mainIngredientUsed.add(mainKey);
  }

  // Pass 2: relax main ingredient duplication, keep protein caps
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (selected.some((x) => x.recipe.id === result.recipe.id)) continue;

      const protein = getProteinType(result.recipe);
      const limit = getProteinLimit(protein);
      const current = proteinCount[protein] || 0;

      if (current >= limit) continue;

      selected.push(result);
      proteinCount[protein] = current + 1;
    }
  }

  // Pass 3: final fill only if there are not enough categories available
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (selected.some((x) => x.recipe.id === result.recipe.id)) continue;
      selected.push(result);
    }
  }

  return selected;
}

export function findCheapestMeals(
  recipes: Recipe[],
  todayPrices: PriceMap,
  lastPrices: PriceMap,
  count: number = 8,
): CostResult[] {
  const validRecipes = recipes.filter((recipe) => hasRequiredPrices(recipe, todayPrices));

  const allResults = validRecipes
    .map((recipe) => calculateRecipeCostDetailed(recipe, todayPrices, lastPrices))
    .filter((result) => Number.isFinite(result.totalCost) && result.totalCost > 0)
    .sort((a, b) => a.totalCost - b.totalCost);

  return chooseBalancedMeals(allResults, count);
}
