// Filipino-friendly name mapping for DA commodities
// Maps DA official names → palengke-friendly Filipino names

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
  "Tambakol (Yellow-Fin Tuna) Local": "Yellow Fin Tambakol",
  "Alumahan (Indian Mackerel)": "Alumahan",

  // Beef
  "Beef Brisket": "Beef litid",
  "Beef Rib Set": "Beef tadyang",
  "Beef Rump": "Beef laman",

  // Pork
  "Pork Belly (Liempo)": "Liempo",
  "Pork Chop": "Pork chop",
  "Pork Hind Leg (Pigue)": "Pigue",
  "Pork Picnic Shoulder (Kasim)": "Kasim",

  // Poultry
  "Chicken Breast": "Dibdib ng manok",
  "Chicken Drumstick": "Binti ng manok",
  "Chicken Leg Quarter": "Paa ng manok",
  "Chicken Thigh": "Hita ng manok",
  "Chicken Wing": "Pakpak ng manok",

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

// Items to REMOVE (not common in palengke)
export const hiddenCommodities: string[] = [
  "Jasponica/Japonica Rice",
  "Basmati Rice",
  "Corn Grits (White Food Grade)",
  "Corn Grits (Yellow Food Grade)",
  "Corn Cracked (Yellow Feed Grade)",
  "Corn Grits (Feed Grade)",
  "Pampano",
  "Pampano Imported",
  "Salmon Belly",
  "Salmon Belly Imported",
  "Salmon Head",
  "Salmon Head Imported",
  "Squid (Pusit Bisaya)",
  "Tanigue",
  "Pork Fore Shank",
  "Pork Hind Shank",
  "Pork Loin",
  "Pork Offals",
  "Pork Spare Ribs",
  "Bell Pepper (Green) Local",
  "Broccoli Imported",
  "Cabbage (Rare Ball)",
  "Cabbage (Wonder Ball)",
  "Carrots Imported",
  "Lettuce (Iceberg)",
  "Lettuce (Romaine)",
  "Garlic Imported",
  "Ginger Imported",
  "Red Onion Imported",
  "White Onion Imported",
  "Cooking Oil (Coconut)",
  "Cooking Oil (Minola)",
  "Cooking Oil (Palm Olein Jolly Brand)",
  "Cooking Oil (Spring)",
  "Salt (Iodized)",
];

// Default items to show in header price tags (13 items)
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

// Helper function
export function getDisplayName(daName: string): string {
  return commodityNameMap[daName] || daName;
}

export function isHidden(daName: string): boolean {
  return hiddenCommodities.some((hidden) => daName.toLowerCase().includes(hidden.toLowerCase()));
}
