// Build a rolling .ics feed from `start` for `days` days, matching the site rotation.
import { CATS, recipeForDate } from './recipes.js';

const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function fold(line){
  let out = '', cur = '';
  for (const ch of line){ if (Buffer.byteLength(cur + ch) > 73){ out += cur + '\r\n '; cur = ch; } else cur += ch; }
  return out + cur;
}

export function buildICS(start = new Date(), days = 21, site = 'https://dinner-tonight-daily.vercel.app'){
  const now = new Date();
  const stamp = ymd(now) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
  const base = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));

  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dinner Tonight//Daily Dinner//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Dinner Tonight',
    'X-WR-CALDESC:A new dinner idea every day\\, with the recipe.',
    'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'
  ];

  for (let i = 0; i < days; i++){
    const d = new Date(base.getTime() + i * 86400000);
    const next = new Date(d.getTime() + 86400000);
    const r = recipeForDate(d);
    const cat = CATS[r.cat].label;
    const macro = r.cal ? ` (~${r.cal} cal${r.protein ? ', ' + r.protein + ' protein' : ''})` : '';
    const desc = [
      r.it + '.', r.desc, '',
      '⏱ ' + r.time + '  •  Serves ' + r.serves + '  •  ' + r.level + (r.cal ? '  •  ~' + r.cal + ' cal' : ''),
      '', 'INGREDIENTS', ...r.ing.map(x => '• ' + x),
      '', 'DIRECTIONS', ...r.steps.map((x, n) => (n + 1) + '. ' + x),
      '', (r.pair ? (r.cal ? r.pair : 'Pairing: ' + r.pair) : ''),
      '', 'More ideas → ' + site
    ].join('\n');

    L.push('BEGIN:VEVENT');
    L.push('UID:dinner-' + ymd(d) + '@dinner-tonight');
    L.push('DTSTAMP:' + stamp);
    L.push('DTSTART;VALUE=DATE:' + ymd(d));
    L.push('DTEND;VALUE=DATE:' + ymd(next));
    L.push(fold('SUMMARY:🍽 ' + esc(r.title) + ' — ' + esc(cat) + macro));
    L.push(fold('DESCRIPTION:' + esc(desc)));
    L.push('CATEGORIES:' + esc(cat));
    L.push('TRANSP:TRANSPARENT');
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
