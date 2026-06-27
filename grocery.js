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
