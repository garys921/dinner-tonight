// Ingredient parsing + Instacart link builder.
// Turns a recipe's plain-text ingredient list into structured line items
// that we can POST to Instacart's Developer Platform API ( /idp/v1/products/recipe ).

import { menuForDate, todaysMenu, RECIPES } from './recipes.js';

// Instacart's supported units (subset that covers our recipes).
// Anything else falls back to "each".
const UNIT_MAP = {
  tsp: 'teaspoon', teaspoon: 'teaspoon', teaspoons: 'teaspoon',
  tbsp: 'tablespoon', tablespoon: 'tablespoon', tablespoons: 'tablespoon',
  cup: 'cup', cups: 'cup',
  oz: 'ounce', ounce: 'ounce', ounces: 'ounce',
  lb: 'pound', lbs: 'pound', pound: 'pound', pounds: 'pound',
  g: 'gram', gram: 'gram', grams: 'gram',
  kg: 'kilogram', kilogram: 'kilogram', kilograms: 'kilogram',
  ml: 'milliliter', l: 'liter', liter: 'liter', litre: 'liter',
  pinch: 'pinch', dash: 'dash', clove: 'each', cloves: 'each',
  can: 'can', cans: 'can', package: 'package', pkg: 'package',
  slice: 'each', slices: 'each', bunch: 'bunch',
  // Extra unit words the QA agent saw leaking into search queries
  // ("Sprigs rosemary", "Scoops vanilla gelato", "Shots espresso", etc.)
  sprig: 'each', sprigs: 'each',
  scoop: 'each', scoops: 'each',
  shot: 'each', shots: 'each',
  piece: 'each', pieces: 'each',
  head: 'each', heads: 'each',
  stalk: 'each', stalks: 'each',
  stick: 'each', sticks: 'each',
  jar: 'each', jars: 'each',
  bottle: 'each', bottles: 'each',
  bag: 'each', bags: 'each',
  box: 'each', boxes: 'each',
  loaf: 'each', loaves: 'each',
  sheet: 'each', sheets: 'each',
  pint: 'each', pints: 'each', quart: 'each', quarts: 'each',
  // Common typos / capitalized at start of string (we lowercase before lookup)
  tbs: 'tablespoon', t: 'teaspoon'
};
// Same set as a tokenizer-safe stripper: when the *name* still begins with
// a unit word (because the recipe omitted the count, e.g. "Sprigs rosemary",
// "Scoops vanilla gelato"), drop the unit so the search box gets the noun.
const LEADING_UNIT_RE = new RegExp(
  '^(?:sprigs?|scoops?|shots?|slices?|cloves?|cups?|tbsp|tbs|tsp|teaspoons?|tablespoons?|' +
  'pinch(?:es)?|dash(?:es)?|cans?|packages?|pkgs?|pieces?|heads?|stalks?|sticks?|' +
  'jars?|bottles?|bags?|boxes?|loaves|loaf|sheets?|pints?|quarts?|bunch(?:es)?|' +
  // Portion/container words seen leaking in ("strips bacon", "ball mozzarella",
  // "wedges lemon", "ears corn", "ribs celery") - strip so the noun lands first.
  'strips?|balls?|wedges?|ears?|ribs?|knobs?|chunks?|cubes?|rounds?|rings?|kernels?)\\s+',
  'i'
);

const NOISE = /\b(thinly|finely|coarsely|roughly|freshly|fresh|cold|hot|warm|cooked|raw|optional|to taste|peeled|seeded|pitted|chopped|sliced|diced|minced|grated|shaved|crushed|halved|quartered|drained|rinsed|softened|melted|room temperature|large|small|medium|extra-firm|firm|ripe|whole|cut|cubed|torn|crusty)\b/gi;

function isPantryStaple(name){
  const s = name.toLowerCase().trim();
  if (!s) return true;
  if (/^(salt|pepper|salt,? pepper|salt and pepper|kosher salt|sea salt|flaky salt|black pepper|olive oil|oil|water)$/.test(s)) return true;
  return false;
}

function parseQty(token){
  if (!token) return null;
  token = token.replace(/[–—]/g, '-').trim();
  if (/^\d+\s*-\s*\d+$/.test(token)) token = token.split('-')[0].trim();
  const mixed = token.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = token.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(token);
  return Number.isFinite(n) ? n : null;
}

