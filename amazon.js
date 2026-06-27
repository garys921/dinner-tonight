// Amazon cart-add helper — search-based (June 2026)
//
// CHANGE LOG / WHY THIS REWRITE
// -----------------------------
// The previous version used the legacy /gp/aws/cart/add.html?ASIN.1=... URL
// pattern with a hardcoded ASIN_DICT. Two problems made it completely broken
// in the live site:
//
//   1. Amazon now REQUIRES an AssociateTag parameter on /gp/aws/cart/add.html.
//      Without it, the page shows "SORRY something went wrong" and wipes the
//      user's existing cart. (Verified live 2026-06-27.)
//
//   2. Most ASINs in the old dictionary were stale or fabricated — even the
//      ones that looked plausible (B074H6GRV5 for Goya cannellini, etc.) hit
//      Amazon's "Cart is empty" reject page. Maintaining a hand-curated ASIN
//      list at scale is not realistic; Amazon retires SKUs constantly.
//
// New strategy:
//   - No ASIN dictionary. No fragile bulk cart-add URL.
//   - For every ingredient, generate a per-item Amazon grocery search URL.
//     Search results ALWAYS show current valid ASINs with a one-tap "Add to
//     cart" button right on the results page.
//   - Provide a "Open all in tabs" landing page so the shopper can click
//     through tonight's whole list with one Add-to-cart tap per item.
//   - Also expose a single-URL bulk Amazon search as a smoother fallback
//     when the multi-tab opener is blocked by a popup blocker.

import { ingredientsForRecipe, ingredientsForMenu, slugify } from './grocery.js';

// Use the general grocery storefront, NOT amazonfresh — Amazon Fresh is
// geo-blocked outside delivery zones (e.g. Gary's Long Island address gets
// "No results" on amazonfresh search). Grocery search works everywhere and
// the Add-to-cart on results pages still routes through Amazon Fresh/WF
// where available.
export function amazonItemSearchURL(name){
  const cleaned = String(name || '').replace(/[,]/g,' ').replace(/\s+/g,' ').trim();
  return 'https://www.amazon.com/s?i=grocery&k=' + encodeURIComponent(cleaned);
}

// Bulk-search URL stuffs the first ~6 ingredient keywords into one search.
// Not ideal for adding to cart (results will be mixed), but acts as a
// graceful fallback when per-item tabs are unavailable.
export function amazonBulkSearchURL(ingredients){
  const q = (ingredients || []).map(i => i.name).slice(0, 6).join(' ');
  return 'https://www.amazon.com/s?i=grocery&k=' + encodeURIComponent(q);
}

// Backwards-compat aliases — other modules import these names.
export const amazonFreshSearchURL    = amazonItemSearchURL;
export const amazonFreshBulkSearchURL = amazonBulkSearchURL;

// ASIN_DICT kept as an empty placeholder so any stale import doesn't crash.
export const ASIN_DICT = {};

// buildAmazonPlan now returns a per-item search plan — no ASIN matching.
// `matched` is empty (no auto-add). `unmatched` is every ingredient, each
// with its own search URL. The route handler renders a landing page with
// one tap-to-add row per item plus an "Open all in tabs" button.
export function buildAmazonPlan(ingredients){
  const list = (ingredients || []).map(item => ({
    name: item.name,
    searchUrl: amazonItemSearchURL(item.name)
  }));
  return {
    matched: [],          // intentionally empty — no fake ASIN auto-add
    unmatched: list,      // every ingredient routed through search
    items: list,
    cartUrl: null,        // no working single-URL cart-add available
    freshSearchUrl: amazonBulkSearchURL(ingredients),
    landingPath: null     // filled in by the route handler with the absolute URL
  };
}

export function coverageStats(){
  return {
    asinCount: 0,
    uniqueAsins: 0,
    strategy: 'per-item-search'
  };
}

export { ingredientsForRecipe, ingredientsForMenu, slugify };
