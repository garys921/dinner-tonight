// GET /api/recipe-card?recipe=<slug>   → minimal HTML with JSON-LD Recipe schema
// GET /api/recipe-card?menu=today      → minimal HTML for tonight's 4-course menu
//
// Purpose: gives Bring! (and other recipe-import apps that parse schema.org)
// a stable URL they can scrape ingredients from. Our main site is a SPA so
// the recipes themselves don't have schema markup; this endpoint plugs that gap.

import {
  todaysMenu, findRecipeBySlug,
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

function render(title, image, ingredients, instructions, servings, totalTime, canonicalUrl){
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

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Dinner Tonight</title>
<link rel="canonical" href="${esc(canonicalUrl)}">
<meta name="description" content="${esc(title)} from Dinner Tonight.">
<style>
  body{font-family:Georgia,'Times New Roman',serif;background:#16140f;color:#f3ead6;max-width:680px;margin:0 auto;padding:28px 18px;line-height:1.55}
  h1{font-weight:normal;letter-spacing:.04em;margin:0 0 8px}
  .meta{color:#b3a98f;font-size:14px;margin-bottom:18px;font-style:italic}
  h2{color:#c9a14a;font-size:14px;letter-spacing:.2em;text-transform:uppercase;margin:22px 0 10px}
  ul,ol{margin:0 0 16px 20px}
  img{max-width:100%;border-radius:10px;margin:8px 0 18px}
  a{color:#c9a14a}
  .back{display:inline-block;margin-bottom:16px;color:#b3a98f;font-size:13px;text-decoration:none}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head><body>
<a class="back" href="/">← Back to Dinner Tonight</a>
<h1 itemprop="name">${esc(title)}</h1>
<div class="meta">Serves ${esc(servings || 2)}${totalTime ? ' · ' + esc(totalTime) + ' min' : ''} · by Dinner Tonight</div>
${image ? `<img src="${esc(image)}" alt="${esc(title)}">` : ''}
<h2>Ingredients</h2>
<ul itemprop="recipeIngredient">${ingList}</ul>
<h2>Preparation</h2>
<ol itemprop="recipeInstructions">${stepList}</ol>
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
      const m = todaysMenu();
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
