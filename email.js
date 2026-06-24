// Build the daily FULL-MENU email (Appetizer, Main, Side, Dessert).
import { CATS, todaysMenu } from './recipes.js';

function courseBlock(label, r){
  const ing = r.ing.map(x => `<li style="margin:3px 0;color:#3c3320">${x}</li>`).join('');
  const steps = r.steps.map(x => `<li style="margin:5px 0;color:#3c3320;line-height:1.5">${x}</li>`).join('');
  const meta = r.cal ? `${r.time} · ${r.level} · ~${r.cal} cal${r.protein ? ' · ' + r.protein : ''}` : `${r.time} · ${r.level} · serves ${r.serves}`;
  return `<tr><td style="padding:22px 40px 6px;border-top:1px solid #e3d8bd">
    <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#9a7d3c">${label}</div>
    <div style="font-family:Georgia,serif;font-size:23px;color:#2c2517;margin:4px 0 2px">${r.emoji} ${r.title}</div>
    <div style="font-style:italic;color:#7c6a44;font-size:13px">${r.it} · ${CATS[r.cat].label}</div>
    <p style="color:#5b4f33;font-size:13.5px;margin:8px 0 4px">${r.desc}</p>
    <div style="font-size:11px;color:#8a7c5c;margin-bottom:6px">${meta}</div>
  </td></tr>
  <tr><td style="padding:0 40px 14px">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2e;margin:6px 0 4px">Ingredients</div>
    <ul style="padding-left:18px;margin:0 0 10px;font-size:13px">${ing}</ul>
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8a6d2e;margin:6px 0 4px">Preparation</div>
    <ol style="padding-left:18px;margin:0;font-size:13px">${steps}</ol>
    ${r.pair && !r.cal ? `<p style="font-style:italic;color:#7c6a44;font-size:12.5px;margin-top:10px">To drink — ${r.pair}</p>` : ''}
  </td></tr>`;
}

export function buildEmail(_ignored, site = 'https://dinner-tonight-daily.vercel.app'){
  const m = todaysMenu();
  const blocks = [
    courseBlock('Appetizer', m.appetizer),
    courseBlock('Main Course', m.main),
    courseBlock('Side', m.side),
    courseBlock('Dessert', m.dessert)
  ].join('');

  const html = `<!DOCTYPE html><html><body style="margin:0;background:#16140f;padding:24px 0;font-family:Georgia,'Times New Roman',serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:#f6f0e2;border:1px solid #c9b78d;border-radius:12px;overflow:hidden">
      <tr><td style="padding:32px 40px 8px;text-align:center">
        <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#9a7d3c">Tonight's Prix Fixe · For Two</div>
        <h1 style="font-weight:normal;font-size:32px;color:#2c2517;margin:10px 0 4px;letter-spacing:.04em">This Evening's Menu</h1>
        <div style="font-style:italic;color:#7c6a44;font-size:13px">Four courses, chosen for tonight</div>
        <div style="color:#b08d3f;margin:14px 0 2px">&#10022; &#10022; &#10022;</div>
      </td></tr>
      ${blocks}
      <tr><td style="padding:18px 40px 32px;text-align:center;border-top:1px solid #e3d8bd">
        <a href="${site}" style="display:inline-block;background:#c9a14a;color:#221d10;text-decoration:none;font-weight:bold;padding:12px 26px;border-radius:999px;font-size:14px">See more dinner ideas</a>
        <p style="color:#a89a7d;font-size:11px;margin-top:18px">You're getting this because you subscribed to Dinner Tonight.<br><a href="${site}/api/unsubscribe?email={{EMAIL}}" style="color:#a89a7d">Unsubscribe</a></p>
      </td></tr>
    </table>
  </td></tr></table></body></html>`;

  const text = `TONIGHT'S MENU — Four courses\n\n` +
    [['Appetizer', m.appetizer], ['Main Course', m.main], ['Side', m.side], ['Dessert', m.dessert]]
      .map(([l, r]) => `${l.toUpperCase()}: ${r.title} (${CATS[r.cat].label})\n${r.desc}\nIngredients: ${r.ing.join('; ')}\nSteps: ${r.steps.map((x, i) => (i + 1) + '. ' + x).join(' ')}`)
      .join('\n\n') + `\n\nMore: ${site}`;

  return { subject: `🍽 Tonight's menu: ${m.main.title} + 3 courses`, html, text };
}
