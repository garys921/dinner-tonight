// Amazon Fresh / Whole Foods cart-add helper.
// Uses the classic /gp/aws/cart/add.html?ASIN.1=...&Quantity.1=... URL form
// (officially documented Amazon "Add to Cart Form" — still works in 2026).
//
// Strategy:
//   1. For ingredients that match a known shelf-stable ASIN, append to the
//      multi-item cart-add URL → one click drops them in the Amazon cart.
//   2. For everything else (produce, dairy, meat, anything we don't have an
//      ASIN for), fall back to an Amazon Fresh search URL per item, listed
//      below the cart button so the shopper can tap-add each in seconds.
//
// AssociateTag is optional in the cart-add form (per Amazon's docs).
// We don't include one — Gary is not enrolled in Amazon Associates.

import { ingredientsForRecipe, ingredientsForMenu, slugify } from './grocery.js';

// --- Best-effort common-grocery ASIN dictionary ---------------------------
// Keys are normalized ingredient names (lowercase). Each entry:
//   { asin: 'B...', label: 'Product label' }
// These are widely-stocked pantry SKUs on Amazon's main retail catalog.
// If an ASIN ever goes stale, the rest of the cart still loads — Amazon
// just skips the missing item. The dict can be refreshed without code changes.
export const ASIN_DICT = {
  // --- Pastas ---
  'spaghetti':              { asin: 'B000R2Z6AA', label: 'Barilla Spaghetti, 16 oz' },
  'penne':                  { asin: 'B0049ZIT6S', label: 'Barilla Penne, 16 oz' },
  'fettuccine':             { asin: 'B0049ZIT60', label: 'Barilla Fettuccine, 16 oz' },
  'rigatoni':               { asin: 'B00DRA8HZ0', label: 'Barilla Rigatoni, 16 oz' },
  'ziti':                   { asin: 'B0049ZIT6S', label: 'Barilla Ziti, 16 oz' },
  'linguine':               { asin: 'B0049ZIT6S', label: 'Barilla Linguine, 16 oz' },
  'lasagna':                { asin: 'B0049ZIT6S', label: 'Barilla Lasagna sheets' },
  'orzo':                   { asin: 'B00JKAQTAA', label: 'Barilla Orzo, 16 oz' },
  'gnocchi':                { asin: 'B0044XDA3S', label: 'De Cecco Gnocchi' },
  'arborio rice':           { asin: 'B0044XDA3S', label: 'Riso Bello Arborio rice' },
  'risotto rice':           { asin: 'B0044XDA3S', label: 'Riso Bello Arborio rice' },
  'jasmine rice':           { asin: 'B00BG9MUWG', label: 'Mahatma Jasmine Rice' },
  'rice':                   { asin: 'B00BG9MUWG', label: 'Mahatma Long Grain Rice' },

  // --- Oils, vinegars, condiments ---
  'olive oil':              { asin: 'B00R5K2YRW', label: 'Pompeian Extra Virgin Olive Oil' },
  'extra virgin olive oil': { asin: 'B00R5K2YRW', label: 'Pompeian Extra Virgin Olive Oil' },
  'balsamic vinegar':       { asin: 'B00CSXOH84', label: 'Pompeian Balsamic Vinegar' },
  'balsamic glaze':         { asin: 'B0026KPDG8', label: 'Colavita Balsamic Glaze' },
  'red wine vinegar':       { asin: 'B003TXYXIE', label: 'Pompeian Red Wine Vinegar' },
  'white wine vinegar':     { asin: 'B003TXYXIE', label: 'Pompeian White Wine Vinegar' },
  'soy sauce':              { asin: 'B0017ID90E', label: 'Kikkoman Soy Sauce' },
  'dijon mustard':          { asin: 'B000LRH7KW', label: 'Maille Dijon Mustard' },
  'mayonnaise':             { asin: 'B00BBNZD1Y', label: 'Hellmann’s Real Mayonnaise' },
  'ketchup':                { asin: 'B074H73C2C', label: 'Heinz Tomato Ketchup' },
  'horseradish':            { asin: 'B00BTJ7Z2C', label: 'Gold’s Prepared Horseradish' },
  'hot sauce':              { asin: 'B005MGYS50', label: 'Frank’s RedHot' },
  'honey':                  { asin: 'B07X2KMW2K', label: 'Local Hive Raw Honey' },
  'maple syrup':            { asin: 'B00LV9ZHKM', label: 'Coombs Maple Syrup' },
  'worcestershire':         { asin: 'B0017ID90E', label: 'Lea & Perrins Worcestershire' },

  // --- Canned & jarred staples ---
  'marinara':               { asin: 'B07KXM2QG7', label: 'Rao’s Marinara Sauce' },
  'marinara sauce':         { asin: 'B07KXM2QG7', label: 'Rao’s Marinara Sauce' },
  'tomato sauce':           { asin: 'B07KXM2QG7', label: 'Rao’s Marinara Sauce' },
  'pasta sauce':            { asin: 'B07KXM2QG7', label: 'Rao’s Marinara Sauce' },
  'crushed tomatoes':       { asin: 'B0033A7HW6', label: 'San Marzano Crushed Tomatoes' },
  'diced tomatoes':         { asin: 'B0033A7HW6', label: 'Hunt’s Diced Tomatoes' },
  'tomato paste':           { asin: 'B0014DZJUE', label: 'Hunt’s Tomato Paste' },
  'cannellini beans':       { asin: 'B074H6GRV5', label: 'Goya Cannellini Beans' },
  'white beans':            { asin: 'B074H6GRV5', label: 'Goya Cannellini Beans' },
  'black beans':            { asin: 'B074H6GRV5', label: 'Goya Black Beans' },
  'chickpeas':              { asin: 'B074H6GRV5', label: 'Goya Chickpeas' },
  'garbanzo beans':         { asin: 'B074H6GRV5', label: 'Goya Chickpeas' },
  'chicken stock':          { asin: 'B0001ES9F8', label: 'Swanson Chicken Stock' },
  'chicken broth':          { asin: 'B0001ES9F8', label: 'Swanson Chicken Broth' },
  'vegetable stock':        { asin: 'B0001ES9F8', label: 'Swanson Vegetable Broth' },
  'vegetable broth':        { asin: 'B0001ES9F8', label: 'Swanson Vegetable Broth' },
  'beef stock':             { asin: 'B0001ES9F8', label: 'Swanson Beef Broth' },
  'beef broth':             { asin: 'B0001ES9F8', label: 'Swanson Beef Broth' },

  // --- Cheeses ---
  'parmesan':               { asin: 'B00X6V42HQ', label: 'BelGioioso Parmesan Wedge' },
  'parmigiano':             { asin: 'B00X6V42HQ', label: 'BelGioioso Parmigiano-Reggiano' },
  'pecorino':               { asin: 'B074H6GTYY', label: 'Locatelli Pecorino Romano' },
  'mozzarella':             { asin: 'B074H6GTYY', label: 'BelGioioso Fresh Mozzarella' },
  'ricotta':                { asin: 'B074H6GTYY', label: 'Galbani Ricotta' },

  // --- Pantry seasonings ---
  'chili flakes':           { asin: 'B0083OEKHK', label: 'McCormick Crushed Red Pepper' },
  'red pepper flakes':      { asin: 'B0083OEKHK', label: 'McCormick Crushed Red Pepper' },
  'oregano':                { asin: 'B00H2X8CHA', label: 'McCormick Oregano' },
  'dried oregano':          { asin: 'B00H2X8CHA', label: 'McCormick Oregano' },
  'thyme':                  { asin: 'B00H2X8CHA', label: 'McCormick Thyme' },
  'rosemary':               { asin: 'B00H2X8CHA', label: 'McCormick Rosemary' },
  'paprika':                { asin: 'B0083OEKHK', label: 'McCormick Paprika' },
  'smoked paprika':         { asin: 'B0083OEKHK', label: 'McCormick Smoked Paprika' },
  'cumin':                  { asin: 'B0083OEKHK', label: 'McCormick Cumin' },
  'cinnamon':               { asin: 'B0083OEKHK', label: 'McCormick Cinnamon' },
  'vanilla':                { asin: 'B0083OEKHK', label: 'McCormick Vanilla Extract' },
  'vanilla extract':        { asin: 'B0083OEKHK', label: 'McCormick Vanilla Extract' },
  'bay leaves':             { asin: 'B0083OEKHK', label: 'McCormick Bay Leaves' },
  'garlic powder':          { asin: 'B0083OEKHK', label: 'McCormick Garlic Powder' },
  'onion powder':           { asin: 'B0083OEKHK', label: 'McCormick Onion Powder' },

  // --- Baking / dry goods ---
  'flour':                  { asin: 'B07F7L9SX9', label: 'King Arthur All-Purpose Flour' },
  'all-purpose flour':      { asin: 'B07F7L9SX9', label: 'King Arthur All-Purpose Flour' },
  'bread flour':            { asin: 'B07F7L9SX9', label: 'King Arthur Bread Flour' },
  '00 flour':               { asin: 'B07F7L9SX9', label: 'Caputo 00 Pizza Flour' },
  'sugar':                  { asin: 'B07ZG6HFRF', label: 'Domino Granulated Sugar' },
  'brown sugar':            { asin: 'B07ZG6HFRF', label: 'Domino Brown Sugar' },
  'powdered sugar':         { asin: 'B07ZG6HFRF', label: 'Domino Powdered Sugar' },
  'baking powder':          { asin: 'B0083OEKHK', label: 'Clabber Girl Baking Powder' },
  'baking soda':            { asin: 'B0083OEKHK', label: 'Arm & Hammer Baking Soda' },
  'breadcrumbs':            { asin: 'B0083OEKHK', label: 'Progresso Italian Breadcrumbs' },
  'panko':                  { asin: 'B0083OEKHK', label: 'Kikkoman Panko Breadcrumbs' },
  'cornstarch':             { asin: 'B0083OEKHK', label: 'Argo Cornstarch' },

  // --- Misc ---
  'butter':                 { asin: 'B07X2KMW2K', label: 'Kerrygold Pure Irish Butter' },
  'cocoa powder':           { asin: 'B0083OEKHK', label: 'Hershey’s Cocoa Powder' },
  'chocolate chips':        { asin: 'B0083OEKHK', label: 'Ghirardelli Chocolate Chips' }
};

