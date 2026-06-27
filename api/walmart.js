// GET /api/walmart?recipe=<slug>   -> 302 to Walmart cart-prefill (or search fallback)
// GET /api/walmart?menu=today      -> 302 to Walmart cart-prefill for the 4-course menu
// GET /api/walmart?...&format=json -> JSON { url, source, matched, unmatched, ingredients }
//
// Walmart's affil.walmart.com/cart/buynow endpoint is publicly accessible —
// no developer key or affiliate ID required to construct the URL. Items the
// shopper doesn't already have in our hand-curated item-ID map fall back to
// walmart.com/search?q=... so nothing is silently dropped.

import {
  todaysMenu, findRecipeBySlug,
  ingredientsForRecipe, ingredientsForMenu
} from '../grocery.js';
import { buildWalmartCart, walmartSearchURL } from '../walmart.js';

export default async function handler(req, res){
  try {
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
      const m = todaysMenu();
      title = "Tonight's Dinner — " + (m.main && m.main.title || 'Four courses');
      ingredients = ingredientsForMenu(m);
    }

    const cart = buildWalmartCart(ingredients);

    if (format === 'json'){
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
      return res.status(200).json({
        ok: true,
        url: cart.url,
        source: cart.source,
        title,
        matched: cart.matched,
        unmatched: cart.unmatched,
        searchFallbackUrl: walmartSearchURL(ingredients)
      });
    }

    // Default: 302 redirect to Walmart so the button feels instant.
    res.setHeader('Cache-Control', 'no-store');
    res.writeHead(302, { Location: cart.url });
    return res.end();
  } catch (e){
    console.error(e);
    return res.status(500).json({ ok:false, error: e.message });
  }
}
