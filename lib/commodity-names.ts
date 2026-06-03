// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Commodity Name Mapping & Visibility
// V2 — English meat cuts, expanded show/hide list
// ═══════════════════════════════════════════════════════════

// Maps DA official commodity names → user-friendly display names
// Rule: meat cuts → English, vegetables/spices → Filipino, fish → Filipino

export const commodityNameMap: Record<string, string> = {
  // Rice
  "Regular Milled 20-40% bran streak": "Bigas pinakamura",
  "Well Milled 1-19% bran streak": "Bigas maalsa",
  "Premium 5% broken": "Bigas premium Long Grain",
  "Other Special Rice White Rice": "Bigas Dinorado/Sinandomeng",
  "Glutinous Rice": "Malagkit",

  // Eggs
  "Chicken Egg (White Medium)": "Itlog",

  // Fish
  Bangus: "Bangus",
  Galunggong: "Galunggong",
  Tilapia: "Tilapia",
  "Sardines (Tamban)": "Tamban",
  Squid: "Pusit",
  "Tambakol (Yellow-Fin Tuna)": "Tambakol",
  "Salmon Belly": "Salmon Belly",
  "Salmon Head": "Salmon Head",

  // Beef — simple English
  "Beef Brisket": "Beef",
  "Beef Rib Set": "Beef Ribs",
  "Beef Rump": "Beef Rump",
  "Beef Short Ribs": "Beef Short Ribs",
  "Beef Sirloin": "Beef Sirloin",

  // Pork — Filipino where universal
  "Pork Belly (Liempo)": "Liempo",
  "Pork Chop": "Pork Chop",
  "Pork Hind Leg (Pigue)": "Pigue",
  "Pork Picnic Shoulder (Kasim)": "Kasim",
  "Pork Spare Ribs": "Pork Spare Ribs",

  // Poultry — English
  "Whole Chicken": "Whole Chicken",
  "Chicken Breast": "Chicken Breast",
  "Chicken Drumstick": "Chicken Drumstick",
  "Chicken Leg Quarter": "Chicken Leg Quarter",
  "Chicken Thigh": "Chicken Thigh",
  "Chicken Wing": "Chicken Wings",
  "Chicken Liver": "Chicken Liver",
  "Chicken Feet": "Chicken Feet",
  "Chicken Neck": "Chicken Neck",

  // Lowland Vegetables
  Ampalaya: "Ampalaya",
  "Chilli (Green) Local": "Siling green",
  Eggplant: "Talong",
  "Native Pechay": "Pechay",
  "Pole Sitao": "Sitaw",
  Squash: "Kalabasa",
  Tomato: "Kamatis",

  // Highland Vegetables
  "Bell Pepper (Red) Local": "Bell pepper",
  "Broccoli Local": "Broccoli",
  "Cabbage (Scorpio)": "Repolyo (Baguio)",
  "Carrots Local": "Carrots",
  "Cauliflower Local": "Cauliflower",
  Celery: "Kintsay",
  Chayote: "Sayote",
  "Habichuelas/Baguio Beans Local": "Baguio Beans",
  "Lettuce (Green Ice)": "Lettuce",
  "Pechay Baguio": "Pechay Baguio",
  "White Potato Local": "Patatas",

  // Corn
  "Corn (Yellow)": "Mais (Dilaw)",
  "Corn (White)": "Mais (Puti)",
  "Sweet Corn (Yellow)": "Mais (Dilaw)",
  "Sweet Corn (White)": "Mais (Puti)",

  // Fruits
  Avocado: "Avocado",
  "Banana (Lakatan)": "Saging lakatan",
  "Banana (Latundan)": "Saging latundan",
  "Banana (Saba)": "Saging saba",
  Calamansi: "Kalamansi",
  "Mango (Carabao)": "Mangga kalabaw",
  Melon: "Melon",
  Papaya: "Papaya",
  Pomelo: "Suha",
  Watermelon: "Pakwan",

  // Spices
  "Chilli (Red) Local": "Sili pula",
  "Garlic Native/Local": "Bawang",
  "Ginger Local": "Luya",
  "Red Onion Local": "Sibuyas pula",
  "White Onion Local": "Sibuyas puti",

  // Other
  "Cooking Oil (Palm)": "Mantika",
  Mungbean: "Munggo",
  "Salt (Rock)": "Asin",
  "Sugar (Brown)": "Asukal brown",
  "Sugar (Refined)": "Asukal white",
  "Sugar (Washed)": "Asukal washed",
};

