// Build a rolling .ics feed from `start` for `days` days — full 4-course menu per day.
import { CATS, menuForDate } from './recipes.js';

const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function fold(line){
  let out = '', cur = '';
  for (const ch of line){ if (Buffer.byteLength(cur + ch) > 73){ out += cur + '\r\n '; cur = ch; } else cur += ch; }
  return out + cur;
}

function courseLines(label, r){
  return [
    label.toUpperCase() + ' — ' + r.title + '  (' + CATS[r.cat].label + (r.cal ? ', ~' + r.cal + ' cal' : '') + ')',
    r.desc,
    'Ingredients: ' + r.ing.join('; '),
    ...r.steps.map((x, n) => '  ' + (n + 1) + '. ' + x),
    ''
  ];
}

export function buildICS(start = new Date(), days = 21, site = 'https://dinner-tonight-daily.vercel.app'){
  const now = new Date();
  const stamp = ymd(now) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';
  const base = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));

  const L = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Dinner Tonight//Daily Menu//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Dinner Tonight',
    'X-WR-CALDESC:A new four-course menu every day\\, with recipes.',
    'REFRESH-INTERVAL;VALUE=DURATION:P1D', 'X-PUBLISHED-TTL:P1D'
  ];

  for (let i = 0; i < days; i++){
    const d = new Date(base.getTime() + i * 86400000);
    const next = new Date(d.getTime() + 86400000);
    const m = menuForDate(d);
    const desc = [
      "Tonight's four-course menu:", '',
      ...courseLines('Appetizer', m.appetizer),
      ...courseLines('Main Course', m.main),
      ...courseLines('Side', m.side),
      ...courseLines('Dessert', m.dessert),
      'More ideas → ' + site
    ].join('\n');

    L.push('BEGIN:VEVENT');
    L.push('UID:dinner-' + ymd(d) + '@dinner-tonight');
    L.push('DTSTAMP:' + stamp);
    L.push('DTSTART;VALUE=DATE:' + ymd(d));
    L.push('DTEND;VALUE=DATE:' + ymd(next));
    L.push(fold('SUMMARY:🍽 ' + esc(m.main.title) + ' + 3 courses'));
    L.push(fold('DESCRIPTION:' + esc(desc)));
    L.push('TRANSP:TRANSPARENT');
    L.push('END:VEVENT');
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}
