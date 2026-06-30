// Privacy-light usage analytics. No PII, no IPs — just aggregate counts in KV.
//   POST /api/track  { event, key }
// Events: visit | recipe | search | feature | restaurant
import { kv } from '@vercel/kv';

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const ev = (b.event || '').toString().slice(0, 24);
    let key = (b.key || '').toString().slice(0, 100).trim();
    if (!ev) return res.status(400).json({ ok:false });
    const day = new Date().toISOString().slice(0, 10);
    const ops = [];
    if (ev === 'visit'){ ops.push(kv.hincrby('stat:day', day, 1)); ops.push(kv.incr('stat:visits')); }
    else if (ev === 'recipe' && key){ ops.push(kv.hincrby('stat:recipe', key, 1)); }
    else if (ev === 'search' && key){ ops.push(kv.hincrby('stat:search', key.toLowerCase().slice(0,60), 1)); }
    else if (ev === 'feature' && key){ ops.push(kv.hincrby('stat:feature', key, 1)); }
    else if (ev === 'restaurant' && key){ ops.push(kv.hincrby('stat:restaurant', key, 1)); }
    if (ops.length) await Promise.all(ops);
    return res.status(200).json({ ok:true });
  } catch (e){
    return res.status(200).json({ ok:false }); // never surface errors to the client
  }
}