// ═══════════════════════════════════════════════════════════
// HIDDEN COMMODITIES — not shown on price dashboard
// ═══════════════════════════════════════════════════════════

export const hiddenCommodities: string[] = [
  // Rice — imported/specialty
  "Jasponica/Japonica Rice",
  "Basmati Rice",

  // Corn — feed/grits
  "Corn Grits (White Food Grade)",
  "Corn Grits (Yellow Food Grade)",
  "Corn Cracked (Yellow Feed Grade)",
  "Corn Grits (Feed Grade)",

  // Fish — imported/premium/uncommon
  "Alumahan (Indian Mackerel)",
  "Bonito (Frigate Tuna)",
  "Mackerel",
  "Pampano",
  "Pampano Imported",
  "Squid (Pusit Bisaya)",
  "Tanigue",

  // Beef — obscure imported cuts
  "Beef Chuck",
  "Beef Flank",
  "Beef Fore Limb",
  "Beef Forequarter",
  "Beef Loin",
  "Beef Plate",
  "Beef Rib Eye",
  "Beef Striploin",
  "Beef Tenderloin",
  "Beef Tongue",

  // Carabeef / Lamb
  "Carabeef Forequarter",
  "Carabeef Meat",
  "Carabeef Rump Steak",
  "Carabeef Trimmings",
  "Lamb Meat",

  // Pork — obscure cuts
  "Pork Boston Shoulder",
  "Pork Fore Shank",
  "Pork Hind Shank",
  "Pork Head",
  "Pork Loin",
  "Pork Offals",
  "Pork Rind/Skin",

  // Poultry — obscure
  "Chicken Rind/Skin",
  "Duck Meat",
  "Peckin Duck",

  // Vegetables — imported duplicates
  "Bell Pepper (Green) Local",
  "Bell Pepper (Green) Imported",
  "Bell Pepper (Red) Imported",
  "Broccoli Imported",
  "Cabbage (Rare Ball)",
  "Cabbage (Wonder Ball)",
  "Cabbage Imported",
  "Carrots Imported",
  "Cauliflower Imported",
  "Lettuce (Iceberg)",
  "Lettuce (Romaine)",
  "Lettuce Imported",
  "White Potato Imported",

  // Spices — imported duplicates
  "Garlic Imported",
  "Ginger Imported",
  "Red Onion Imported",
  "White Onion Imported",
  "Tiger Chillies Imported",

  // Other — brand duplicates
  "Cooking Oil (Coconut)",
  "Cooking Oil (Minola)",
  "Cooking Oil (Palm Olein Jolly Brand)",
  "Cooking Oil (Spring)",
  "Salt (Iodized)",
];

// ═══════════════════════════════════════════════════════════
// DEFAULT HOMEPAGE PRICE TAGS
// ═══════════════════════════════════════════════════════════

export const defaultItems = [
  { key: "Pork Belly (Liempo)", label: "Baboy" },
  { key: "Chicken Leg Quarter", label: "Manok" },
  { key: "Beef Brisket", label: "Beef" },
  { key: "Chicken Egg (White Medium)", label: "Itlog" },
  { key: "Bangus", label: "Bangus" },
  { key: "Tilapia", label: "Tilapia" },
  { key: "Regular Milled 20-40% bran streak", label: "Bigas" },
  { key: "Red Onion Local", label: "Sibuyas" },
  { key: "Garlic Native/Local", label: "Bawang" },
  { key: "Banana (Saba)", label: "Saging" },
  { key: "Cooking Oil (Palm)", label: "Mantika" },
  { key: "Calamansi", label: "Kalamansi" },
  { key: "Chilli (Red) Local", label: "Sili" },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

export function getDisplayName(daName: string): string {
  return commodityNameMap[daName] || daName;
}

export function isHidden(daName: string): boolean {
  return hiddenCommodities.some((hidden) =>
    daName.toLowerCase().includes(hidden.toLowerCase())
  );
}
