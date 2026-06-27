// GET /api/recipe-card?recipe=<slug>   → minimal HTML with JSON-LD Recipe schema
// GET /api/recipe-card?menu=today      → minimal HTML for tonight's 4-course menu
//
// Purpose: gives Bring! (and other recipe-import apps that parse schema.org)
// a stable URL they can scrape ingredients from. Our main site is a SPA so
// the recipes themselves don't have schema markup; this endpoint plugs that gap.

import {
  todaysMenu, menuForDateString, findRecipeBySlug,
  ingredientsForRecipe, ingredientsForMenu
} from '../grocery.js';

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function recipeJsonLd({ title, image, servings, totalTime, ingredients, instructions, author, url }){
  // Bring! requires: name, author, recipeIngredient. We also include image + instructions.
  // recipeIngredient strings should look like "1 cup flour" — we use display_text when present.
  const ingStrings = ingredients.map(i => {
    if (i.display_text) return i.display_text;
    const m = i.measurements && i.measurements[0];
    const q = m && m.quantity ? (Math.round(m.quantity * 100) / 100) : '';
    const u = m && m.unit && m.unit !== 'each' ? ' ' + m.unit : '';
    return ((q ? q + u + ' ' : '') + i.name).trim();
  });
  return {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: title,
    image: image ? [image] : undefined,
    author: { '@type': 'Organization', name: author || 'Dinner Tonight' },
    description: 'A Dinner Tonight recipe — fresh ingredients, easy steps.',
    recipeYield: String(servings || 2),
    totalTime: totalTime ? ('PT' + totalTime + 'M') : undefined,
    recipeIngredient: ingStrings,
    recipeInstructions: (instructions || []).map(s => ({ '@type': 'HowToStep', text: s })),
    url: url || undefined
  };
}

