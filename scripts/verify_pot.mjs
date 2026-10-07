/* verify-pot.mjs —— PotReveal 定向核查：reduced-motion 连点是否换菜 + 揭榜是否加购
 * 用法：node verify-pot.mjs [light|night]
 * 判据：连点两次「端上来」，抓到的菜名必须不同（reduced 用户不演动画但必须换菜）。
 */
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'

const PORT = Number(process.env.PORT || 9451)
const THEME = process.argv[2] || 'light'
const REDUCED = process.argv[3] === 'reduced'
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const TMP = path.join(os.tmpdir(), 'chenguang-verify-pot')

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TMP}-${Date.now()}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let ws, id = 0
const p = new Map()
const errs = []
const send = (m, q = {}) => new Promise((res, rej) => { const i = ++id; p.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: q })) })

try {
  let ready = null
  for (let i = 0; i < 60 && !ready; i++) { await sleep(400); try { ready = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch { ready = null } }
  ws = new WebSocket(ready.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = e => {
    const d = JSON.parse(e.data)
    if (d.method === 'Runtime.exceptionThrown') errs.push('EXCEPTION ' + JSON.stringify(d.params.exceptionDetails.exception?.description || '').slice(0, 160))
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('console.error ' + d.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 160))
    if (d.id && p.has(d.id)) { const x = p.get(d.id); p.delete(d.id); if (d.error) x.rej(new Error(d.error.message)); else x.res(d.result) }
  }
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{var d=new Date(),h=d.getHours(),auto=(h>=21||h<5)?'night':'light';var a=new Date(d);if(a.getHours()<5)a.setDate(a.getDate()-1);
      localStorage.setItem('couple_order_theme','${THEME}');
      localStorage.setItem('couple_order_theme_manual_slot',a.getFullYear()+'-'+(a.getMonth()+1)+'-'+a.getDate()+'-'+auto);}catch(e){}`,
  })
  if (REDUCED) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' })
  await sleep(9000)

  const r = await send('Runtime.evaluate', {
    expression: String.raw`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const btn = () => [...document.querySelectorAll('button')].find(b => /^端上/.test(b.getAttribute('aria-label')||''));
      const plateName = () => { const n = document.querySelector('[aria-label^="掀开笼盖"]'); return n ? n.getAttribute('aria-label') : null; };
      const cartCount = () => { try { return JSON.parse(localStorage.getItem('couple_order_cart_v2')||'[]').reduce((n,i)=>n+(i.quantity||0),0); } catch(e){ return -1 } };
      const b = btn(); if (!b) return { err: '找不到「端上来」按钮' };
      const out = { reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, first: plateName(), cart0: cartCount() };
      b.click(); await sleep(3600);
      out.after1 = plateName(); out.cart1 = cartCount();
      const b2 = btn(); if (b2) b2.click(); await sleep(3600);
      out.after2 = plateName(); out.cart2 = cartCount();
      return out;
    })()`,
    awaitPromise: true, returnByValue: true,
  })
  const v = r.result.value
  if (!v || v.err) { console.log('✗ 无效：', v ? v.err : '求值失败'); process.exitCode = 1 }
  else {
    const rotated = v.after1 && v.after2 && v.after1 !== v.after2
    const added = v.cart2 > v.cart0
    console.log(`${rotated && added && !errs.length ? '✓' : '✗'} theme=${THEME} reducedMotion=${v.reduced}`);
    console.log(`   菜名 ${v.first} → ${v.after1} → ${v.after2}`);
    console.log(`   连点换菜=${rotated ? '是' : '否'}  购物车 ${v.cart0}→${v.cart1}→${v.cart2}（加购=${added ? '是' : '否'}）`);
    if (errs.length) console.log('   报错：' + errs.join(' | '));
    if (!rotated || !added || errs.length) process.exitCode = 1
  }
} catch (e) { console.error('FAILED ' + e.message); process.exitCode = 1 }
/* 关浏览器：CDP 的 Browser.close 在页面已被前面异常带崩时会永不 settle，
   不设上限会让脚本挂成 "unsettled top-level await"（实测踩到），故给 3s 兜底。 */
try { await Promise.race([send('Browser.close'), sleep(3000)]) } catch {}
proc.kill('SIGTERM'); process.exit(process.exitCode || 0)