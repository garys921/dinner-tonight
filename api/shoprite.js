// GET /api/shoprite?recipe=<slug>            → ShopRite list page (single recipe)
// GET /api/shoprite?menu=today               → ShopRite list page (full menu)
// GET /api/shoprite?menu=today&date=YYYY-MM-DD → list page for that ET day
// GET /api/shoprite?menu=today&format=json   → JSON
// GET /api/shoprite?menu=today&redirect=bulk → 302 to bulk search URL
//
// Mirrors api/amazon-cart.js and api/walmart.js — standalone endpoint so
// the daily email and external integrations can deep-link ShopRite
// without going through /api/grocery?service=shoprite.
//
// ShopRite doesn't expose a public cart-add API, so the page surfaces:
//   • one big "Search all on ShopRite" button (their multi-token search)
//   • per-ingredient "Find →" pills that drop the shopper into a search for
//     just that one item (works much better for produce / proteins than
//     the multi-token query, which the QA agent saw silently truncate).
//
// Pantry staples (salt, pepper, oil, water) are skipped via the same
// isPantryStaple filter that ingredientsForRecipe / ingredientsForMenu use.

import {
  todaysMenu, menuForDateString, findRecipeBySlug,
  ingredientsForRecipe, ingredientsForMenu,
  shopRiteSearchURL, shopRiteItemSearchURL
} from '../grocery.js';

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderListPage(title, ingredients, bulkUrl, site){
  const rows = ingredients.map(it => {
    const m = it.measurements && it.measurements[0];
    const qty = m ? (Math.round(m.quantity * 100) / 100) + (m.unit && m.unit !== 'each' ? ' ' + m.unit : '') : '';
    const fd = shopRiteItemSearchURL(it.name);
    return `<li>
      <label><input type="checkbox" checked>
        <span class="qty">${escapeHtml(qty)}</span>
        <span class="name">${escapeHtml(it.name)}</span>
      </label>
      <a class="find" href="${fd}" target="_blank" rel="noopener" title="Find on ShopRite">Find →</a>
    </li>`;
  }).join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — ShopRite · Dinner Tonight</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px;min-height:100vh}
  .wrap{max-width:560px;margin:0 auto}
  .back{display:inline-block;color:#b3a98f;text-decoration:none;font-size:13px;margin-bottom:18px}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#d6332b;margin-bottom:8px}
  h1{font-weight:normal;font-size:28px;margin-bottom:6px;letter-spacing:.04em}
  .sub{color:#b3a98f;font-size:14px;margin-bottom:22px}
  .bulk{display:block;background:#d6332b;color:#0a0a0a;text-decoration:none;padding:16px;border-radius:14px;font-size:16px;font-weight:bold;text-align:center;margin-bottom:18px}
  ul{list-style:none;padding:0;margin:0 0 18px 0}
  li{display:flex;align-items:center;justify-content:space-between;background:#1f1c15;border:1px solid #2c281e;border-radius:10px;padding:10px 12px;margin-bottom:8px}
  label{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer}
  .qty{color:#b3a98f;font-size:13px;min-width:54px;display:inline-block}
  .name{font-size:15px}
  .find{font-size:13px;color:#d6332b;text-decoration:none;border:1px solid #d6332b;padding:4px 10px;border-radius:6px}
  .note{color:#b3a98f;font-size:12px;line-height:1.5;text-align:center;margin-top:10px}
</style></head><body><div class="wrap">
  <a class="back" href="${site}">← Back to tonight's menu</a>
  <div class="eyebrow">ShopRite</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Pantry staples excluded. Tap each "Find →" to drop into a single-item search — multi-item search silently truncates on ShopRite.</div>
  <a class="bulk" href="${bulkUrl}" target="_blank" rel="noopener">🛒 Open ShopRite search for all items</a>
  <ul>${rows}</ul>
  <div class="note">ShopRite doesn't expose a public cart-add API, so this page is search-driven. Signed-in shoppers can add each item with one tap.</div>
</div></body></html>`;
}

export default async function handler(req, res){
  try {
    const site = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
    const q = req.query || {};
    const slug = (q.recipe || '').toString();
    const wantMenu = (q.menu || '').toString();
    const format = (q.format || '').toString().toLowerCase();
    const redirect = (q.redirect || '').toString().toLowerCase();

    let title, ingredients;
    if (slug){
      const r = findRecipeBySlug(slug);
      if (!r) return res.status(404).json({ ok:false, error:'Recipe not found' });
      title = r.title;
      ingredients = ingredientsForRecipe(r);
    } else {
      const dateStr = (q && q.date) ? String(q.date) : '';
      const m = dateStr ? menuForDateString(dateStr) : todaysMenu();
      title = "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses');
      ingredients = ingredientsForMenu(m);
    }

    const bulkUrl = shopRiteSearchURL(ingredients);

    if (format === 'json'){
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).json({
        ok: true,
        title,
        ingredients,
        url: bulkUrl,
        items: ingredients.map(it => ({
          name: it.name,
          url: shopRiteItemSearchURL(it.name)
        }))
      });
    }

    if (redirect === 'bulk' || redirect === 'cart'){
      res.setHeader('Location', bulkUrl);
      return res.status(302).end();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    return res.status(200).send(renderListPage(title, ingredients, bulkUrl, site));
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
