// GET /api/amazon-cart?recipe=<slug>   → Amazon Fresh shopping page (single recipe)
// GET /api/amazon-cart?menu=today      → Amazon Fresh shopping page (full menu)
// GET /api/amazon-cart?menu=today&format=json  → JSON
// GET /api/amazon-cart?menu=today&redirect=cart → 302 straight to Amazon cart-add URL
//
// Behavior: renders a list page with one big "Add staples to Amazon cart"
// button (multi-item /gp/aws/cart/add.html URL) plus per-item Amazon Fresh
// search links for produce / dairy / meat we don't have ASINs for.

import { todaysMenu, findRecipeBySlug } from '../grocery.js';
import {
  ingredientsForRecipe, ingredientsForMenu,
  buildAmazonPlan, amazonFreshSearchURL, coverageStats
} from '../amazon.js';

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderListPage(title, plan, ingredients, site){
  const matchedRows = plan.matched.map(m => {
    const productLink = `https://www.amazon.com/dp/${m.asin}`;
    return `<li class="match">
      <label><input type="checkbox" checked>
        <span class="name">${escapeHtml(m.name)}</span>
        <span class="lbl">${escapeHtml(m.label)}</span>
      </label>
      <a class="find" href="${productLink}" target="_blank" rel="noopener">View →</a>
    </li>`;
  }).join('');

  const unmatchedRows = plan.unmatched.map(it => {
    const search = amazonFreshSearchURL(it.name);
    return `<li class="unmatch">
      <label><input type="checkbox" checked>
        <span class="name">${escapeHtml(it.name)}</span>
        <span class="lbl">Search Amazon Fresh</span>
      </label>
      <a class="find" href="${search}" target="_blank" rel="noopener">Find →</a>
    </li>`;
  }).join('');

  const cartHref = plan.cartUrl || plan.freshSearchUrl;
  const cartLabel = plan.cartUrl
    ? `🛒 Add ${plan.matched.length} item${plan.matched.length===1?'':'s'} to Amazon cart`
    : '🛒 Search ingredients on Amazon Fresh';
  const noteHtml = plan.cartUrl && plan.unmatched.length
    ? `<div class="note">Staples go straight to your cart. ${plan.unmatched.length} fresh item${plan.unmatched.length===1?'':'s'} below — tap "Find →" to add each from Amazon Fresh.</div>`
    : '<div class="note">Pantry staples (salt, pepper, oil, water) aren\'t included.</div>';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — Amazon Fresh · Dinner Tonight</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px;min-height:100vh}
  .wrap{max-width:560px;margin:0 auto}
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
  .name{color:#f3ead6;font-weight:600;min-width:130px}
  .lbl{color:#8a7c5c;font-size:12px;font-style:italic}
  .match .lbl{color:#9ab36a}
  .find{color:#b3a98f;text-decoration:none;font-size:12px;padding:4px 10px;border:1px solid #3a3527;border-radius:999px;transition:.15s;flex-shrink:0}
  .find:hover{color:#16140f;background:#ff9900;border-color:#ff9900}
  .actions{margin-top:8px;display:flex;flex-direction:column;gap:10px}
  .btn{display:block;text-align:center;background:#ff9900;color:#0f1111;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:.03em;transition:.15s}
  .btn:hover{background:#febd69}
  .btn.ghost{background:transparent;color:#f3ead6;border:1px solid #3a3527}
  .btn.ghost:hover{border-color:#ff9900;color:#ff9900}
  .note{color:#8a7c5c;font-size:12px;margin-top:14px;text-align:center;font-style:italic}
  .empty{color:#8a7c5c;font-style:italic;padding:8px 4px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px}
</style>
</head><body>
<div class="wrap">
  <a class="back" href="${site}">← Back to Dinner Tonight</a>
  <div class="eyebrow">Amazon Fresh · Whole Foods</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">One-click pantry staples — produce, dairy &amp; meat in Fresh search below.</div>

  ${plan.matched.length ? `
  <div class="card">
    <h2>Staples · in cart</h2>
    <ul>${matchedRows}</ul>
  </div>` : ''}

  ${plan.unmatched.length ? `
  <div class="card">
    <h2>Fresh · search on Amazon</h2>
    <ul>${unmatchedRows}</ul>
  </div>` : ''}

  <div class="actions">
    <a class="btn" href="${cartHref}" target="_blank" rel="noopener">${cartLabel}</a>
    <button class="btn ghost" onclick="copyList()">Copy full list</button>
    <a class="btn ghost" href="${site}">Back to Dinner Tonight</a>
  </div>
  ${noteHtml}
</div>
<script>
function copyList(){
  var items = Array.from(document.querySelectorAll('li')).map(function(li){
    return li.querySelector('.name').textContent.trim();
  }).join('\\n');
  navigator.clipboard.writeText(items).then(function(){
    alert('Shopping list copied to clipboard.');
  });
}
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
    const redirect = (q.redirect || '').toString().toLowerCase();

    let title, ingredients;
    if (slug){
      const r = findRecipeBySlug(slug);
      if (!r) return res.status(404).json({ ok:false, error:'Recipe not found' });
      title = r.title;
      ingredients = ingredientsForRecipe(r);
    } else {
      const m = todaysMenu();
      title = "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses');
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

    if (redirect === 'cart' && plan.cartUrl){
      res.setHeader('Location', plan.cartUrl);
      return res.status(302).end();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    return res.status(200).send(renderListPage(title, plan, ingredients, site));
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