// Internal: parse a SINGLE comma-free phrase. Returns one item or null.
function parseOneIngredient(raw, originalDisplay){
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Normalize unicode dashes (en/em) to ASCII hyphen so quantity ranges
  // like "4-6 chicken thighs" and "12-14 wonton wrappers" parse correctly.
  // Without this, the leading-quantity regex misses the range entirely and
  // the whole string lands in the search query.
  s = s.replace(/[\u2013\u2014]/g, '-');
  if (/^optional\b/i.test(s)) return null;
  // Lines like "Optional protein: grilled chicken, shrimp or sausage" should
  // never become an ingredient.
  if (/^optional\s+\w+\s*:/i.test(s)) return null;

  // Drop parenthetical asides BEFORE anything else — they create junk like
  // "Sriracha ()" when the inner text gets stripped by other passes.
  s = s.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();

  // Pure-modifier lines we don't want as ingredients.
  if (/^(to taste|for serving|for garnish|optional|as needed)$/i.test(s)) return null;

  // Strip trailing prep notes like "rinsed, drained, peeled" attached with a
  // comma (the caller already splits real comma-joined ingredient lists).
  s = s.replace(/,\s*(rinsed|drained|peeled|halved|chopped|sliced|diced|minced|to taste|optional|softened|melted|cubed|cooked|raw|seeded|pitted|crushed|torn|warmed|chilled|sifted|shredded|grated|thawed|uncooked|trimmed|deveined|quartered|julienned|cracked|ground|whisked|beaten|zested|skinless|boneless|toasted|roasted|smoked|patted dry)\b.*$/i, '');

  // Pull the leading quantity off first; the rest is unit? + name.
  const qm = s.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s+(.+)$/);

  let quantity = null, unit = null, name = s;
  if (qm){
    quantity = parseQty(qm[1]);
    const rest = qm[2];
    const um = rest.match(/^([a-zA-Z]+\.?)\s+(.+)$/);
    if (um){
      const maybeUnit = um[1].toLowerCase().replace(/\.$/, '');
      if (UNIT_MAP[maybeUnit]){
        unit = UNIT_MAP[maybeUnit];
        name = um[2];
      } else {
        unit = 'each';
        name = rest;
      }
    } else {
      unit = 'each';
      name = rest;
    }
  }

  // Even with no leading number, drop a stray unit word at the head of the
  // name. Recipes like "Sprigs rosemary" / "Scoops vanilla gelato" used to
  // leak the unit into the search query.
  name = name.replace(LEADING_UNIT_RE, '');

  name = name.replace(NOISE, '').replace(/\s+/g, ' ').replace(/^\s*-\s*/, '').trim();

  // Filter junk that survives normalization.
  if (!name) return null;
  if (isPantryStaple(name)) return null;
  if (name.length < 2) return null;
  if (/^(and|or|plus|the)$/i.test(name)) return null;

  return {
    name: name.replace(/^\w/, c => c.toUpperCase()),
    display_text: originalDisplay || raw,
    measurements: quantity ? [{ quantity, unit: unit || 'each' }] : [{ quantity: 1, unit: 'each' }]
  };
}

// Public entry point. Returns an ARRAY of zero or more items, because a
// single raw line like "Parsley, scallion, basil" expands into three.
// Callers flatten the array.
export function parseIngredient(raw){
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];

  // Detect "comma-joined herb / aromatic list" — e.g. "Ginger, garlic, sesame oil"
  // or "Parsley, scallion, basil". Heuristic: every comma-separated chunk is
  // short and has no leading number and no embedded unit phrase. Otherwise
  // we treat the comma as a prep separator ("1 cup flour, sifted") and keep
  // the original behavior.
  const chunks = text.split(',').map(x => x.trim()).filter(Boolean);
  const looksLikeList = chunks.length >= 2 && chunks.every(c =>
    !/^\d/.test(c) &&
    c.split(/\s+/).length <= 3 &&
    !/\b(cup|cups|tsp|tbsp|teaspoon|tablespoon|oz|ounce|lb|pound|gram|kg|ml|liter|can|jar|bottle|package|pkg|bag|box|stick|pint|quart|pinch|dash)\b/i.test(c)
  );

  if (looksLikeList){
    const out = [];
    for (const c of chunks){
      const item = parseOneIngredient(c, raw);
      if (item) out.push(item);
    }
    return out;
  }

  const single = parseOneIngredient(text, raw);
  return single ? [single] : [];
}

