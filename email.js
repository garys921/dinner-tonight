// Build the daily FULL-MENU email (Appetizer, Main, Side, Dessert).
// Upgraded by email-upgrade agent: big "Get the groceries" CTA, per-store chips,
// per-dish star ratings, calendar feed link, preserved Resend unsubscribe footer.
import { CATS, todaysMenu } from './recipes.js';

// ---------- helpers ----------
function slugify(s){
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function todayLine(d = new Date()){
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });
}

// ---------- inline UI pieces ----------
function bigCTA(label, href, opts){
  opts = opts || {};
  var bg = opts.bg || '#c9a14a';
  var color = opts.color || '#221d10';
  return '<a href="' + href + '" target="_blank" rel="noopener" ' +
    'style="display:inline-block;background:' + bg + ';color:' + color + ';text-decoration:none;' +
    'font-family:\'Helvetica Neue\',Arial,sans-serif;font-weight:700;font-size:14px;' +
    'letter-spacing:.04em;padding:14px 26px;border-radius:999px;mso-padding-alt:0;' +
    'border:1px solid ' + bg + '">' + label + '</a>';
}
function ghostCTA(label, href){
  return '<a href="' + href + '" target="_blank" rel="noopener" ' +
    'style="display:inline-block;background:transparent;color:#f6f0e2;text-decoration:none;' +
    'font-family:\'Helvetica Neue\',Arial,sans-serif;font-weight:600;font-size:13px;' +
    'letter-spacing:.03em;padding:12px 22px;border-radius:999px;border:1px solid #c9a14a">' + label + '</a>';
}
function ghostCTAdark(label, href){
  return '<a href="' + href + '" target="_blank" rel="noopener" ' +
    'style="display:inline-block;background:transparent;color:#5b4f33;text-decoration:none;' +
    'font-family:\'Helvetica Neue\',Arial,sans-serif;font-weight:600;font-size:13px;' +
    'letter-spacing:.03em;padding:12px 22px;border-radius:999px;border:1px solid #c9a14a">' + label + '</a>';
}
function chip(label, href){
  return '<a href="' + href + '" target="_blank" rel="noopener" ' +
    'style="display:inline-block;background:#fbf5e6;color:#5b4f33;text-decoration:none;' +
    'font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:12px;font-weight:600;' +
    'letter-spacing:.04em;padding:8px 14px;border-radius:999px;border:1px solid #c9b78d;' +
    'margin:4px 4px 0 0">' + label + '</a>';
}
function starRow(site, dish){
  var t = encodeURIComponent(dish);
  var html = '';
  for (var n = 1; n <= 5; n++){
    var href = site + '/?dish=' + t + '&rate=' + n;
    html += '<a href="' + href + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;text-decoration:none;color:#c9a14a;font-size:22px;' +
      'padding:0 5px;line-height:1;font-family:Arial,sans-serif" ' +
      'aria-label="Rate ' + n + ' star' + (n>1?'s':'') + '">&#9733;</a>';
  }
  return html;
}

