// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Recipe Database & Cost Engine
// 47 authentic Filipino recipes with DA price mapping
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
  [daKey: string]: number; // price per kg or per piece
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

// ═══════════════════════════════════════════════════════════
// RECIPES (47 dishes)
// ═══════════════════════════════════════════════════════════

export const RECIPES: Recipe[] = [
  // ─── 1. Adobong Manok ────────────────────────────────
  {
    id: "adobong-manok",
    name: "Adobong Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.06,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.15,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 2,
        unit: "pcs",
        amount: "2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 2. Sinigang na Baboy ────────────────────────────
  {
    id: "sinigang-na-baboy",
    name: "Sinigang na Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      { name: "Kamatis", daKey: "Tomato", qty: 0.2, unit: "kg", amount: "2 pcs", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Gabi",
        daKey: null,
        qty: 0.25,
        unit: "kg",
        amount: "1 pc",
        optional: false,
        fallbackPrice: 50,
      },
      {
        name: "Kangkong",
        daKey: null,
        qty: 0.175,
        unit: "kg",
        amount: "1 tali",
        optional: false,
        fallbackPrice: 100,
      },
      {
        name: "Sitaw",
        daKey: "Pole Sitao",
        qty: 0.125,
        unit: "kg",
        amount: "5-8 pcs",
        optional: true,
      },
      { name: "Talong", daKey: "Eggplant", qty: 0.2, unit: "kg", amount: "1 pc", optional: true },
      {
        name: "Okra",
        daKey: null,
        qty: 0.1,
        unit: "kg",
        amount: "4-6 pcs",
        optional: true,
        fallbackPrice: 90,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 3. Kare-Kare ───────────────────────────────────
  {
    id: "kare-kare",
    name: "Kare-Kare",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Beef litid",
        daKey: "Beef Brisket",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      { name: "Talong", daKey: "Eggplant", qty: 0.2, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sitaw",
        daKey: "Pole Sitao",
        qty: 0.125,
        unit: "kg",
        amount: "5-8 pcs",
        optional: false,
      },
      {
        name: "Pechay",
        daKey: "Native Pechay",
        qty: 0.2,
        unit: "kg",
        amount: "1 tali",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4 cloves",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
    ],
  },

  // ─── 4. Tinolang Manok ──────────────────────────────
  {
    id: "tinolang-manok",
    name: "Tinolang Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      { name: "Sayote", daKey: "Chayote", qty: 0.4, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Malunggay",
        daKey: null,
        qty: 0.04,
        unit: "kg",
        amount: "1 tali",
        optional: true,
        fallbackPrice: 250,
      },
    ],
  },

  // ─── 5. Lechon Kawali ───────────────────────────────
  {
    id: "lechon-kawali",
    name: "Lechon Kawali",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Liempo",
        daKey: "Pork Belly (Liempo)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4-6 cloves",
        optional: false,
      },
    ],
  },

  // ─── 6. Lumpiang Shanghai ───────────────────────────
  {
    id: "lumpiang-shanghai",
    name: "Lumpiang Shanghai",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Giniling (Kasim)",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4 cloves",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 7. Pork Sisig ─────────────────────────────────
  {
    id: "pork-sisig",
    name: "Pork Sisig",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Liempo",
        daKey: "Pork Belly (Liempo)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.15,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Siling green",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "2-4 pcs",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 8. Nilagang Baboy ──────────────────────────────
  {
    id: "nilagang-baboy",
    name: "Nilagang Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Repolyo",
        daKey: "Cabbage (Scorpio)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 head",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Pechay",
        daKey: "Native Pechay",
        qty: 0.2,
        unit: "kg",
        amount: "1 tali",
        optional: true,
      },
      {
        name: "Mais",
        daKey: null,
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
        fallbackPrice: 18,
      },
    ],
  },

  // ─── 9. Chicken Afritada ────────────────────────────
  {
    id: "chicken-afritada",
    name: "Chicken Afritada",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 10. Pork Menudo ────────────────────────────────
  {
    id: "pork-menudo",
    name: "Pork Menudo",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Atay ng baboy",
        daKey: null,
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
        fallbackPrice: 225,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 11. Ginataang Kalabasa ─────────────────────────
  {
    id: "ginataang-kalabasa",
    name: "Ginataang Kalabasa",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kalabasa",
        daKey: "Squash",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: false,
      },
      {
        name: "Sitaw",
        daKey: "Pole Sitao",
        qty: 0.125,
        unit: "kg",
        amount: "5-8 pcs",
        optional: true,
      },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 12. Tortang Talong ─────────────────────────────
  {
    id: "tortang-talong",
    name: "Tortang Talong",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Talong",
        daKey: "Eggplant",
        qty: 0.4,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 3,
        unit: "pcs",
        amount: "3 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.065,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.015,
        unit: "kg",
        amount: "2-3 cloves",
        optional: true,
      },
      {
        name: "Giniling (Kasim)",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
      },
    ],
  },

  // ─── 13. Pinakbet ───────────────────────────────────
  {
    id: "pinakbet",
    name: "Pinakbet",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kalabasa",
        daKey: "Squash",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      {
        name: "Sitaw",
        daKey: "Pole Sitao",
        qty: 0.125,
        unit: "kg",
        amount: "5-8 pcs",
        optional: false,
      },
      {
        name: "Talong",
        daKey: "Eggplant",
        qty: 0.275,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      { name: "Kamatis", daKey: "Tomato", qty: 0.2, unit: "kg", amount: "2 pcs", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Okra",
        daKey: null,
        qty: 0.1,
        unit: "kg",
        amount: "4-6 pcs",
        optional: true,
        fallbackPrice: 90,
      },
      { name: "Ampalaya", daKey: "Ampalaya", qty: 0.2, unit: "kg", amount: "1 pc", optional: true },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
      },
    ],
  },

  // ─── 14. Giniling na Baboy ──────────────────────────
  {
    id: "giniling-na-baboy",
    name: "Giniling na Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Giniling (Kasim)",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.175,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 16. Ginisang Sayote ────────────────────────────
  {
    id: "ginisang-sayote",
    name: "Ginisang Sayote",
    servings: "2-4 na tao",
    ingredients: [
      { name: "Sayote", daKey: "Chayote", qty: 0.5, unit: "kg", amount: "2 pcs", optional: false },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      { name: "Kamatis", daKey: "Tomato", qty: 0.1, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 17. Pritong Tilapia ────────────────────────────
  {
    id: "pritong-tilapia",
    name: "Pritong Tilapia",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Tilapia",
        daKey: "Tilapia",
        qty: 0.75,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.025,
        unit: "kg",
        amount: "2-3 pcs",
        optional: true,
      },
    ],
  },

  // ─── 18. Ginisang Repolyo at Manok ──────────────────
  {
    id: "ginisang-repolyo-at-manok",
    name: "Ginisang Repolyo at Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Repolyo",
        daKey: "Cabbage (Scorpio)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 head",
        optional: false,
      },
      {
        name: "Dibdib ng manok",
        daKey: "Chicken Breast",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 19. Sopas ──────────────────────────────────────
  {
    id: "sopas",
    name: "Sopas",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Dibdib ng manok",
        daKey: "Chicken Breast",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      {
        name: "Repolyo",
        daKey: "Cabbage (Scorpio)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 head",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 20. Ginisang Ampalaya ──────────────────────────
  {
    id: "ginisang-ampalaya",
    name: "Ginisang Ampalaya",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Ampalaya",
        daKey: "Ampalaya",
        qty: 0.4,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 3,
        unit: "pcs",
        amount: "3 pcs",
        optional: false,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.14,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Giniling (Kasim)",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
      },
    ],
  },

  // ─── 21. Chicken Caldereta ──────────────────────────
  {
    id: "chicken-caldereta",
    name: "Chicken Caldereta",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 22. Beef Nilaga ────────────────────────────────
  {
    id: "beef-nilaga",
    name: "Beef Nilaga",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Beef litid",
        daKey: "Beef Brisket",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Repolyo",
        daKey: "Cabbage (Scorpio)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 head",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Pechay",
        daKey: "Native Pechay",
        qty: 0.2,
        unit: "kg",
        amount: "1 tali",
        optional: true,
      },
      {
        name: "Mais",
        daKey: null,
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
        fallbackPrice: 18,
      },
    ],
  },

  // ─── 23. Ginataang Sitaw at Kalabasa ────────────────
  {
    id: "ginataang-sitaw-at-kalabasa",
    name: "Ginataang Sitaw at Kalabasa",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kalabasa",
        daKey: "Squash",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Sitaw",
        daKey: "Pole Sitao",
        qty: 0.125,
        unit: "kg",
        amount: "5-8 pcs",
        optional: false,
      },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: true,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 24. Ginisang Pechay at Baboy ───────────────────
  {
    id: "ginisang-pechay-at-baboy",
    name: "Ginisang Pechay at Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Pechay",
        daKey: "Native Pechay",
        qty: 0.325,
        unit: "kg",
        amount: "1-2 tali",
        optional: false,
      },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      { name: "Kamatis", daKey: "Tomato", qty: 0.1, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 25. Ginisang Sayote at Manok ───────────────────
  {
    id: "ginisang-sayote-at-manok",
    name: "Ginisang Sayote at Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      { name: "Sayote", daKey: "Chayote", qty: 0.5, unit: "kg", amount: "2 pcs", optional: false },
      { name: "Kamatis", daKey: "Tomato", qty: 0.1, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: true,
      },
    ],
  },

  // ─── 26. Ginisang Sayote at Baboy ───────────────────
  {
    id: "ginisang-sayote-at-baboy",
    name: "Ginisang Sayote at Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      { name: "Sayote", daKey: "Chayote", qty: 0.5, unit: "kg", amount: "2 pcs", optional: false },
      { name: "Kamatis", daKey: "Tomato", qty: 0.1, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 27. Pritong Manok ──────────────────────────────
  {
    id: "pritong-manok",
    name: "Pritong Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 28. Beef Broccoli ──────────────────────────────
  {
    id: "beef-broccoli",
    name: "Beef Broccoli",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Beef litid",
        daKey: "Beef Brisket",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Broccoli",
        daKey: "Broccoli Local",
        qty: 0.4,
        unit: "kg",
        amount: "1 head",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 29. Ginisang Upo ──────────────────────────────
  {
    id: "ginisang-upo",
    name: "Ginisang Upo",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Upo",
        daKey: null,
        qty: 0.7,
        unit: "kg",
        amount: "1 pc",
        optional: false,
        fallbackPrice: 50,
      },
      { name: "Kamatis", daKey: "Tomato", qty: 0.1, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: true,
      },
    ],
  },

  // ─── 30. Ginataang Tilapia ──────────────────────────
  {
    id: "ginataang-tilapia",
    name: "Ginataang Tilapia",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Tilapia",
        daKey: "Tilapia",
        qty: 0.625,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Pechay",
        daKey: "Native Pechay",
        qty: 0.2,
        unit: "kg",
        amount: "1 tali",
        optional: false,
      },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 31. Pritong Bangus ─────────────────────────────
  {
    id: "pritong-bangus",
    name: "Pritong Bangus",
    servings: "2-4 na tao",
    ingredients: [
      { name: "Bangus", daKey: "Bangus", qty: 0.75, unit: "kg", amount: "1 pc", optional: false },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: true,
      },
    ],
  },

  // ─── 32. Sarciadong Tilapia ─────────────────────────
  {
    id: "sarciadong-tilapia",
    name: "Sarciadong Tilapia",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Tilapia",
        daKey: "Tilapia",
        qty: 0.625,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.225,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 2,
        unit: "pcs",
        amount: "1-2 pcs",
        optional: false,
      },
    ],
  },

  // ─── 33. Pritong Galunggong ─────────────────────────
  {
    id: "pritong-galunggong",
    name: "Pritong Galunggong",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Galunggong",
        daKey: "Galunggong",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.025,
        unit: "kg",
        amount: "2-3 pcs",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.025,
        unit: "kg",
        amount: "3-4 cloves",
        optional: true,
      },
    ],
  },

  // ─── 34. Sarciadong Galunggong ──────────────────────
  {
    id: "sarciadong-galunggong",
    name: "Sarciadong Galunggong",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Galunggong",
        daKey: "Galunggong",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.225,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 2,
        unit: "pcs",
        amount: "1-2 pcs",
        optional: false,
      },
    ],
  },

  // ─── 35. Pritong Tamban ─────────────────────────────
  {
    id: "pritong-tamban",
    name: "Pritong Tamban",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Tamban",
        daKey: "Sardines (Tamban)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.025,
        unit: "kg",
        amount: "2-3 pcs",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.025,
        unit: "kg",
        amount: "3-4 cloves",
        optional: true,
      },
    ],
  },

  // ─── 36. Tortang Giniling ───────────────────────────
  {
    id: "tortang-giniling",
    name: "Tortang Giniling",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Giniling (Kasim)",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.25,
        unit: "kg",
        amount: "1/4 kg",
        optional: false,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 3,
        unit: "pcs",
        amount: "3 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.175,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 38. Pritong Pork Chop ──────────────────────────
  {
    id: "pritong-pork-chop",
    name: "Pritong Pork Chop",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Pork chop",
        daKey: "Pork Chop",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4-6 cloves",
        optional: true,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 1,
        unit: "pcs",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 39. Pritong Liempo ─────────────────────────────
  {
    id: "pritong-liempo",
    name: "Pritong Liempo",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Liempo",
        daKey: "Pork Belly (Liempo)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4-6 cloves",
        optional: true,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.025,
        unit: "kg",
        amount: "2-3 pcs",
        optional: true,
      },
    ],
  },

  // ─── 40. Pritong Pakpak ng Manok ────────────────────
  {
    id: "pritong-pakpak-ng-manok",
    name: "Pritong Pakpak ng Manok",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Pakpak ng manok",
        daKey: "Chicken Wing",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
    ],
  },

  // ─── 41. Adobong Baboy ──────────────────────────────
  {
    id: "adobong-baboy",
    name: "Adobong Baboy",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.15,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
      {
        name: "Itlog",
        daKey: "Chicken Egg (White Medium)",
        qty: 2,
        unit: "pcs",
        amount: "2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 42. Pork Mechado ───────────────────────────────
  {
    id: "pork-mechado",
    name: "Pork Mechado",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.14,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 43. Beef Mechado ───────────────────────────────
  {
    id: "beef-mechado",
    name: "Beef Mechado",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Beef litid",
        daKey: "Beef Brisket",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.14,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 44. Pork Caldereta ─────────────────────────────
  {
    id: "pork-caldereta",
    name: "Pork Caldereta",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Kasim",
        daKey: "Pork Picnic Shoulder (Kasim)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
    ],
  },

  // ─── 45. Beef Caldereta ─────────────────────────────
  {
    id: "beef-caldereta",
    name: "Beef Caldereta",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Beef litid",
        daKey: "Beef Brisket",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Patatas",
        daKey: "White Potato Local",
        qty: 0.3,
        unit: "kg",
        amount: "1-2 pcs",
        optional: false,
      },
      {
        name: "Carrots",
        daKey: "Carrots Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 ulo",
        optional: false,
      },
      {
        name: "Bell pepper",
        daKey: "Bell Pepper (Red) Local",
        qty: 0.125,
        unit: "kg",
        amount: "1 pc",
        optional: true,
      },
    ],
  },

  // ─── 51. Chicken Inasal ─────────────────────────────
  {
    id: "chicken-inasal",
    name: "Chicken Inasal",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Paa ng manok",
        daKey: "Chicken Leg Quarter",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
    ],
  },

  // ─── 52. Inihaw na Liempo ───────────────────────────
  {
    id: "inihaw-na-liempo",
    name: "Inihaw na Liempo",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Liempo",
        daKey: "Pork Belly (Liempo)",
        qty: 0.5,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
      {
        name: "Bawang",
        daKey: "Garlic Native/Local",
        qty: 0.035,
        unit: "kg",
        amount: "4-6 cloves",
        optional: true,
      },
    ],
  },

  // ─── 53. Inihaw na Bangus ───────────────────────────
  {
    id: "inihaw-na-bangus",
    name: "Inihaw na Bangus",
    servings: "2-4 na tao",
    ingredients: [
      { name: "Bangus", daKey: "Bangus", qty: 0.75, unit: "kg", amount: "1 pc", optional: false },
      { name: "Kamatis", daKey: "Tomato", qty: 0.2, unit: "kg", amount: "2 pcs", optional: false },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Luya",
        daKey: "Ginger Local",
        qty: 0.04,
        unit: "kg",
        amount: "1 piraso",
        optional: true,
      },
      {
        name: "Kalamansi",
        daKey: "Calamansi",
        qty: 0.04,
        unit: "kg",
        amount: "3-5 pcs",
        optional: true,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },

  // ─── 56. Sinigang na Bangus ─────────────────────────
  {
    id: "sinigang-na-bangus",
    name: "Sinigang na Bangus",
    servings: "2-4 na tao",
    ingredients: [
      {
        name: "Bangus",
        daKey: "Bangus",
        qty: 0.625,
        unit: "kg",
        amount: "1/2 kg",
        optional: false,
      },
      {
        name: "Kamatis",
        daKey: "Tomato",
        qty: 0.225,
        unit: "kg",
        amount: "2-3 pcs",
        optional: false,
      },
      {
        name: "Sibuyas",
        daKey: "Red Onion Local",
        qty: 0.1,
        unit: "kg",
        amount: "1 pc",
        optional: false,
      },
      {
        name: "Kangkong",
        daKey: null,
        qty: 0.175,
        unit: "kg",
        amount: "1 tali",
        optional: false,
        fallbackPrice: 100,
      },
      {
        name: "Gabi",
        daKey: null,
        qty: 0.25,
        unit: "kg",
        amount: "1 pc",
        optional: false,
        fallbackPrice: 50,
      },
      { name: "Talong", daKey: "Eggplant", qty: 0.2, unit: "kg", amount: "1 pc", optional: true },
      {
        name: "Okra",
        daKey: null,
        qty: 0.1,
        unit: "kg",
        amount: "4-6 pcs",
        optional: true,
        fallbackPrice: 90,
      },
      {
        name: "Siling haba",
        daKey: "Chilli (Green) Local",
        qty: 0.02,
        unit: "kg",
        amount: "1-2 pcs",
        optional: true,
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════
// COST CALCULATION ENGINE
// ═══════════════════════════════════════════════════════════

/**
 * Calculate the cost of a single ingredient.
 * For "kg" items: price_per_kg * qty
 * For "pcs" items: price_per_piece * qty
 */
function getIngredientCost(ing: RecipeIngredient, priceMap: PriceMap): number {
  if (ing.daKey && priceMap[ing.daKey] !== undefined) {
    return priceMap[ing.daKey] * ing.qty;
  }
  if (ing.fallbackPrice !== undefined) {
    return ing.fallbackPrice * ing.qty;
  }
  // Unknown price — skip (will not affect total)
  return 0;
}

/**
 * Get the trend for an ingredient by comparing today vs last price.
 */
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

/**
 * Calculate total required cost for a recipe using today's prices.
 * Only counts non-optional ingredients.
 */
export function calculateRecipeCost(recipe: Recipe, priceMap: PriceMap): number {
  let total = 0;
  for (const ing of recipe.ingredients) {
    if (!ing.optional) {
      total += getIngredientCost(ing, priceMap);
    }
  }
  return Math.round(total);
}

/**
 * Calculate full cost result with per-ingredient breakdown.
 */
export function calculateRecipeCostDetailed(
  recipe: Recipe,
  todayPrices: PriceMap,
  lastPrices: PriceMap,
): CostResult {
  let totalCost = 0;
  const ingredientCosts = recipe.ingredients.map((ing) => {
    const cost = getIngredientCost(ing, todayPrices);
    if (!ing.optional) {
      totalCost += cost;
    }
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

/**
 * Find the cheapest N meals from all recipes.
 * Returns detailed cost results sorted by price ascending.
 * Ensures protein diversity: max 2 dishes per protein type.
 */
export function findCheapestMeals(
  recipes: Recipe[],
  todayPrices: PriceMap,
  lastPrices: PriceMap,
  count: number = 5,
): CostResult[] {
  // Calculate cost for all recipes
  const allResults = recipes.map((recipe) =>
    calculateRecipeCostDetailed(recipe, todayPrices, lastPrices),
  );

  // Sort by total cost ascending
  allResults.sort((a, b) => a.totalCost - b.totalCost);

  // Pick top N with protein diversity
  const selected: CostResult[] = [];
  const proteinCount: Record<string, number> = {};

  for (const result of allResults) {
    if (selected.length >= count) break;

    // Determine primary protein from first required ingredient
    const mainProtein = getProteinType(result.recipe);
    const currentCount = proteinCount[mainProtein] || 0;

    // Allow max 2 of same protein type
    if (currentCount < 2) {
      selected.push(result);
      proteinCount[mainProtein] = currentCount + 1;
    }
  }

  // If we still need more (unlikely), fill without restriction
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (!selected.includes(result)) {
        selected.push(result);
      }
    }
  }

  return selected;
}

/**
 * Helper to determine protein type from a recipe.
 */
function getProteinType(recipe: Recipe): string {
  const id = recipe.id;
  if (
    id.includes("manok") ||
    id.includes("chicken") ||
    id.includes("inasal") ||
    id.includes("pakpak") ||
    id.includes("afritada") ||
    id.includes("sopas") ||
    id.includes("repolyo-at-manok")
  )
    return "chicken";
  if (
    id.includes("baboy") ||
    id.includes("pork") ||
    id.includes("liempo") ||
    id.includes("lechon") ||
    id.includes("sisig") ||
    id.includes("lumpia") ||
    id.includes("giniling") ||
    id.includes("menudo") ||
    id.includes("mechado-pork") ||
    id.includes("caldereta-pork") ||
    id.includes("inihaw-na-liempo")
  )
    return "pork";
  if (
    id.includes("beef") ||
    id.includes("kare-kare") ||
    id.includes("broccoli") ||
    id.includes("bistek")
  )
    return "beef";
  if (
    id.includes("bangus") ||
    id.includes("tilapia") ||
    id.includes("galunggong") ||
    id.includes("tamban") ||
    id.includes("sarciadong")
  )
    return "fish";
  if (id.includes("tortang-talong") || id.includes("ampalaya") || id.includes("tortang-giniling"))
    return "egg";
  if (
    id.includes("pinakbet") ||
    id.includes("ginataang-kalabasa") ||
    id.includes("upo") ||
    id.includes("sayote") ||
    id.includes("pechay")
  )
    return "veggie";
  return "other";
}