function render(title, image, ingredients, instructions, servings, totalTime, canonicalUrl, slug){
  const jsonLd = recipeJsonLd({
    title, image, servings, totalTime, ingredients, instructions,
    author: 'Dinner Tonight', url: canonicalUrl
  });
  const ingList = ingredients.map(i => {
    const m = i.measurements && i.measurements[0];
    const q = m && m.quantity ? (Math.round(m.quantity * 100) / 100) : '';
    const u = m && m.unit && m.unit !== 'each' ? ' ' + m.unit : '';
    return `<li>${esc(((q ? q + u + ' ' : '') + i.name).trim())}</li>`;
  }).join('');
  const stepList = (instructions || []).map(s => `<li>${esc(s)}</li>`).join('');
  const groceryUrl = slug ? ('/api/grocery?recipe=' + encodeURIComponent(slug)) : '/api/grocery?menu=today';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Dinner Tonight</title>
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta name="description" content="${esc(title)} from Dinner Tonight.">
<meta name="theme-color" content="#16140f">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;utf8,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E%3Crect%20width='32'%20height='32'%20rx='6'%20fill='%2316140f'/%3E%3Ccircle%20cx='16'%20cy='16'%20r='6.5'%20fill='%23c9a14a'/%3E%3C/svg%3E">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(title)} — Dinner Tonight">
<meta property="og:description" content="${esc(title)} from Dinner Tonight — full recipe, ingredients, and one-tap shopping.">
<meta property="og:url" content="${esc(canonicalUrl)}">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;background:#16140f;color:#f3ead6;line-height:1.6;-webkit-font-smoothing:antialiased;padding:32px 18px 60px;min-height:100vh}
  .wrap{max-width:680px;margin:0 auto}
  .back{display:inline-block;margin-bottom:18px;color:#b3a98f;font-size:13px;text-decoration:none;transition:.15s;font-family:'Helvetica Neue',Arial,sans-serif}
  .back:hover{color:#e3c987}
  .card{background:#1f1c15;border:1px solid #3a3527;border-radius:14px;padding:36px 36px 28px;box-shadow:0 18px 50px rgba(0,0,0,.45);position:relative}
  .card::after{content:"";position:absolute;inset:10px;border:1px solid rgba(201,161,74,.2);border-radius:8px;pointer-events:none}
  .eyebrow{font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#c9a14a;margin-bottom:8px;font-family:'Helvetica Neue',Arial,sans-serif}
  h1{font-weight:normal;letter-spacing:.04em;font-size:30px;margin:0 0 8px;line-height:1.2}
  .meta{color:#b3a98f;font-size:14px;margin-bottom:18px;font-style:italic}
  h2{color:#c9a14a;font-size:13px;letter-spacing:.22em;text-transform:uppercase;margin:26px 0 12px;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;padding-bottom:6px;border-bottom:1px solid rgba(201,161,74,.18)}
  ul,ol{margin:0 0 4px 22px}
  ul li,ol li{margin-bottom:6px}
  img{max-width:100%;border-radius:10px;margin:8px 0 18px}
  a{color:#c9a14a}
  .actions{margin-top:28px;display:flex;flex-direction:column;gap:10px}
  .cta-primary{display:flex;align-items:center;justify-content:center;gap:8px;background:linear-gradient(180deg,#d4af55,#b88c34);color:#1c170c;font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:15px;letter-spacing:.02em;padding:16px 22px;border:1px solid #e3c987;border-radius:14px;text-decoration:none;transition:.18s ease;min-height:54px;box-shadow:0 6px 18px rgba(201,161,74,.28),inset 0 1px 0 rgba(255,255,255,.18)}
  .cta-primary:hover{transform:translateY(-2px);box-shadow:0 12px 26px rgba(201,161,74,.4),inset 0 1px 0 rgba(255,255,255,.22)}
  @media(max-width:540px){
    body{padding:22px 14px 50px}
    .card{padding:26px 20px 20px}
    h1{font-size:24px}
  }
  @media print{
    body{background:#fff;color:#000;padding:20px}
    .back,.actions{display:none !important}
    .card{background:#fff;border:none;box-shadow:none;padding:0}
    .card::after{display:none}
    h1,h2{color:#000 !important}
  }
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head><body>
<div class="wrap">
  <a class="back" href="/">← Back to Dinner Tonight</a>
  <div class="card">
    <div class="eyebrow">Recipe</div>
    <h1 itemprop="name">${esc(title)}</h1>
    <div class="meta">Serves ${esc(servings || 2)}${totalTime ? ' · ' + esc(totalTime) + ' min' : ''} · by Dinner Tonight</div>
    ${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
    <h2>Ingredients</h2>
    <ul itemprop="recipeIngredient">${ingList}</ul>
    <h2>Preparation</h2>
    <ol itemprop="recipeInstructions">${stepList}</ol>
  </div>
  <div class="actions">
    <a class="cta-primary" href="${groceryUrl}">🛒 Order ingredients</a>
  </div>
</div>
</body></html>`;
}

export default async function handler(req, res){
  try {
    const host = req.headers.host || 'dinner-tonight-daily.vercel.app';
    const site = 'https://' + host;
    const q = req.query || {};
    const slug = (q.recipe || '').toString();
    const wantMenu = (q.menu || '').toString();

    let title, ingredients, instructions, servings, totalTime, canonicalPath, image;
    if (slug){
      const r = findRecipeBySlug(slug);
      if (!r) return res.status(404).send('Recipe not found');
      title = r.title;
      ingredients = ingredientsForRecipe(r);
      instructions = r.steps || [];
      servings = (typeof r.serves === 'string' ? parseInt(r.serves, 10) || 2 : (r.serves || 2));
      const tm = String(r.time || '').match(/\d+/);
      totalTime = tm ? parseInt(tm[0], 10) : null;
      image = r.img || null;
      canonicalPath = '/api/recipe-card?recipe=' + encodeURIComponent(slug);
    } else if (wantMenu){
      const dateStr = (req.query && req.query.date) ? String(req.query.date) : ''; const m = dateStr ? menuForDateString(dateStr) : todaysMenu();
      title = "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses');
      ingredients = ingredientsForMenu(m);
      instructions = [
        m.appetizer ? 'APPETIZER · ' + m.appetizer.title : null,
        ...(m.appetizer && m.appetizer.steps ? m.appetizer.steps.slice(0, 2) : []),
        m.main ? 'MAIN · ' + m.main.title : null,
        ...(m.main && m.main.steps ? m.main.steps.slice(0, 3) : []),
        m.side ? 'SIDE · ' + m.side.title : null,
        ...(m.side && m.side.steps ? m.side.steps.slice(0, 2) : []),
        m.dessert ? 'DESSERT · ' + m.dessert.title : null,
        ...(m.dessert && m.dessert.steps ? m.dessert.steps.slice(0, 2) : [])
      ].filter(Boolean);
      servings = 2;
      totalTime = 90;
      image = (m.main && m.main.img) || null;
      canonicalPath = '/api/recipe-card?menu=today';
    } else {
      return res.status(400).send('Provide ?recipe=<slug> or ?menu=today');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
    return res.status(200).send(
      render(title, image, ingredients, instructions, servings, totalTime, site + canonicalPath)
    );
  } catch (e){
    console.error(e);
    return res.status(500).send('Error: ' + e.message);
  }
}
