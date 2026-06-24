// GET /api/unsubscribe?email=...  — remove an address from the list.
import { kv } from '@vercel/kv';

export default async function handler(req, res){
  const email = (req.query.email || '').toString().trim().toLowerCase();
  if (email) await kv.srem('subscribers', email);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#16140f;color:#f3ead6;text-align:center;padding:80px 20px">
    <h1 style="font-weight:normal">You're unsubscribed.</h1>
    <p style="color:#b3a98f">You won't get any more daily dinners. Changed your mind? Just sign up again any time.</p>
    <p><a href="/" style="color:#e3c987">← Back to Dinner Tonight</a></p>
  </body></html>`);
}
