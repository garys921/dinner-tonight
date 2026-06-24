# Dinner Tonight — Backend (email + live calendar + community ratings)

This turns the static site into a real app:

- **Daily email** — visitors subscribe; everyone gets that day's dinner each morning.
- **Live calendar** — `/dinner.ics` is now generated on the fly (always shows today + the next 20 days), so it never goes stale.
- **Community ratings** — star ratings are saved server-side so averages can be shared across everyone.

## What's in here
```
index.html          the website (now wired to the APIs)
api/subscribe.js     POST  — add an email to the list
api/unsubscribe.js   GET   — remove an email (used by the email footer link)
api/send-daily.js    CRON  — emails today's dinner to all subscribers (runs daily)
api/calendar.js      GET   — live rolling .ics feed  (served at /dinner.ics)
api/rate.js          GET/POST — community star ratings
lib/recipes.js       the 30 recipes + the daily-pick logic (single source of truth)
lib/ics.js           builds the calendar feed
lib/email.js         builds the daily email (HTML + text)
vercel.json          daily cron schedule + the /dinner.ics route
```

## Go-live checklist (the parts that need your login)

1. **Put this in a GitHub repo and connect it to Vercel.**
   Vercel → the `dinner-tonight-daily` project → Settings → Git → Connect. This lets the
   serverless functions and the daily cron actually run (the drag-and-drop deploy can't do those).

2. **Add a database (Vercel KV — free tier).**
   Vercel → Storage → Create → KV → connect it to the project. This stores the email list and ratings.
   It auto-adds the `KV_*` environment variables; no copying needed.

3. **Create an email service account (Resend — free tier).**
   - Sign up at resend.com, verify a "from" domain (or use their test domain to start).
   - Create an API key.
   - In Vercel → Settings → Environment Variables, add:
     - `RESEND_API_KEY` = your key
     - `EMAIL_FROM` = e.g. `Dinner Tonight <dinner@yourdomain.com>`
     - `CRON_SECRET` = any long random string (protects the daily job)

4. **Deploy.** Push to GitHub → Vercel builds it. The cron fires daily at 14:00 UTC.

That's it. Tell me when the three accounts exist and I'll finish wiring + test a real send.

## Notes / fine-tuning later
- Cross-device personal accounts (so each person's own ratings follow them) build on top of the KV store + a login — next step after this.
- Email send time (14:00 UTC) is set in `vercel.json` — easy to change to your timezone.
