// GET /sitemap.xml  (rewritten to /api/sitemap) — homepage + every recipe page.
import { RECIPES } from '../recipes.js';
import { slugify } from '../grocery.js';

export default function handler(req, res){
  const base = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
  const today = new Date().toISOString().slice(0,10);
  const rows = [`  <url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`];
  const seen = new Set();
  for (const r of RECIPES){
    const s = slugify(r.title);
    if (s && !seen.has(s)){
      seen.add(s);
      rows.push(`  <url><loc>${base}/recipe/${s}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`);
    }
  }
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows.join('\n') + '\n</urlset>';
  res.setHeader('Content-Type','application/xml; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate');
  return res.status(200).send(xml);
}