// ---------- course card ----------
function courseBlock(label, r, site){
  var slug = slugify(r.title);
  var ing = r.ing.map(function(x){ return '<li style="margin:3px 0;color:#3c3320">' + esc(x) + '</li>'; }).join('');
  var steps = r.steps.map(function(x){ return '<li style="margin:5px 0;color:#3c3320;line-height:1.5">' + esc(x) + '</li>'; }).join('');
  var meta = r.cal
    ? (r.time + ' &middot; ' + r.level + ' &middot; ~' + r.cal + ' cal' + (r.protein ? ' &middot; ' + esc(r.protein) : ''))
    : (r.time + ' &middot; ' + r.level + ' &middot; serves ' + r.serves);

  return [
    '<tr><td style="padding:24px 32px 6px;border-top:1px solid #e3d8bd">',
      '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a7d3c">' + label + '</div>',
      '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:23px;color:#2c2517;margin:6px 0 2px;line-height:1.25">' + esc(r.title) + '</div>',
      '<div style="font-style:italic;color:#7c6a44;font-size:13px">' + esc(r.it) + ' &middot; ' + esc(CATS[r.cat].label) + '</div>',
      '<p style="color:#5b4f33;font-size:14px;line-height:1.5;margin:10px 0 4px">' + esc(r.desc) + '</p>',
      '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;color:#8a7c5c;margin-bottom:6px">' + meta + '</div>',
    '</td></tr>',
    '<tr><td style="padding:6px 32px 6px">',
      '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2e;margin:6px 0 4px">Ingredients</div>',
      '<ul style="padding-left:18px;margin:0 0 10px;font-size:13.5px">' + ing + '</ul>',
      '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2e;margin:10px 0 4px">Preparation</div>',
      '<ol style="padding-left:18px;margin:0;font-size:13.5px">' + steps + '</ol>',
      (r.pair && !r.cal ? '<p style="font-style:italic;color:#7c6a44;font-size:12.5px;margin:12px 0 0">To drink &mdash; ' + esc(r.pair) + '</p>' : ''),
    '</td></tr>',
    '<tr><td style="padding:14px 32px 4px">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">',
        '<tr><td align="left" style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#9a7d3c;padding:0 0 6px">Tried it? Rate this dish</td></tr>',
        '<tr><td align="left" style="padding:0 0 4px">' + starRow(site, r.title) + '</td></tr>',
      '</table>',
    '</td></tr>',
    '<tr><td style="padding:6px 32px 18px">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
        '<tr><td>',
          chip('&#x1F6D2; Order on Instacart', site + '/api/grocery?recipe=' + encodeURIComponent(slug)),
          chip('Send to Bring!', site + '/api/grocery?recipe=' + encodeURIComponent(slug) + '&service=bring'),
          chip('Walmart cart', site + '/api/grocery?recipe=' + encodeURIComponent(slug) + '&service=walmart'),
        '</td></tr>',
      '</table>',
    '</td></tr>'
  ].join('');
}

