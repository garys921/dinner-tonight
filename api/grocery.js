// GET /api/grocery?recipe=<slug>                  → Instacart shopping list page (default)
// GET /api/grocery?menu=today                     → Instacart link for tonight's 4-course menu
// GET /api/grocery?menu=today&format=json         → JSON {url, ingredients[]}
// GET /api/grocery?menu=today&view=list           → standalone HTML shopping list page
//
// New `service=` mode (added by shopping-list-bridges agent):
//   ?service=bring       → 302 to Bring! deeplink (sends ingredients to Bring! shopping list)
//   ?service=reminders   → 302 to a mailto: link prefilled with ingredients (Apple Reminders trick)
//   ?service=sms         → 302 to an sms: link with ingredients (iMessage → long-press → Reminders)
//   ?service=freshdirect → 302 to FreshDirect search for the ingredients (LI delivery)
//   ?service=stopandshop → 302 to Stop & Shop / Peapod search (LI delivery)
//   ?service=shoprite    → 302 to ShopRite From Home search (LI delivery)
//   ?service=amazon      → 302 to Amazon REAL cart-add URL (matched staples pre-staged; unmatched fall back to search)
//   ?service=walmart     → 302 to Walmart REAL cart-prefill (items pre-staged via affil.walmart.com)
//   ?service=instacart   → 302 to Instacart bulk search (multi-banner fallback)
// Each service also supports &format=json to return {url} without redirecting.

import { buildWalmartCart } from '../walmart.js';
import { buildAmazonPlan, amazonFreshBulkSearchURL } from '../amazon.js';
import {
  todaysMenu, menuForDateString, findRecipeBySlug,
  payloadForRecipe, payloadForMenu,
  ingredientsForRecipe, ingredientsForMenu,
  createInstacartRecipePage, instacartSearchURL,
  bringDeeplinkURL, mailtoListURL, smsListURL,
  freshDirectSearchURL, stopAndShopSearchURL, shopRiteSearchURL,
  amazonFreshSearchURL, walmartSearchURL,
  amazonFreshItemSearchURL, walmartItemSearchURL,
  instacartItemSearchURL, freshDirectItemSearchURL
} from '../grocery.js';

