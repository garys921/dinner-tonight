// GET /api/og   → 1200x630 SVG OG card for social/iMessage previews
// Dynamic-ish: pulls tonight's main dish title from the recipe data so the
// share image always reflects the current menu.
import { todaysMenu } from '../grocery.js';

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

export default function handler(req, res){
  let mainTitle = 'Four courses, decided';
  try {
    const m = todaysMenu();
    if (m && m.main && m.main.title) mainTitle = m.main.title;
  } catch (e) {}

  const date = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'long', month: 'long', day: 'numeric'
  }).format(new Date());

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#272318"/>
      <stop offset="1" stop-color="#1b1810"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#c9a14a" stroke-opacity=".35" stroke-width="2" rx="12"/>
  <g font-family="Georgia, 'Times New Roman', serif" text-anchor="middle">
    <text x="600" y="160" font-size="20" letter-spacing="8" fill="#c9a14a" font-family="Helvetica Neue, Arial, sans-serif">TONIGHT'S MENU · ${esc(date.toUpperCase())}</text>
    <text x="600" y="260" font-size="72" fill="#f3ead6">Dinner Tonight</text>
    <line x1="500" y1="300" x2="700" y2="300" stroke="#c9a14a" stroke-opacity=".55" stroke-width="1"/>
    <text x="600" y="380" font-size="48" font-style="italic" fill="#e3c987">${esc(mainTitle)}</text>
    <text x="600" y="460" font-size="22" fill="#b3a98f" font-family="Helvetica Neue, Arial, sans-serif">A new four-course menu every evening</text>
    <text x="600" y="495" font-size="22" fill="#b3a98f" font-family="Helvetica Neue, Arial, sans-serif">— recipes, shopping list, one tap to order.</text>
    <text x="600" y="565" font-size="14" letter-spacing="6" fill="#8a7c5c" font-family="Helvetica Neue, Arial, sans-serif">DINNER-TONIGHT-DAILY.VERCEL.APP</text>
  </g>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(svg);
}
