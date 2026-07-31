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
  unit: "kg" | "pcs" | "tali";
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

type Unit = "kg" | "pcs" | "tali";

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
      ["Bawang", "Garlic", 0.06, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.15, "kg", "1-2 pcs"],
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Gabi", null, 0.25, "kg", "1 pc", false, 140],
      ["Kangkong", null, 1, "tali", "1 tali", false, 20],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
      ["Okra", null, 1, "tali", "1 tali", true, 15],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
      ["Sinigang mix", null, 1, "pcs", "1 pack", false, 8.45],
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
    [ p("Tubig", "1 liter"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),

  recipe(
    "kare-kare",
    "Kare-Kare",
    ings(
      ["Beef", "Beef Brisket", 0.5, "kg", "1/2 kg"],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali"],
      ["Bawang", "Garlic", 0.035, "kg", "4 cloves"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bagoong alamang", null, 0.5, "pcs", "1/2 pack", false, 25],
      ["Peanut butter", null, 1, "pcs", "1 jar", false, 55.75],
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
      p("Atsuete powder", "1 tbsp"),
      p("Tubig", "4 cups"),
      p("Mantika", "2 tbsp"),
      p("Asin", "1 tsp"),
      p("Puso ng saging", "1 pc"),
    ],
  ),

  recipe(
    "tinolang-manok",
    "Tinolang Manok",
    ings(
      ["Chicken", "Chicken Leg Quarter", 0.5, "kg", "1/2 kg"],
      ["Sayote", "Chayote", 0.4, "kg", "1 pc"],
      ["Luya", "Ginger", 0.04, "kg", "1 piraso"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Malunggay", null, 1, "tali", "1 tali", true, 20],
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
      ["Bawang", "Garlic", 0.035, "kg", "4-6 cloves"],
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
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.035, "kg", "4 cloves"],
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
      ["Sibuyas", "Red Onion", 0.15, "kg", "1-2 pcs"],
      ["Siling green", "Chilli (Green)", 0.02, "kg", "2-4 pcs"],
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
      ["Repolyo", "Cabbage", 0.25, "kg", "1/4 head"],
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
      ["Mais", null, 1, "pcs", "1 pc", true, 25],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Atay ng baboy", null, 0.25, "kg", "1/4 kg", true, 280],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
      ["Hotdog", null, 2, "pcs", "2 pcs", true, 10],
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
      p("Laurel", "2 pcs"),
      p("Toyo", "2 tbsp"),
      p("Kalamansi", "3 pcs"),
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
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger", 0.04, "kg", "1 piraso"],
      ["Sitaw", "Pole Sitao", 0.125, "kg", "5-8 pcs", true],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
      ["Gata", null, 1, "pcs", "1 pack", false, 35.75],
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
      ["Sibuyas", "Red Onion", 0.065, "kg", "1 pc", true],
      ["Bawang", "Garlic", 0.015, "kg", "2-3 cloves", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Okra", null, 1, "tali", "1 tali", true, 15],
      ["Ampalaya", "Ampalaya", 0.2, "kg", "1 pc", true],
      ["Pork", "Pork Picnic Shoulder (Kasim)", 0.25, "kg", "1/4 kg", true],
      ["Bagoong alamang", null, 0.5, "pcs", "1/2 pack", false, 25],
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
      ["Patatas", "White Potato", 0.175, "kg", "1 pc"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Repolyo", "Cabbage", 0.5, "kg", "1/2 head"],
      ["Chicken Breast", "Chicken Breast", 0.625, "kg", "1/2 kg"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Repolyo", "Cabbage", 0.25, "kg", "1/4 head"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Hotdog", null, 2, "pcs", "2 pcs", true, 10],
      ["Elbow macaroni", null, 1, "pcs", "1 pack", false, 26.1],
      ["Evaporated milk", null, 1, "pcs", "1 can", false, 20.25],
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
      p("Tubig", "6 cups"),
      p("Margarine", "1 tbsp"),
      p("Patis", "1 tbsp"),
      p("Paminta", "1/2 tsp"),
      p("Kintsay", "1 stalk"),
    ],
  ),

  recipe(
    "ginisang-ampalaya",
    "Ginisang Ampalaya",
    ings(
      ["Ampalaya", "Ampalaya", 0.4, "kg", "1-2 pcs"],
      ["Itlog", "Chicken Egg (White Medium)", 3, "pcs", "3 pcs"],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
      ["Liver spread", null, 1, "pcs", "1 can", false, 24.35],
      ["Grated cheese", null, 1, "pcs", "1 pack", true, 17.6],
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
      p("Siling labuyo", "2 pcs"),
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
      ["Repolyo", "Cabbage", 0.25, "kg", "1/4 head"],
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Pechay", "Native Pechay", 0.2, "kg", "1 tali", true],
      ["Mais", null, 1, "pcs", "1 pc", true, 25],
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
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger", 0.04, "kg", "1 piraso", true],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
      ["Gata", null, 1, "pcs", "1 pack", false, 35.75],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Luya", "Ginger", 0.04, "kg", "1 piraso", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Broccoli", "Broccoli", 0.4, "kg", "1 head"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc", true],
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
      ["Upo", null, 1, "pcs", "1 pc", false, 80],
      ["Kamatis", "Tomato", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Luya", "Ginger", 0.04, "kg", "1 piraso"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
      ["Gata", null, 1, "pcs", "1 pack", false, 35.75],
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
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Bawang", "Garlic", 0.025, "kg", "3-4 cloves", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
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
      ["Bawang", "Garlic", 0.025, "kg", "3-4 cloves", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Patatas", "White Potato", 0.175, "kg", "1 pc", true],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc", true],
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
      ["Bawang", "Garlic", 0.035, "kg", "4-6 cloves", true],
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
      ["Bawang", "Garlic", 0.035, "kg", "4-6 cloves", true],
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
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Sibuyas", "Red Onion", 0.15, "kg", "1-2 pcs"],
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs", true],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Kamatis", "Tomato", 0.14, "kg", "1-2 pcs", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
      ["Liver spread", null, 1, "pcs", "1 can", false, 24.35],
      ["Grated cheese", null, 1, "pcs", "1 pack", true, 17.6],
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
      p("Bell pepper", "1 pc"),
      p("Siling labuyo", "2 pcs"),
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
      ["Patatas", "White Potato", 0.3, "kg", "1-2 pcs"],
      ["Carrots", "Carrots", 0.1, "kg", "1 pc"],
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Bawang", "Garlic", 0.04, "kg", "1 ulo"],
      ["Bell pepper", "Bell Pepper (Red)", 0.125, "kg", "1 pc", true],
      ["Tomato sauce", null, 1, "pcs", "1 pack", false, 13.6],
      ["Liver spread", null, 1, "pcs", "1 can", false, 24.35],
      ["Grated cheese", null, 1, "pcs", "1 pack", true, 17.6],
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
      p("Siling labuyo", "2 pcs"),
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
      ["Bawang", "Garlic", 0.035, "kg", "4-6 cloves", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Luya", "Ginger", 0.04, "kg", "1 piraso", true],
      ["Kalamansi", "Calamansi", 0.04, "kg", "3-5 pcs", true],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
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
      ["Sibuyas", "Red Onion", 0.1, "kg", "1 pc"],
      ["Kangkong", null, 1, "tali", "1 tali", false, 20],
      ["Gabi", null, 0.25, "kg", "1 pc", false, 140],
      ["Talong", "Eggplant", 0.2, "kg", "1 pc", true],
      ["Okra", null, 1, "tali", "1 tali", true, 15],
      ["Siling haba", "Chilli (Green)", 0.02, "kg", "1-2 pcs", true],
      ["Sinigang mix", null, 1, "pcs", "1 pack", false, 8.45],
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
    [ p("Tubig", "1 liter"), p("Patis", "2 tbsp"), p("Asin", "1 tsp")],
  ),
];

// ═══════════════════════════════════════════════════════════
// SMART COST ENGINE
// ═══════════════════════════════════════════════════════════

// Palengke-realistic rates for items bought by piece, not by kilo.
// DA per-kg wholesale rates inflate small quantities unrealistically.
const PALENGKE_RATE_OVERRIDES: Record<string, number> = {
  "Garlic": 175, // 1 ulo ≈ ₱7 (DA ₱383/kg × 0.04 = ₱15 — too high)
  "Red Onion": 80, // 1 pc ≈ ₱8 (DA ₱102/kg × 0.10 = ₱10 — slightly high)
  "Ginger": 125, // 1 piraso ≈ ₱5 (DA ₱180/kg × 0.04 = ₱7 — slightly high)
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

// isMainProteinIngredient() lived here until 30 Jul 2026. Its only caller was
// the 3/4 kg rule below, so retiring that rule left it dead, and dead code that
// looks load-bearing is worse than no code. getMainIngredientKey above is still
// live: the selection engine uses it to stop two dishes with the same main
// ingredient landing on one day.

/**
 * RETIRED 30 Jul 2026. It now returns the ingredient untouched.
 *
 * It used to round a small main protein UP to 3/4 kg, on the theory that a
 * family portion is 3/4 kg. Chan killed it: *"3/4 kg rule, make it 1/2 for all
 * of them i think 1/2 is enough for 1-3 person"*.
 *
 * He is the one who wrote "1/2 kg" in the recipes, every card says 1-3 katao, and
 * the rule was quietly overriding his amount AND relabelling it as "3/4 kg" on
 * the card. The app was overruling its own author and then hiding that it had.
 *
 * Measured before removing it: 13 of the 47 dishes were affected and the book
 * carried P380 of protein nobody asked for, about P29 a dish. Fried Tamban was
 * P102 and is P74 now.
 *
 * The function stays as a seam rather than being deleted at every call site, so
 * the reason is recorded where the behaviour used to live. Anything wanting to
 * adjust a quantity at costing time belongs here.
 */
function normalizeIngredientForCost(_recipe: Recipe, ing: RecipeIngredient): RecipeIngredient {
  return ing;
}

/**
 * Can this recipe be costed from today's prices?
 *
 * A required ingredient with no price EXCLUDES the whole recipe. That guard is
 * deliberate — a missing Galunggong price once read as free and ranked the dish
 * cheapest — and it stays.
 *
 * What changed (Jul 28 2026) is an asymmetry: getIngredientCost() already falls
 * back to `fallbackPrice` when the DA has no price for a daKey, but this
 * function ignored `fallbackPrice` unless daKey was null. So a recipe was thrown
 * out BEFORE costing even ran, even though the cost function was ready to handle
 * it. Now the two agree.
 *
 * Measured impact: on 3 of the 28 Feb 2026 sheets the DA published no Cabbage
 * (Scorpio) price, which silently removed Sopas, Nilagang Baboy, Beef Nilaga and
 * Ginisang Repolyo at Manok — all sabaw or ginisa, the fragile categories.
 *
 * NOTE: no daKey ingredient carries a fallbackPrice yet. This only opens the
 * door; the numbers are Chan's to set during his recipe pass, because a made-up
 * price is exactly what this project's canon forbids.
 */
function hasRequiredPrices(recipe: Recipe, priceMap: PriceMap): boolean {
  return recipe.ingredients.every((ing) => {
    if (ing.optional) return true;
    if (ing.daKey === null) return ing.fallbackPrice !== undefined;
    const price = priceMap[ing.daKey];
    if (typeof price === "number" && Number.isFinite(price) && price > 0) return true;
    // DA did not price it today: a hand-set fallback may still carry the recipe.
    return ing.fallbackPrice !== undefined && ing.fallbackPrice > 0;
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

/**
 * Pantry goods that DO cost money, at a flat tingi price for one dish.
 *
 * Chan, Jul 30 2026, reviewing Chicken Steak with Gravy: *"some of this item
 * should be optional and not free -- Harina, knorr chicken cubes, mantika,
 * paminta, this should not be free"*, with the prices: *"for all the dishes that
 * have mantika or oil we should put it like 10 pesos base price, for paminta 2
 * pesos is the base price for 1 dish tingi, harina/flour/cornstarch we can have
 * a base price of 10 pesos on palengke"*.
 *
 * This PARTLY REVERSES the Jul 29 split model, which made every tingi seasoning
 * free. Oil and pepper are no longer free: oil is in 38 of 47 dishes and pepper
 * in 44, so calling them free understated almost every dish on the site. The P10
 * is the repackaged mantika he described, and P2 is a tingi of pepper, so both
 * are whole units in the whole-packs sense, not a fraction of anything.
 *
 * A FLAT price per dish, never price x amount. A dish deep-frying in 1 cup of
 * oil and one sauteing in 2 tbsp both pay P10, because both send you to the
 * sari-sari store for the same P10 sachet.
 *
 * What is absent stays free, and every absence is Chan's own call:
 *   asin           "asin is optional its not needed"
 *   garlic powder  "optional we already have garlic"
 *   tubig, laurel  never bought for a single dish
 *
 * ── Jul 30 2026, second pass: the sauces get priced too ─────
 * Asked whether toyo, patis, suka and asukal should follow, Chan: *"yes do it"*.
 * Every price below is a real ShopSuki row, not a guess.
 *
 * Toyo, patis and suka use the 100ml BUDGET PACK, not the cheaper 60ml, because
 * that is the size Chan already ruled on: *"shop suki is 100ml budget pack which
 * is enough for 1 dish. so i think we should follow it"*. A 60ml Datu Puti at
 * P5.00 exists but does not cover the 1/2 cup an adobo asks for.
 *
 * ASUKAL is the one price not from ShopSuki. Its cheapest catalogue row is a
 * 1/2 kg bag at P35, absurd for the 1 tsp a dish uses, and Chan is right that
 * *"asukal is just sugar - we already have this on dti bantay presyo"* — the DA
 * sheet does carry Sugar (Brown) at P72.32/kg. But a per-tablespoon figure from
 * that (P0.87) is not a thing you can buy either. Chan, 30 Jul 2026: *"put it as
 * a base price of 5 pesos there is a tingi of this also"*. P5 is the tingi bag,
 * which is the unit that actually changes hands.
 *
 * MARGARINE AND MANTIKILYA are both priced, and both at P10. Chan first: *"some
 * this need margarine or mantikilya or butter, margarine is a cheaper side of
 * butter in philippines"*, then on seeing the P10.60 ShopSuki figure: *"10 pesos
 * base price on palengke - we should put it for this -- 10 pesos is enough for 1
 * dish"*. He said that about mantikilya; margarine follows it because margarine
 * is the CHEAPER of the two and leaving it at P10.60 would price the cheap
 * option above the dear one. Say so if that is wrong.
 *
 * ── Four roles, not two (Chan, 30 Jul 2026) ─────────────────
 * A pantry good is no longer just priced-or-free. Reviewing this same dish he
 * asked for all four:
 *
 *   charged   a real line with a price, and tickable on /pantry
 *   optional  shown, greyed, NEVER counted: *"garlic powder is not free this
 *             should be optional and not counted on total price"*
 *   hidden    not shown at all: *"tubig -- dont display this"*
 *   free      shown under the free heading, the remainder (laurel)
 *
 * ASIN MOVED FROM FREE TO CHARGED at P5: *"asin should be here - 5 pesos base
 * price not optional or free so they can tick this pantry items"*. That reverses
 * his Jul 30 morning ruling that asin was optional, and the reason is the pantry
 * page — he wants it tickable, and only a charged good can be.
 *
 * MANTIKA IS CONDITIONAL, the one rule that depends on the rest of the dish:
 * *"sometimes if you have mantikilya/butter or margarine -- mantika is optional
 * make this mantika optional"*. A dish already buying a butter-family fat does
 * not also buy oil, so mantika drops to `optional` there. See pantryRole().
 */
const PANTRY_PRICES: Record<string, number> = {
  // Oil and fat
  Mantika: 10,
  "Atsuete oil": 10,
  Margarine: 10,
  Mantikilya: 10,
  // Seasoning
  Asin: 5,
  Paminta: 2,
  "Pamintang buo": 2,
  Toyo: 7.2,
  Patis: 10.6,
  Suka: 6.3,
  Asukal: 5,
  "Asukal na pula": 5,
  "Chicken broth cube": 6.8,
  "Knorr chicken cube": 6.8,
  // Coating
  Harina: 10,
  Flour: 10,
  Cornstarch: 10,

  // ── The 19 that used to sit in the "free" list ────────────
  // Chan, 30 Jul 2026: *"this items is probably not optional goods or items
  // instead its essential for the dish and should be counted on total, most of
  // this are on shopsuki"*. He was right, and it was worse than free: removing
  // the pantry section from the card would have hidden a whole bottle of Mang
  // Tomas and 30 lumpia wrappers, so a cook could not have shopped for the dish.
  //
  // Groceries priced from ShopSuki, cheapest pack that actually covers the
  // amount the recipe asks for.
  "Mang Tomas sauce": 6.45,
  "Lumpia wrapper": 54.65,
  "Sweet chili sauce": 31.5,
  Mayonnaise: 33.95,
  "Oyster sauce": 6.05,
  Breadcrumbs: 13.65,
  "Banana ketchup": 10.1,
  "Green peas": 13.4,
  Raisins: 20.65,
  "Atsuete powder": 16.7,
  Laurel: 10.75,
  Tanglad: 10.05,
  "Puso ng saging": 17.5,

  // Fresh goods, priced to MATCH what the app already charges for the same good
  // where it is a real ingredient. Bawang is P7 for one ulo on 39 other cards, so
  // it is P7 here too — a good must not cost two different amounts on one site.
  Bawang: 7,
  Kalamansi: 3,
  Luya: 5,
  "Bell pepper": 27,
  "Siling labuyo": 2,
  Kintsay: 6,
};

/** Shown and greyed, never counted. Chan on garlic powder: "we already have garlic". */
const PANTRY_OPTIONAL = new Set(["Garlic powder", "Garlic Powder"]);

/** Never displayed. Chan: "tubig -- dont display this". */
const PANTRY_HIDDEN = new Set(["Tubig", "Hugas bigas"]);

/**
 * A dish buying one of these does not also buy oil, so its mantika drops to
 * optional. Chan: "sometimes if you have mantikilya/butter or margarine --
 * mantika is optional".
 */
const BUTTER_FAMILY = new Set(["Mantikilya", "Margarine", "Butter"]);

export type PantryRole = "charged" | "optional" | "hidden" | "free";

/**
 * What a pantry good does on ONE dish. Four outcomes, all of them Chan's calls —
 * see the PANTRY_PRICES header for the quotes.
 *
 * Takes the whole recipe, not just a name, because the mantika rule genuinely
 * depends on what else the dish buys.
 */
export function pantryRole(recipe: Recipe, name: string): PantryRole {
  if (PANTRY_HIDDEN.has(name)) return "hidden";
  if (PANTRY_OPTIONAL.has(name)) return "optional";
  if (name === "Mantika" && recipe.pantryItems.some((p) => BUTTER_FAMILY.has(p.name))) {
    return "optional";
  }
  return PANTRY_PRICES[name] !== undefined ? "charged" : "free";
}

/**
 * The ShopSuki row each price above came from, so a number can be re-checked
 * without re-running the whole catalogue pull.
 */
export const PANTRY_SOURCES: Record<string, string> = {
  Mantika: "P10 repackaged sari-sari sachet (Chan; the DA's 350ml bottle is P39.21)",
  Margarine: "Star Margarine Classic Twin Pack 30g",
  Mantikilya: "Star Margarine Classic Twin Pack 30g (cheapest of the butter family)",
  Toyo: "Datu Puti Soy Sauce 100ml",
  Patis: "Silver Swan Patis Seasoning 100ml",
  Suka: "Silver Swan Sukang Puti Budget Pack 100ml",
  Asukal: "P5 tingi (Chan: there is a tingi of this too). The DA sells Sugar (Brown) at P72.32/kg, which works out to P0.87 a tbsp, but nobody buys a tablespoon.",
  "Chicken broth cube": "Knorr Broth Cubes Chicken Single 10g",
  Asin: "P5 tingi (Chan: \"asin should be here - 5 pesos base price not optional or free so they can tick this pantry items\")",
  Paminta: "P2 tingi (Chan)",
  Flour: "P10 palengke tingi (Chan)",
};

/**
 * What the pantry adds to one dish. Zero when every pantry good is free.
 *
 * Summed in CENTAVOS. The prices are decimals (toyo 7.20, patis 10.60, suka
 * 6.30) and adding them as floats produced P29.799999999999997 on the mechado,
 * which would have reached a card.
 */
export function pantryCost(recipe: Recipe): number {
  let centavos = 0;
  for (const item of recipe.pantryItems) {
    // Only a CHARGED good counts. An optional one is shown and never billed,
    // which is the whole difference between garlic powder and asin.
    if (pantryRole(recipe, item.name) !== "charged") continue;
    centavos += Math.round((PANTRY_PRICES[item.name] ?? 0) * 100);
  }
  return centavos / 100;
}

/** The tingi price of one pantry good, or undefined when it is free. */
export function pantryItemPrice(name: string): number | undefined {
  return PANTRY_PRICES[name];
}

export function calculateRecipeCost(recipe: Recipe, priceMap: PriceMap): number {
  if (!hasRequiredPrices(recipe, priceMap)) return Number.POSITIVE_INFINITY;

  let total = 0;
  for (const ing of recipe.ingredients) {
    if (!ing.optional) total += getIngredientCost(recipe, ing, priceMap);
  }

  // Oil, pepper and flour are bought, not conjured. See PANTRY_PRICES.
  total += pantryCost(recipe);

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

  // A priced pantry good becomes a real line on the card. Showing it under a
  // "not in DA price monitoring" heading while it adds P10 to the total would be
  // the same display-versus-data split that once made the homepage and /ulam
  // disagree, so it is listed where the money is.
  for (const item of recipe.pantryItems) {
    const role = pantryRole(recipe, item.name);
    if (role === "hidden" || role === "free") continue;

    // An optional pantry good gets a line so the cook knows to bring it, and a
    // cost of zero so it can never move the total.
    if (role === "optional") {
      ingredientCosts.push({
        name: item.name,
        amount: item.amount,
        cost: 0,
        trend: "stable",
        optional: true,
      });
      continue;
    }

    const price = pantryItemPrice(item.name) ?? 0;
    totalCost += price;
    ingredientCosts.push({
      name: item.name,
      amount: item.amount,
      cost: price,
      trend: "stable",
      optional: false,
    });
  }

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
// V2.4 DAILY SELECTION — 5 mura slots + 3 "iba naman" slots
// ═══════════════════════════════════════════════════════════
// Replaces the cheapest-8 selection for the daily suggestions.
//
// THE PROBLEM IT SOLVES (measured on production data, 28 Jul 2026):
// the old flow sorted by price and excluded only YESTERDAY's picks. Cheapest
// -first has exactly one right answer, so with stable prices day N could not
// repeat day N-1 but was free to repeat day N-2. The result was a mathematically
// guaranteed two-day loop: 16-22 Jul served **2 distinct menus over 7 days**, and
// **21 of the 47 recipes had never once been shown**.
//
// Widening the price pool surfaces more dishes but drags whole days to a ~P200
// average, which breaks the promise the app is named after. So the eight cards
// stop competing on a single rule:
//
//   5 "mura" slots  — the cheapest CORE_POOL dishes, preferring whichever has
//                     waited longest inside that cheap set. Guarantees a genuinely
//                     cheap option on the page every single day.
//   3 "iba" slots   — whichever recipes have waited longest across ALL of them,
//                     price ignored. This is what finally surfaces the other 31.
//
// Simulated over 28 days on real prices held CONSTANT (the worst case for
// variety): 28/28 distinct menus, 47/47 recipes surfaced, never more than 2
// fried in a day, and the cheapest dish on the worst day still P100.

/** Which slot a pick earned. The UI labels "iba" as "Iba naman ngayon". */
export type MealSlot = "mura" | "iba";

export interface DailyPick {
  result: CostResult;
  slot: MealSlot;
}

/**
 * Cooking method, from the recipe id.
 *
 * NOTE the ids are Filipino: the fried dishes are `pritong-*`, NOT `fried-*`.
 * A rule written against `fried-` matches only the 2 `inihaw-` dishes and
 * silently lets 8 more fried dishes through the cap.
 */
export function getCookingMethod(recipe: Recipe): "prito" | "sabaw" | "ginisa" | "sarsa" {
  const id = recipe.id;
  if (id.indexOf("pritong-") === 0 || id.indexOf("inihaw-") === 0) return "prito";
  if (/sinigang|nilaga|tinola|sopas/.test(id)) return "sabaw";
  if (/ginisa|ginataan|torta|sarciado/.test(id)) return "ginisa";
  return "sarsa";
}

export interface DailySelectionOptions {
  /** Total cards on the page. */
  count?: number;
  /** How many of those are price-driven. */
  coreSlots?: number;
  /** The mura slots draw from this many of the cheapest dishes. */
  corePool?: number;
  /** A dish shown this many days ago or fewer is held back. */
  memoryDays?: number;
  /** Max prito/inihaw dishes in one day. Chan's call: 2. */
  pritoCap?: number;
}

export const DEFAULT_SELECTION: Required<DailySelectionOptions> = {
  count: 8,
  coreSlots: 5,
  corePool: 16,
  memoryDays: 3,
  pritoCap: 2,
};

/** Treated as "waited forever", so unseen recipes win the rotation slots first. */
const NEVER_SHOWN = 999;

/**
 * Pick the day's meals.
 *
 * `daysSinceShown` maps recipe id to how many days ago it last appeared
 * (1 = yesterday). Absent means never shown.
 */
export function selectDailyMeals(
  recipes: Recipe[],
  todayPrices: PriceMap,
  lastPrices: PriceMap,
  daysSinceShown: Record<string, number>,
  options: DailySelectionOptions = {},
): DailyPick[] {
  const opts = { ...DEFAULT_SELECTION, ...options };

  // TRUE cost order. Do not reuse findCheapestMeals' output as a price ranking:
  // it returns results in balanced-pass order, and slicing that for a "cheapest
  // N" pool once put a P255 Beef Mechado into a slot labelled "mura".
  const costed = recipes
    .filter((recipe) => hasRequiredPrices(recipe, todayPrices))
    .map((recipe) => calculateRecipeCostDetailed(recipe, todayPrices, lastPrices))
    .filter((result) => Number.isFinite(result.totalCost) && result.totalCost > 0)
    .sort((a, b) => a.totalCost - b.totalCost);

  if (costed.length === 0) return [];

  const waited = (result: CostResult): number => {
    const d = daysSinceShown[result.recipe.id];
    return typeof d === "number" && Number.isFinite(d) ? d : NEVER_SHOWN;
  };
  const byWaitedThenCheapest = (a: CostResult, b: CostResult) =>
    waited(b) - waited(a) || a.totalCost - b.totalCost;

  const picked: DailyPick[] = [];
  const used: Record<string, boolean> = {};
  const proteinCount: Record<string, number> = {};
  let pritoCount = 0;

  /**
   * `pritoLimit` is lower for the mura slots than the day's real cap, and that
   * gap is the whole point.
   *
   * Fried dishes are cheap, so they crowd the cheap pool. With one shared cap
   * the five mura slots spent the entire prito budget before the rotation slots
   * ran, and a fried dish too dear to be "mura" could then never be taken at
   * all — not on any day, ever. Three recipes went permanently unshown that
   * way (29 Jul 2026), which is the exact failure the V2.4 selection exists to
   * prevent, reappearing through a side door.
   *
   * Holding one prito slot back for rotation fixes it without raising the cap:
   * a day still never serves more than opts.pritoCap fried dishes.
   */
  const canTake = (result: CostResult, enforceProtein: boolean, pritoLimit: number): boolean => {
    if (used[result.recipe.id]) return false;
    if (getCookingMethod(result.recipe) === "prito" && pritoCount >= pritoLimit) return false;
    if (enforceProtein) {
      const protein = getProteinType(result.recipe);
      if ((proteinCount[protein] || 0) >= getProteinLimit(protein)) return false;
    }
    return true;
  };

  /** The cheap slots may not use the last fried slot; rotation needs it. */
  const MURA_PRITO_LIMIT = Math.max(1, opts.pritoCap - 1);

  const take = (result: CostResult, slot: MealSlot) => {
    picked.push({ result, slot });
    used[result.recipe.id] = true;
    const protein = getProteinType(result.recipe);
    proteinCount[protein] = (proteinCount[protein] || 0) + 1;
    if (getCookingMethod(result.recipe) === "prito") pritoCount++;
  };

  // ── MURA: cheap slots, rotating within the cheap set ────────────────
  const corePool = costed.slice(0, opts.corePool).sort(byWaitedThenCheapest);
  const rested = corePool.filter((r) => waited(r) > opts.memoryDays);

  for (const result of rested) {
    if (picked.length >= opts.coreSlots) break;
    if (canTake(result, true, MURA_PRITO_LIMIT)) take(result, "mura");
  }
  for (const result of corePool) {
    if (picked.length >= opts.coreSlots) break;
    if (canTake(result, true, MURA_PRITO_LIMIT)) take(result, "mura");
  }
  for (const result of corePool) {
    if (picked.length >= opts.coreSlots) break;
    if (canTake(result, false, MURA_PRITO_LIMIT)) take(result, "mura");
  }

  // ── IBA NAMAN: longest-waiting across the whole book, price ignored ──
  const rotation = costed.filter((r) => !used[r.recipe.id]).sort(byWaitedThenCheapest);

  for (const result of rotation) {
    if (picked.length >= opts.count) break;
    /*
      A dish that has NEVER been shown gets one exemption from the protein cap.

      Without it a whole category can lock a dish out forever. The veggie cap is
      1 a day and the cheap pool is full of veggie dishes, so a veggie mura pick
      spent that cap every single day and Ginataang Sitaw at Kalabasa — the
      dearest of the five — was never once surfaced in a 28-day simulation
      (29 Jul 2026).

      The exemption is self-limiting: it only fires while a dish has never been
      shown, so it cannot become a way for one category to take over a day.
    */
    const neverShown = waited(result) === NEVER_SHOWN;
    if (canTake(result, !neverShown, opts.pritoCap)) take(result, "iba");
  }
  for (const result of rotation) {
    if (picked.length >= opts.count) break;
    if (canTake(result, false, opts.pritoCap)) take(result, "iba");
  }
  // Last resort: fill the page even if that means breaking the prito cap.
  for (const result of costed) {
    if (picked.length >= opts.count) break;
    if (!used[result.recipe.id]) take(result, "iba");
  }

  return picked;
}

/** The page opens with this many price-driven picks before any rotation pick. */
export const LEAD_MURA_CARDS = 2;

/**
 * Stable per-day shuffle for page order.
 *
 * Chan, 28 Jul 2026: "when i open the site it always shows me ginataang kalabasa
 * and im annoyed... dont make it into first place anymore". Sorting the cards by
 * price meant the single cheapest dish permanently owned the top of the page.
 *
 * Seeded by the date, so every visitor sees the same order all day and a
 * different one tomorrow. Simulated: 8 different dishes led over 10 days, and
 * Ginataang Kalabasa led none of them.
 *
 * `getSlot` is optional, and supplying it adds one guarantee on top of the
 * shuffle: **the first two cards are always "mura" picks, so the earliest a
 * rotation pick can appear is third.**
 *
 * Chan asked for this after seeing a ₱119 rotation pick lead the page: *"dont
 * put it in first place to third place so they will not be shocked when a dish
 * with 200+ price show up, upon opening the app"*. The app is named after cheap
 * food; the first thing a visitor sees has to deliver on that before it starts
 * showing them variety. Everything from the third card down keeps the shuffled
 * order, so the rotation picks still move around day to day.
 */
export function orderForDisplay<T>(
  items: T[],
  dateKey: string,
  getSlot?: (item: T) => MealSlot | undefined,
): T[] {
  let seed = 0;
  for (let i = 0; i < dateKey.length; i++) {
    seed = (Math.imul(seed, 31) + dateKey.charCodeAt(i)) >>> 0;
  }
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }

  if (!getSlot) return out;

  // Promote the first LEAD_MURA_CARDS cheap picks to the front, keeping the
  // shuffled order among themselves and among everything left behind. If a day
  // somehow has fewer than two mura picks, this simply leads with what exists
  // rather than inventing anything.
  const lead: T[] = [];
  for (const item of out) {
    if (lead.length >= LEAD_MURA_CARDS) break;
    if (getSlot(item) !== "iba") lead.push(item);
  }
  const tail = out.filter((item) => lead.indexOf(item) === -1);
  return lead.concat(tail);
}

// ═══════════════════════════════════════════════════════════
// PROTEIN TYPE EXPORT — used by the filter tabs (lib/protein-tabs.ts)
// ═══════════════════════════════════════════════════════════
export { getProteinType };

/**
 * Every daKey the 47 recipes can ask for.
 *
 * ONE home. Anything that builds a PriceMap feeds this list to
 * buildPriceMap() — the suggest cron and the /ulam browse page both do, and a
 * second hand-rolled copy would let the two pages price the same dish
 * differently.
 */
export const RECIPE_DA_KEYS: string[] = Array.from(
  new Set(
    RECIPES.flatMap((r) => r.ingredients.map((i) => i.daKey)).filter(
      (k): k is string => typeof k === "string" && k.length > 0,
    ),
  ),
);
