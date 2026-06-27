# Dinner Tonight — daily menu site

A four-course menu picked fresh every day, with recipes, calendar feed, daily email, community ratings, and **one-click grocery ordering** via Instacart.

## What's in here

```
index.html           the website (wired to the APIs)
recipes.js           84 recipes + the daily-pick logic (single source of truth)
ics.js               builds the rolling calendar feed
email.js             builds the daily email (HTML + text)
grocery.js           ingredient parser + Instacart link builder
api/subscribe.js     POST  — add an email to the list
api/unsubscribe.js   GET   — remove an email (used by the email footer link)
api/send-daily.js    CRON  — emails today's menu to subscribers (runs daily at 14:00 UTC)
api/calendar.js      GET   — live .ics feed (served at /dinner.ics)
api/rate.js          GET/POST — community star ratings
api/grocery.js       GET   — shopping-list page + Instacart deep link
vercel.json          daily cron schedule + the /dinner.ics route
```

## Routes

- `/` — the site
- `/dinner.ics` — rolling 21-day calendar feed
- `/api/grocery?menu=today` — shopping list for tonight's four-course menu
- `/api/grocery?recipe=<slug>` — shopping list for one specific recipe (e.g. `chicken-parmesan`)
- `/api/grocery?menu=today&format=json` — same data as JSON

## Grocery feature

Each day's menu has an "🛒 Order ingredients on Instacart" button. It opens a clean
shopping-list page with checkboxes, copy/print, per-item Instacart search links, and an
"Order all on Instacart" button at the bottom.

By default that bottom button goes to an Instacart search seeded with the ingredient names
(works for everyone, no API key needed).

**To upgrade to true one-click ordering** (the polished Instacart "recipe page"
with quantities, instructions, and pantry-item filtering), get a free key at
`https://docs.instacart.com/developer_platform_api/get_started/overview` and set:

```
INSTACART_API_KEY = <your key>
```

in Vercel → Settings → Environment Variables. No code change needed; the endpoint
auto-detects the key.

## Required env vars (already configured in Vercel)

- `RESEND_API_KEY` — daily email
- `EMAIL_FROM` — sender address
- `CRON_SECRET` — protects the daily-send job
- `KV_*` — auto-injected by Vercel KV

## Optional

- `INSTACART_API_KEY` — upgrades grocery button from search → full recipe page