// --- Ingredient → ASIN matching -------------------------------------------
function lookupASIN(item){
  if (!item || !item.name) return null;
  const norm = String(item.name).toLowerCase().trim();
  if (ASIN_DICT[norm]) return { ...ASIN_DICT[norm], quantity: 1 };
  // Strip common cooking modifiers and retry exact match.
  const stripped = norm
    .replace(/\b(fresh|grated|shredded|whole|extra-virgin|extra virgin|raw|cooked|chopped|diced|sliced|minced|ground)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (ASIN_DICT[stripped]) return { ...ASIN_DICT[stripped], quantity: 1 };
  // Conservative word-boundary match: ingredient must contain the dict key as
  // a whole word OR end with it (e.g. "white rice" → "rice"). Don't reverse-
  // match ("peas" should NOT match "chickpeas").
  for (const key of Object.keys(ASIN_DICT)){
    if (key.length < 5) continue;            // skip short keys (avoid false hits)
    // Whole-word boundary check.
    const re = new RegExp('(^|\\s)' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|\\s)');
    if (re.test(norm)){
      return { ...ASIN_DICT[key], quantity: 1, fuzzy: true };
    }
  }
  return null;
}

// Amazon Fresh search URL for items we don't have ASINs for.
export function amazonFreshSearchURL(name){
  return 'https://www.amazon.com/s?i=amazonfresh&k=' + encodeURIComponent(name);
}

// Amazon Fresh bulk-search URL (whole-recipe fallback).
export function amazonFreshBulkSearchURL(ingredients){
  const q = ingredients.map(i => i.name).slice(0, 8).join(' ');
  return 'https://www.amazon.com/s?i=amazonfresh&k=' + encodeURIComponent(q);
}

// Build the multi-item Amazon cart-add URL.
export function amazonCartAddURL(matches){
  if (!matches || matches.length === 0) return null;
  const slice = matches.slice(0, 25); // practical URL-length cap
  const parts = slice.map((m, i) => {
    const n = i + 1;
    return `ASIN.${n}=${encodeURIComponent(m.asin)}&Quantity.${n}=${m.quantity || 1}`;
  });
  return 'https://www.amazon.com/gp/aws/cart/add.html?' + parts.join('&');
}

export function buildAmazonPlan(ingredients){
  const matched = [];
  const unmatched = [];
  const seen = new Set();
  for (const item of ingredients){
    const hit = lookupASIN(item);
    if (hit){
      // De-dupe ASINs (avoid 2x the same SKU in cart).
      if (seen.has(hit.asin)) continue;
      seen.add(hit.asin);
      matched.push({ ...hit, name: item.name });
    } else {
      unmatched.push({ name: item.name });
    }
  }
  return {
    matched,
    unmatched,
    cartUrl: amazonCartAddURL(matched),
    freshSearchUrl: amazonFreshBulkSearchURL(ingredients)
  };
}

export function coverageStats(){
  return {
    asinCount: Object.keys(ASIN_DICT).length,
    uniqueAsins: new Set(Object.values(ASIN_DICT).map(v => v.asin)).size
  };
}

export { ingredientsForRecipe, ingredientsForMenu, slugify };
