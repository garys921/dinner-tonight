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
import { findRestaurantBySlug, restaurantAsRecipe } from '../restaurants.js';
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

  // Store picker config: each entry maps to a primary "go" button at the bottom
  // of the list. Default tab is Amazon Fresh (most universal Long Island option).
  const stores = [
    { id:'amazon',      label:'Amazon Fresh', short:'Amazon', accent:'#ff9900', dark:'#0f1111', url: bridges.amazon },
    { id:'freshdirect', label:'FreshDirect',  short:'FreshDirect', accent:'#e8462b', dark:'#fff', url: bridges.freshdirect },
    { id:'walmart',     label:'Walmart',      short:'Walmart', accent:'#0071dc', dark:'#fff', url: bridges.walmart },
    { id:'stopandshop', label:'Stop & Shop',  short:'Stop & Shop', accent:'#cc0000', dark:'#fff', url: bridges.stopandshop },
    { id:'shoprite',    label:'ShopRite',     short:'ShopRite', accent:'#dd0000', dark:'#fff', url: bridges.shoprite },
    { id:'instacart',   label:'Instacart',    short:'Instacart', accent:'#43a047', dark:'#fff', url: bridges.instacart },
    { id:'bring',       label:'Bring! list',  short:'Bring!', accent:'#d04a02', dark:'#fff', url: bridges.bring },
    { id:'plain',       label:'Plain text',   short:'Plain list', accent:'#c9a14a', dark:'#221d10', url: '#print' }
  ];
  const storeTabs = stores.map((st, i) => `<button class="store-tab${i===0?' active':''}" data-store="${st.id}" data-url="${escapeHtml(st.url)}" data-accent="${st.accent}" data-dark="${st.dark}" data-label="${escapeHtml(st.label)}">${escapeHtml(st.short)}</button>`).join('');

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — shopping list · Dinner Tonight</title>
<meta name="theme-color" content="#16140f">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E%3Crect%20width='32'%20height='32'%20rx='6'%20fill='%2316140f'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='6.5'%20fill='%23c9a14a'/%3E%3C/svg%3E">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#16140f;color:#f3ead6;font-family:Georgia,'Times New Roman',serif;padding:32px 18px 60px;min-height:100vh;-webkit-font-smoothing:antialiased}
  .wrap{max-width:620px;margin:0 auto}
  .back{display:inline-block;color:#b3a98f;text-decoration:none;font-size:13px;margin-bottom:18px;transition:.15s}
  .back:hover{color:#e3c987}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#c9a14a;margin-bottom:8px}
  h1{font-weight:normal;font-size:30px;margin-bottom:6px;letter-spacing:.04em;line-height:1.18}
  .sub{color:#b3a98f;font-size:14px;font-style:italic;margin-bottom:24px;line-height:1.5}

  /* Store picker — horizontal scrollable segmented control */
  .picker-card{background:#1f1c15;border:1px solid #3a3527;border-radius:14px;padding:14px;margin-bottom:18px;box-shadow:0 8px 24px rgba(0,0,0,.3)}
  .picker-label{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#8a7c5c;margin-bottom:10px;font-family:'Helvetica Neue',Arial,sans-serif;text-align:center}
  .store-tabs{display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:4px;scrollbar-width:thin;scrollbar-color:#3a3527 transparent}
  .store-tabs::-webkit-scrollbar{height:6px}
  .store-tabs::-webkit-scrollbar-thumb{background:#3a3527;border-radius:3px}
  .store-tab{flex:0 0 auto;background:#15130e;border:1px solid #3a3527;color:#b3a98f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:.02em;padding:9px 16px;border-radius:999px;cursor:pointer;transition:.15s;white-space:nowrap;min-height:38px}
  .store-tab:hover{color:#f3ead6;border-color:#5a4f33}
  .store-tab.active{background:#c9a14a;color:#221d10;border-color:#e3c987;box-shadow:0 4px 12px rgba(201,161,74,.25)}

  /* Ingredient list */
  .card{background:#1f1c15;border:1px solid #3a3527;border-radius:14px;padding:22px 22px 14px;box-shadow:0 18px 50px rgba(0,0,0,.45)}
  ul{list-style:none}
  li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 4px;border-bottom:1px solid #2b2618;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14.5px}
  li:last-child{border-bottom:none}
  li:has(input:not(:checked)) .qty,
  li:has(input:not(:checked)) .name{opacity:.4;text-decoration:line-through}
  label{display:flex;align-items:center;gap:10px;flex:1;cursor:pointer;min-height:32px}
  input[type=checkbox]{width:18px;height:18px;accent-color:#c9a14a;cursor:pointer;flex-shrink:0}
  .qty{color:#c9a14a;font-weight:600;min-width:60px;transition:.15s}
  .name{color:#f3ead6;transition:.15s}
  .find-row{display:flex;gap:4px;flex-shrink:0}
  .find{color:#b3a98f;text-decoration:none;font-size:10px;font-weight:600;letter-spacing:.04em;padding:5px 7px;min-width:32px;text-align:center;border:1px solid #3a3527;border-radius:6px;transition:.15s}
  .find.fd:hover{background:#e8462b;color:#fff;border-color:#e8462b}
  .find.amzn:hover{background:#ff9900;color:#0f1111;border-color:#ff9900}
  .find.wmt:hover{background:#0071dc;color:#fff;border-color:#0071dc}
  .find.ic:hover{background:#43a047;color:#fff;border-color:#43a047}

  /* Primary CTA — re-renders to match the active store tab */
  .order-cta-wrap{margin-top:20px;display:flex;flex-direction:column;gap:10px}
  .order-cta{display:flex;align-items:center;justify-content:center;gap:10px;background:#c9a14a;color:#221d10;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:15px;letter-spacing:.02em;padding:16px 22px;border:1px solid #e3c987;border-radius:14px;text-decoration:none;transition:.18s ease;min-height:54px;box-shadow:0 6px 18px rgba(201,161,74,.28),inset 0 1px 0 rgba(255,255,255,.18);text-align:center}
  .order-cta:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(201,161,74,.4),inset 0 1px 0 rgba(255,255,255,.22)}
  .order-cta:active{transform:translateY(0)}
  .order-cta.disabled{pointer-events:none;opacity:.55}
  .btn-row{display:flex;gap:10px;flex-wrap:wrap}
  .btn-row .btn-sm{flex:1;display:flex;align-items:center;justify-content:center;background:transparent;color:#b3a98f;font-family:'Helvetica Neue',Arial,sans-serif;font-size:13px;font-weight:600;padding:11px 16px;border:1px solid #3a3527;border-radius:12px;cursor:pointer;transition:.15s;text-decoration:none;min-height:42px}
  .btn-row .btn-sm:hover{border-color:#c9a14a;color:#e3c987}

  .note{color:#8a7c5c;font-size:12px;margin-top:18px;text-align:center;font-style:italic}

  @media(max-width:520px){
    body{padding:22px 14px 50px}
    h1{font-size:24px}
    .card{padding:18px 16px 10px}
    .find-row{display:none}
    li{padding:14px 2px}
    .name{font-size:15px}
  }
  @media print{
    body{background:#fff;color:#000;padding:20px}
    .back,.picker-card,.order-cta-wrap,.note,.find-row{display:none !important}
    .card{background:#fff;border:none;box-shadow:none;padding:0}
    h1,.qty,.name{color:#000 !important}
    li{border-bottom:1px solid #ccc}
  }
</style>
</head><body>
<div class="wrap">
  <a class="back" href="${site}">← Back to Dinner Tonight</a>
  <div class="eyebrow">Shopping list</div>
  <h1>${escapeHtml(title)}</h1>
  <div class="sub">Pick a store, uncheck anything you already have, and tap the order button.</div>

  <div class="picker-card">
    <div class="picker-label">Order from</div>
    <div class="store-tabs" id="storeTabs">${storeTabs}</div>
  </div>

  <div class="card">
    <ul>${rows}</ul>
  </div>

  <div class="order-cta-wrap">
    <a class="order-cta" id="orderCta" href="${bridges.amazon}" target="_blank" rel="noopener">Order from <span id="orderCtaStore">Amazon Fresh</span> →</a>
    <div class="btn-row">
      <button class="btn-sm" onclick="copyList()">Copy list</button>
      <button class="btn-sm" onclick="window.print()">Print</button>
    </div>
  </div>
  <div class="note">Pantry staples (salt, pepper, oil, water) aren't included.</div>
</div>
<script>
function copyList(){
  var items = Array.from(document.querySelectorAll('li')).filter(function(li){
    var cb = li.querySelector('input[type=checkbox]');
    return cb && cb.checked;
  }).map(function(li){
    var q = (li.querySelector('.qty')||{}).textContent || '';
    var n = (li.querySelector('.name')||{}).textContent || '';
    return (q.trim() ? q.trim() + ' ' : '') + n.trim();
  }).join('\\n');
  if (!items){ alert('Check at least one item first.'); return; }
  navigator.clipboard.writeText(items).then(function(){
    var btn = document.querySelector('.btn-sm');
    if (btn){ var orig = btn.textContent; btn.textContent = 'Copied!'; setTimeout(function(){ btn.textContent = orig; }, 1400); }
  }, function(){ alert('Could not copy.'); });
}
// store picker — switch the primary CTA and accent color when a tab is clicked
(function(){
  var tabs = document.querySelectorAll('.store-tab');
  var cta = document.getElementById('orderCta');
  var ctaStore = document.getElementById('orderCtaStore');
  function activate(tab){
    tabs.forEach(function(t){ t.classList.remove('active'); });
    tab.classList.add('active');
    var url = tab.getAttribute('data-url');
    var label = tab.getAttribute('data-label');
    if (url === '#print'){
      cta.href = 'javascript:void(0)';
      cta.onclick = function(e){ e.preventDefault(); window.print(); };
      ctaStore.textContent = 'Print';
      cta.firstChild.textContent = 'Print the ';
    } else {
      cta.onclick = null;
      cta.href = url;
      ctaStore.textContent = label;
      cta.firstChild.textContent = 'Order from ';
    }
  }
  tabs.forEach(function(t){ t.addEventListener('click', function(){ activate(t); }); });
})();
</script>
</body></html>`;
}

// Resolve the recipe-card URL on this site that Bring! will scrape.
function recipeCardUrl(site, slug, wantMenu, dateStr){
  if (slug) return site + '/api/recipe-card?recipe=' + encodeURIComponent(slug);
  const dq = dateStr ? ('&date=' + encodeURIComponent(dateStr)) : '';
  return site + '/api/recipe-card?menu=today' + dq;
}

function bridgesFor(site, slug, wantMenu, title, ingredients, dateStr, restaurantSlug){
  return {
    bring:       bringDeeplinkURL(recipeCardUrl(site, slug, wantMenu, dateStr)),
    reminders:   mailtoListURL(title, ingredients),
    sms:         smsListURL(title, ingredients),
    freshdirect: freshDirectSearchURL(ingredients),
    stopandshop: stopAndShopSearchURL(ingredients),
    shoprite:    shopRiteSearchURL(ingredients),
    amazon:      (function(){
      // Amazon's bulk cart-add URL was retired in 2026 (returns "SORRY
      // something went wrong" and wipes the cart). Redirect to our own
      // landing page which fans out to per-ingredient Amazon search tabs.
      const dq = dateStr ? ('&date=' + encodeURIComponent(dateStr)) : '';
      if (restaurantSlug) return site + '/api/amazon-cart?restaurant=' + encodeURIComponent(restaurantSlug);
      if (slug) return site + '/api/amazon-cart?recipe=' + encodeURIComponent(slug);
      return site + '/api/amazon-cart?menu=today' + dq;
    })(),
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

    const restaurantSlug = (q.restaurant || '').toString();
    let title, ingredients, payload;
    if (restaurantSlug){
      // Long Island restaurant copycat — looked up from restaurants.js
      // (not the main recipes.js catalog).
      const raw = findRestaurantBySlug(restaurantSlug);
      if (!raw) return res.status(404).json({ ok:false, error:'Restaurant not found' });
      const r = restaurantAsRecipe(raw);
      title = r.title;
      ingredients = ingredientsForRecipe(r);
      payload = payloadForRecipe(r, site);
    } else if (slug){
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

    const bridges = bridgesFor(site, slug, wantMenu, title, ingredients, (q.date || '').toString(), restaurantSlug);

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
