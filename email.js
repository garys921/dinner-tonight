// Build the daily dinner email (HTML + plain text) for a recipe.
import { CATS } from './recipes.js';

export function buildEmail(r, site = 'https://dinner-tonight-daily.vercel.app'){
  const cat = CATS[r.cat].label;
  const macro = r.cal ? `${r.time} · Serves ${r.serves} · ${r.level} · ~${r.cal} cal${r.protein ? ' · ' + r.protein + ' protein' : ''}`
                      : `${r.time} · Serves ${r.serves} · ${r.level}`;
  const ing = r.ing.map(x => `<li style="margin:4px 0;color:#3c3320">${x}</li>`).join('');
  const steps = r.steps.map(x => `<li style="margin:7px 0;color:#3c3320;line-height:1.5">${x}</li>`).join('');

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#16140f;padding:24px 0;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#f6f0e2;border:1px solid #c9b78d;border-radius:12px;overflow:hidden">
      <tr><td style="padding:30px 40px 10px;text-align:center">
        <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a7d3c">Tonight on the Menu</div>
        <div style="font-size:44px;line-height:1;margin:14px 0">${r.emoji}</div>
        <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9a7d3c">${cat}</div>
        <h1 style="font-weight:normal;font-size:30px;color:#2c2517;margin:8px 0 4px">${r.title}</h1>
        <div style="font-style:italic;color:#7c6a44;font-size:14px">${r.it}</div>
        <div style="color:#b08d3f;margin:14px 0">&#10022;</div>
        <p style="font-style:italic;color:#5b4f33;font-size:14px;margin:0 auto;max-width:430px">${r.desc}</p>
        <div style="font-size:12px;color:#7c6a44;margin-top:14px">${macro}</div>
      </td></tr>
      <tr><td style="padding:18px 40px 8px">
        <h3 style="font-weight:normal;color:#8a6d2e;border-bottom:1px solid #d8c9a4;padding-bottom:6px;font-size:15px">The Plate</h3>
        <ul style="padding-left:18px;margin:10px 0;font-size:14px">${ing}</ul>
        <h3 style="font-weight:normal;color:#8a6d2e;border-bottom:1px solid #d8c9a4;padding-bottom:6px;font-size:15px;margin-top:18px">Preparation</h3>
        <ol style="padding-left:18px;margin:10px 0;font-size:14px">${steps}</ol>
        ${r.pair ? `<p style="font-style:italic;color:#7c6a44;font-size:13px;border-top:1px solid #d8c9a4;padding-top:14px;margin-top:18px;text-align:center">${r.cal ? r.pair : 'To drink — ' + r.pair}</p>` : ''}
      </td></tr>
      <tr><td style="padding:8px 40px 30px;text-align:center">
        <a href="${site}" style="display:inline-block;background:#c9a14a;color:#221d10;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:999px;font-size:14px">See more dinner ideas</a>
        <p style="color:#a89a7d;font-size:11px;margin-top:18px">You're getting this because you subscribed to Dinner Tonight.<br><a href="${site}/api/unsubscribe?email={{EMAIL}}" style="color:#a89a7d">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text = `Tonight on the Menu — ${cat}\n${r.title}\n${r.it}\n\n${r.desc}\n\n${macro}\n\nINGREDIENTS\n${r.ing.map(x => '- ' + x).join('\n')}\n\nDIRECTIONS\n${r.steps.map((x, i) => (i + 1) + '. ' + x).join('\n')}\n${r.pair ? '\nPairing: ' + r.pair : ''}\n\nMore: ${site}`;

  return { subject: `🍽 Tonight's dinner: ${r.title}`, html, text };
}
