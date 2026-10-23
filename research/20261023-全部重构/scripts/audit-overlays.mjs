import { launchChrome, openAndSettle, evaluate, closeChrome, sleep } from './cdp.mjs'

const base = process.env.BASE || 'http://localhost:5180'
const stamp = Date.now()
const port = 9560 + (stamp % 20)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/overlay${stamp}`)
const { client } = await openAndSettle({ port, url: `${base}/#/menu`, wait: 2400 })

const conExpr = (scope) => `(() => {
  const lum = (c) => { const k = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2] };
  const parse = (s) => { const m = s.match(/[0-9.]+/g); return m ? m.slice(0, 3).map(Number) : null };
  const effBg = (el) => { let n = el; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); const bg = parse(cs.backgroundColor); const alpha = cs.backgroundColor.includes('rgba') ? Number(cs.backgroundColor.match(/[0-9.]+/g)[3]) : 1; if (bg && alpha > 0.05) return bg; n = n.parentElement; } return [255, 255, 255] };
  const out = [];
  document.querySelectorAll('${scope} *').forEach((el) => {
    if (el.closest('.sr-only') || el.tagName === 'OPTION') return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim());
    if (!own.length || !/[\u4e00-\u9fa5A-Za-z0-9]/.test(own.join(''))) return;
    const cs = getComputedStyle(el); const rect = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.15 || rect.width <= 1 || rect.height <= 1) return;
    const fg = parse(cs.color); if (!fg) return; const bg = effBg(el);
    const lf = lum(fg), lb = lum(bg); const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700; const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    out.push({ t: own.join(' ').slice(0, 20), sel: typeof el.className === 'string' ? el.className : el.tagName, px: Math.round(px), r: Number(ratio.toFixed(2)), need, ok: ratio >= need });
  });
  return out;
})()`

const tapExpr = (scope) => `(() => {
  const out = [];
  document.querySelectorAll('${scope} button, ${scope} a[href], ${scope} input, ${scope} textarea, ${scope} select, ${scope} [role="switch"]').forEach((el) => {
    if (el.closest('.sr-only') || el.dataset.hit === '44') return;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) return;
    const labels = el.labels ? [...el.labels].map((l) => l.innerText).join(' ').trim() : '';
    const name = (el.getAttribute('aria-label') || labels || el.getAttribute('placeholder') || el.innerText || el.value || '').trim().slice(0, 24);
    if (r.width < 44 || r.height < 44 || !name) out.push({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className.slice(0, 36) : '', w: Math.round(r.width), h: Math.round(r.height), name });
  });
  return out;
})()`

async function audit(scope, label) {
  const con = await evaluate(client, conExpr(scope))
  const taps = await evaluate(client, tapExpr(scope))
  const bad = con.filter((x) => !x.ok)
  console.log(`${label}: texts=${con.length} bad=${bad.length} taps=${taps.length}`)
  for (const b of bad) console.log(`   ${b.r}:1 need ${b.need} ${b.px}px ${b.sel} 「${b.t}」`)
  for (const t of taps) console.log(`   tap ${t.w}x${t.h} ${t.tag}.${t.cls} 「${t.name}」`)
}

for (const theme of ['day', 'night']) {
  await evaluate(client, `localStorage.setItem('lamb_theme', ${JSON.stringify(theme)})`)
  await client.send('Page.navigate', { url: `${base}/?v=${Date.now()}#/menu` })
  await sleep(3200)
  // 许愿弹层
  const opened = await evaluate(client, `(() => { const b = document.querySelector('[aria-label="许个愿"]'); if (!b) return 'no-button'; b.click(); return 'clicked' })()`)
  await sleep(600)
  console.log(`${theme} wish open:`, opened, 'dialogs=', await evaluate(client, `document.querySelectorAll('.dialog').length`))
  await audit('.dialog', `${theme} wish-dialog`)
  await evaluate(client, `document.querySelector('.dialog__actions .btn--ghost')?.click()`)
  await sleep(300)
  // 菜品面板
  await evaluate(client, `document.querySelector('.dish-row__main')?.click()`)
  await sleep(900)
  console.log(`${theme} sheet count:`, await evaluate(client, `document.querySelectorAll('.sheet').length`))
  await audit('.sheet', `${theme} dish-sheet`)
  await evaluate(client, `document.querySelector('.dish-sheet__close')?.click()`)
  await sleep(300)
  // 后台加菜表单
  await evaluate(client, `location.hash = '#/admin/dishes'`)
  await sleep(1400)
  await evaluate(client, `document.querySelector('[aria-label="加一道菜"]')?.click()`)
  await sleep(600)
  console.log(`${theme} form dialogs:`, await evaluate(client, `document.querySelectorAll('.dialog').length`))
  await audit('.dialog', `${theme} dish-form`)
}

await closeChrome(chrome)
process.exit(0)
