// ═══════════════════════════════════════════════════════════
// Ano Ulam? — Recipe Database & Cost Engine
// V3 — English meat names, palengke rate overrides, balanced selection
// 47 Filipino recipes with DA price mapping
// V2.2 — Added steps, pantryItems, isPantry flag
// ═══════════════════════════════════════════════════════════

export interface RecipeIngredient {
  name: string;
  daKey: string | null;
  qty: number;
  unit: "kg" | "pcs";
  amount: string;
  optional: boolean;
  fallbackPrice?: number;
  isPantry?: boolean;
}

export interface PantryItem {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  servings: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  pantryItems: PantryItem[];
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

function p(name: string, amount: string): PantryItem {
  return { name, amount };
}

function recipe(
  id: string,
  name: string,
  ingredients: RecipeIngredient[],
  steps: string[],
  pantryItems: PantryItem[],
): Recipe {
  return { id, name, servings: "1-3 katao", ingredients, steps, pantryItems };
}

// Helper to create ingredient arrays more compactly
type IngTuple = [string, string | null, number, Unit, string, boolean?, number?];

function ings(...items: IngTuple[]): RecipeIngredient[] {
  return items.map((x) => ing(x[0], x[1], x[2], x[3], x[4], x[5] ?? false, x[6]));
}

// ═══════════════════════════════════════════════════════════
// RECIPES (47 dishes)
// ═══════════════════════════════════════════════════════════

export const RECIPES: Recipe[] = [
  recipe(
    "adobong-manok",
    "Adobong Manok",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
      ["Bawang", "Garlic Native/Local", 0.06, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs", true],
      ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "2 pcs", true],
    ),
    [
      "I-marinate ang manok sa toyo, bawang, at paminta ng kalahating oras.",
      "Igisa ang bawang at sibuyas sa mainit na mantika hanggang sa mabango.",
      "Ilagay ang binabad na manok at igisa hanggang sa mag-iba ang kulay.",
      "Ibuhos ang sabaw ng marinade at pakuluan hanggang sa lumambot ang manok.",
      "Idagdag ang suka at huwag munang hahaluin hanggang sa kumulo.",
      "Ilagay ang dahon ng laurel at pamintang buo.",
      "Patuyuin ang sabaw nang kaunti hanggang sa lumapot ang sarsa bago hanguin.",
    ],
    [
      p("Toyo", "1/2 cup"),
      p("Suka", "1/3 cup"),
      p("Tubig", "1 cup"),
      p("Laurel", "3 pcs"),
      p("Pamintang buo", "1 tsp"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1/2 tsp"),
      p("Asukal", "1 tsp"),
    ],
  ),

  recipe(
    "sinigang-na-baboy",
    "Sinigang na Baboy",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Gabi", null, 0.25, "kg", "1 pc", false, 50],
      ["Kangkong", null, 0.175, "kg", "1 tali", false, 100],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
      ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Pakuluan ang karne ng baboy sa tubig kasama ang kamatis at sibuyas.",
      "Tanggalin ang mga dumi na lulutang sa ibabaw ng sabaw habang kumukulo.",
      "Ilagay ang gabi at lutuin hanggang sa medyo lumambot.",
      "Idagdag ang pampaasim na sampalok kapag malambot na ang karne.",
      "Ihulog ang labanos, sitaw, at kangkong sa kumukulong sabaw.",
      "Timplahan ng patis at sili para sa dagdag na anghang.",
      "Hanguin kapag luto na ang lahat ng gulay.",
    ],
    [p("Sinigang mix", "1 pack"), p("Tubig", "1 liter"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),

  recipe(
    "kare-kare",
    "Kare-Kare",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali"],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4 cloves"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
    ),
    [
      "Pakuluan ang buntot at pata ng baka hanggang sa matanggal ang tigas.",
      "Igisa ang bawang at sibuyas sa kawali na may kaunting mantika.",
      "Ihalo ang pinalambot na baka at lagyan ng sabaw ng pinaglagaan.",
      "Tunawin ang peanut butter at atsuete bago ihalo sa sabaw.",
      "Idagdag ang puso ng saging, talong, at sitaw.",
      "Pakuluan hanggang sa lumapot ang sarsa at maluto ang gulay.",
      "Ihain kasama ang ginisang bagoong alamang.",
    ],
    [
      p("Peanut butter", "1/2 cup"),
      p("Atsuete powder", "1 tbsp"),
      p("Tubig", "4 cups"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1 tsp"),
      p("Bagoong alamang", "1/2 cup"),
      p("Puso ng saging", "1 pc"),
    ],
  ),

  recipe(
    "tinolang-manok",
    "Tinolang Manok",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
      ["Sayote", "Chayote", 0.4, "kg", "1 pc"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Malunggay", null, 0.04, "kg", "1 tali", true, 250],
    ),
    [
      "Igisa ang luya, bawang, at sibuyas sa kaunting mantika.",
      "Ilagay ang manok at igisa hanggang sa mag-iba ang kulay ng balat.",
      "Ibuhos ang tubig para sa sabaw at hayaang kumulo nang dahan-dahan.",
      "Idagdag ang sayote o papaya kapag malambot na ang manok.",
      "Timplahan ng patis at kaunting paminta ayon sa iyong panlasa.",
      "Ihulog ang dahon ng sili o malunggay bago patayin ang apoy.",
      "Takpan ng isang minuto bago ihain sa pamilya.",
    ],
    [
      p("Patis", "2 tbsp"),
      p("Tubig", "4 cups"),
      p("Mantika", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
    ],
  ),

  recipe(
    "lechon-kawali",
    "Lechon Kawali",
    ings(
      ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves"],
    ),
    [
      "Pakuluan ang liempo sa tubig na may asin, paminta, at bawang.",
      "Hanguin ang karne at patuyuin nang husto ang balat.",
      "Tusukin ang balat gamit ang tinidor para sumingaw ang natitirang basa.",
      "Painitin ang maraming mantika sa malalim na kawali hanggang sa umusok.",
      "Iprito ang liempo nang dahan-dahan hanggang sa pumutok ang balat.",
      "Baligtarin ang karne para maging pantay ang pagkakaluto nito.",
      "Hanguin at patuluin ang labis na mantika bago hiwain.",
    ],
    [
      p("Tubig", "4 cups"),
      p("Pamintang buo", "1 tbsp"),
      p("Laurel", "3 pcs"),
      p("Asin", "2 tbsp"),
      p("Mantika", "3 cups"),
      p("Mang Tomas sauce", "1 bottle"),
    ],
  ),

  recipe(
    "lumpiang-shanghai",
    "Lumpiang Shanghai",
    ings(
      ["Ground Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4 cloves"],
      ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
    ),
    [
      "Paghaluin ang giniling na baboy, carrots, sibuyas, at itlog sa mangkok.",
      "Timplahan ang halo ng asin, paminta, at kaunting seasoning.",
      "Ibalot ang tamang dami ng halo sa wrapper ng lumpia.",
      "Basain ang dulo ng wrapper ng tubig para sumara at hindi bumuka.",
      "Painitin ang mantika sa kawali para sa deep fry.",
      "Iprito ang mga lumpia hanggang sa maging kulay ginto ang balat.",
      "Hanguin at patuluin ang mantika sa may tissue.",
    ],
    [
      p("Lumpia wrapper", "30 pcs"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1 tsp"),
      p("Kintsay", "1 stalk"),
      p("Mantika", "2 cups"),
      p("Sweet chili sauce", "1/2 cup"),
    ],
  ),

  recipe(
    "pork-sisig",
    "Pork Sisig",
    ings(
      ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
      ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
      ["Siling green", "Chilli (Green) Local", 0.02, "kg", "2-4 pcs"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs"],
      ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
    ),
    [
      "Pakuluan ang ulo ng baboy at atay hanggang sa lumambot.",
      "Ihawin ang pinalambot na karne hanggang sa medyo masunog ang balat.",
      "Hiwain nang pino ang inihaw na karne at atay ng baboy.",
      "Igisa ang sibuyas at sili sa kawali na may mantika.",
      "Ihalo ang tinadtad na karne at lutuin hanggang sa maging malutong.",
      "Timplahan ng calamansi juice, toyo, asin, at paminta.",
      "Ihain sa mainit na plancha na may itlog sa ibabaw.",
    ],
    [
      p("Mayonnaise", "3 tbsp"),
      p("Toyo", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
      p("Margarine", "1 tbsp"),
      p("Mantika", "2 tbsp"),
      p("Siling labuyo", "2 pcs"),
    ],
  ),

  recipe(
    "nilagang-baboy",
    "Nilagang Baboy",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
      ["Mais", null, 1, "pcs", "1 pc", true, 18],
    ),
    [
      "Pakuluan ang karne ng baboy sa tubig kasama ang sibuyas at paminta.",
      "Tanggalin ang mga bula sa ibabaw para maging malinaw ang sabaw.",
      "Idagdag ang mais at saging na saba kapag medyo malambot na ang karne.",
      "Ihulog ang patatas at lutuin hanggang sa lumambot ang mga ito.",
      "Timplahan ng patis o asin para makuha ang tamang lasa.",
      "Ilagay ang repolyo o pechay sa huling bahagi ng pagluluto.",
      "Takpan at patayin ang apoy para maluto ang gulay sa singaw.",
    ],
    [p("Tubig", "6 cups"), p("Pamintang buo", "1 tbsp"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),

  recipe(
    "chicken-afritada",
    "Chicken Afritada",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ),
    [
      "Iprito muna ang patatas at carrots hanggang sa maging brown.",
      "Igisa ang bawang at sibuyas sa parehong kawali.",
      "Idagdag ang manok at igisa hanggang sa mag-iba ang kulay nito.",
      "Ibuhos ang tomato sauce at kaunting tubig para may sabaw.",
      "Pakuluan hanggang sa lumambot ang manok at lumapot ang sarsa.",
      "Ibalik ang piniritong patatas, carrots, at bell pepper sa kawali.",
      "Timplahan ng asin, paminta, at patis bago hanguin.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Tubig", "1 cup"),
      p("Laurel", "2 pcs"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Mantika", "2 tbsp"),
      p("Green peas", "1/2 cup"),
    ],
  ),

  recipe(
    "pork-menudo",
    "Pork Menudo",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Atay ng baboy", null, 0.25, "kg", "1/4 kg", true, 225],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ),
    [
      "I-marinate ang baboy sa toyo at calamansi ng ilang minuto.",
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Idagdag ang baboy at igisa hanggang sa mawala ang pagkapula.",
      "Ihalo ang atay ng baboy at tomato sauce sa kawali.",
      "Pakuluan ang karne sa mahinang apoy hanggang sa lumambot.",
      "Ihulog ang patatas, carrots, at raisins kung mayroon.",
      "Timplahan ng asin at paminta bago patayin ang apoy.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Laurel", "2 pcs"),
      p("Toyo", "2 tbsp"),
      p("Kalamansi", "3 pcs"),
      p("Hotdog", "2 pcs"),
      p("Tubig", "1 cup"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1/2 tsp"),
      p("Paminta", "1/2 tsp"),
      p("Raisins", "2 tbsp"),
    ],
  ),

  recipe(
    "ginataang-kalabasa",
    "Ginataang Kalabasa",
    ings(
      ["Kalabasa", "Squash", 0.5, "kg", "1/2 kg"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Igisa ang bawang, sibuyas, at luya sa kaunting mantika.",
      "Idagdag ang karne ng baboy o hipon at igisa nang bahagya.",
      "Ibuhos ang pangalawang piga ng gata at hayaang kumulo.",
      "Ilagay ang kalabasa at lutuin hanggang sa lumambot ito.",
      "Idagdag ang sitaw kapag medyo luto na ang kalabasa.",
      "Ibuhos ang unang piga ng gata o kakang gata.",
      "Timplahan ng bagoong o asin at pakuluan hanggang sa lumapot.",
    ],
    [
      p("Gata", "2 cups"),
      p("Patis", "1 tbsp"),
      p("Mantika", "1 tbsp"),
      p("Tubig", "1/2 cup"),
      p("Paminta", "1/4 tsp"),
    ],
  ),

  recipe(
    "tortang-talong",
    "Tortang Talong",
    ings(
      ["Talong", "Eggplant", 0.4, "kg", "2-3 pcs"],
      ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
      ["Sibuyas", "Red Onion Local", 0.065, "kg", "1 pc", true],
      ["Bawang", "Garlic Native/Local", 0.015, "kg", "2-3 cloves", true],
      ["Ground Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
    ),
    [
      "Ihawin ang talong sa ibabaw ng apoy hanggang sa mangitim ang balat.",
      "Balatan ang inihaw na talong nang dahan-dahan gamit ang kamay.",
      "Batihin ang itlog sa isang malawak na pinggan na may asin at paminta.",
      "I-flat ang talong gamit ang tinidor at isawsaw sa binating itlog.",
      "Painitin ang mantika sa kawali para sa pagpiprito.",
      "Ilagay ang talong na may itlog sa kawali at iprito nang katamtaman ang apoy.",
      "Baligtarin ang talong kapag naging brown na ang ilalim nito bago hanguin.",
    ],
    [p("Mantika", "4 tbsp"), p("Asin", "1/2 tsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "pinakbet",
    "Pinakbet",
    ings(
      ["Kalabasa", "Squash", 0.25, "kg", "1/4 kg"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
      ["Talong", "Eggplant", 0.275, "kg", "1-2 pcs"],
      ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
      ["Ampalaya", "Ampalaya", 0.2, "kg", "1 pc", true],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
    ),
    [
      "Igisa ang bawang, sibuyas, at kamatis sa mainit na mantika.",
      "Idagdag ang sahog na baboy at lutuin hanggang sa mamula.",
      "Ihalo ang bagoong alamang at gisaing mabuti kasama ng karne.",
      "Ibuhos ang kaunting tubig at hayaang kumulo.",
      "Ihulog ang kalabasa at sitaw dahil matigas ang mga ito.",
      "Isunod ang talong, ampalaya, at okra sa kawali.",
      "Takpan ang kawali at hayaang maluto ang gulay nang bahagya bago hanguin.",
    ],
    [
      p("Bagoong alamang", "3 tbsp"),
      p("Tubig", "1 cup"),
      p("Mantika", "1 tbsp"),
      p("Asin", "1/2 tsp"),
      p("Paminta", "1/4 tsp"),
    ],
  ),

  recipe(
    "giniling-na-baboy",
    "Pork Giniling",
    ings(
      ["Ground Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.175, "kg", "1 pc"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang at sibuyas sa sapat na mantika.",
      "Idagdag ang giniling na baboy at lutuin hanggang sa mag-tubig.",
      "Ibuhos ang tomato sauce at kaunting toyo para sa lasa at kulay.",
      "Ihulog ang tinadtad na patatas at carrots sa kawali.",
      "Pakuluan sa katamtamang apoy hanggang sa lumambot ang mga gulay.",
      "Ihalo ang green peas at pasas sa niluluto.",
      "Timplahan ng asin at paminta bago patayin ang apoy.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Toyo", "2 tbsp"),
      p("Tubig", "1/2 cup"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1/2 tsp"),
      p("Paminta", "1/4 tsp"),
      p("Green peas", "1/2 cup"),
      p("Raisins", "2 tbsp"),
    ],
  ),

  recipe(
    "ginisang-sayote",
    "Ginisang Sayote",
    ings(
      ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Idagdag ang hiniwang karne ng baboy o hipon.",
      "Ihulog ang hiwang sayote kapag luto na ang karne.",
      "Ibuhos ang kaunting patis o toyo para pampalasa.",
      "Lagyan ng kaunting tubig para magkaroon ng kaunting sabaw.",
      "Takpan at hayaang kumulo hanggang sa lumambot ang sayote.",
      "Hanguin habang medyo berde at malutong pa ang sayote.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/2 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "pritong-tilapia",
    "Fried Tilapia",
    ings(
      ["Tilapia", "Tilapia", 0.75, "kg", "3/4 kg"],
      ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
    ),
    [
      "Linisin ang tilapia at lagyan ng hiwa sa magkabilang gilid.",
      "Kamayin at lagyan ng sapat na asin ang buong katawan nito.",
      "Painitin ang maraming mantika sa kawali hanggang sa uminit nang husto.",
      "Iprito ang tilapia nang dahan-dahan para hindi tumalsik ang mantika.",
      "Baligtarin ang isda kapag naging kulay brown at malutong na ang ilalim.",
      "Lutuin ang kabilang gilid hanggang sa maging pantay ang lutong.",
      "Hanguin at patuluin ang labis na mantika sa sala-salang bakal.",
    ],
    [p("Mantika", "1 cup"), p("Asin", "1 tsp"), p("Paminta", "1/2 tsp")],
  ),

  recipe(
    "ginisang-repolyo-at-manok",
    "Ginisang Repolyo at Manok",
    ings(
      ["Repolyo", "Cabbage (Scorpio)", 0.5, "kg", "1/2 head"],
      ["Chicken Breast", "Chicken Breast", 0.625, "kg", "1/2 kg"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang at sibuyas sa katamtamang apoy.",
      "Ihalo ang hinimay o hiniwang manok sa kawali.",
      "Idagdag ang patis o toyo para sumipsip ang lasa sa karne.",
      "Ihulog ang hiniwang repolyo kapag luto na ang manok.",
      "Lagyan ng kaunting tubig o sabaw ng manok kung gusto ng basa.",
      "Haluin nang mabilis para magpantay ang luto ng gulay.",
      "Patayin ang apoy habang medyo malutong pa ang repolyo.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/4 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "sopas",
    "Sopas",
    ings(
      ["Chicken Breast", "Chicken Breast", 0.25, "kg", "1/4 kg"],
      ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang, sibuyas, at hinimay na manok sa mantikilya.",
      "Idagdag ang hiniwang hotdog at atay ng manok sa gisa.",
      "Ibuhos ang sabaw ng manok at hayaang kumulo nang malakas.",
      "Ihulog ang macaroni pasta at lutuin hanggang sa lumambot ito.",
      "Idagdag ang carrots at repolyo sa kumukulong sabaw.",
      "Ibuhos ang evaporada o gatas para maging maputi at malinamnam.",
      "Timplahan ng asin at paminta bago hanguin sa kalan.",
    ],
    [
      p("Elbow macaroni", "2 cups"),
      p("Evaporated milk", "1 cup"),
      p("Tubig", "6 cups"),
      p("Margarine", "1 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Kintsay", "1 stalk"),
      p("Hotdog", "2 pcs"),
    ],
  ),

  recipe(
    "ginisang-ampalaya",
    "Ginisang Ampalaya",
    ings(
      ["Ampalaya", "Ampalaya", 0.4, "kg", "1-2 pcs"],
      ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Ground Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
    ),
    [
      "Ibabad ang hiwang ampalaya sa tubig na may asin para mabawasan ang pait.",
      "Igisa ang bawang, sibuyas, at kamatis sa mainit na mantika.",
      "Ihalo ang karneng baboy o hipon at igisa nang bahagya.",
      "Pigain ang ampalaya bago ihulog sa ginisang rekado.",
      "Iwasang haluin agad para hindi lumabas ang pait ng gulay.",
      "Ibuhos ang binating itlog sa ibabaw ng ampalaya pagkatapos ng ilang minuto.",
      "Haluin nang dahan-dahan hanggang sa maluto ang itlog bago hanguin.",
    ],
    [p("Patis", "1 tbsp"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp"), p("Asin", "1 tsp")],
  ),

  recipe(
    "chicken-caldereta",
    "Chicken Caldereta",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ),
    [
      "Iprito ang patatas at carrots sa mainit na mantika bago itabi.",
      "Igisa ang bawang at sibuyas sa parehong kawali.",
      "Idagdag ang manok at lutuin hanggang sa mag-iba ang kulay nito.",
      "Ibuhos ang tomato sauce at kaunting tubig para lumambot ang karne.",
      "Ihalo ang liver spread o dinurog na atay para lumapot ang sarsa.",
      "Ihulog ang piniritong patatas, carrots, at hiniwang bell pepper.",
      "Timplahan ng keso, asin, at paminta bago patayin ang apoy.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Liver spread", "1 can"),
      p("Siling labuyo", "2 pcs"),
      p("Grated cheese", "1/2 cup"),
      p("Tubig", "1 cup"),
      p("Mantika", "2 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
    ],
  ),

  recipe(
    "beef-nilaga",
    "Beef Nilaga",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Repolyo", "Cabbage (Scorpio)", 0.25, "kg", "1/4 head"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
      ["Mais", null, 1, "pcs", "1 pc", true, 18],
    ),
    [
      "Pakuluan ang karne ng baka sa tubig kasama ang sibuyas at pamintang buo.",
      "Tanggalin ang mga dumi na lumulutang sa sabaw gamit ang kutsara.",
      "Lutuin sa mahinang apoy hanggang sa matanggal ang tigas ng baka.",
      "Ihulog ang patatas at mais kapag malambot na ang karne.",
      "Timplahan ng asin o patis para sa sapat na alat.",
      "Idagdag ang pechay at repolyo sa huling bahagi ng pagluluto.",
      "Takpan ang kaldero at patayin ang apoy para maluto sa singaw.",
    ],
    [p("Tubig", "6 cups"), p("Pamintang buo", "1 tbsp"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),

  recipe(
    "ginataang-sitaw-at-kalabasa",
    "Ginataang Sitaw at Kalabasa",
    ings(
      ["Kalabasa", "Squash", 0.5, "kg", "1/2 kg"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Igisa ang bawang at sibuyas sa kaunting mantika.",
      "Ihalo ang baboy o hipon at lutuin hanggang sa mag-iba ang kulay.",
      "Ibuhos ang pangalawang piga ng gata at pakuluan nang dahan-dahan.",
      "Idagdag ang kalabasa at lutuin hanggang sa medyo lumambot.",
      "Ihulog ang sitaw sa kawali kasama ang sili kung gusto ng anghang.",
      "Ibuhos ang makapal na kakang gata sa ibabaw ng mga gulay.",
      "Timplahan ng asin o bagoong at hayaang lumapot ang gata.",
    ],
    [
      p("Gata", "2 cups"),
      p("Patis", "1 tbsp"),
      p("Mantika", "1 tbsp"),
      p("Tubig", "1/2 cup"),
      p("Paminta", "1/4 tsp"),
    ],
  ),

  recipe(
    "ginisang-pechay-at-baboy",
    "Ginisang Pechay at Baboy",
    ings(
      ["Pechay", "Native Pechay", 0.325, "kg", "1-2 tali"],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Idagdag ang hiwang baboy at igisa hanggang sa pumula ang gilid.",
      "Ibuhos ang kaunting toyo o patis para sa dagdag na lasa.",
      "Lagyan ng kaunting tubig at pakuluan para lumambot ang karne.",
      "Ihulog ang matitigas na tangkay ng pechay sa kawali.",
      "Idagdag ang dahon ng pechay kapag medyo luto na ang tangkay.",
      "Hanguin agad para hindi overcook ang mga dahon.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/4 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "ginisang-sayote-at-manok",
    "Ginisang Sayote at Manok",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
      ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Ihalo ang hiniwang manok at gisaing mabuti hanggang sa mag-brown.",
      "Idagdag ang patis para lumasa nang husto sa manok.",
      "Ibuhos ang kaunting tubig at pakuluan para lumambot ang karne.",
      "Ihulog ang hiniwang sayote sa kumukulong sabaw.",
      "Takpan ang kawali at lutuin sa katamtamang apoy ng ilang minuto.",
      "Hanguin kapag malambot na ang sayote pero may kaunting renyo pa.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/2 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "ginisang-sayote-at-baboy",
    "Ginisang Sayote at Baboy",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Sayote", "Chayote", 0.5, "kg", "2 pcs"],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Idagdag ang hiniwang karne ng baboy at lutuin hanggang sa mag-iba ang kulay.",
      "Buhusan ng kaunting patis para sumipsip ang alat sa karne.",
      "Ihulog ang hiwang sayote kapag medyo malambot na ang baboy.",
      "Lagyan ng kaunting tubig para maging masabaw ang gulay.",
      "Takpan ang kawali at hayaang kumulo sa katamtamang apoy.",
      "Hanguin kapag malambot na ang sayote pero malutong pa nang kaunti.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/2 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "pritong-manok",
    "Fried Chicken",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
    ),
    [
      "I-marinate ang manok sa patis, calamansi, at paminta ng kalahating oras.",
      "Ipagpag ang manok sa harina na may kaunting asin at paminta.",
      "Painitin ang maraming mantika sa malalim na kawali hanggang sa uminit nang husto.",
      "Ihulog ang manok nang dahan-dahan sa mainit na mantika.",
      "Iprito sa katamtamang apoy para maluto pati ang loob ng karne.",
      "Baligtarin ang manok kapag naging brown at malutong na ang balat.",
      "Hanguin at patuluin ang labis na mantika bago ihain.",
    ],
    [
      p("Toyo", "3 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
      p("Flour", "1/2 cup"),
      p("Mantika", "2 cups"),
    ],
  ),

  recipe(
    "beef-broccoli",
    "Beef Broccoli",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Broccoli", "Broccoli Local", 0.4, "kg", "1 head"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc", true],
    ),
    [
      "I-marinate ang hiniwang baka sa toyo, cornstarch, at kaunting asukal.",
      "I-blanch ang broccoli sa kumukulong tubig ng isang minuto sabay hango sa malamig na tubig.",
      "Igisa ang bawang at luya sa kawali gamit ang kaunting mantika.",
      "Idagdag ang baka at igisa nang mabilis sa malakas na apoy hanggang sa mag-iba ang kulay.",
      "Ibuhos ang oyster sauce at kaunting tubig para sa sarsa.",
      "Ihulog ang broccoli at haluin nang mabilis para mag-isang minuto.",
      "Hanguin agad para hindi ma-overcook ang gulay at baka.",
    ],
    [
      p("Oyster sauce", "3 tbsp"),
      p("Toyo", "2 tbsp"),
      p("Cornstarch", "1 tsp"),
      p("Tubig", "1/2 cup"),
      p("Mantika", "2 tbsp"),
      p("Paminta", "1/4 tsp"),
      p("Asin", "1/2 tsp"),
      p("Asukal", "1 tsp"),
    ],
  ),

  recipe(
    "ginisang-upo",
    "Ginisang Upo",
    ings(
      ["Upo", null, 0.7, "kg", "1 pc", false, 50],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Ihalo ang giniling na baboy o hipon at lutuin hanggang sa mag-iba ang kulay.",
      "Idagdag ang patis para sa tamang alat ng gisa.",
      "Ihulog ang hiniwang upo sa kawali.",
      "Takpan ang kawali at hayaang kusang lumabas ang sabaw ng upo.",
      "Pakuluan sa katamtamang apoy hanggang sa lumambot ang gulay.",
      "Hanguin habang medyo malinaw na ang kulay ng upo.",
    ],
    [p("Patis", "1 tbsp"), p("Tubig", "1/2 cup"), p("Mantika", "1 tbsp"), p("Paminta", "1/4 tsp")],
  ),

  recipe(
    "ginataang-tilapia",
    "Ginataang Tilapia",
    ings(
      ["Tilapia", "Tilapia", 0.625, "kg", "2-3 pcs"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Iprito nang bahagya ang tilapia para hindi madurog sa gata.",
      "Igisa ang luya, bawang, at sibuyas sa kawali.",
      "Ibuhos ang pangalawang piga ng gata at pakuluan nang dahan-dahan.",
      "Idagdag ang sili, pechay, o talong sa kumukulong sabaw.",
      "Ihanay ang piniritong tilapia sa ibabaw ng mga gulay.",
      "Ibuhos ang makapal na kakang gata para maging malinamnam.",
      "Timplahan ng asin o patis at hayaang lumapot ang sarsa bago hanguin.",
    ],
    [
      p("Gata", "2 cups"),
      p("Suka", "2 tbsp"),
      p("Tubig", "1/2 cup"),
      p("Asin", "1 tsp"),
      p("Paminta", "1/4 tsp"),
    ],
  ),

  recipe(
    "pritong-bangus",
    "Fried Bangus",
    ings(
      ["Bangus", "Bangus", 0.75, "kg", "3/4 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo", true],
    ),
    [
      "Linisin ang bangus at hiwain sa gitna para maging butterfly cut.",
      "I-marinate ang bangus sa suka, maraming bawang, asin, at paminta.",
      "Painitin ang sapat na mantika sa kawali sa katamtamang apoy.",
      "Iprito ang bangus na nakaharap muna ang bahagi ng laman sa ilalim.",
      "Baligtarin kapag naging brown at malutong na ang laman ng isda.",
      "Lutuin ang bahagi ng balat hanggang sa maging crispy ito.",
      "Hanguin at patuluin ang mantika bago isawsaw sa suka na may sili.",
    ],
    [p("Toyo", "3 tbsp"), p("Paminta", "1/2 tsp"), p("Asin", "1/2 tsp"), p("Mantika", "1 cup")],
  ),

  recipe(
    "sarciadong-tilapia",
    "Sarciadong Tilapia",
    ings(
      ["Tilapia", "Tilapia", 0.625, "kg", "2-3 pcs"],
      ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "1-2 pcs"],
    ),
    [
      "Iprito ang tilapia hanggang sa maging malutong at kulay brown ang balat.",
      "Igisa ang bawang, sibuyas, at maraming kamatis sa ibang kawali.",
      "Pipisin ang mga kamatis habang ginigisa para lumabas ang katas nito.",
      "Lagyan ng kaunting sabaw o tubig at timplahan ng patis at paminta.",
      "Ibuhos ang binating itlog habang dahan-dahang hinahalo ang sarsa.",
      "Ipatong ang piniritong tilapia sa ibabaw ng sarsa para sumipsip ang lasa.",
      "Hanguin pagkatapos ng dalawang minutong pagkakaluto.",
    ],
    [
      p("Tubig", "1/2 cup"),
      p("Mantika", "1/2 cup"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/4 tsp"),
      p("Asin", "1/2 tsp"),
    ],
  ),

  recipe(
    "pritong-galunggong",
    "Fried Galunggong",
    ings(
      ["Galunggong", "Galunggong", 0.625, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
      ["Bawang", "Garlic Native/Local", 0.025, "kg", "3-4 cloves", true],
    ),
    [
      "Linisin ang galunggong at tanggalin ang hasang pati bituka nito.",
      "Budburan ng sapat na asin ang bawat isda sa magkabilang panig.",
      "Painitin ang maraming mantika sa kawali hanggang sa umusok nang kaunti.",
      "Iprito ang galunggong nang dahan-dahan sa mainit na mantika.",
      "Lutuin hanggang sa maging tuyo at napakalutong ng balat nito.",
      "Baligtarin ang isda para maluto nang pantay ang kabilang gilid.",
      "Hanguin at patuluin ang labis na mantika sa strainer.",
    ],
    [p("Asin", "1 tsp"), p("Paminta", "1/2 tsp"), p("Mantika", "1 cup")],
  ),

  recipe(
    "sarciadong-galunggong",
    "Sarciadong Galunggong",
    ings(
      ["Galunggong", "Galunggong", 0.5, "kg", "1/2 kg"],
      ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "1-2 pcs"],
    ),
    [
      "Iprito muna ang galunggong hanggang sa maging luto at crispy.",
      "Igisa ang bawang, sibuyas, at maraming hiniwang kamatis sa kawali.",
      "Lutuin ang kamatis hanggang sa madurog at maging malapot ang sarsa.",
      "Ibuhos ang kaunting sabaw ng tubig at timplahan ng patis.",
      "Ihalo ang binating itlog habang dahan-dahang pinapaikot sa kawali.",
      "Ilagay ang piniritong galunggong sa ibabaw ng sarsa.",
      "Hayaang kumulo ng isang minuto bago hanguin at ihain.",
    ],
    [
      p("Tubig", "1/2 cup"),
      p("Mantika", "1/2 cup"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/4 tsp"),
      p("Asin", "1/2 tsp"),
    ],
  ),

  recipe(
    "pritong-tamban",
    "Fried Tamban",
    ings(
      ["Tamban", "Sardines (Tamban)", 0.5, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
      ["Bawang", "Garlic Native/Local", 0.025, "kg", "3-4 cloves", true],
    ),
    [
      "Linisin ang isdang tamban at tanggalin ang kaliskis nito.",
      "Asinan nang mabuti ang loob at labas ng bawat isda.",
      "Painitin ang sapat na mantika sa kawali para sa pagpiprito.",
      "Iprito ang tamban nang katamtamang apoy para hindi agad masunog.",
      "Baligtarin kapag naging kulay ginto at malutong na ang ilalim.",
      "Lutuin ang kabilang bahagi hanggang sa maging crispy ang balat.",
      "Hanguin at patuluin ang mantika sa strainer bago ihain.",
    ],
    [p("Asin", "1 tsp"), p("Paminta", "1/2 tsp"), p("Mantika", "1 cup")],
  ),

  recipe(
    "tortang-giniling",
    "Tortang Giniling",
    ings(
      ["Ground Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg"],
      ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Patatas", "White Potato Local", 0.175, "kg", "1 pc", true],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc", true],
    ),
    [
      "Igisa ang bawang, sibuyas, at giniling na baboy sa kawali.",
      "Idagdag ang pinong patatas at carrots at lutuin hanggang sa lumambot.",
      "Timplahan ng asin at paminta bago patayin ang apoy at palamigin nang bahagya.",
      "Batihin ang mga itlog sa isang mangkok kasama ang ginisang karne.",
      "Painitin ang kaunting mantika sa malawak na kawali.",
      "Ibuhos ang sapat na dami ng pinaghalong itlog at karne.",
      "Baligtarin nang dahan-dahan gamit ang sandok kapag luto na ang ilalim bago hanguin.",
    ],
    [p("Mantika", "4 tbsp"), p("Asin", "1 tsp"), p("Paminta", "1/2 tsp")],
  ),

  recipe(
    "pritong-pork-chop",
    "Fried Pork Chop",
    ings(
      ["Pork Chop", "Pork Chop", 0.5, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
      ["Itlog", "Chicken Egg (White Medium)", 1, "pcs", "1 pc", true],
    ),
    [
      "I-marinate ang pork chop sa toyo, calamansi, at paminta ng isang oras.",
      "Ipagpag ang karne sa harina kung gusto mo ng may kaunting balot.",
      "Painitin ang sapat na mantika sa kawali sa katamtamang apoy.",
      "Iprito ang pork chop nang dahan-dahan para maluto hanggang sa loob.",
      "Baligtarin ang karne kapag naging kulay brown na ang gilid nito.",
      "Lutuin ang kabilang panig hanggang sa maging pantay ang kulay.",
      "Hanguin at patuluin ang labis na mantika bago ihain sa mesa.",
    ],
    [
      p("Toyo", "3 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
      p("Breadcrumbs", "1/2 cup"),
      p("Mantika", "1 cup"),
    ],
  ),

  recipe(
    "pritong-liempo",
    "Fried Liempo",
    ings(
      ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
      ["Kalamansi", "Calamansi", 0.025, "kg", "2-3 pcs", true],
    ),
    [
      "I-marinate ang liempo sa toyo, calamansi, bawang, at paminta ng isang oras.",
      "Painitin ang sapat na mantika sa kawali sa katamtamang apoy.",
      "Ilagay ang liempo nang dahan-dahan sa mainit na mantika.",
      "Iprito ang karne hanggang sa maging kulay brown ang ilalim.",
      "Baligtarin ang liempo para maluto nang pantay ang kabilang panig.",
      "Hanguin at patuluin ang mantika bago hiwain at ihain.",
    ],
    [p("Toyo", "3 tbsp"), p("Paminta", "1/2 tsp"), p("Asin", "1/2 tsp"), p("Mantika", "1 cup")],
  ),

  recipe(
    "pritong-pakpak-ng-manok",
    "Fried Chicken Wings",
    ings(
      ["Chicken Wings", "Chicken Wing", 0.625, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ),
    [
      "I-marinate ang chicken wings sa asin, paminta, at kaunting bawang.",
      "Ipagpag ang bawat pakpak sa harina para maging malutong ang balat.",
      "Painitin ang sapat na mantika para sa deep fry sa katamtamang apoy.",
      "Iprito ang mga pakpak ng manok nang dahan-dahan.",
      "Baligtarin kapag naging kulay ginto at malutong na ang balat.",
      "Hanguin at patuluin ang labis na mantika sa strainer.",
    ],
    [
      p("Toyo", "3 tbsp"),
      p("Bawang", "4 cloves"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
      p("Flour", "1/2 cup"),
      p("Mantika", "2 cups"),
    ],
  ),

  recipe(
    "adobong-baboy",
    "Adobong Baboy",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion Local", 0.15, "kg", "1-2 pcs"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs", true],
      ["Itlog", "Chicken Egg (White Medium)", 2, "pcs", "2 pcs", true],
    ),
    [
      "I-marinate ang karne ng baboy sa toyo, bawang, at paminta.",
      "Igisa ang maraming bawang sa kaunting mantika hanggang sa bumango.",
      "Idagdag ang baboy kasama ang marinade at gisaing mabuti.",
      "Ibuhos ang tubig at ilagay ang dahon ng laurel at pamintang buo.",
      "Pakuluan sa mahinang apoy hanggang sa lumambot nang husto ang karne.",
      "Idagdag ang suka at hayaang kumulo nang hindi hinahalo ng ilang minuto.",
      "Lutuin hanggang sa mabawasan ang sabaw at lumapot ang sarsa.",
    ],
    [
      p("Toyo", "1/2 cup"),
      p("Suka", "1/3 cup"),
      p("Tubig", "1 cup"),
      p("Laurel", "3 pcs"),
      p("Pamintang buo", "1 tsp"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1/2 tsp"),
      p("Asukal", "1 tsp"),
    ],
  ),

  recipe(
    "pork-mechado",
    "Pork Mechado",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ),
    [
      "Igisa ang bawang at sibuyas sa mainit na mantika.",
      "Idagdag ang karne ng baboy at igisa hanggang sa mag-iba ang kulay.",
      "Ibuhos ang tomato sauce at kaunting patis o toyo para sa lasa.",
      "Lagyan ng tubig at pakuluan hanggang sa lumambot ang karne.",
      "Ihulog ang patatas, carrots, at bell pepper sa kawali.",
      "Timplahan ng kaunting asukal, asin, at paminta ayon sa iyong panlasa.",
      "Hanguin kapag lumapot na ang sarsa at malambot na ang mga gulay.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Toyo", "2 tbsp"),
      p("Tubig", "1 cup"),
      p("Laurel", "2 pcs"),
      p("Mantika", "2 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
    ],
  ),

  recipe(
    "beef-mechado",
    "Beef Mechado",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs", true],
    ),
    [
      "Igisa ang bawang at sibuyas sa kaunting mantika.",
      "Ihalo ang baka at igisa hanggang sa mawala ang pagkapula ng karne.",
      "Ibuhos ang tomato sauce, toyo, at sapat na tubig para sa sabaw.",
      "Pakuluan sa mahinang apoy nang matagal hanggang sa lumambot ang baka.",
      "Ihulog ang patatas, carrots, at bell pepper kapag malambot na ang baka.",
      "Timplahan ng kaunting lemon o calamansi para sa kaunting asim.",
      "Hanguin kapag lumapot na ang sarsa ng mechado.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Toyo", "2 tbsp"),
      p("Tubig", "2 cups"),
      p("Laurel", "2 pcs"),
      p("Mantika", "2 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
    ],
  ),

  recipe(
    "pork-caldereta",
    "Pork Caldereta",
    ings(
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
    ),
    [
      "Iprito muna ang patatas at carrots sa mainit na mantika saka itabi.",
      "Igisa ang bawang, sibuyas, at sili sa parehong kawali.",
      "Idagdag ang baboy at lutuin hanggang sa mag-iba ang kulay nito.",
      "Ibuhos ang tomato sauce at tubig para pampalambot sa karne.",
      "Ihalo ang liver spread kapag malambot na ang karne para lumapot ang sarsa.",
      "Idagdag ang piniritong patatas, carrots, bell pepper, at keso.",
      "Pakuluan ng isa pang minuto bago hanguin at ihain.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Liver spread", "1 can"),
      p("Bell pepper", "1 pc"),
      p("Siling labuyo", "2 pcs"),
      p("Grated cheese", "1/2 cup"),
      p("Tubig", "1 cup"),
      p("Mantika", "2 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
    ],
  ),

  recipe(
    "beef-caldereta",
    "Beef Caldereta",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Patatas", "White Potato Local", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots Local", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic Native/Local", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red) Local", 0.125, "kg", "1 pc", true],
    ),
    [
      "Pakuluan ang baka sa tubig hanggang sa matanggal ang tigas nito.",
      "Igisa ang bawang, sibuyas, at sili sa hiwalay na kaldero.",
      "Ihalo ang pinalambot na baka at gisaing mabuti kasama ng rekado.",
      "Ibuhos ang tomato sauce at kaunting sabaw ng pinaglagaan ng baka.",
      "Idagdag ang liver spread para maging malapot at malinamnam ang sarsa.",
      "Ihulog ang patatas, carrots, bell pepper, at saging na saba.",
      "Timplahan ng gadgaring keso bago patayin ang apoy.",
    ],
    [
      p("Tomato sauce", "1 cup"),
      p("Liver spread", "1 can"),
      p("Siling labuyo", "2 pcs"),
      p("Grated cheese", "1/2 cup"),
      p("Tubig", "2 cups"),
      p("Mantika", "2 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
    ],
  ),

  recipe(
    "chicken-inasal",
    "Chicken Inasal",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.625, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
    ),
    [
      "Paghaluin ang tanglad, bawang, luya, calamansi, at suka para sa marinade.",
      "I-marinate ang manok sa hinalong sangkap sa loob ng magdamag.",
      "Painitin ang kawali at ihanda ang uling para sa pag-iihaw.",
      "Ihanda ang chicken oil na may atsuete at asin para sa pampahid.",
      "Ihawin ang manok sa ibabaw ng nagbabagang uling.",
      "Pahiran ng chicken oil ang manok habang binabaligtad para hindi matuyo.",
      "Hanguin kapag luto na ang loob at medyo sunog-sunog ang balat.",
    ],
    [
      p("Tanglad", "2 stalks"),
      p("Luya", "1 thumb-sized piece"),
      p("Bawang", "1 head"),
      p("Suka", "1/2 cup"),
      p("Atsuete oil", "3 tbsp"),
      p("Asin", "1 tsp"),
      p("Paminta", "1/2 tsp"),
      p("Asukal", "1 tbsp"),
    ],
  ),

  recipe(
    "inihaw-na-liempo",
    "Inihaw na Liempo",
    ings(
      ["Liempo", "Pork Belly (Liempo)", 0.5, "kg", "1/2 kg"],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Bawang", "Garlic Native/Local", 0.035, "kg", "4-6 cloves", true],
    ),
    [
      "I-marinate ang liempo sa toyo, calamansi, bawang, at kaunting asukal ng tatlong oras.",
      "Ihanda ang uling hanggang sa magbaga nang husto ang apoy.",
      "Ipatong ang liempo sa ihawan sa ibabaw ng uling.",
      "Ihawin ang karne nang dahan-dahan para maluto pati ang loob.",
      "Pahiran ng natitirang marinade ang karne habang binabaligtad ito.",
      "Hanguin kapag medyo may kaunting taba nang nasusunog sa gilid.",
    ],
    [
      p("Toyo", "1/2 cup"),
      p("Banana ketchup", "1/2 cup"),
      p("Paminta", "1/2 tsp"),
      p("Asin", "1/2 tsp"),
      p("Siling labuyo", "2 pcs"),
    ],
  ),

  recipe(
    "inihaw-na-bangus",
    "Inihaw na Bangus",
    ings(
      ["Bangus", "Bangus", 0.75, "kg", "3/4 kg"],
      ["Kamatis", "Tomato", 0.2, "kg", "2 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger Local", 0.04, "kg", "1 piraso", true],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Linisin ang bangus at hiwain sa likod para sa paglalagyan ng palaman.",
      "Paghaluin ang tinadtad na kamatis, sibuyas, at luya sa mangkok.",
      "Punuin ang loob ng bangus ng pinaghalong kamatis at sibuyas.",
      "Balutin ang bangus sa aluminum foil para hindi matapon ang palaman.",
      "Ipatong ang binalot na bangus sa ibabaw ng mainit na uling.",
      "Ihawin ang bawat panig ng sampung minuto para maluto nang pantay.",
      "Hanguin at buksan ang foil bago ihain kasama ang toyo at calamansi.",
    ],
    [p("Asin", "1 tsp"), p("Paminta", "1/2 tsp"), p("Margarine", "1 tbsp")],
  ),

  recipe(
    "sinigang-na-bangus",
    "Sinigang na Bangus",
    ings(
      ["Bangus", "Bangus", 0.625, "kg", "1/2 kg"],
      ["Kamatis", "Tomato", 0.225, "kg", "2-3 pcs"],
      ["Sibuyas", "Red Onion Local", 0.1, "kg", "1 pc"],
      ["Kangkong", null, 0.175, "kg", "1 tali", false, 100],
      ["Gabi", null, 0.25, "kg", "1 pc", false, 50],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
      ["Okra", null, 0.1, "kg", "4-6 pcs", true, 90],
      ["Siling haba", "Chilli (Green) Local", 0.02, "kg", "1-2 pcs", true],
    ),
    [
      "Pakuluan ang tubig kasama ang kamatis, sibuyas, at luya.",
      "Ihulog ang gabi at labanos sa kumukulong sabaw hanggang sa lumambot.",
      "Idagdag ang bangus nang dahan-dahan para hindi madurog ang isda.",
      "Ibuhos ang pampaasim na sampalok o calamansi kapag luto na ang isda.",
      "Ihulog ang kangkong, sitaw, at sili sa kaldero.",
      "Timplahan ng patis para makuha ang tamang alat at asim.",
      "Patayin ang apoy pagkatapos ng isang minuto para hindi ma-overcook ang gulay.",
    ],
    [p("Sinigang mix", "1 pack"), p("Tubig", "1 liter"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),
];

// ═══════════════════════════════════════════════════════════
// SMART COST ENGINE
// ═══════════════════════════════════════════════════════════

// Palengke-realistic rates for items bought by piece, not by kilo.
// DA per-kg wholesale rates inflate small quantities unrealistically.
const PALENGKE_RATE_OVERRIDES: Record<string, number> = {
  "Garlic Native/Local": 175, // 1 ulo ≈ ₱7 (DA ₱383/kg × 0.04 = ₱15 — too high)
  "Red Onion Local": 80, // 1 pc ≈ ₱8 (DA ₱102/kg × 0.10 = ₱10 — slightly high)
  "Ginger Local": 125, // 1 piraso ≈ ₱5 (DA ₱180/kg × 0.04 = ₱7 — slightly high)
};

// ═══════════════════════════════════════════════════════════
// PROTEIN TYPE CLASSIFICATION
// Order matters! Specific checks (beef, egg) run BEFORE
// generic pork patterns to prevent misclassification.
// V2.1.1 fix: beef-caldereta, beef-mechado, tortang-giniling,
// ginataang-sitaw-at-kalabasa all correctly classified now.
// ═══════════════════════════════════════════════════════════

function getProteinType(
  recipe: Recipe,
): "fish" | "chicken" | "pork" | "beef" | "egg" | "veggie" | "other" {
  const id = recipe.id;

  // ── Beef: FIRST — prevents "caldereta"/"mechado" from matching pork ──
  if (id.includes("beef") || id.includes("kare-kare")) return "beef";

  // ── Egg: BEFORE pork — prevents "tortang-giniling" from matching pork ──
  if (id.includes("tortang") || id.includes("ampalaya")) return "egg";

  // ── Chicken ──
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

  // ── Pork ──
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
  )
    return "pork";

  // ── Fish ──
  if (
    id.includes("bangus") ||
    id.includes("tilapia") ||
    id.includes("galunggong") ||
    id.includes("tamban") ||
    id.includes("sarciadong")
  )
    return "fish";

  // ── Veggie ──
  if (
    id.includes("pinakbet") ||
    id.includes("ginataang-kalabasa") ||
    id.includes("ginataang-sitaw") ||
    id.includes("upo") ||
    id.includes("sayote") ||
    id.includes("pechay")
  )
    return "veggie";

  return "other";
}

// ═══════════════════════════════════════════════════════════
// MAIN INGREDIENT KEY
// Used for Pass 1 ingredient diversity check.
// V2.1.1 fix: chicken breast/wing checked BEFORE generic
// "chicken" to prevent all chicken cuts mapping to "chicken-leg".
// ═══════════════════════════════════════════════════════════

function getMainIngredientKey(recipe: Recipe): string {
  const required = recipe.ingredients.find((ing) => !ing.optional);
  if (!required) return recipe.id;

  const key = (required.daKey || required.name).toLowerCase();

  // Fish — specific species
  if (key.includes("galunggong")) return "galunggong";
  if (key.includes("tilapia")) return "tilapia";
  if (key.includes("bangus")) return "bangus";
  if (key.includes("tamban") || key.includes("sardines")) return "tamban";

  // Chicken — specific cuts BEFORE generic "chicken"
  if (key.includes("chicken breast")) return "chicken-breast";
  if (key.includes("chicken wing")) return "chicken-wing";
  if (key.includes("chicken leg") || key.includes("chicken")) return "chicken-leg";

  // Pork — specific cuts
  if (key.includes("pork belly") || key.includes("liempo")) return "liempo";
  if (key.includes("pork chop")) return "pork-chop";
  if (key.includes("pork picnic") || key.includes("kasim")) return "kasim";

  // Beef
  if (key.includes("beef")) return "beef";

  // Vegetables
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
    return { ...ing, qty: 0.75, amount: "3/4 kg" };
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
    // Use palengke rate for small-quantity items bought by piece
    if (normalized.qty <= 0.2 && PALENGKE_RATE_OVERRIDES[normalized.daKey]) {
      return PALENGKE_RATE_OVERRIDES[normalized.daKey] * normalized.qty;
    }
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
    case "fish":
      return 2;
    case "chicken":
      return 2;
    case "pork":
      return 2;
    case "beef":
      return 1;
    case "egg":
      return 1;
    case "veggie":
      return 1;
    default:
      return 1;
  }
}

// ═══════════════════════════════════════════════════════════
// BALANCED SELECTION — 4-PASS SYSTEM
// V2.1.1: Added Pass 4 (no caps) to guarantee filling all
// slots when caps prevent reaching target count.
// Uses Set for O(1) dedup instead of Array.some() scans.
// ═══════════════════════════════════════════════════════════

function chooseBalancedMeals(allResults: CostResult[], count: number): CostResult[] {
  const selected: CostResult[] = [];
  const proteinCount: Record<string, number> = {};
  const mainIngredientUsed = new Set<string>();
  const selectedIds = new Set<string>();

  // Pass 1: strict — respect caps + no duplicate main ingredients
  for (const result of allResults) {
    if (selected.length >= count) break;

    const protein = getProteinType(result.recipe);
    const mainKey = getMainIngredientKey(result.recipe);
    const limit = getProteinLimit(protein);
    const current = proteinCount[protein] || 0;

    if (current >= limit) continue;
    if (mainIngredientUsed.has(mainKey)) continue;

    selected.push(result);
    selectedIds.add(result.recipe.id);
    proteinCount[protein] = current + 1;
    mainIngredientUsed.add(mainKey);
  }

  // Pass 2: relax ingredient dups, still respect caps
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (selectedIds.has(result.recipe.id)) continue;

      const protein = getProteinType(result.recipe);
      const limit = getProteinLimit(protein);
      const current = proteinCount[protein] || 0;

      if (current >= limit) continue;

      selected.push(result);
      selectedIds.add(result.recipe.id);
      proteinCount[protein] = current + 1;
    }
  }

  // Pass 3: relax caps with double limits, still controlled
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (selectedIds.has(result.recipe.id)) continue;

      const protein = getProteinType(result.recipe);
      const doubleLimit = getProteinLimit(protein) * 2;
      const current = proteinCount[protein] || 0;

      if (current >= doubleLimit) continue;

      selected.push(result);
      selectedIds.add(result.recipe.id);
      proteinCount[protein] = current + 1;
    }
  }

  // Pass 4: NO caps — fill remaining with cheapest available
  // Guarantees we reach target count if pool has enough recipes
  if (selected.length < count) {
    for (const result of allResults) {
      if (selected.length >= count) break;
      if (selectedIds.has(result.recipe.id)) continue;

      selected.push(result);
      selectedIds.add(result.recipe.id);
    }
  }

  return selected;
}

// ═══════════════════════════════════════════════════════════
// UPDATED: Added excludeIds for daily meal rotation
// Excludes yesterday's meal picks so users see variety
// ═══════════════════════════════════════════════════════════
export function findCheapestMeals(
  recipes: Recipe[],
  todayPrices: PriceMap,
  lastPrices: PriceMap,
  count: number = 8,
  excludeIds: string[] = [],
): CostResult[] {
  const validRecipes = recipes
    .filter((recipe) => hasRequiredPrices(recipe, todayPrices))
    .filter((recipe) => !excludeIds.includes(recipe.id));

  const allResults = validRecipes
    .map((recipe) => calculateRecipeCostDetailed(recipe, todayPrices, lastPrices))
    .filter((result) => Number.isFinite(result.totalCost) && result.totalCost > 0)
    .sort((a, b) => a.totalCost - b.totalCost);

  return chooseBalancedMeals(allResults, count);
}

// ═══════════════════════════════════════════════════════════
// PROTEIN TYPE EXPORT — used by page.tsx filter tabs
// ═══════════════════════════════════════════════════════════
export { getProteinType };
