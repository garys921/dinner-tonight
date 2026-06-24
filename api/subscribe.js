// POST /api/subscribe  { email }
// Stores the email in a Vercel KV set. Idempotent.
import { kv } from '@vercel/kv';

function valid(email){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email); }

export default async function handler(req, res){
  if (req.method !== 'POST') return res.status(405).json({ ok:false, error:'Method not allowed' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const email = (body.email || '').trim().toLowerCase();
    if (!valid(email)) return res.status(400).json({ ok:false, error:'Invalid email' });
    await kv.sadd('subscribers', email);
    return res.status(200).json({ ok:true });
  } catch (e) {
    return res.status(500).json({ ok:false, error:'Server error' });
  }
}
