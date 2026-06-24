// Community ratings (no login needed yet — aggregate stars per dish).
//   POST /api/rate { id, stars }   → record a rating
//   GET  /api/rate                 → { id: {avg, count} } for all dishes
import { kv } from '@vercel/kv';

export default async function handler(req, res){
  if (req.method === 'GET'){
    const sums = (await kv.hgetall('rate:sum')) || {};
    const counts = (await kv.hgetall('rate:count')) || {};
    const out = {};
    for (const id of Object.keys(counts)){
      const c = Number(counts[id]) || 0;
      out[id] = { avg: c ? (Number(sums[id]) / c) : 0, count: c };
    }
    return res.status(200).json({ ok:true, ratings: out });
  }
  if (req.method === 'POST'){
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const id = (body.id || '').toString().slice(0, 80);
    const stars = Math.max(1, Math.min(5, parseInt(body.stars, 10) || 0));
    if (!id || !stars) return res.status(400).json({ ok:false, error:'Need id and stars 1-5' });
    await kv.hincrby('rate:sum', id, stars);
    await kv.hincrby('rate:count', id, 1);
    return res.status(200).json({ ok:true });
  }
  return res.status(405).json({ ok:false });
}
