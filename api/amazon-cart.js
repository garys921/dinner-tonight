// GET /api/amazon-cart?recipe=<slug>   → Amazon shopping landing page (single recipe)
// GET /api/amazon-cart?menu=today      → Amazon shopping landing page (full menu)
// GET /api/amazon-cart?menu=today&format=json  → JSON
//
// The page shows one row per ingredient with a tap-to-search button that
// opens Amazon grocery search in a new tab. From the search page Gary taps
// the "Add to cart" button right on the result tile. There's also an "Open
// all in tabs" button at the top that fan-outs the whole list at once.

import { todaysMenu, findRecipeBySlug, menuForDateString } from '../grocery.js';
import {
  ingredientsForRecipe, ingredientsForMenu,
  buildAmazonPlan, amazonItemSearchURL, amazonBulkSearchURL,
  coverageStats
} from '../amazon.js';

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderListPage(title, plan, ingredients, site){
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

export default async function handler(req, res){
  try {
    const site = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
    const q = req.query || {};
    const slug = (q.recipe || '').toString();
    const wantMenu = (q.menu || '').toString();
    const format = (q.format || '').toString().toLowerCase();

    let title, ingredients;
    if (slug){
      const r = findRecipeBySlug(slug);
      if (!r) return res.status(404).json({ ok:false, error:'Recipe not found' });
      title = r.title;
      ingredients = ingredientsForRecipe(r);
    } else {
      const dateStr = (q.date || '').toString();
      const m = dateStr && menuForDateString ? menuForDateString(dateStr) : todaysMenu();
      title = "Tonight's Dinner - " + (m.main && m.main.title || 'Four courses');
      ingredients = ingredientsForMenu(m);
    }

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
    return res.status(200).send(renderListPage(title, plan, ingredients, site));
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