function mergeIngredients(items){
  const map = new Map();
  for (const it of items){
    if (!it) continue;
    const key = it.name.toLowerCase();
    if (!map.has(key)){
      map.set(key, { ...it, measurements: [...it.measurements] });
    } else {
      const cur = map.get(key);
      const a = cur.measurements[0], b = it.measurements[0];
      if (a && b && a.unit === b.unit){
        a.quantity = (a.quantity || 1) + (b.quantity || 1);
      }
    }
  }
  return Array.from(map.values());
}

export function ingredientsForRecipe(r){
  const out = [];
  for (const line of (r.ing || [])){
    const items = parseIngredient(line);
    if (!items) continue;
    if (Array.isArray(items)) out.push(...items);
    else out.push(items);
  }
  return out;
}

export function ingredientsForMenu(m){
  const all = [
    ...(m.appetizer ? ingredientsForRecipe(m.appetizer) : []),
    ...(m.main ? ingredientsForRecipe(m.main) : []),
    ...(m.side ? ingredientsForRecipe(m.side) : []),
    ...(m.dessert ? ingredientsForRecipe(m.dessert) : [])
  ];
  return mergeIngredients(all);
}

export function buildRecipePayload({ title, image_url, servings, cooking_time, instructions, ingredients, linkbackUrl }){
  return {
    title,
    image_url: image_url || undefined,
    author: 'Dinner Tonight',
    servings: servings || 2,
    cooking_time: cooking_time || 30,
    expires_in: 365,
    instructions: (instructions || []).slice(0, 12),
    ingredients,
    landing_page_configuration: {
      partner_linkback_url: linkbackUrl || 'https://dinner-tonight-daily.vercel.app',
      enable_pantry_items: true
    }
  };
}

export function instacartSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 8).join(' ');
  return 'https://www.instacart.com/store/s?k=' + encodeURIComponent(q);
}

export async function createInstacartRecipePage(payload, apiKey){
  const res = await fetch('https://connect.instacart.com/idp/v1/products/recipe', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok){
    const txt = await res.text();
    throw new Error('Instacart API ' + res.status + ': ' + txt.slice(0, 300));
  }
  const j = await res.json();
  return j.products_link_url;
}

export function payloadForRecipe(r, linkbackUrl){
  const timeMatch = String(r.time).match(/\d+/);
  return buildRecipePayload({
    title: r.title,
    servings: typeof r.serves === 'string' ? parseInt(r.serves, 10) || 2 : (r.serves || 2),
    cooking_time: timeMatch ? parseInt(timeMatch[0], 10) : 30,
    instructions: r.steps,
    ingredients: ingredientsForRecipe(r),
    linkbackUrl
  });
}

export function payloadForMenu(m, linkbackUrl){
  return buildRecipePayload({
    title: "Tonight's Dinner — " + (m.main && m.main.title || 'Four-course menu'),
    servings: 2,
    cooking_time: 90,
    instructions: [
      m.appetizer ? 'APPETIZER · ' + m.appetizer.title : null,
      ...(m.appetizer && m.appetizer.steps ? m.appetizer.steps.slice(0, 2) : []),
      m.main ? 'MAIN · ' + m.main.title : null,
      ...(m.main && m.main.steps ? m.main.steps.slice(0, 3) : []),
      m.side ? 'SIDE · ' + m.side.title : null,
      ...(m.side && m.side.steps ? m.side.steps.slice(0, 2) : []),
      m.dessert ? 'DESSERT · ' + m.dessert.title : null,
      ...(m.dessert && m.dessert.steps ? m.dessert.steps.slice(0, 2) : [])
    ].filter(Boolean),
    ingredients: ingredientsForMenu(m),
    linkbackUrl
  });
}

export function slugify(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function findRecipeBySlug(slug){
  if (!slug) return null;
  const s = slugify(slug);
  return RECIPES.find(r => slugify(r.title) === s) || null;
}

export { menuForDate, todaysMenu };

// Parse a YYYY-MM-DD date string and return the menu for that ET calendar
// day. Used by all standalone endpoints so the chips fetch the SAME menu
// the homepage rendered, even between ET-midnight and UTC-midnight.
import { menuForYMD } from './recipes.js';
import { canonicalIngredientName } from './synonyms.js';
export function menuForDateString(dateStr){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''));
  if (!m) return todaysMenu();
  return menuForYMD({ year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) });
}


