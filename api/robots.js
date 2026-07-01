// GET /robots.txt  (rewritten to /api/robots) — allow all, point to the sitemap.
export default function handler(req, res){
  const base = 'https://' + (req.headers.host || 'dinner-tonight-daily.vercel.app');
  const body = 'User-agent: *\nAllow: /\n\nSitemap: ' + base + '/sitemap.xml\n';
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.setHeader('Cache-Control','s-maxage=86400');
  return res.status(200).send(body);
}
