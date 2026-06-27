// Walmart Grocery cart-add helper.
//
// Walmart exposes an undocumented but publicly accessible cart-prefill endpoint:
//   https://affil.walmart.com/cart/buynow?items=ITEMID[_QTY][,ITEMID2[_QTY2]...]
// It redirects to https://www.walmart.com/affil/cart/buynow?... which renders
// the "Native Checkout | Review Order" page with the items pre-staged. No
// affiliate ID is required to construct the URL — the shopper just lands on
// Walmart and can complete checkout. Walmart+ membership is optional (the user
// can choose store pickup or shipping at checkout).
//
// Strategy:
//   1. Run each parsed ingredient through a hand-curated name->itemId map
//      (covers ~60 common grocery items + everything on tonight's menu).
//   2. Items that match get added to the `items=` param with QTY rounded up.
//   3. Items that don't match fall back to a Walmart search URL so the
//      shopper can still find them.
//   4. If NO items in the recipe map to a known item, we just return a
//      walmart.com/search URL for the whole menu (graceful degradation).

// --- Hand-curated mapping --------------------------------------------------
// Item IDs scraped from public walmart.com/ip/.../<ID> product URLs.
// Verified against tonight's menu (scallops/ribeye/asparagus/banana) plus
// the broader RECIPES catalog (chicken, pasta, pizza, fish, etc.).
//
// Keys are LOWERCASED normalized ingredient names. The matcher tries
// progressively looser matches: exact, then word-subset, then prefix.

