// GET /recipe/<slug>  (rewritten to /api/recipe?slug=<slug>)
// Server-rendered, indexable recipe page with schema.org/Recipe structured data.
import { findRecipeBySlug, slugify } from '../grocery.js';

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function minutes(t){ const m = String(t||'').match(/\d+/); return m ? parseInt(m[0],10) : null; }
function baseUrl(req){ return 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app'); }

const COURSE = { appetizer:'Appetizer', main:'Main Course', side:'Side Dish', dessert:'Dessert', breakfast:'Breakfast', lunch:'Lunch', snack:'Snack', drink:'Drink', baking:'Baking' };

export default async function handler(req, res){
  const q = req.query || {};
  const slug = (q.slug || q.recipe || '').toString();
  const r = findRecipeBySlug(slug);
  const base = baseUrl(req);

  if (!r){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.status(404).send(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><title>Recipe not found — Dinner Tonight</title><body style="font-family:system-ui;max-width:640px;margin:60px auto;padding:0 20px;text-align:center"><h1>Recipe not found</h1><p><a href="${base}/">Browse 500+ free recipes at Dinner Tonight →</a></p>`);
  }

  const cleanSlug = slugify(r.title);
  const url = base + '/recipe/' + cleanSlug;
  const mins = minutes(r.time);
  const desc = (r.desc || (r.title + ' — a Dinner Tonight recipe.')).slice(0,300);
  const metaDesc = (r.title + ': ' + (r.desc || '') + ' Ingredients, easy steps' + (mins ? ', ready in ' + r.time : '') + '.').replace(/\s+/g,' ').slice(0,158);
  const img = base + '/og.svg';
  const kw = [r.cat, COURSE[r.course]||'', 'dinner recipe', mins && mins<=30 ? '30 minute meal' : ''].filter(Boolean).join(', ');

  const jsonld = {
    '@context':'https://schema.org/','@type':'Recipe',
    name: r.title,
    description: desc,
    image: [img],
    author: { '@type':'Organization', name:'Dinner Tonight', url: base + '/' },
    datePublished: '2026-01-01',
    recipeCategory: COURSE[r.course] || 'Main Course',
    keywords: kw,
    recipeYield: String(r.serves || 2),
    totalTime: mins ? ('PT'+mins+'M') : undefined,
    recipeIngredient: (r.ing || []),
    recipeInstructions: (r.steps || []).map(s => ({ '@type':'HowToStep', text: s })),
    nutrition: (r.cal || r.protein) ? { '@type':'NutritionInformation', calories: (r.cal? r.cal + ' calories': undefined), proteinContent: r.protein || undefined } : undefined
  };

  const walmart = base + '/api/store?service=walmart&recipe=' + encodeURIComponent(cleanSlug);
  const crumbLd = {
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:base+'/'},
      {'@type':'ListItem',position:2,name:'Recipes',item:base+'/#browse'},
      {'@type':'ListItem',position:3,name:r.title,item:url}
    ]
  };

  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.title)} Recipe${mins?(' — '+esc(r.time)):''} | Dinner Tonight</title>
<meta name="description" content="${esc(metaDesc)}">
<meta name="robots" content="index,follow">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(r.title)} Recipe">
<meta property="og:description" content="${esc(metaDesc)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${esc(img)}">
<meta name="twitter:card" content="summary"><meta name="twitter:title" content="${esc(r.title)} Recipe"><meta name="twitter:description" content="${esc(metaDesc)}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbLd)}</script>
<style>
*{box-sizing:border-box}body{font-family:'Poppins',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2a2433;background:#fbf7f4;margin:0;line-height:1.6}
a{color:#e05a2f;text-decoration:none}a:hover{text-decoration:underline}
header{border-bottom:1px solid #efe7e1;background:#fff}
.wrap{max-width:760px;margin:0 auto;padding:0 20px}
.brand{display:flex;align-items:center;gap:9px;font-weight:700;font-size:19px;padding:16px 0;color:#2a2433}
.dot{width:12px;height:12px;border-radius:50%;background:#ff6a3d;display:inline-block}
main{padding:26px 0 50px}
.crumb{font-size:13px;color:#7d7689;margin-bottom:14px}
.cat{color:#ff6a3d;font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase}
h1{font-size:34px;font-weight:700;margin:6px 0 6px;line-height:1.15}
.sub{color:#7d7689;font-style:italic;margin:0 0 18px}
.meta{display:flex;flex-wrap:wrap;gap:22px;padding:16px 0;border-top:1px solid #efe7e1;border-bottom:1px solid #efe7e1;margin-bottom:24px}
.meta div{font-size:14px}.meta .k{display:block;color:#7d7689;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.cols{display:grid;grid-template-columns:1fr;gap:28px}@media(min-width:640px){.cols{grid-template-columns:.9fr 1.1fr}}
h2{font-size:19px;font-weight:600;margin:0 0 12px}
ul,ol{margin:0;padding-left:20px}li{margin:7px 0}
.cta{display:block;text-align:center;background:#ff6a3d;color:#fff;font-weight:600;padding:15px;border-radius:14px;margin:28px 0 6px}
.cta:hover{text-decoration:none;filter:brightness(1.05)}
.back{display:inline-block;margin-top:24px}
footer{border-top:1px solid #efe7e1;background:#fff;font-size:13px;color:#7d7689}
footer .wrap{padding:22px 20px}footer a{margin-right:14px}
</style></head><body>
<header><div class="wrap"><a class="brand" href="${base}/"><span class="dot"></span> Dinner Tonight</a></div></header>
<main><div class="wrap">
  <div class="crumb"><a href="${base}/">Home</a> › <a href="${base}/#browse">Recipes</a> › ${esc(r.title)}</div>
  <div class="cat">${esc(COURSE[r.course]||'Recipe')}</div>
  <h1>${esc(r.title)}</h1>
  ${r.it?`<p class="sub">${esc(r.it)}</p>`:''}
  <p>${esc(r.desc||'')}</p>
  <div class="meta">
    ${r.time?`<div><span class="k">Time</span>${esc(r.time)}</div>`:''}
    ${r.serves?`<div><span class="k">Serves</span>${esc(r.serves)}</div>`:''}
    ${r.level?`<div><span class="k">Level</span>${esc(r.level)}</div>`:''}
    ${r.cal?`<div><span class="k">Calories</span>${esc(r.cal)}</div>`:''}
    ${r.protein?`<div><span class="k">Protein</span>${esc(r.protein)}</div>`:''}
  </div>
  <div class="cols">
    <div><h2>Ingredients</h2><ul>${(r.ing||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>
    <div><h2>Instructions</h2><ol>${(r.steps||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
  </div>
  <a class="cta" href="${esc(walmart)}" rel="nofollow">🛒 Order these ingredients on Walmart</a>
  ${r.pair?`<p style="color:#7d7689;text-align:center;font-size:14px">${esc(r.pair)}</p>`:''}
  <a class="back" href="${base}/">← Explore 500+ free recipes, a meal planner & daily dinner ideas</a>
</div></main>
<footer><div class="wrap">
  <div style="margin-bottom:8px"><b>Dinner Tonight</b> — free recipes, a new dinner every day, and one-tap shopping.</div>
  <a href="${base}/">Home</a><a href="${base}/#browse">All recipes</a><a href="${base}/#mealprep">Meal prep</a><a href="${base}/#kitchen">Meal planner</a><a href="${base}/#localspots">Long Island</a>
</div></footer>
</body></html>`;

  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate');
  return res.status(200).send(html);
}