// ─── Shopping-list-app bridges & Long Island grocery search builders ──────────
// Added by shopping-list-bridges agent. None of these require auth or paid APIs.
//
// Categories:
//   "list"  → sends ingredients to a shopping-list app (Bring!, Apple Reminders, plain copy)
//   "order" → opens a Long Island grocery service search/cart (FreshDirect, Stop & Shop, ShopRite)

// Build a plain-text ingredient list, one per line (used by Reminders/Notes/copy/email).
export function ingredientsAsLines(ingredients){
  return ingredients.map(it => {
    const m = it.measurements && it.measurements[0];
    const q = m && m.quantity ? (Math.round(m.quantity * 100) / 100) : '';
    const u = m && m.unit && m.unit !== 'each' ? ' ' + m.unit : '';
    return ((q ? q + u + ' ' : '') + it.name).trim();
  });
}

// Bring! deeplink — Bring's server fetches our recipe-card URL, parses the
// JSON-LD Recipe, and adds the ingredients on the user's device.
// Docs: https://sites.google.com/getbring.com/bring-import-dev-guide/web-to-app-integration
export function bringDeeplinkURL(recipeCardUrl, opts){
  const baseQty = (opts && opts.baseQuantity) || 2;
  const reqQty = (opts && opts.requestedQuantity) || baseQty;
  return 'https://api.getbring.com/rest/bringrecipes/deeplink'
    + '?url=' + encodeURIComponent(recipeCardUrl)
    + '&source=web'
    + '&baseQuantity=' + baseQty
    + '&requestedQuantity=' + reqQty;
}

// Apple Reminders / iOS Reminders — there's no public x-apple-reminderkit:// URL
// scheme that takes a list of items, so the best universal trick is mailto: with
// the list pre-formatted; on iOS the user can long-press the body and "Add to
// Reminders". For Apple Notes / Reminders we also expose a dedicated /view=list
// page (already in api/grocery.js) the user can save.

// Generic mailto bridge — works for Reminders, Notes, AnyList, OurGroceries,
// Paprika (all support sharing a plain-text list via mail/share-sheet).
// Truncate an ingredient line array so the encoded URI fits within `maxUri`.
// Returns the line array (possibly with a "... and N more" tail).
function truncateForUri(lines, maxUri, fixedOverheadEncodedLen){
  // Quick path: if the joined body encoded length + fixed overhead is fine, keep all.
  const joined = lines.join('\n');
  if (encodeURIComponent(joined).length + fixedOverheadEncodedLen <= maxUri) return lines;
  // Otherwise: progressively peel from the tail until we fit, leaving room
  // for the "... and N more" sentinel.
  const out = lines.slice();
  while (out.length > 1){
    const trimmed = out.slice();
    const more = lines.length - trimmed.length + 1; // +1 because we'll drop one more
    trimmed.pop();
    const tail = trimmed.length < lines.length ? '\n... and ' + (lines.length - trimmed.length) + ' more' : '';
    const candidate = trimmed.join('\n') + tail;
    if (encodeURIComponent(candidate).length + fixedOverheadEncodedLen <= maxUri){
      return [...trimmed, '... and ' + (lines.length - trimmed.length) + ' more'];
    }
    out.pop();
  }
  return out;
}

export function mailtoListURL(title, ingredients){
  const subject = (title || 'Shopping list') + ' \u2014 Dinner Tonight';
  const lines = ingredientsAsLines(ingredients);
  // mailto: URIs over ~2000 chars get clipped by mail clients (Gmail/Apple Mail
  // both cut around 2000–2048). Reserve overhead for "mailto:?subject=&body=" +
  // encoded subject.
  const subjectEnc = encodeURIComponent(subject);
  const overhead = 'mailto:?subject=&body='.length + subjectEnc.length;
  const safeLines = truncateForUri(lines, 1900, overhead);
  const body = safeLines.join('\n');
  return 'mailto:?subject=' + subjectEnc + '&body=' + encodeURIComponent(body);
}

