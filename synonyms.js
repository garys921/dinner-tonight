// Ingredient name normalization for all grocery search bridges.
//
// Why: search engines on Amazon, Walmart, FreshDirect, Stop & Shop and
// ShopRite all do "near-exact" string matching. "scallions" returns nothing
// on Amazon Fresh where the canonical name is "green onions"; "coriander"
// often gets the spice instead of the herb (which is "cilantro" in the US).
// This file gives one centralized place to map every variant in our recipe
// catalog to the canonical product name that maximizes search hits.
//
// All store endpoints + the Walmart cart lookup call `canonicalIngredientName()`
// before constructing their search URL or doing the item-ID lookup.

// Map of <variant lowercase> -> <canonical search term>.
// Keep the variant exactly as it would appear after parseIngredient
// (lowercased, prep-stripped — e.g. "fresh cilantro" parses to "cilantro").
export const INGREDIENT_SYNONYMS = {
  // Herbs / aromatics
  'scallion': 'green onions',
  'scallions': 'green onions',
  'spring onion': 'green onions',
  'spring onions': 'green onions',
  'coriander': 'cilantro',            // US grocery term
  'coriander leaves': 'cilantro',
  'flat-leaf parsley': 'parsley',
  'italian parsley': 'parsley',
  'rocket': 'arugula',                // UK term
  'baby arugula': 'arugula',

  // Mozzarella variants — Walmart/Amazon split fresh vs. shredded
  'ball mozzarella': 'fresh mozzarella',
  'mozzarella ball': 'fresh mozzarella',
  'low-moisture mozzarella': 'shredded mozzarella',

  // Proteins
  'strips bacon': 'bacon',
  'slices bacon': 'bacon',
  'rashers bacon': 'bacon',
  'bacon strips': 'bacon',
  'thick-cut bacon': 'bacon',
  'sea scallops': 'scallops',
  'bay scallops': 'scallops',
  'jumbo shrimp': 'shrimp',
  'peeled shrimp': 'shrimp',
  'peeled and deveined shrimp': 'shrimp',
  'peeled, deveined shrimp': 'shrimp',

  // Bread / bakery
  'crusty bread': 'bread',
  'baguette': 'french baguette',
  'ciabatta': 'ciabatta bread',
  'sourdough': 'sourdough bread',
  'rye': 'rye bread',
  'brioche': 'brioche buns',
  'flatbreads': 'flatbread',
  'pizza crust': 'pizza dough',
  'pizza dough or crust': 'pizza dough',
  'naan': 'naan bread',
  'pita': 'pita bread',

  // Dairy
  'heavy whipping cream': 'heavy cream',
  'whipping cream': 'heavy cream',
  'mascarpone': 'mascarpone cheese',
  'ricotta': 'ricotta cheese',
  'grated parmesan': 'parmesan cheese',
  'shaved parmesan': 'parmesan cheese',
  'pecorino': 'pecorino romano',
  'feta': 'feta cheese',
  'goat cheese': 'goat cheese',
  'sharp cheddar': 'cheddar cheese',
  'aged cheddar': 'cheddar cheese',
  'provolone': 'provolone cheese',
  'swiss': 'swiss cheese',
  'gruyere': 'gruyere cheese',
  'fontina': 'fontina cheese',
  'brie': 'brie cheese',

  // Vegetables / produce
  'baby potatoes': 'baby potatoes',
  'yukon gold potatoes': 'yukon gold potatoes',
  'red potatoes': 'red potatoes',
  'russet potatoes': 'russet potatoes',
  'roma tomatoes': 'roma tomatoes',
  'cherry tomatoes': 'cherry tomatoes',
  'grape tomatoes': 'grape tomatoes',
  'eggplant': 'eggplant',
  'aubergine': 'eggplant',            // UK term
  'capsicum': 'bell pepper',          // UK/AU term
  'courgette': 'zucchini',            // UK term
  'mange tout': 'snow peas',          // UK term
  'snap peas': 'sugar snap peas',
  'broccolini': 'broccolini',
  'baby spinach': 'spinach',
  'baby kale': 'kale',

  // Pantry / dry goods
  'chili flakes': 'red pepper flakes',
  'red chili flakes': 'red pepper flakes',
  'crushed red pepper': 'red pepper flakes',
  'red chili': 'red pepper flakes',
  'kosher salt': 'salt',
  'sea salt': 'salt',
  'flaky salt': 'sea salt flakes',
  'black pepper': 'black pepper',
  'fresh ground pepper': 'black pepper',
  'cracked pepper': 'black pepper',

  // Specific brands / hard-to-search items
  'soy sauce': 'soy sauce',
  'low-sodium soy sauce': 'soy sauce',
  'tamari': 'tamari soy sauce',
  'sesame oil': 'toasted sesame oil',
  'fish sauce': 'fish sauce',
  'oyster sauce': 'oyster sauce',
  'hoisin': 'hoisin sauce',
  'sriracha': 'sriracha sauce',
  'gochujang': 'gochujang paste',
  'mirin': 'mirin rice wine',
  'rice vinegar': 'rice vinegar',
  'rice wine vinegar': 'rice vinegar',
  'balsamic': 'balsamic vinegar',
  'balsamic glaze': 'balsamic glaze',
  'apple cider vinegar': 'apple cider vinegar',
  'white wine vinegar': 'white wine vinegar',

  // Sweeteners
  'honey or maple syrup': 'honey',
  'maple syrup or honey': 'honey',
  'pure maple syrup': 'maple syrup',
  'brown sugar': 'brown sugar',
  'powdered sugar': 'powdered sugar',
  'confectioners sugar': 'powdered sugar',
  'confectioners\' sugar': 'powdered sugar',

  // Stocks / broths
  'stock': 'chicken broth',
  'warm stock': 'chicken broth',
  'chicken stock': 'chicken broth',
  'vegetable stock': 'vegetable broth',
  'beef stock': 'beef broth',
  'fish stock': 'fish stock',

  // Wine
  'white wine': 'dry white wine',
  'red wine': 'red wine',
  'cooking wine': 'cooking wine',

  // Spices we don't want to over-narrow
  'dried oregano': 'oregano',
  'dried thyme': 'thyme',
  'dried basil': 'basil',
  'smoked paprika': 'smoked paprika',
  'sweet paprika': 'paprika',

  // Misc
  'mayo': 'mayonnaise',
  'dijon': 'dijon mustard',
  'whole grain mustard': 'whole grain mustard',
  'horseradish': 'prepared horseradish',
  'prepared horseradish': 'prepared horseradish',
  'tzatziki': 'tzatziki sauce',
  'pesto': 'basil pesto',
  'basil pesto': 'basil pesto',
  'sun-dried tomatoes': 'sun-dried tomatoes',
  'roasted red peppers': 'roasted red peppers',
  'capers': 'capers',
  'kalamata olives': 'kalamata olives',
  'olives': 'olives',
  'taco seasoning': 'taco seasoning',
  'breadcrumbs': 'breadcrumbs',
  'panko': 'panko breadcrumbs',
  'gnocchi': 'potato gnocchi',
  'potato gnocchi': 'potato gnocchi',
  'arborio rice': 'arborio rice',
  'jasmine rice': 'jasmine rice',
  'basmati rice': 'basmati rice',
  'quinoa': 'quinoa',
  'farro': 'farro',
  'couscous': 'couscous',
  'lentils': 'green lentils',
  'black beans': 'black beans',
  'cannellini beans': 'cannellini beans',
  'chickpeas': 'chickpeas',
  'garbanzo beans': 'chickpeas',
  'tofu': 'firm tofu',
  'extra firm tofu': 'extra firm tofu',
  'silken tofu': 'silken tofu',

  // Berries / fruit
  'mixed berries': 'mixed berries',
  'frozen berries': 'frozen mixed berries',
  'blueberries': 'blueberries',
  'strawberries': 'strawberries',
  'raspberries': 'raspberries',
  'blackberries': 'blackberries',

  // Chocolate
  'dark chocolate': 'dark chocolate bar',
  'semisweet chocolate': 'semisweet chocolate chips',
  'chocolate chips': 'chocolate chips',
  'cocoa powder': 'unsweetened cocoa powder',
  'unsweetened cocoa': 'unsweetened cocoa powder',

  // Eggs / dairy
  'greek yogurt': 'greek yogurt',
  'plain yogurt': 'plain yogurt',
  'sour cream': 'sour cream',
  'cream cheese': 'cream cheese',

  // Deli
  'roast turkey': 'sliced turkey breast',
  'sliced turkey': 'sliced turkey breast',
  'roast beef': 'sliced roast beef',
  'sliced roast beef': 'sliced roast beef',
  'corned beef': 'corned beef',
  'pastrami': 'sliced pastrami',
  'ham': 'sliced ham',
  'prosciutto': 'prosciutto',
  'salami': 'salami',
  'pepperoni': 'pepperoni',

  // Other
  'avocado': 'avocado',
  'ripe avocado': 'avocado',
  'lime juice': 'fresh lime juice',
  'lemon juice': 'fresh lemon juice',
  'cilantro': 'cilantro',              // canonical (explicit so map test stays cheap)
  'parsley': 'parsley'
};

// Return the best search-friendly canonical name for a parsed ingredient.
// Always returns a non-empty string (falls back to the original name).
export function canonicalIngredientName(name){
  if (!name) return '';
  const raw = String(name).trim();
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (INGREDIENT_SYNONYMS[lower]) return INGREDIENT_SYNONYMS[lower];
  // Try without trailing 's' (simple pluralization)
  if (lower.endsWith('s') && INGREDIENT_SYNONYMS[lower.slice(0, -1)]){
    return INGREDIENT_SYNONYMS[lower.slice(0, -1)];
  }
  // Try with trailing 's' added
  if (!lower.endsWith('s') && INGREDIENT_SYNONYMS[lower + 's']){
    return INGREDIENT_SYNONYMS[lower + 's'];
  }
  return raw;
}