function escapeHtml(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderListPage(title, ingredients, instacartUrl, site, bridges){
  const rows = ingredients.map(it => {
    const m = it.measurements && it.measurements[0];
    const qty = m ? (Math.round(m.quantity * 100) / 100) + (m.unit && m.unit !== 'each' ? ' ' + m.unit : '') : '';
    const fd = freshDirectItemSearchURL(it.name);
    const af = amazonFreshItemSearchURL(it.name);
    const wm = walmartItemSearchURL(it.name);
    const ic = instacartItemSearchURL(it.name);
    return `<li>
      <label><input type="checkbox" checked>
        <span class="qty">${escapeHtml(qty)}</span>
        <span class="name">${escapeHtml(it.name)}</span>
      </label>
      <span class="find-row">
        <a class="find fd" href="${fd}" target="_blank" rel="noopener" title="Find on FreshDirect">FD</a>
        <a class="find amzn" href="${af}" target="_blank" rel="noopener" title="Find on Amazon Fresh">AF</a>
        <a class="find wmt" href="${wm}" target="_blank" rel="noopener" title="Find on Walmart">WM</a>
        <a class="find ic" href="${ic}" target="_blank" rel="noopener" title="Find on Instacart">IC</a>
      </span>
    </li>`;
  }).join('');
  const bridgeBtns = bridges ? `
    <div class="bridges">
      <div class="bridge-label">Search & shop at</div>
      <a class="chip retailer fd-c" href="${bridges.freshdirect}" target="_blank" rel="noopener" title="Long Island delivery">🥬 FreshDirect</a>
      <a class="chip retailer amzn-c" href="${bridges.amazon}" target="_blank" rel="noopener" title="Prime delivery — most US metros">📦 Amazon Fresh</a>
      <a class="chip retailer wmt-c" href="${bridges.walmart}" target="_blank" rel="noopener" title="Pickup + delivery nationwide">🛒 Walmart</a>
      <a class="chip retailer ic-c" href="${bridges.instacart}" target="_blank" rel="noopener" title="Multi-banner aggregator">🥕 Instacart</a>
      <a class="chip retailer ss-c" href="${bridges.stopandshop}" target="_blank" rel="noopener" title="Long Island">Stop &amp; Shop</a>
      <a class="chip retailer sr-c" href="${bridges.shoprite}" target="_blank" rel="noopener" title="Long Island">ShopRite</a>
      <div class="bridge-label" style="margin-top:14px">Or send list to</div>
      <a class="chip" href="${bridges.bring}" target="_blank" rel="noopener">Bring!</a>
      <a class="chip" href="${bridges.reminders}">Reminders / email</a>
      <a class="chip" href="${bridges.sms}">Text it to me</a>
    </div>` : '';
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — shopping list · Dinner Tonight</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px;min-height:100vh}
  .wrap{max-width:560px;margin:0 auto}
  .back{display:inline-block;color:#b3a98f;text-decoration:none;font-size:13px;margin-bottom:18px}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#c9a14a;margin-bottom:8px}
  h1{font-weight:normal;font-size:28px;margin-bottom:6px;letter-spacing:.04em}
  .sub{color:#b3a98f;font-size:14px;font-style:italic;margin-bottom:20px}
  .card{background:#1f1c15;border:1px solid #3a3527;border-radius:14px;padding:22px 22px 14px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
  ul{list-style:none}
  li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 4px;border-bottom:1px solid #2b2618;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14.5px}
  li:last-child{border-bottom:none}
  label{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer}
  input[type=checkbox]{width:17px;height:17px;accent-color:#c9a14a}
  .qty{color:#c9a14a;font-weight:600;min-width:60px}
  .name{color:#f3ead6}
  .find{color:#b3a98f;text-decoration:none;font-size:12px;padding:4px 10px;border:1px solid #3a3527;border-radius:999px;transition:.15s}
  .find:hover{color:#16140f;background:#e3c987;border-color:#e3c987}
  .actions{margin-top:24px;display:flex;flex-direction:column;gap:10px}
  .btn{display:block;text-align:center;background:#c9a14a;color:#221d10;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:999px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;letter-spacing:.03em;transition:.15s}
  .btn:hover{background:#e3c987}
  .btn.ghost{background:transparent;color:#f3ead6;border:1px solid #3a3527}
  .btn.ghost:hover{border-color:#e3c987;color:#e3c987}
  .bridges{margin-top:18px;padding-top:14px;border-top:1px solid #2b2618;display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-family:'Helvetica Neue',Arial,sans-serif}
  .bridge-label{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#8a7c5c;width:100%;margin-bottom:4px}
  .chip{font-size:12.5px;color:#f3ead6;background:#2b2618;border:1px solid #3a3527;padding:7px 12px;border-radius:999px;text-decoration:none;transition:.15s}
  .chip:hover{background:#3a3527;border-color:#c9a14a;color:#e3c987}
  .chip.retailer{font-weight:600}
  .chip.fd-c{background:rgba(232,70,43,.12);border-color:rgba(232,70,43,.45);color:#f3ead6}
  .chip.fd-c:hover{background:#e8462b;color:#fff;border-color:#e8462b}
  .chip.amzn-c{background:rgba(255,153,0,.12);border-color:rgba(255,153,0,.45);color:#f3ead6}
  .chip.amzn-c:hover{background:#ff9900;color:#0f1111;border-color:#ff9900}
  .chip.wmt-c{background:rgba(0,113,220,.14);border-color:rgba(0,113,220,.45);color:#f3ead6}
  .chip.wmt-c:hover{background:#0071dc;color:#fff;border-color:#0071dc}
  .chip.ic-c{background:rgba(67,160,71,.14);border-color:rgba(67,160,71,.45);color:#f3ead6}
  .chip.ic-c:hover{background:#43a047;color:#fff;border-color:#43a047}
  .chip.ss-c:hover{background:#cc0000;color:#fff;border-color:#cc0000}
  .chip.sr-c:hover{background:#dd0000;color:#fff;border-color:#dd0000}
  .find-row{display:flex;gap:4px;flex-shrink:0}
  .find-row .find{font-size:10px;font-weight:600;letter-spacing:.04em;padding:5px 7px;min-width:30px;text-align:center;border-radius:6px}
  .find-row .find.fd:hover{background:#e8462b;color:#fff;border-color:#e8462b}
  .find-row .find.amzn:hover{background:#ff9900;color:#0f1111;border-color:#ff9900}
  .find-row .find.wmt:hover{background:#0071dc;color:#fff;border-color:#0071dc}
  .find-row .find.ic:hover{background:#43a047;color:#fff;border-color:#43a047}
  .note{color:#8a7c5c;font-size:12px;margin-top:14px;text-align:center;font-style:italic}
</style>
</head><body>
<div class="wrap">
  <a class="back" href="${site}">← Back to Dinner Tonight</a>
  <div class="eyebrow">Shopping list</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Pick a delivery service below, or tap a per-item pill (FD/AF/WM/IC) to find one ingredient.</div>
  <div class="card">
    <ul>${rows}</ul>
    ${bridgeBtns}
  </div>
  <div class="actions">
    <a class="btn" href="${bridges.freshdirect}" target="_blank" rel="noopener">🥬 Send list to FreshDirect (Long Island)</a>
    <button class="btn ghost" onclick="copyList()">Copy list</button>
    <button class="btn ghost" onclick="window.print()">Print</button>
  </div>
  <div class="note">Pantry staples (salt, pepper, oil, water) aren't included.</div>
</div>
<script>
function copyList(){
  var items = Array.from(document.querySelectorAll('li')).map(function(li){
    var q = li.querySelector('.qty').textContent.trim();
    var n = li.querySelector('.name').textContent.trim();
    return (q ? q + ' ' : '') + n;
  }).join('\\n');
  navigator.clipboard.writeText(items).then(function(){
    alert('Shopping list copied to clipboard.');
  });
}
</script>
</body></html>`;
}

// Resolve the recipe-card URL on this site that Bring! will scrape.
function recipeCardUrl(site, slug, wantMenu, dateStr){
  if (slug) return site + '/api/recipe-card?recipe=' + encodeURIComponent(slug);
  const dq = dateStr ? ('&date=' + encodeURIComponent(dateStr)) : '';
  return site + '/api/recipe-card?menu=today' + dq;
}

function bridgesFor(site, slug, wantMenu, title, ingredients, dateStr){
  return {
    bring:       bringDeeplinkURL(recipeCardUrl(site, slug, wantMenu, dateStr)),
    reminders:   mailtoListURL(title, ingredients),
    sms:         smsListURL(title, ingredients),
    freshdirect: freshDirectSearchURL(ingredients),
    stopandshop: stopAndShopSearchURL(ingredients),
    shoprite:    shopRiteSearchURL(ingredients),
    amazon:      (function(){ const p = buildAmazonPlan(ingredients); return p.cartUrl || p.freshSearchUrl || amazonFreshBulkSearchURL(ingredients); })(),
    walmart:     buildWalmartCart(ingredients).url,
    instacart:   instacartSearchURL(ingredients)
  };
}

function resolveService(service, bridges){
  switch (service){
    case 'bring':       return bridges.bring;
    case 'reminders':   return bridges.reminders;
    case 'sms':         return bridges.sms;
    case 'freshdirect': return bridges.freshdirect;
    case 'stopandshop': return bridges.stopandshop;
    case 'shoprite':    return bridges.shoprite;
    case 'amazon':      return bridges.amazon;
    case 'amazonfresh': return bridges.amazon;
    case 'amazon-search': return amazonFreshSearchURL(ingredients);
    case 'amazon-page': return '/api/amazon-cart' + (slug ? ('?recipe=' + encodeURIComponent(slug)) : '?menu=today');
    case 'walmart':     return bridges.walmart;
    case 'instacart':   return bridges.instacart;
    default: return null;
  }
}

export default async function handler(req, res){
  try {
    const site = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
    const q = req.query || {};
    const slug = (q.recipe || '').toString();
    const wantMenu = (q.menu || '').toString();
    const format = (q.format || '').toString().toLowerCase();
    const view = (q.view || '').toString().toLowerCase();
    const service = (q.service || '').toString().toLowerCase();

    let title, ingredients, payload;
    if (slug){
      const r = findRecipeBySlug(slug);
      if (!r) return res.status(404).json({ ok:false, error:'Recipe not found' });
      title = r.title;
      ingredients = ingredientsForRecipe(r);
      payload = payloadForRecipe(r, site);
    } else {
      const dateStr = (q.date || '').toString();
      const m = dateStr ? menuForDateString(dateStr) : todaysMenu();
      title = "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses');
      ingredients = ingredientsForMenu(m);
      payload = payloadForMenu(m, site);
    }

    const bridges = bridgesFor(site, slug, wantMenu, title, ingredients, (q.date || '').toString());

    // service= bridge mode: short-circuit and redirect (or return JSON URL)
    if (service){
      const target = resolveService(service, bridges);
      if (!target){
        return res.status(400).json({
          ok:false, error:'Unknown service. Valid: bring|reminders|sms|freshdirect|stopandshop|shoprite|amazon|amazon-search|amazon-page|walmart|instacart'
        });
      }
      if (format === 'json'){
        return res.status(200).json({ ok:true, service, url: target, title, ingredients });
      }
      res.setHeader('Cache-Control', 'no-store');
      res.writeHead(302, { Location: target });
      return res.end();
    }

    // Default: Instacart flow (unchanged)
    let url = null, source = 'fallback';
    const apiKey = process.env.INSTACART_API_KEY;
    if (apiKey){
      try {
        url = await createInstacartRecipePage(payload, apiKey);
        source = 'instacart_recipe_api';
      } catch (e){
        console.error('Instacart API failed, using fallback:', e.message);
      }
    }
    if (!url) url = instacartSearchURL(ingredients);

    if (format === 'json'){
      return res.status(200).json({ ok:true, url, source, title, ingredients, bridges });
    }
    if (view === 'list'){
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).send(renderListPage(title, ingredients, url, site, bridges));
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderListPage(title, ingredients, url, site, bridges));
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
