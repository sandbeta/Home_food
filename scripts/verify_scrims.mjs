/* verify_scrims.mjs —— 逐个打开遮罩，验「玻璃接上了 + 与 CSS 降级层不跳 + 无报错」
 *
 * 只点**只读的 opener**（按 aria-label 精确匹配），不点任何会写数据的按钮。
 * AddDishModal 的入口在 Admin 里与表单状态耦合，本轮不驱动它：它用的是同一个
 * useGlassSurface 接线，与已验证的三个遮罩同一行代码，差异只在宿主 className。
 *
 * 用法：node verify_scrims.mjs [light|night]
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(__dirname, '..') + path.sep)
const sharp = require('sharp')

const PORT = Number(process.env.PORT || 9481)
const THEME = process.argv[2] || 'light'
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
// 可复现基线脚本：截图落仓库内 .tmp-glass/（gitignore），chrome profile 落系统临时目录
const OUT = path.join(__dirname, '..', '.tmp-glass', 'shots')
fs.mkdirSync(OUT, { recursive: true })
const CHROME_PROFILE_BASE = path.join(os.tmpdir(), 'chenguang-glass-scrims')
const CASES = THEME === 'night'
  ? [{ route: 'home', label: null, note: '夜宵首页：深夜食堂抽屉自动开' }]
  : [
    { route: 'menu', label: '告诉他想吃什么', note: '愿望池表单' },
    { route: 'cart', label: '生成采购清单', note: '采购清单抽屉' },
  ]
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${CHROME_PROFILE_BASE}-${Date.now()}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let ws, id = 0
const p = new Map()
const errs = []
const send = (m, q = {}) => new Promise((res, rej) => { const i = ++id; p.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: q })) })

async function lum(box) {
  const s = await send('Page.captureScreenshot', { format: 'png' })
  const b = await sharp(Buffer.from(s.data, 'base64')).extract(box).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const d = b.data; let r = 0, g = 0, bl = 0, n = 0
  for (let i = 0; i < d.length; i += 3) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++ }
  const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
  const R = r / n, G = g / n, B = bl / n
  return { rgb: [Math.round(R), Math.round(G), Math.round(B)], lum: +(0.2126 * f(R) + 0.7152 * f(G) + 0.0722 * f(B)).toFixed(4) }
}

const openExpr = label => String.raw`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const label = ${JSON.stringify(label)};
  if (label) {
    const btn = [...document.querySelectorAll('button')].find(b =>
      (b.getAttribute('aria-label') || '') === label || (b.textContent || '').includes(label));
    if (!btn) return { err: '找不到 opener：' + label };
    btn.click(); await sleep(1400);
  } else await sleep(1400);
  const scrim = document.querySelector('.glass-op--scrim');
  if (!scrim) return { err: '遮罩没出现' };
  const cvs = [...scrim.querySelectorAll('canvas')];
  return {
    ok: true,
    canvases: cvs.length,
    buf: cvs.map(c => [c.width, c.height]),
    // 遮罩是通栏矩形 → 取「面板上方」那条不带内容的区域当测量窗，
    // 那里两条链路都只有「底 + 玻璃」，量出来的差才是玻璃本身的差。
    clip: { x: 40, y: 90, w: 300, h: 60 },
    scrimBg: getComputedStyle(scrim).backgroundColor,
    panelOpaque: (() => {
      const face = document.querySelector('.d3-card-face');
      return face ? getComputedStyle(face).backgroundColor : null;
    })(),
  };
})()`

try {
  let ready = null
  for (let i = 0; i < 60 && !ready; i++) { await sleep(400); try { ready = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch { ready = null } }
  ws = new WebSocket(ready.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = e => {
    const d = JSON.parse(e.data)
    if (d.method === 'Runtime.exceptionThrown') errs.push('EXCEPTION ' + JSON.stringify(d.params.exceptionDetails.exception?.description || '').slice(0, 200))
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('console.error ' + d.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200))
    if (d.id && p.has(d.id)) { const x = p.get(d.id); p.delete(d.id); if (d.error) x.rej(new Error(d.error.message)); else x.res(d.result) }
  }
  await send('Page.enable'); await send('Runtime.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{var d=new Date(),h=d.getHours(),auto=(h>=21||h<5)?'night':'light';var a=new Date(d);if(a.getHours()<5)a.setDate(a.getDate()-1);
      localStorage.setItem('couple_order_theme','${THEME}');
      localStorage.setItem('couple_order_theme_manual_slot',a.getFullYear()+'-'+(a.getMonth()+1)+'-'+a.getDate()+'-'+auto);}catch(e){}`,
  })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  for (const c of CASES) {
    errs.length = 0
    await send('Page.navigate', { url: `http://localhost:5173/#/${c.route}` })
    await sleep(9000)
    const expr = openExpr(c.label || '')
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    const v = r.result.value
    if (!v || v.err) { console.log(`✗ ${c.route} ${c.note}：${v ? v.err : '求值失败'}`); continue }
    const box = { left: v.clip.x, top: v.clip.y, width: v.clip.w, height: v.clip.h }
    const withGL = await lum(box)
    await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('canvas')].filter(c=>c.width>1&&!c.classList.contains('ambient-gl')).forEach(c=>c.style.display='none');1` })
    await sleep(400)
    const css = await lum(box)
    await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('canvas')].forEach(c=>c.style.display='');1` })
    // 再量一次「纹理同点」：GL 亮于 CSS 时，先看是纹理亮于真实页面（采集漏层），
    // 还是 shader 自己加了亮度（边缘项没关干净）。
    const tv = await send('Runtime.evaluate', {
      expression: String.raw`(async()=>{const sleep=ms=>new Promise(r=>setTimeout(r,ms));const bt=await import('/src/lib/backdropTexture.js?v='+Date.now());bt.attach();await sleep(800);const t=bt.getBackdropTexture();const o=document.createElement('canvas');o.width=t.width;o.height=t.height;o.getContext('2d').drawImage(t,0,0);return o.toDataURL('image/png').split(',')[1]})()`,
      awaitPromise: true, returnByValue: true })
    let texLum = null
    if (tv.result.value) {
      const tb = Buffer.from(tv.result.value, 'base64')
      const sc = 0.5
      const t = await sharp(tb).extract({ left: Math.round(v.clip.x * sc), top: Math.round(v.clip.y * sc),
        width: Math.round(v.clip.w * sc), height: Math.round(v.clip.h * sc) }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
      const d = t.data; let r = 0, g = 0, b = 0, n = 0
      for (let i = 0; i < d.length; i += 3) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++ }
      const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }
      texLum = +(0.2126 * f(r / n) + 0.7152 * f(g / n) + 0.0722 * f(b / n)).toFixed(4)
    }
    // 「裸床」：把整块遮罩连画布一起藏掉，量它身后真实页面
    await send('Runtime.evaluate', { expression: `document.querySelector('.glass-op--scrim').style.display='none';1` })
    await sleep(350)
    const bed = await lum(box)
    await send('Runtime.evaluate', { expression: `document.querySelector('.glass-op--scrim').style.display='';1` })
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(`${OUT}/scrim-${THEME}-${c.route}.png`, Buffer.from(shot.data, 'base64'))
    console.log(`${v.canvases > 0 && Math.abs(withGL.lum - css.lum) <= 0.03 ? '✓' : '✗'} ${c.route} · ${c.note}
   画布=${JSON.stringify(v.buf)} 遮罩底=${v.scrimBg} 面板底=${v.panelOpaque}
   webgl=${withGL.lum} css降级=${css.lum} diff=${(withGL.lum - css.lum).toFixed(4)}
   裸床(藏整块遮罩)=${bed.lum} 纹理同点=${texLum}  报错=${errs.length ? errs.join(' | ') : '无'}`)
  }
} catch (e) { console.error('FAILED ' + e.message) }
try { await send('Browser.close') } catch {}
proc.kill('SIGTERM'); process.exit(0)
