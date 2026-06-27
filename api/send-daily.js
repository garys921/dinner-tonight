// GET /api/send-daily  — run by Vercel Cron once a day (see vercel.json).
// Emails today's dinner to every subscriber. Protected by CRON_SECRET (fail-closed).
//
// Auth:
//   - Vercel Cron auto-sends `Authorization: Bearer ${CRON_SECRET}` when the
//     CRON_SECRET project env var is set.
//   - If CRON_SECRET is NOT set, this endpoint refuses to run (503). It will
//     not fan out emails without a secret.
//   - Manual invocations must include the same Authorization header.
//
// Safe testing:
//   - Append `?dryRun=true` to skip the actual Resend send and just return
//     the count of recipients that would have been emailed.
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { timingSafeEqual } from 'node:crypto';
import { recipeForDate } from '../recipes.js';
import { buildEmail } from '../email.js';

function safeEqual(a, b){
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export default async function handler(req, res){
  // ----- Fail-closed auth -----
  const secret = process.env.CRON_SECRET;
  if (!secret){
    // No secret configured → refuse. This prevents accidental fan-out sends
    // from any unauthenticated request.
    return res.status(503).json({
      ok: false,
      error: 'CRON_SECRET is not configured on this deployment; refusing to send.'
    });
  }
  const auth = req.headers.authorization || '';
  if (!safeEqual(auth, `Bearer ${secret}`)){
    return res.status(401).json({ ok:false, error:'Unauthorized' });
  }

  // ----- Optional dry-run -----
  const dryRun = String(req.query?.dryRun || '').toLowerCase() === 'true';

  const site = `https://${req.headers.host || 'dinner-tonight-daily.vercel.app'}`;
  const r = recipeForDate(new Date());
  const { subject, html, text } = buildEmail(r, site);

  const subscribers = (await kv.smembers('subscribers')) || [];

  if (dryRun){
    return res.status(200).json({
      ok: true,
      dryRun: true,
      dish: r.title,
      subject,
      wouldHaveSent: subscribers.length,
      note: 'dryRun=true — no emails were sent'
    });
  }

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
