// GET /api/store?service=<svc>[&recipe=<slug>|&menu=today[&date=YYYY-MM-DD]]
//
// Unified store-specific shopping endpoint. Replaces the previous five
// store-specific files (amazon-cart.js, walmart.js, freshdirect.js,
// stop-and-shop.js, shoprite.js) so the project stays under the Vercel
// Hobby plan's 12-lambda ceiling.
//
// Supported services:
//   amazon       → HTML landing page with per-ingredient Amazon Fresh search
//                  buttons + "Open all in tabs" fanout.
//   walmart      → 302 to Walmart cart-prefill URL (or search fallback).
//                  ?format=json returns { url, source, matched, unmatched }.
//   freshdirect  → HTML list page with FreshDirect per-item "Find →" links.
//   stopandshop  → HTML list page with Stop & Shop per-item "Find →" links.
//   shoprite     → HTML list page with ShopRite per-item "Find →" links.
//
// Old paths still resolve via rewrites in vercel.json:
//   /api/amazon-cart    → /api/store?service=amazon
//   /api/walmart        → /api/store?service=walmart
//   /api/freshdirect    → /api/store?service=freshdirect
//   /api/stop-and-shop  → /api/store?service=stopandshop
//   /api/shoprite       → /api/store?service=shoprite

import {
  todaysMenu, menuForDateString, findRecipeBySlug,
  ingredientsForRecipe, ingredientsForMenu,
  freshDirectSearchURL, freshDirectItemSearchURL,
  stopAndShopSearchURL, stopAndShopItemSearchURL,
  shopRiteSearchURL, shopRiteItemSearchURL
} from '../grocery.js';
import {
  buildAmazonPlan, amazonItemSearchURL, amazonBulkSearchURL,
  coverageStats
} from '../amazon.js';
import { buildWalmartCart, walmartSearchURL } from '../walmart.js';
import { findRestaurantBySlug, restaurantAsRecipe } from '../restaurants.js';

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// -------------------- Amazon (HTML landing page) --------------------

