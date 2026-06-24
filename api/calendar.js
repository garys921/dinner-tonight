// GET /api/calendar.ics  → rolling feed (today + next 20 days), always current.
import { buildICS } from '../ics.js';

export default function handler(req, res){
  const site = `https://${req.headers.host || 'dinner-tonight-daily.vercel.app'}`;
  const ics = buildICS(new Date(), 21, site);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="dinner-tonight.ics"');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  res.status(200).send(ics);
}
