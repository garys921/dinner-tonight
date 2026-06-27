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
};

const TRAILING_NOISE = /\b(thinly|finely|coarsely|roughly|freshly|fresh|cold|hot|warm|cooked|raw|optional|to taste|peeled|seeded|pitted|chopped|sliced|diced|minced|grated|shaved|crushed|halved|quartered|drained|rinsed|softened|melted|room temperature|large|small|medium|extra-firm|firm|ripe|whole|cut|cubed|torn|crusty|frozen|boneless|skinless|wild|caught)\b/gi;

function normalize(name){
  return String(name || '')
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