// ---------- main entry ----------
export function buildEmail(_ignored, site){
  site = site || 'https://dinner-tonight-daily.vercel.app';
  var m = todaysMenu();
  var dateLine = todayLine();
  var fullListUrl = site + '/api/grocery?menu=today&view=list';
  var fullInstacartUrl = site + '/api/grocery?menu=today';
  var calendarUrl = site + '/api/calendar.ics';

  var blocks = [
    courseBlock('Appetizer', m.appetizer, site),
    courseBlock('Main Course', m.main, site),
    courseBlock('Side', m.side, site),
    courseBlock('Dessert', m.dessert, site)
  ].join('');

  var preheader = esc(m.appetizer.title) + ' &middot; ' + esc(m.main.title) + ' &middot; ' + esc(m.side.title) + ' &middot; ' + esc(m.dessert.title);

  var html = [
    '<!DOCTYPE html>',
    '<html><head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="x-apple-disable-message-reformatting">',
    '<meta name="color-scheme" content="light dark">',
    '<title>Tonight\'s menu &mdash; Dinner Tonight</title>',
    '</head>',
    '<body style="margin:0;padding:0;background:#16140f;font-family:Georgia,\'Times New Roman\',serif">',
    '<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#16140f;line-height:1px;opacity:0">' + preheader + '</div>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#16140f;padding:24px 12px">',
      '<tr><td align="center">',
      '<table role="presentation" width="620" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;width:100%;background:#f6f0e2;border:1px solid #c9b78d;border-radius:14px;overflow:hidden">',

        // HEADER
        '<tr><td style="padding:34px 32px 4px;text-align:center">',
          '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10.5px;letter-spacing:.32em;text-transform:uppercase;color:#9a7d3c">' + esc(dateLine) + ' &middot; Prix Fixe for Two</div>',
          '<h1 style="font-family:Georgia,\'Times New Roman\',serif;font-weight:normal;font-size:30px;color:#2c2517;margin:12px 0 4px;letter-spacing:.03em;line-height:1.18">This Evening\'s Menu</h1>',
          '<div style="font-family:Georgia,serif;font-style:italic;color:#7c6a44;font-size:14px">Tonight: ' + esc(m.main.title) + '</div>',
          '<div style="color:#b08d3f;margin:14px 0 2px;font-size:14px">&#10022; &#10022; &#10022;</div>',
        '</td></tr>',

        // PRIMARY CTAs
        '<tr><td style="padding:14px 32px 4px;text-align:center">',
          '<div style="margin-bottom:12px">' + bigCTA('&#x1F6D2; Get the groceries', fullListUrl) + '</div>',
          '<div style="margin-bottom:6px">' + ghostCTAdark('See the full menu page', site + '/') + '</div>',
        '</td></tr>',

        // STORE CHIPS
        '<tr><td style="padding:18px 32px 6px;text-align:center">',
          '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#9a7d3c;margin-bottom:8px">Send the whole list to</div>',
          '<div>',
            chip('Bring!', fullInstacartUrl + '&service=bring'),
            chip('Walmart', fullInstacartUrl + '&service=walmart'),
            chip('FreshDirect', fullInstacartUrl + '&service=freshdirect'),
            chip('Stop &amp; Shop', fullInstacartUrl + '&service=stopandshop'),
            chip('ShopRite', fullInstacartUrl + '&service=shoprite'),
          '</div>',
        '</td></tr>',

        // COURSE CARDS
        blocks,

        // CALENDAR
        '<tr><td style="padding:22px 32px 12px;border-top:1px solid #e3d8bd;text-align:center">',
          '<div style="font-family:\'Helvetica Neue\',Arial,sans-serif;font-size:10.5px;letter-spacing:.22em;text-transform:uppercase;color:#9a7d3c;margin-bottom:8px">Calendar</div>',
          '<div style="font-family:Georgia,serif;color:#5b4f33;font-size:13.5px;margin-bottom:12px">Subscribe once &mdash; tonight\'s dish (and the next three weeks) lands on your calendar automatically.</div>',
          '<div>' + ghostCTAdark('&#x1F4C5; Add to my calendar', calendarUrl) + '</div>',
        '</td></tr>',

        // FOOTER
        '<tr><td style="padding:22px 32px 30px;text-align:center;border-top:1px solid #e3d8bd;background:#efe6d2">',
          '<div style="font-family:Georgia,serif;font-style:italic;color:#7c6a44;font-size:13px;margin-bottom:8px">Dinner Tonight &mdash; a new prix-fixe menu, every evening.</div>',
          '<p style="font-family:\'Helvetica Neue\',Arial,sans-serif;color:#a89a7d;font-size:11px;margin:14px 0 0;line-height:1.6">',
            'You\'re getting this because you subscribed to Dinner Tonight.<br>',
            '<a href="' + site + '/api/unsubscribe?email={{EMAIL}}" style="color:#8a7c5c;text-decoration:underline">Unsubscribe</a>',
          '</p>',
        '</td></tr>',

      '</table>',
      '</td></tr>',
    '</table>',
    '</body></html>'
  ].join('');

  var text =
    'TONIGHT\'S MENU — ' + dateLine + '\n' +
    'Four courses for two.\n\n' +
    'Get the full grocery list:  ' + fullListUrl + '\n' +
    'Order on Instacart:         ' + fullInstacartUrl + '\n' +
    'Add to calendar:            ' + calendarUrl + '\n' +
    'View on the web:            ' + site + '/\n\n' +
    [['Appetizer', m.appetizer], ['Main Course', m.main], ['Side', m.side], ['Dessert', m.dessert]]
      .map(function(pair){
        var l = pair[0], r = pair[1];
        return l.toUpperCase() + ': ' + r.title + ' (' + CATS[r.cat].label + ')\n' +
          r.desc + '\n' +
          'Ingredients: ' + r.ing.join('; ') + '\n' +
          'Steps: ' + r.steps.map(function(x, i){ return (i + 1) + '. ' + x; }).join(' ') + '\n' +
          'Rate it: ' + site + '/?dish=' + encodeURIComponent(r.title) + '&rate=5';
      })
      .join('\n\n') +
    '\n\nUnsubscribe: ' + site + '/api/unsubscribe?email={{EMAIL}}\n';

  return {
    subject: 'Tonight: ' + m.main.title + ' (+ 3 courses)',
    html: html,
    text: text
  };
}