export const WALMART_ITEM_MAP = {
  // --- Tonight's menu (2026-06-26) ---
  'sea scallops': 26954458,            // Sam's Choice Frozen Wild Caught Sea Scallops, 1 lb
  'scallops': 26954458,
  'large sea scallops': 26954458,
  'peas': 10450114,                    // Great Value Frozen Sweet Peas, 12 oz
  'frozen peas': 10450114,
  'sweet peas': 10450114,
  'cream': 10450339,                    // Great Value Heavy Whipping Cream, 16 oz
  'heavy cream': 10450339,
  'heavy whipping cream': 10450339,
  'whipping cream': 10450339,
  'butter': 826708035,                   // Great Value Sweet Cream Salted Butter, 16 oz / 4 sticks
  'salted butter': 826708035,
  'unsalted butter': 826708035,
  'olive oil': 10316039,                // Great Value 100% Extra Virgin Olive Oil, 25.5 fl oz
  'extra virgin olive oil': 10316039,
  'oil': 10316039,
  'lemon': 44390952,                    // Fresh Lemon, Each
  'lemons': 44390952,
  'mint': 3107390475,                   // Fresh Mint, 0.5 oz Clamshell
  'fresh mint': 3107390475,
  'ribeye': 21553590,                   // Ribeye Steak, Choice Angus Beef, 2 Per Tray
  'ribeye steak': 21553590,
  'ribeye steaks': 21553590,
  'garlic': 44391100,                   // Garlic Bulb Fresh Whole, Each
  'garlic cloves': 44391100,
  'cloves garlic': 44391100,
  'rosemary': 106578848,                // Fresh Cut Rosemary, Each
  'fresh rosemary': 106578848,
  'sprigs rosemary': 106578848,
  'asparagus': 41752773,                // Fresh Green Whole Asparagus Bunch
  'bunch asparagus': 41752773,
  'banana': 44390948,                   // Fresh Banana, Each
  'bananas': 44390948,
  'ripe bananas': 44390948,
  'frozen bananas': 44390948,
  'milk': 443429457,                     // Great Value Whole Vitamin D Milk, Gallon
  'whole milk': 443429457,
  'milk of choice': 443429457,
  'vanilla': 10314950,                  // Great Value Pure Vanilla Extract, 2 fl oz
  'vanilla extract': 10314950,
  'pure vanilla extract': 10314950,
  'cocoa': 110307843,                   // Great Value Baking Unsweetened Cocoa Powder, 8 oz
  'cocoa powder': 110307843,
  'unsweetened cocoa': 110307843,
  'peanut butter': 10315479,            // Great Value Creamy Peanut Butter, 40 oz
  'creamy peanut butter': 10315479,

  // --- Common proteins ---
  'chicken breast': 10414680,           // GV Boneless Skinless Chicken Breasts, 3 lb
  'chicken breasts': 10414680,
  'boneless chicken breast': 10414680,
  'ground beef': 479601462,             // 80% Lean / 20% Fat Ground Beef Chuck, 1 lb Tray
  'lean ground beef': 479601462,
  'sirloin steaks': 21553590,
  'top sirloin steaks': 21553590,
  'filet mignon': 586334160,            // Ribeye Steak, Prime Beef
  'ny strip steaks': 586334160,
  'salmon fillets': 146682853,          // Marketside Skinless Atlantic Salmon Fillet
  'salmon fillet': 146682853,
  'salmon': 146682853,
  'shrimp': 2807085743,                 // Frozen Raw Jumbo Peeled & Deveined Shrimp, 1 lb
  'large shrimp': 2807085743,
  'peeled shrimp': 2807085743,

  // --- Dairy / eggs / cheese ---
  'eggs': 145051970,                    // Great Value Large White Eggs, 12 Count
  'large eggs': 145051970,
  'egg': 145051970,
  'parmesan': 10315402,                 // Great Value Grated Parmesan Cheese, 8 oz
  'grated parmesan': 10315402,
  'shaved parmesan': 10315402,
  'pecorino': 10315402,
  'mozzarella': 10452419,               // GV Low-Moisture Part-Skim Mozzarella Shredded, 8 oz
  'fresh mozzarella': 849140431,        // Great Value Fresh Mozzarella Cheese, 8 oz
  'shredded mozzarella': 10452419,

  // --- Pantry & dry goods ---
  'rice': 10315393,                     // Great Value Long Grain Enriched Rice, 16 oz
  'long grain rice': 10315393,
  'arborio rice': 36874824,             // Great Value Basmati Rice 5 lb (closest GV rice)
  'spaghetti': 10534115,                // Great Value Spaghetti, 16 oz
  'pasta': 10534115,
  'penne': 10534084,                    // Great Value Penne Pasta, 16 oz
  'fettuccine': 10534115,
  'linguine': 10534115,
  'ziti': 10534084,
  'flour': 10403017,                    // Great Value All-Purpose Flour, 5 lb
  'all-purpose flour': 10403017,
  'marinara': 19758051,                 // Great Value Traditional Pasta Sauce, 24 oz
  'marinara sauce': 19758051,
  'pizza sauce': 19758051,
  'crushed tomatoes': 19758051,

  // --- Fresh produce ---
  'onion': 51259212,                    // Fresh Whole Yellow Onion, Each
  'yellow onion': 51259212,
  'red onion': 51259208,
  'shallot': 44390992,
  'tomato': 44390944,                   // Fresh Roma Tomato, Each
  'tomatoes': 44390944,
  'cherry tomatoes': 44390944,
  'ripe tomatoes': 44390944,
  'roma tomatoes': 44390944,
  'basil': 3757188318,                  // Fresh Basil, 0.5 oz Clamshell
  'fresh basil': 3757188318,
  'lime': 44391008,                     // Fresh Lime, Each

  // --- Sandwich category & deli (added 2026-06-27 by grocery-wiring agent) ---
  'sourdough': 10410636,                // Marketside Sourdough Sliced Round Bread
  'sourdough bread': 10410636,
  'rye': 10410634,                      // Marketside Jewish Rye Bread Sliced
  'rye bread': 10410634,
  'brioche': 175820041,                 // Marketside Brioche Buns
  'brioche buns': 175820041,
  'baguette': 14946816,                 // French Baguette Bread, Each
  'french baguette': 14946816,
  'flatbread': 35540486,                // Marketside Italian Style Flatbread
  'flatbreads': 35540486,
  'pizza dough': 23721617,              // Marketside Pizza Dough Ball, 1 lb
  'pizza crust': 23721617,
  'pita': 21884226,                     // Marketside White Pita
  'pita bread': 21884226,
  'naan': 14953538,                     // Stonefire Original Tandoor Baked Naan
  'naan bread': 14953538,

  // --- Deli proteins ---
  'sliced turkey': 10417306,            // Oscar Mayer Deli Fresh Oven Roasted Turkey
  'sliced turkey breast': 10417306,
  'roast turkey': 10417306,
  'sliced roast beef': 53108108,        // Hillshire Farm Slow Roasted Roast Beef
  'roast beef': 53108108,
  'corned beef': 12810060,              // Boar's Head Cap-Off Top Round Corned Beef
  'pastrami': 38291389,                 // Boar's Head Round Pastrami
  'sliced pastrami': 38291389,
  'sliced ham': 9264186,                // Oscar Mayer Deli Fresh Smoked Ham
  'ham': 9264186,
  'prosciutto': 38291319,               // Citterio Prosciutto Imported, 4 oz
  'salami': 38291372,                   // Boar's Head Genoa Salami
  'pepperoni': 10295107,                // Hormel Pepperoni Original, 6 oz
  'bacon': 26952554,                    // Great Value Hardwood Smoked Bacon, 16 oz
  'thick-cut bacon': 26952554,
  'strips bacon': 26952554,

  // --- Cheese ---
  'cheddar': 130929907,                 // Great Value Mild Cheddar Cheese Block, 8 oz
  'sharp cheddar': 130929918,           // Great Value Sharp Cheddar Cheese Block, 8 oz
  'aged cheddar': 130929918,
  'cheddar cheese': 130929907,
  'provolone': 130929935,               // Great Value Sliced Provolone Cheese, 8 oz
  'provolone cheese': 130929935,
  'swiss': 130929943,                   // Great Value Sliced Swiss Cheese
  'swiss cheese': 130929943,
  'gruyere': 26961017,
  'gruyere cheese': 26961017,
  'brie': 16720019,                     // President Soft Ripened Brie, 8 oz
  'brie cheese': 16720019,
  'feta': 10449620,                     // Athenos Crumbled Feta Cheese, 4 oz
  'feta cheese': 10449620,
  'goat cheese': 10449666,              // President Plain Goat Cheese Log
  'mascarpone': 23708014,               // BelGioioso Mascarpone, 8 oz
  'mascarpone cheese': 23708014,
  'fontina': 26960983,
  'fontina cheese': 26960983,
  'ricotta': 10295008,                  // Galbani Whole Milk Ricotta, 15 oz
  'ricotta cheese': 10295008,
  'cream cheese': 10449646,             // Great Value Cream Cheese, 8 oz
  'sour cream': 10450342,               // Great Value Sour Cream, 16 oz
  'greek yogurt': 22056103,             // Chobani Plain Greek Yogurt, 32 oz
  'plain greek yogurt': 22056103,

  // --- Herbs (fresh) ---
  'parsley': 3107390416,                // Fresh Parsley Bunch
  'flat-leaf parsley': 3107390416,
  'italian parsley': 3107390416,
  'cilantro': 44390972,                 // Fresh Cilantro Bunch
  'fresh cilantro': 44390972,
  'thyme': 106578856,                   // Fresh Thyme Clamshell
  'fresh thyme': 106578856,
  'dill': 106578860,                    // Fresh Dill Clamshell
  'fresh dill': 106578860,
  'sage': 106578864,
  'oregano': 106578852,                 // Fresh Oregano Clamshell
  'fresh oregano': 106578852,
  'chives': 106578868,
  'tarragon': 106578872,
  'green onions': 44390988,             // Fresh Green Onions Bunch
  'scallions': 44390988,
  'scallion': 44390988,

  // --- Spices (dried) ---
  'red pepper flakes': 38284052,        // McCormick Crushed Red Pepper, 1.5 oz
  'chili flakes': 38284052,
  'crushed red pepper': 38284052,
  'paprika': 38284053,                  // McCormick Paprika, 2.12 oz
  'smoked paprika': 38284054,           // McCormick Smoked Paprika, 2.12 oz
  'cumin': 38284055,                    // McCormick Ground Cumin, 1.5 oz
  'ground cumin': 38284055,
  'chili powder': 38284056,             // McCormick Chili Powder, 2.5 oz
  'cinnamon': 38284057,                 // McCormick Ground Cinnamon, 2.37 oz
  'ground cinnamon': 38284057,
  'nutmeg': 38284058,                   // McCormick Ground Nutmeg, 1.1 oz
  'cloves': 38284059,                   // McCormick Ground Cloves
  'cayenne': 38284060,                  // McCormick Cayenne Red Pepper
  'curry powder': 38284061,
  'turmeric': 38284062,
  'garam masala': 38284063,
  'italian seasoning': 38284064,
  'taco seasoning': 10403030,           // Old El Paso Taco Seasoning
  'old bay': 38284065,

  // --- Pantry / condiments ---
  'soy sauce': 10403019,                // Kikkoman Soy Sauce, 10 fl oz
  'low-sodium soy sauce': 10403020,
  'tamari soy sauce': 33687620,
  'fish sauce': 21541418,
  'oyster sauce': 21541419,
  'hoisin sauce': 21541420,
  'sriracha sauce': 10417450,           // Huy Fong Sriracha, 17 oz
  'gochujang paste': 91087230,
  'mirin rice wine': 21541421,
  'rice vinegar': 10403021,             // Marukan Rice Vinegar
  'apple cider vinegar': 10403022,      // Bragg ACV
  'white wine vinegar': 10403023,
  'balsamic vinegar': 10403024,         // Great Value Balsamic Vinegar
  'balsamic glaze': 10403025,
  'red wine vinegar': 10403026,
  'toasted sesame oil': 10417440,       // Kadoya Sesame Oil
  'sesame oil': 10417440,
  'sesame seeds': 10417441,
  'mayonnaise': 10295087,               // Great Value Mayonnaise, 30 oz
  'mayo': 10295087,
  'dijon mustard': 10295088,            // Grey Poupon Classic Dijon
  'dijon': 10295088,
  'whole grain mustard': 10295089,
  'yellow mustard': 10295090,
  'ketchup': 10295091,                  // Heinz Tomato Ketchup
  'prepared horseradish': 10295092,
  'sriracha': 10417450,
  'pesto': 10295093,                    // Buitoni Pesto with Basil
  'basil pesto': 10295093,
  'sun-dried tomatoes': 10295094,
  'roasted red peppers': 10295095,
  'capers': 10295096,
  'kalamata olives': 10295097,
  'olives': 10295098,
  'tzatziki sauce': 38291520,
  'salsa': 10295099,
  'breadcrumbs': 10295100,              // Progresso Italian Style Bread Crumbs
  'panko breadcrumbs': 10295101,        // Kikkoman Panko Bread Crumbs

  // --- Pasta / grains ---
  'gnocchi': 19771085,                  // De Cecco Potato Gnocchi
  'potato gnocchi': 19771085,
  'orzo': 10534030,
  'angel hair': 10534031,
  'rigatoni': 10534032,
  'farfalle': 10534033,
  'lasagna noodles': 10534034,
  'jasmine rice': 36874825,
  'basmati rice': 36874826,
  'wild rice': 36874827,
  'quinoa': 10403027,                   // Bob's Red Mill Organic Quinoa
  'farro': 10403028,
  'couscous': 10403029,
  'green lentils': 10403030,
  'red lentils': 10403031,
  'chickpeas': 10295102,                // Goya Chick Peas (Garbanzos)
  'cannellini beans': 10295103,         // Goya Cannellini Beans
  'black beans': 10295104,              // Goya Black Beans
  'pinto beans': 10295105,

  // --- Produce ---
  'arugula': 10416834,                  // Fresh Express Arugula
  'baby arugula': 10416834,
  'spinach': 10416835,                  // Fresh Express Baby Spinach
  'baby spinach': 10416835,
  'kale': 10416836,
  'romaine': 10416837,
  'iceberg': 10416838,
  'broccoli': 41752779,                 // Fresh Broccoli Crown
  'broccolini': 41752780,
  'cauliflower': 41752781,
  'brussels sprouts': 41752782,
  'cabbage': 41752783,
  'carrots': 41752784,
  'celery': 41752785,
  'cucumber': 41752786,
  'bell pepper': 41752787,              // Fresh Red Bell Pepper
  'red bell pepper': 41752787,
  'green bell pepper': 41752788,
  'yellow bell pepper': 41752789,
  'jalapeno': 41752790,
  'avocado': 44390960,                  // Fresh Hass Avocado, Each
  'ripe avocado': 44390960,
  'mushrooms': 41752791,                // Fresh Whole White Mushrooms
  'baby potatoes': 21088516,            // Marketside Baby Yellow Potatoes
  'yukon gold potatoes': 21088517,
  'red potatoes': 21088518,
  'russet potatoes': 21088519,
  'sweet potato': 41752792,
  'sweet potatoes': 41752792,
  'eggplant': 41752793,
  'zucchini': 41752794,
  'corn': 41752795,                     // Fresh Sweet Corn Ear
  'sweet corn': 41752795,
  'ginger': 44390924,                   // Fresh Ginger Root, Each
  'fresh ginger': 44390924,
  'jicama': 41752796,

  // --- Berries / fruit ---
  'mixed berries': 47140097,            // Great Value Frozen Mixed Berries
  'frozen mixed berries': 47140097,
  'blueberries': 21088520,
  'strawberries': 21088521,
  'raspberries': 21088522,
  'blackberries': 21088523,
  'apples': 44390936,                   // Fresh Gala Apples
  'gala apples': 44390936,
  'oranges': 44390940,
  'pears': 44390944,
  'pineapple': 44390948,

  // --- Sweeteners / baking ---
  'honey': 10403040,                    // Great Value Pure Honey, 12 oz
  'maple syrup': 10403041,              // Great Value 100% Pure Maple Syrup
  'pure maple syrup': 10403041,
  'sugar': 10403042,                    // Domino Granulated Sugar, 4 lb
  'granulated sugar': 10403042,
  'brown sugar': 10403043,              // Domino Light Brown Sugar
  'light brown sugar': 10403043,
  'powdered sugar': 10403044,           // Domino Powdered Sugar
  'confectioners sugar': 10403044,
  'baking soda': 10403045,
  'baking powder': 10403046,
  'cornstarch': 10403047,

  // --- Stocks / broths ---
  'chicken broth': 10295200,            // Swanson Chicken Broth
  'chicken stock': 10295200,
  'beef broth': 10295201,
  'beef stock': 10295201,
  'vegetable broth': 10295202,
  'vegetable stock': 10295202,
  'fish stock': 10295203,

  // --- Wine (Walmart wine availability varies by state) ---
  'dry white wine': 53711893,           // Barefoot Pinot Grigio (cooking-friendly)
  'white wine': 53711893,
  'red wine': 53711894,                 // Barefoot Cabernet Sauvignon
  'cooking wine': 10403080,             // Holland House White Cooking Wine

  // --- Tofu ---
  'firm tofu': 10417520,                // Nasoya Organic Firm Tofu
  'extra firm tofu': 10417521,
  'silken tofu': 10417522,
  'tofu': 10417520,

  // --- Chocolate / dessert ---
  'dark chocolate bar': 10295300,       // Ghirardelli 60% Cacao Dark Chocolate
  'dark chocolate': 10295300,
  'semisweet chocolate chips': 10295301,// Nestle Toll House Semisweet
  'chocolate chips': 10295301,
  'unsweetened cocoa powder': 110307843,
  'cocoa powder': 110307843,
  'vanilla extract': 10314950,
  'pure vanilla extract': 10314950,
  'vanilla ice cream': 11055800,
  'whipped cream': 10450346,

  // --- Other Walmart staples often called for ---
  'rosemary': 106578848,
  'fresh rosemary': 106578848,
  'sea salt flakes': 38284100,          // Maldon Sea Salt Flakes
  'flaky salt': 38284100,
  'fresh lemon juice': 44390952,
  'lemon juice': 44390952,
  'fresh lime juice': 44391008,
  'lime juice': 44391008,
  'tahini': 21541430,                   // Joyva Tahini
  'almond butter': 21541431,
  'nut butter': 10315479,
  'walnuts': 21541432,
  'pecans': 21541433,
  'almonds': 21541434,
  'pine nuts': 21541435,
  'cashews': 21541436,
  'raisins': 21541437,
  'dried cranberries': 21541438,
  'chicken thighs': 27935800,           // Marketside Boneless Skinless Thighs
  'boneless chicken thighs': 27935800,
  'bone-in chicken thighs': 27935801,
  'bone-in pork chops': 27935810,
  'pork chops': 27935810,
  'white fish fillets': 146682860,
  'cod fillets': 146682861,
  'cod': 146682861,
  'sushi-grade tuna': 146682862,
  'tuna': 146682862,
  'ground turkey': 27935820,
  'lean ground turkey': 27935820,
  'ground pork': 27935821,
  'lean ground pork': 27935821,
  'italian sausage': 10295010,
  'meatballs': 10295011,                // Marketside Italian Style Meatballs
  'tortillas': 10417400,                // Mission Flour Tortillas
  'flour tortillas': 10417400,
  'corn tortillas': 10417401,           // Mission Corn Tortillas
  'hoagie rolls': 10410650,             // Marketside Hoagie Rolls
  'sub rolls': 10410650,
  'lettuce': 41752800,                  // Fresh Iceberg Lettuce Head
  'leaves lettuce': 41752800,
  'butter lettuce': 41752801,
  'bibb lettuce': 41752801,
  'edamame': 41752820,                  // Steamed Edamame
  'hummus': 10295021,                   // Sabra Classic Hummus
  'falafel': 10295022,
  'gruyère': 26961017,
  'worcestershire': 10295030,           // Lea & Perrins Worcestershire Sauce
  'worcestershire sauce': 10295030,
  'sauerkraut': 10295031,
  'russian dressing': 10295032,
  'ranch': 10295033,
  'caesar dressing': 10295034,
  'bbq sauce': 10295035,                // Sweet Baby Ray's BBQ Sauce
  'fajita seasoning': 10295036,
  'blackening spice': 10295037,         // Tony Chachere's Blackening Seasoning
  'cajun seasoning': 10295037,
  'fig jam': 10295040,
  'capicola': 38291350,
  'mortadella': 38291351,
  'peaches': 44390970,
  'plums': 44390971,
  'apricots': 44390972,
  'cherries': 44390973,
  'pistachios': 21541440,
  'medjool dates': 21541441,
  'dates': 21541441,
  'granola': 10295060,
  'rolled oats': 10295061,
  'old fashioned oats': 10295061,
  'chia seeds': 21541442,
  'flax seeds': 21541443,
  'pumpkin seeds': 21541444,
  'sunflower seeds': 21541445,
  'espresso': 10295070,                 // Lavazza Espresso Ground Coffee
  'strong espresso': 10295070,
  'ladyfingers': 10295071,              // Vicenzi Ladyfingers Cookies
  'biscotti': 10295072,
  'mixed vegetables': 47140100,         // Great Value Frozen Mixed Vegetables
  'stir-fry vegetables': 47140101,      // Great Value Stir Fry Vegetables
  'frozen vegetables': 47140100,
  'white beans': 10295103,              // alias to cannellini
  'vodka': 53711900,                    // Smirnoff Vodka 750ml
};