// SMS bridge — same idea, lands directly in iMessage so user can long-press to
// add to Reminders or forward to themselves.
export function smsListURL(title, ingredients){
  // iOS Messages silently truncates SMS-scheme URIs around ~280 chars after
  // encoding. We aim conservatively for 240 chars body so the deeplink fires.
  const header = (title ? title + ':\n' : '');
  const lines = ingredientsAsLines(ingredients);
  const overhead = 'sms:?body='.length + encodeURIComponent(header).length;
  const safeLines = truncateForUri(lines, 240, overhead);
  const body = header + safeLines.join('\n');
  return 'sms:?body=' + encodeURIComponent(body);
}

// ─── Long Island grocery search URLs ─────────────────────────────────────────
// All three deliver to Nassau & Suffolk counties. No public cart-add API exists
// for small sites; the best we can do without an account is open the retailer's
// product search for the combined ingredient query.

export function freshDirectSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 8).join(' ');
  return 'https://www.freshdirect.com/search?search=' + encodeURIComponent(q);
}

// Stop & Shop / Peapod: their multi-item product-search silently drops items
// past ~6 tokens. We still expose the bulk URL for the chip-row, but the
// recommended UX is the per-ingredient list page (api/stop-and-shop.js).
export function stopAndShopSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 3).join(' ');
  return 'https://stopandshop.com/product-search/' + encodeURIComponent(q);
}
export function stopAndShopItemSearchURL(name){
  return 'https://stopandshop.com/product-search/' + encodeURIComponent(canonicalIngredientName(name || ''));
}

// ShopRite From Home: same story — truncates silently. Keep bulk for the
// chip-row, expose per-item for the surgical list page.
export function shopRiteSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 3).join(' ');
  return 'https://www.shoprite.com/sm/planning/rsid/3000/results?q='
    + encodeURIComponent(q);
}
export function shopRiteItemSearchURL(name){
  return 'https://www.shoprite.com/sm/planning/rsid/3000/results?q='
    + encodeURIComponent(canonicalIngredientName(name || ''));
}

// ─── Amazon Fresh & Walmart search URLs (added 2026-06-26 per user request) ──
// User specifically asked: "Investigate Amazon Fresh / Whole Foods" and
// "Walmart Grocery". Verdict from research:
//   - Amazon /gp/aws/cart/add.html?ASIN.1=... cart-add URL still works, BUT
//     requires accurate per-product ASIN lookup (no public Product Advertising
//     API access since the May 2026 PA-API shutdown for non-affiliates), and
//     grocery SKUs rotate ~10-20%/yr. A static ASIN map would rot quickly and
//     silently produce broken add-to-cart links — bad UX.
//   - Walmart /sc/cart/addToCart requires an Impact Radius affiliate publisher
//     UUID (open signup but gated, ~2 day approval).
// The honest universally-working pattern for both retailers is the search-
// prefill URL: user lands signed-in to their account in a new tab with the
// ingredient names already searched, taps add on each. No auth on our end.

// Amazon Fresh search URL (i=amazonfresh scopes to Fresh delivery; Whole
// Foods items appear automatically when the user is in a WF service zone).
export function amazonFreshSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 8).join(' ');
  return 'https://www.amazon.com/s?i=grocery&k=' + encodeURIComponent(q);
}

// Walmart Grocery search URL. catId=976759 scopes to the Food/Grocery dept.
export function walmartSearchURL(ingredients){
  const q = ingredients.map(i => canonicalIngredientName(i.name)).slice(0, 8).join(' ');
  return 'https://www.walmart.com/search?q=' + encodeURIComponent(q) + '&catId=976759';
}

// Per-item search URLs (used for the "Find →" pills on each row of the
// shopping list page so the shopper can drill into a single ingredient).
export function amazonFreshItemSearchURL(name){
  return 'https://www.amazon.com/s?i=grocery&k=' + encodeURIComponent(canonicalIngredientName(name || ''));
}
export function walmartItemSearchURL(name){
  return 'https://www.walmart.com/search?q=' + encodeURIComponent(canonicalIngredientName(name || '')) + '&catId=976759';
}
export function instacartItemSearchURL(name){
  return 'https://www.instacart.com/store/s?k=' + encodeURIComponent(canonicalIngredientName(name || ''));
}
export function freshDirectItemSearchURL(name){
  return 'https://www.freshdirect.com/srch.jsp?searchParams=' + encodeURIComponent(canonicalIngredientName(name || ''));
}
