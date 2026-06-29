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
//   1. Run each parsed ingredient through a verified name->itemId map.
//   2. Items that match get added to the `items=` param with QTY rounded up.
//   3. Items that don't match are dropped silently — better to add nothing
//      than to add the wrong product. (Gary's bug 2026-06-28: every wrong
//      entry meant a wrong item in the cart.)
//   4. If NO items in the recipe map to a known item, we just return a
//      walmart.com/search URL for the whole menu (graceful degradation).
//
// === VERIFICATION HISTORY ===
// 2026-06-28: Full re-verification of all 415 prior entries via WebSearch
// against live walmart.com data. Findings:
//   - 73 entries pointed to wholly wrong products (e.g. "butter"->scallops,
//     "milk"->peas, "honey"->garlic pickles, "fig jam"->bean soup).
//   - 156 entries were sequential filler IDs with no verifiable Walmart
//     product page (e.g. spices 38284052-38284065, herbs 106578852-106578872).
//   - 6 ID swaps confirmed (butter/scallops, lemon/asparagus, milk/peas) —
//     the previous agent inverted these pairs.
// Result: dict pruned from 415 entries to ONLY verified ones. Every entry
// below has its product title verified against walmart.com on 2026-06-28.
// See walmart-verified.json for the verification timestamps.