function renderAmazonPage(title, plan, site){
  const rows = plan.items.map((it, idx) => {
    const search = escapeHtml(it.searchUrl);
    const safeName = escapeHtml(it.name);
    return `<li>
      <label><input type="checkbox" class="cb" data-i="${idx}" checked>
        <span class="name">${safeName}</span>
      </label>
      <a class="find" href="${search}" target="_blank" rel="noopener" data-i="${idx}">Search &amp; Add &rarr;</a>
    </li>`;
  }).join('');

  const itemSearchURLsJSON = JSON.stringify(plan.items.map(i => i.searchUrl));
  const bulkUrl = escapeHtml(plan.freshSearchUrl);

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} - Amazon - Dinner Tonight</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px;min-height:100vh}
  .wrap{max-width:580px;margin:0 auto}
  .back{display:inline-block;color:#b3a98f;text-decoration:none;font-size:13px;margin-bottom:18px}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#ff9900;margin-bottom:8px}
  h1{font-weight:normal;font-size:28px;margin-bottom:6px;letter-spacing:.04em}
  .sub{color:#b3a98f;font-size:14px;font-style:italic;margin-bottom:20px}
  .card{background:#1f1c15;border:1px solid #3a3527;border-radius:14px;padding:22px 22px 14px;box-shadow:0 18px 50px rgba(0,0,0,.45);margin-bottom:14px}
  .card h2{font-size:14px;letter-spacing:.18em;text-transform:uppercase;color:#c9a14a;font-weight:normal;margin-bottom:12px}
  ul{list-style:none}
  li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 4px;border-bottom:1px solid #2b2618;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14.5px}
  li:last-child{border-bottom:none}
  label{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;flex-wrap:wrap}
  input[type=checkbox]{width:17px;height:17px;accent-color:#ff9900}
  .name{color:#f3ead6;font-weight:600}
  .find{color:#16140f;background:#ff9900;text-decoration:none;font-size:12px;padding:6px 12px;border:1px solid #ff9900;border-radius:999px;transition:.15s;flex-shrink:0;font-weight:700}
  .find:hover{background:#febd69;border-color:#febd69}
  .actions{margin-top:8px;display:flex;flex-direction:column;gap:10px}
  .btn{display:block;text-align:center;background:#ff9900;color:#0f1111;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:.03em;transition:.15s;border:none;cursor:pointer}
  .btn:hover{background:#febd69}
  .btn.ghost{background:transparent;color:#f3ead6;border:1px solid #3a3527}
  .btn.ghost:hover{border-color:#ff9900;color:#ff9900}
  .note{color:#8a7c5c;font-size:12px;margin-top:14px;text-align:center;font-style:italic;line-height:1.5}
  .how{background:#1a1810;border-left:3px solid #ff9900;padding:14px 16px;margin-bottom:14px;border-radius:6px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;color:#c4b89c;line-height:1.55}
  .how b{color:#ff9900}
</style>
</head><body>
<div class="wrap">
  <a class="back" href="${escapeHtml(site)}">&larr; Back to Dinner Tonight</a>
  <div class="eyebrow">Amazon Grocery &middot; Whole Foods</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Tap any ingredient to open it on Amazon and add to cart.</div>

  <div class="how">
    <b>How this works:</b> Amazon's direct cart-add URL was retired in 2026, so we open a fresh Amazon search for each ingredient. On each search results page tap the yellow <b>Add to cart</b> button on whichever brand looks right. Two taps per ingredient, no hand-entered ASINs that can go stale.
  </div>

  <div class="card">
    <h2>Ingredients (${plan.items.length})</h2>
    <ul>${rows}</ul>
  </div>

  <div class="actions">
    <button class="btn" id="openAllBtn">Open all ${plan.items.length} in tabs</button>
    <a class="btn ghost" href="${bulkUrl}" target="_blank" rel="noopener">Or: one combined Amazon search</a>
    <button class="btn ghost" id="copyBtn">Copy full list</button>
    <a class="btn ghost" href="${escapeHtml(site)}">Back to Dinner Tonight</a>
  </div>
  <div class="note">If "Open all in tabs" is blocked, allow pop-ups for dinner-tonight-daily.vercel.app. Pantry staples (salt, pepper, water) aren't included.</div>
</div>
<script>
var URLS = ${itemSearchURLsJSON};
document.getElementById('openAllBtn').addEventListener('click', function(){
  var checks = Array.from(document.querySelectorAll('.cb'));
  var picked = checks.filter(function(c){ return c.checked; }).map(function(c){ return URLS[+c.dataset.i]; });
  picked.forEach(function(u){ window.open(u, '_blank', 'noopener'); });
});
document.getElementById('copyBtn').addEventListener('click', function(){
  var items = Array.from(document.querySelectorAll('li .name')).map(function(n){ return n.textContent.trim(); }).join('\\n');
  navigator.clipboard.writeText(items).then(function(){ alert('Shopping list copied to clipboard.'); });
});
</script>
</body></html>`;
}

// -------------------- Generic per-store list page (FD / S&S / SR) --------------------

function renderGenericStorePage({ brand, accent, emoji, itemSearchFn, title, ingredients, bulkUrl, site }){
  const rows = ingredients.map(it => {
    const m = it.measurements && it.measurements[0];
    const qty = m ? (Math.round(m.quantity * 100) / 100) + (m.unit && m.unit !== 'each' ? ' ' + m.unit : '') : '';
    const fd = itemSearchFn(it.name);
    return `<li>
      <label><input type="checkbox" checked>
        <span class="qty">${escapeHtml(qty)}</span>
        <span class="name">${escapeHtml(it.name)}</span>
      </label>
      <a class="find" href="${fd}" target="_blank" rel="noopener" title="Find on ${escapeHtml(brand)}">Find →</a>
    </li>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — ${escapeHtml(brand)} · Dinner Tonight</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px;min-height:100vh}
  .wrap{max-width:560px;margin:0 auto}
  .back{display:inline-block;color:#b3a98f;text-decoration:none;font-size:13px;margin-bottom:18px}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:${accent};margin-bottom:8px}
  h1{font-weight:normal;font-size:28px;margin-bottom:6px;letter-spacing:.04em}
  .sub{color:#b3a98f;font-size:14px;margin-bottom:22px}
  .bulk{display:block;background:${accent};color:#0a0a0a;text-decoration:none;padding:16px;border-radius:14px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:18px}
  ul{list-style:none;padding:0;margin:0 0 18px 0}
  li{display:flex;align-items:center;justify-content:space-between;background:#1f1c15;border:1px solid #2c281e;border-radius:10px;padding:10px 12px;margin-bottom:8px}
  label{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer}
  .qty{color:#b3a98f;font-size:13px;min-width:54px;display:inline-block}
  .name{font-size:15px}
  .find{font-size:13px;color:${accent};text-decoration:none;border:1px solid ${accent};padding:4px 10px;border-radius:6px}
  .note{color:#b3a98f;font-size:12px;line-height:1.5;text-align:center;margin-top:10px}
</style></head><body><div class="wrap">
  <a class="back" href="${site}">← Back to tonight's menu</a>
  <div class="eyebrow">${escapeHtml(brand)}</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Pantry staples excluded. Tap each "Find →" to drop into a single-item search — multi-item search silently truncates on ${escapeHtml(brand)}.</div>
  <a class="bulk" href="${bulkUrl}" target="_blank" rel="noopener">${emoji} Open ${escapeHtml(brand)} search for all items</a>
  <ul>${rows}</ul>
  <div class="note">${escapeHtml(brand)} doesn't expose a public cart-add API, so this page is search-driven. Signed-in shoppers can add each item with one tap.</div>
</div></body></html>`;
}

// -------------------- Per-service configs (FD / S&S / SR) --------------------

const GENERIC_STORES = {
  freshdirect: {
    brand: 'FreshDirect',
    accent: '#7cc24a',
    emoji: '🥬',
    bulkFn: freshDirectSearchURL,
    itemFn: freshDirectItemSearchURL
  },
  stopandshop: {
    brand: 'Stop & Shop',
    accent: '#e21a23',
    emoji: '🛒',
    bulkFn: stopAndShopSearchURL,
    itemFn: stopAndShopItemSearchURL
  },
  shoprite: {
    brand: 'ShopRite',
    accent: '#d6332b',
    emoji: '🛒',
    bulkFn: shopRiteSearchURL,
    itemFn: shopRiteItemSearchURL
  }
};

// -------------------- Main handler --------------------

function resolveTitleAndIngredients(q){
  // Long Island restaurant copycat recipes live in restaurants.js, not the
  // main recipes.js catalog. They reach this endpoint via ?restaurant=<slug>.
  const restaurantSlug = (q.restaurant || '').toString();
  if (restaurantSlug){
    const raw = findRestaurantBySlug(restaurantSlug);
    if (!raw) return { error: 'Restaurant not found' };
    const r = restaurantAsRecipe(raw);
    return { title: r.title, ingredients: ingredientsForRecipe(r) };
  }
  const slug = (q.recipe || '').toString();
  if (slug){
    const r = findRecipeBySlug(slug);
    if (!r) return { error:'Recipe not found' };
    return { title: r.title, ingredients: ingredientsForRecipe(r) };
  }
  const dateStr = (q.date || '').toString();
  const m = dateStr ? menuForDateString(dateStr) : todaysMenu();
  return {
    title: "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses'),
    ingredients: ingredientsForMenu(m)
  };
}

export default async function handler(req, res){
  try {
    const site = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
    const q = req.query || {};
    const service = (q.service || '').toString().toLowerCase();
    const format = (q.format || '').toString().toLowerCase();
    const redirect = (q.redirect || '').toString().toLowerCase();

    if (!service){
      return res.status(400).json({
        ok: false,
        error: 'Missing service parameter. Valid: amazon|walmart|freshdirect|stopandshop|shoprite'
      });
    }

    const resolved = resolveTitleAndIngredients(q);
    if (resolved.error){
      return res.status(404).json({ ok:false, error: resolved.error });
    }
    const { title, ingredients } = resolved;

    // ----- Amazon: HTML landing page (or JSON) -----
    if (service === 'amazon' || service === 'amazon-cart' || service === 'amazonfresh'){
      const plan = buildAmazonPlan(ingredients);
      if (format === 'json'){
        return res.status(200).json({
          ok: true,
          title,
          ingredients,
          plan,
          coverage: coverageStats()
        });
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).send(renderAmazonPage(title, plan, site));
    }

    // ----- Walmart: 302 redirect by default (or JSON) -----
    if (service === 'walmart'){
      const cart = buildWalmartCart(ingredients);
      if (format === 'json'){
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return res.status(200).json({
          ok: true,
          url: cart.url,
          source: cart.source,
          title,
          matched: cart.matched,
          unmatched: cart.unmatched,
          searchFallbackUrl: walmartSearchURL(ingredients)
        });
      }
      res.setHeader('Cache-Control', 'no-store');
      res.writeHead(302, { Location: cart.url });
      return res.end();
    }

    // ----- Generic per-store HTML page (FD / S&S / SR) -----
    const cfg = GENERIC_STORES[service]
      || (service === 'stop-and-shop' ? GENERIC_STORES.stopandshop : null);
    if (cfg){
      const bulkUrl = cfg.bulkFn(ingredients);
      if (format === 'json'){
        res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return res.status(200).json({
          ok: true,
          title,
          ingredients,
          url: bulkUrl,
          items: ingredients.map(it => ({
            name: it.name,
            url: cfg.itemFn(it.name)
          }))
        });
      }
      if (redirect === 'bulk' || redirect === 'cart'){
        res.setHeader('Location', bulkUrl);
        return res.status(302).end();
      }
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).send(renderGenericStorePage({
        brand: cfg.brand,
        accent: cfg.accent,
        emoji: cfg.emoji,
        itemSearchFn: cfg.itemFn,
        title, ingredients, bulkUrl, site
      }));
    }

    return res.status(400).json({
      ok: false,
      error: 'Unknown service. Valid: amazon|walmart|freshdirect|stopandshop|shoprite'
    });
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
