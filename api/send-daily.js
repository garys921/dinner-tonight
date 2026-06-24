// GET /api/send-daily  — run by Vercel Cron once a day (see vercel.json).
// Emails today's dinner to every subscriber. Protected by CRON_SECRET.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { recipeForDate } from '../recipes.js';
import { buildEmail } from '../email.js';

export default async function handler(req, res){
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.authorization || '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`){
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  const site = `https://${req.headers.host || 'dinner-tonight-daily.vercel.app'}`;
  const r = recipeForDate(new Date());
  const { subject, html, text } = buildEmail(r, site);

  const subscribers = (await kv.smembers('subscribers')) || [];
  if (subscribers.length === 0) return res.status(200).json({ ok:true, sent:0, note:'no subscribers yet' });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const FROM = process.env.EMAIL_FROM || 'Dinner Tonight <dinner@yourdomain.com>';

  let sent = 0, failed = 0;
  // send in small batches to be gentle on rate limits
  for (const email of subscribers){
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject,
        html: html.replace('{{EMAIL}}', encodeURIComponent(email)),
        text
      });
      sent++;
    } catch (e){ failed++; }
  }
  return res.status(200).json({ ok:true, dish:r.title, sent, failed });
}