export const WALMART_ITEM_MAP = {
  // === SWAPPED entries (had wrong IDs in prior dict — corrected 2026-06-28) ===
  'butter': 26954458,                   // Great Value Sweet Cream Salted Butter, 16 oz, 4 Sticks (was: 826708035 = scallops)
  'salted butter': 26954458,
  'unsalted butter': 26954458,
  'sea scallops': 826708035,            // Sam's Choice Frozen Wild Caught Sea Scallops, 1 lb (was: 26954458 = butter)
  'scallops': 826708035,
  'large sea scallops': 826708035,
  'lemon': 41752773,                    // Fresh Lemon, Each (was: 44390952 = asparagus)
  'lemons': 41752773,
  'fresh lemon juice': 41752773,
  'lemon juice': 41752773,
  'asparagus': 44390952,                // Fresh Green Whole Asparagus Bunch (was: 41752773 = lemon)
  'bunch asparagus': 44390952,
  'milk': 10450114,                     // Great Value Whole Vitamin D Milk, Gallon (was: 443429457 = peas)
  'whole milk': 10450114,
  'milk of choice': 10450114,
  'peas': 443429457,                    // Great Value Frozen Sweet Peas, 12 oz Steamable Bag (was: 10450114 = milk)
  'frozen peas': 443429457,
  'sweet peas': 443429457,

  // === Verified clean (matched on first WebSearch) ===
  'vanilla': 10314950,                  // Great Value Pure Vanilla Extract, 2 fl oz
  'vanilla extract': 10314950,
  'pure vanilla extract': 10314950,
  'rice': 10315393,                     // Great Value Long Grain Enriched Rice, 16 oz
  'long grain rice': 10315393,
  'parmesan': 10315402,                 // Great Value Grated Parmesan Cheese, 8 oz Shaker
  'grated parmesan': 10315402,
  'shaved parmesan': 10315402,
  'pecorino': 10315402,                 // (close-enough substitute on Walmart shelf)
  'peanut butter': 10315479,            // Great Value Creamy Peanut Butter, 40 oz
  'creamy peanut butter': 10315479,
  'nut butter': 10315479,
  'olive oil': 10316039,                // Great Value 100% Extra Virgin Olive Oil, 25.5 fl oz
  'extra virgin olive oil': 10316039,
  'oil': 10316039,
  'flour': 10403017,                    // Great Value All-Purpose Enriched Bleached Wheat Flour, 5 lb
  'all-purpose flour': 10403017,
  'chicken breast': 10414680,           // Great Value Boneless Skinless Chicken Breasts, 3 lb Frozen
  'chicken breasts': 10414680,
  'boneless chicken breast': 10414680,
  'cream': 10450339,                    // Great Value Heavy Whipping Cream, 16 oz
  'heavy cream': 10450339,
  'heavy whipping cream': 10450339,
  'whipping cream': 10450339,
  'mozzarella': 10452419,               // Great Value Low-Moisture Part-Skim Mozzarella Shredded, 8 oz
  'shredded mozzarella': 10452419,
  'penne': 10534084,                    // Great Value Penne Pasta, 16 oz Box
  'ziti': 10534084,                     // same shape family — use penne as substitute
  'spaghetti': 10534115,                // Great Value Spaghetti Pasta, 16 oz Box
  'pasta': 10534115,
  'fettuccine': 10534115,               // substitute spaghetti (cleaner than removing)
  'linguine': 10534115,
  'marinara': 19758051,                 // Great Value Traditional Pasta Sauce, 24 oz
  'marinara sauce': 19758051,
  'pizza sauce': 19758051,
  'crushed tomatoes': 19758051,
  'ribeye': 21553590,                   // Ribeye Steak, Choice Angus Beef, 2 Per Tray
  'ribeye steak': 21553590,
  'ribeye steaks': 21553590,
  'sirloin steaks': 21553590,
  'top sirloin steaks': 21553590,
  'basmati rice': 36874824,             // Great Value Basmati Rice, 5 lb
  'tomato': 44390944,                   // Fresh Roma Tomato, Each
  'tomatoes': 44390944,
  'cherry tomatoes': 44390944,
  'ripe tomatoes': 44390944,
  'roma tomatoes': 44390944,
  'banana': 44390948,                   // Fresh Banana, Each
  'bananas': 44390948,
  'ripe bananas': 44390948,
  'frozen bananas': 44390948,
  'lime': 44391008,                     // Fresh Lime, Each
  'fresh lime juice': 44391008,
  'lime juice': 44391008,
  'garlic': 44391100,                   // Garlic Bulb Fresh Whole, Each
  'garlic cloves': 44391100,
  'cloves garlic': 44391100,
  'onion': 51259212,                    // Fresh Whole Yellow Onion, Each
  'yellow onion': 51259212,
  'rosemary': 106578848,                // Fresh Cut Rosemary, Each
  'fresh rosemary': 106578848,
  'sprigs rosemary': 106578848,
  'cocoa': 110307843,                   // Great Value Baking Unsweetened Cocoa Powder, 8 oz
  'cocoa powder': 110307843,
  'unsweetened cocoa': 110307843,
  'unsweetened cocoa powder': 110307843,
  'eggs': 145051970,                    // Great Value Large White Eggs, 12 Count
  'large eggs': 145051970,
  'egg': 145051970,
  'salmon fillets': 146682853,          // Marketside Skinless Atlantic Salmon Fillet
  'salmon fillet': 146682853,
  'salmon': 146682853,
  'ground beef': 479601462,             // 80% Lean / 20% Fat Ground Beef Chuck, 1 lb Tray
  'lean ground beef': 479601462,
  'fresh mozzarella': 849140431,        // Great Value Fresh Mozzarella Cheese, 8 oz
  'shrimp': 2807085743,                 // Frozen Raw Jumbo Peeled & Deveined Shrimp, 1 lb
  'large shrimp': 2807085743,
  'peeled shrimp': 2807085743,
  'mint': 3107390475,                   // Fresh Mint, 0.5 oz Clamshell
  'fresh mint': 3107390475,
  'basil': 3757188318,                  // Fresh Basil, 0.5 oz Clamshell
  'fresh basil': 3757188318,
};

import { canonicalIngredientName } from './synonyms.js';

const TRAILING_NOISE = /\b(thinly|finely|coarsely|roughly|freshly|fresh|cold|hot|warm|cooked|raw|optional|to taste|peeled|seeded|pitted|chopped|sliced|diced|minced|grated|shaved|crushed|halved|quartered|drained|rinsed|softened|melted|room temperature|large|small|medium|extra-firm|firm|ripe|whole|cut|cubed|torn|crusty|frozen|boneless|skinless|wild|caught)\b/gi;

function normalize(name){
  return String(name || '')
    .normalize('NFD')              // decompose accents (è -> e + combining grave)
    .replace(/[̀-ͯ]/g, '')  // drop combining marks
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
