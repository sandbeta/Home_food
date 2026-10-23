import { launchChrome, openAndSettle, evaluate, closeChrome, sleep } from './cdp.mjs'

const base = process.env.BASE || 'http://localhost:5180'
const stamp = Date.now()
const port = 9520 + (stamp % 30)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/audit${stamp}`)
const { client } = await openAndSettle({ port, url: `${base}/#/today`, wait: 2200 })

const CART = JSON.stringify([
  { dish_id: 1, name: '番茄牛腩煲', price: 28, category: '硬菜', quantity: 1, added_by: 'me' },
  { dish_id: 3, name: '可乐鸡翅', price: 22, category: '家常菜', quantity: 2, added_by: 'partner' },
])

const contrastExpr = `(() => {
  const lum = (c) => { const k = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2] };
  const parse = (s) => { const m = s.match(/[\\d.]+/g); return m ? m.slice(0, 3).map(Number) : null };
  const effBg = (el) => { let n = el; while (n && n !== document.documentElement) { const cs = getComputedStyle(n); const bg = parse(cs.backgroundColor); const alpha = cs.backgroundColor.includes('rgba') ? Number(cs.backgroundColor.match(/[\\d.]+/g)[3]) : 1; if (bg && alpha > 0.05) return bg; n = n.parentElement; } return [255, 255, 255] };
  const out = [];
  document.querySelectorAll('.app *').forEach((el) => {
    if (el.closest('.sr-only')) return;
    if (el.tagName === 'OPTION') return;
    const own = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).map(n => n.textContent.trim());
    if (!own.length) return;
    if (!/[\\u4e00-\\u9fa5A-Za-z0-9]/.test(own.join(''))) return;
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.15) return;
    if (rect.width <= 1 || rect.height <= 1) return;
    const fg = parse(cs.color); if (!fg) return;
    const bg = effBg(el);
    const lf = lum(fg), lb = lum(bg);
    const ratio = (Math.max(lf, lb) + 0.05) / (Math.min(lf, lb) + 0.05);
    const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    out.push({ t: own.join(' ').slice(0, 24), sel: typeof el.className === 'string' ? el.className : el.tagName, px: Math.round(px), r: Number(ratio.toFixed(2)), need, ok: ratio >= need, fg: 'rgb(' + fg.map(Math.round).join(',') + ')', bg: 'rgb(' + bg.map(Math.round).join(',') + ')' });
  });
  return out;
})()`

const tapExpr = `(() => {
  const out = [];
  document.querySelectorAll('button, a[href], input, textarea, select, [role="switch"], [role="button"]').forEach((el) => {
    if (el.closest('.sr-only') || el.dataset.hit === '44') return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = el.getBoundingClientRect();
    if (r.width <= 1 || r.height <= 1) return;
    const labels = el.labels ? [...el.labels].map((l) => l.innerText).join(' ').trim() : '';
    const name = (el.getAttribute('aria-label') || labels || el.getAttribute('placeholder') || el.innerText || el.value || '').trim().slice(0, 24);
    const bad = r.width < 44 || r.height < 44;
    const noName = !name;
    if (bad || noName) out.push({ tag: el.tagName, cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '', w: Math.round(r.width), h: Math.round(r.height), bad, noName, name });
  });
  return out;
})()`

const overflowExpr = `(() => ({ doc: document.documentElement.scrollWidth, win: innerWidth }))()`

const routes = ['today', 'menu', 'cart', 'me', 'orders', 'fridge', 'admin', 'admin/dishes']
const report = []

for (const theme of ['day', 'night']) {
  await evaluate(client, `localStorage.setItem('lamb_theme', ${JSON.stringify(theme)}); localStorage.setItem('couple_order_cart_v2', ${JSON.stringify(CART)})`)
  await client.send('Page.navigate', { url: `${base}/?v=${Date.now()}#/today` })
  await sleep(3200)
  for (const route of routes) {
    await evaluate(client, `location.hash = '#/${route}'`)
    await sleep(900)
    const contrast = await evaluate(client, contrastExpr)
    const taps = await evaluate(client, tapExpr)
    const overflow = await evaluate(client, overflowExpr)
    const bad = contrast.filter((x) => !x.ok)
    report.push({ theme, route, texts: contrast.length, bad, taps, overflow })
    console.log(`${theme} ${route}: texts=${contrast.length} bad=${bad.length} tapIssues=${taps.length} overflow=${overflow.doc > overflow.win ? 'YES' : 'no'}`)
    for (const b of bad.sort((a, b) => a.r - b.r).slice(0, 12)) {
      console.log(`   ${b.r}:1 need ${b.need} ${b.px}px ${b.sel} 「${b.t}」 fg ${b.fg} bg ${b.bg}`)
    }
    for (const t of taps.slice(0, 10)) {
      console.log(`   tap ${t.bad ? `${t.w}x${t.h}` : 'size-ok'} ${t.noName ? 'NO-NAME' : ''} ${t.tag}.${t.cls} 「${t.name}」`)
    }
  }
}

await closeChrome(chrome)
process.exit(0)
