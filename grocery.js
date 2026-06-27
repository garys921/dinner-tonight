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
  slice: 'each', slices: 'each', bunch: 'bunch'
};

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

export function parseIngredient(raw){
  if (!raw) return null;
  let s = String(raw).trim();
  if (/^optional/i.test(s)) return null;
  s = s.replace(/,\s*(rinsed|drained|peeled|halved|chopped|sliced|diced|to taste|optional).*$/i, '');

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

  name = name.replace(NOISE, '').replace(/\s+/g, ' ').replace(/^\s*-\s*/, '').trim();
  if (name.includes(',')) name = name.split(',')[0].trim();
  if (isPantryStaple(name)) return null;
  if (name.length < 2) return null;

  return {
    name: name.replace(/^\w/, c => c.toUpperCase()),
    display_text: raw,
    measurements: quantity ? [{ quantity, unit: unit || 'each' }] : [{ quantity: 1, unit: 'each' }]
  };
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
  return (r.ing || []).map(parseIngredient).filter(Boolean);
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
  const q = ingredients.map(i => i.name).slice(0, 8).join(' ');
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
export function mailtoListURL(title, ingredients){
  const subject = (title || 'Shopping list') + ' — Dinner Tonight';
  const body = ingredientsAsLines(ingredients).join('\n');
  return 'mailto:?subject=' + encodeURIComponent(subject)
    + '&body=' + encodeURIComponent(body);
}

// SMS bridge — same idea, lands directly in iMessage so user can long-press to
// add to Reminders or forward to themselves.
export function smsListURL(title, ingredients){
  const body = (title ? title + ':\n' : '') + ingredientsAsLines(ingredients).join('\n');
  return 'sms:?body=' + encodeURIComponent(body);
}

// ─── Long Island grocery search URLs ─────────────────────────────────────────
// All three deliver to Nassau & Suffolk counties. No public cart-add API exists
// for small sites; the best we can do without an account is open the retailer's
// product search for the combined ingredient query.

export function freshDirectSearchURL(ingredients){
  const q = ingredients.map(i => i.name).slice(0, 8).join(' ');
  return 'https://www.freshdirect.com/search?search=' + encodeURIComponent(q);
}

export function stopAndShopSearchURL(ingredients){
  // Stop & Shop / Peapod use this product-search path; for multi-item queries
  // the user lands on a results page they can shop from.
  const q = ingredients.map(i => i.name).slice(0, 6).join(' ');
  return 'https://stopandshop.com/product-search/' + encodeURIComponent(q);
}

export function shopRiteSearchURL(ingredients){
  const q = ingredients.map(i => i.name).slice(0, 6).join(' ');
  return 'https://www.shoprite.com/sm/planning/rsid/3000/results?q='
    + encodeURIComponent(q);
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
  const q = ingredients.map(i => i.name).slice(0, 8).join(' ');
  return 'https://www.amazon.com/s?i=amazonfresh&k=' + encodeURIComponent(q);
}

// Walmart Grocery search URL. catId=976759 scopes to the Food/Grocery dept.
export function walmartSearchURL(ingredients){
  const q = ingredients.map(i => i.name).slice(0, 8).join(' ');
  return 'https://www.walmart.com/search?q=' + encodeURIComponent(q) + '&catId=976759';
}

// Per-item search URLs (used for the "Find →" pills on each row of the
// shopping list page so the shopper can drill into a single ingredient).
export function amazonFreshItemSearchURL(name){
  return 'https://www.amazon.com/s?i=amazonfresh&k=' + encodeURIComponent(String(name || ''));
}
export function walmartItemSearchURL(name){
  return 'https://www.walmart.com/search?q=' + encodeURIComponent(String(name || '')) + '&catId=976759';
}
export function instacartItemSearchURL(name){
  return 'https://www.instacart.com/store/s?k=' + encodeURIComponent(String(name || ''));
}
export function freshDirectItemSearchURL(name){
  return 'https://www.freshdirect.com/srch.jsp?searchParams=' + encodeURIComponent(String(name || ''));
}
