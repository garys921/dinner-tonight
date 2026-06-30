// Usage dashboard — what people actually use. Aggregate, no PII.
//   GET /api/stats           → HTML dashboard
//   GET /api/stats?format=json → raw JSON
import { kv } from '@vercel/kv';

function top(obj, n){
  return Object.entries(obj || {}).map(([k,v]) => [k, Number(v)||0]).sort((a,b)=>b[1]-a[1]).slice(0, n);
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export default async function handler(req, res){
  try {
    const [recipe, search, feature, restaurant, day, visits] = await Promise.all([
      kv.hgetall('stat:recipe'), kv.hgetall('stat:search'), kv.hgetall('stat:feature'),
      kv.hgetall('stat:restaurant'), kv.hgetall('stat:day'), kv.get('stat:visits')
    ]);
    const data = {
      visits: Number(visits) || 0,
      topRecipes: top(recipe, 30),
      topSearches: top(search, 30),
      features: top(feature, 40),
      topRestaurants: top(restaurant, 25),
      byDay: Object.entries(day || {}).sort((a,b)=> a[0] < b[0] ? -1 : 1).slice(-30)
    };
    if ((req.query.format || '') === 'json') return res.status(200).json({ ok:true, ...data });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(render(data));
  } catch (e){
    return res.status(500).json({ ok:false, error: e.message });
  }
}

function barList(rows, accent){
  if (!rows.length) return '<p class="muted">No data yet — share the site and check back.</p>';
  const max = Math.max(...rows.map(r => r[1]), 1);
  return '<div class="bars">' + rows.map(([k,v]) =>
    `<div class="bar"><div class="bk">${esc(k)}</div><div class="bt"><div class="bf" style="width:${Math.round(v/max*100)}%;background:${accent}"></div></div><div class="bv">${v}</div></div>`
  ).join('') + '</div>';
}

function render(d){
  const dayMax = Math.max(...d.byDay.map(r=>r[1]), 1);
  const spark = d.byDay.map(([dt,v]) => `<div class="sp" title="${dt}: ${v}" style="height:${Math.max(6, Math.round(v/dayMax*70))}px"></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Dinner Tonight — Usage</title><style>
:root{--bg:#241f17;--card:#39321f;--ink:#f9f2e2;--muted:#c7bd9f;--gold:#d9b35e;--line:#4c4330}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:'Helvetica Neue',Arial,sans-serif;padding:28px 18px;max-width:980px;margin:0 auto}
h1{font-family:Georgia,serif;font-weight:normal;color:var(--gold);margin:0 0 4px}
.sub{color:var(--muted);margin:0 0 24px}
.kpis{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 20px;flex:1;min-width:140px}
.kpi b{font-size:30px;font-family:Georgia,serif;color:var(--gold)}.kpi span{display:block;color:var(--muted);font-size:12px;letter-spacing:.1em;text-transform:uppercase;margin-top:4px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}@media(max-width:720px){.grid{grid-template-columns:1fr}}
.panel{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px}
.panel h2{font-family:Georgia,serif;font-weight:normal;font-size:18px;margin:0 0 14px;color:var(--ink)}
.bars{display:flex;flex-direction:column;gap:9px}
.bar{display:grid;grid-template-columns:1fr 120px 38px;align-items:center;gap:10px;font-size:13.5px}
.bk{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.bt{background:rgba(0,0,0,.25);border-radius:6px;height:9px;overflow:hidden}.bf{height:100%;border-radius:6px}
.bv{text-align:right;color:var(--muted)}
.muted{color:var(--muted)}
.spark{display:flex;align-items:flex-end;gap:3px;height:74px;margin-top:6px}.sp{flex:1;background:var(--gold);border-radius:2px;opacity:.85}
.foot{color:var(--muted);font-size:12px;margin-top:26px;text-align:center}
</style></head><body>
<h1>What people actually use</h1>
<p class="sub">Live usage of Dinner Tonight — aggregate counts only, no personal data.</p>
<div class="kpis">
  <div class="kpi"><b>${d.visits.toLocaleString()}</b><span>Total visits</span></div>
  <div class="kpi"><b>${d.topRecipes.reduce((a,r)=>a+r[1],0).toLocaleString()}</b><span>Recipe opens</span></div>
  <div class="kpi"><b>${d.topSearches.length}</b><span>Distinct searches</span></div>
  <div class="kpi"><b>${(d.features.find(f=>f[0]==='walmart')||[,0])[1].toLocaleString()}</b><span>Walmart cart clicks</span></div>
</div>
<div class="panel" style="margin-bottom:20px"><h2>Visits — last 30 days</h2><div class="spark">${spark||'<span class="muted">No data yet</span>'}</div></div>
<div class="grid">
  <div class="panel"><h2>🔥 Most-opened recipes</h2>${barList(d.topRecipes, 'var(--gold)')}</div>
  <div class="panel"><h2>🔎 Top searches</h2>${barList(d.topSearches, '#8a9a52')}</div>
  <div class="panel"><h2>🛠️ Feature usage</h2>${barList(d.features, '#b07d3e')}</div>
  <div class="panel"><h2>🍽️ Top restaurant dishes</h2>${barList(d.topRestaurants, '#9a6f8a')}</div>
</div>
<p class="foot">Bookmark this page. Reload anytime to see fresh numbers.</p>
</body></html>`;
}