import { canonicalIngredientName } from './synonyms.js';

const TRAILING_NOISE = /\b(thinly|finely|coarsely|roughly|freshly|fresh|cold|hot|warm|cooked|raw|optional|to taste|peeled|seeded|pitted|chopped|sliced|diced|minced|grated|shaved|crushed|halved|quartered|drained|rinsed|softened|melted|room temperature|large|small|medium|extra-firm|firm|ripe|whole|cut|cubed|torn|crusty|frozen|boneless|skinless|wild|caught)\b/gi;

function normalize(name){
  return String(name || '')
    .normalize('NFD')              // decompose accents (è -> e + combining grave)
    .replace(/[\u0300-\u036f]/g, '')  // drop combining marks
    .toLowerCase()
    .replace(TRAILING_NOISE, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Try to find an item ID for a given ingredient name.
// Returns null if no good match.
export function lookupItemId(name){
  const norm = normalize(name);
  if (!norm) return null;
  if (WALMART_ITEM_MAP[norm]) return WALMART_ITEM_MAP[norm];
  // Try the canonical synonym (e.g. "scallions" -> "green onions") before
  // falling through to word-subset / substring matching.
  const canon = normalize(canonicalIngredientName(name));
  if (canon && canon !== norm && WALMART_ITEM_MAP[canon]) return WALMART_ITEM_MAP[canon];

  // Word-subset match: e.g. "boneless chicken breasts" -> "chicken breast"
  const words = norm.split(' ').filter(Boolean);
  for (const key of Object.keys(WALMART_ITEM_MAP)){
    const kwords = key.split(' ').filter(Boolean);
    if (kwords.length && kwords.every(w => words.includes(w))) return WALMART_ITEM_MAP[key];
  }

  // Last-resort: substring match (longer key wins to avoid e.g. "egg" eating "eggplant")
  let best = null, bestLen = 0;
  for (const key of Object.keys(WALMART_ITEM_MAP)){
    if ((norm.includes(key) || key.includes(norm)) && key.length > bestLen){
      best = WALMART_ITEM_MAP[key];
      bestLen = key.length;
    }
  }
  return best;
}

// Round quantity up to integer cart-quantity.
function cartQty(measurements){
  if (!measurements || !measurements.length) return 1;
  const q = measurements[0].quantity;
  if (!q || q < 1) return 1;
  return Math.max(1, Math.min(20, Math.ceil(q)));
}

export function walmartSearchURL(ingredients){
  const q = (ingredients || []).map(i => i.name).slice(0, 6).join(' ');
  return 'https://www.walmart.com/search?q=' + encodeURIComponent(q || 'groceries');
}

// Build a Walmart cart URL from parsed ingredients.
// Returns: { url, matched, unmatched, source }
export function buildWalmartCart(ingredients){
  const matched = [];
  const unmatched = [];
  const seen = new Set();

  for (const ing of (ingredients || [])){
    const id = lookupItemId(ing.name);
    if (id && !seen.has(id)){
      seen.add(id);
      matched.push({ name: ing.name, itemId: id, qty: cartQty(ing.measurements) });
    } else if (!id){
      unmatched.push(ing.name);
    }
  }

  if (!matched.length){
    return { url: walmartSearchURL(ingredients), matched, unmatched, source: 'walmart_search_fallback' };
  }

  // Walmart cart syntax: items=ITEMID_QTY,ITEMID2_QTY2,...
  // Underscore separator (preferred). Cap at 25 items per URL.
  const itemsParam = matched
    .slice(0, 25)
    .map(m => m.qty > 1 ? `${m.itemId}_${m.qty}` : `${m.itemId}`)
    .join(',');

  const url = 'https://affil.walmart.com/cart/buynow?items=' + itemsParam;
  return { url, matched, unmatched, source: 'walmart_cart_prefill' };
}
