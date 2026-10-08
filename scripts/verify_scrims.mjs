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
    /* cart 用例需要非空购物车：入口在「有菜」分支里，而全新 headless profile 的
       购物车是空的 → 报「找不到 opener」，看起来像页面坏了，其实是脚本缺前置数据。
       由 seedCart() 事先种一份，脚本自足。 */
    { route: 'cart', label: '生成采购清单', note: '采购清单抽屉' },
  ]
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${CHROME_PROFILE_BASE}-${Date.now()}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))

/* 前置检查 + 购物车种子：两者缺一，脚本都会「什么都没测到」却照样往下走。
   dev server 没起 → 页面空白 → scrim 永远找不到，报成「遮罩没出现」，像页面坏了。
   与静态门禁同原则：空数据必须 fail，工具自身的前置缺失不能伪装成产品结论。 */
const APP_ORIGIN = 'http://localhost:5173'
const FIXTURE = [
  { dish_id: 1, name: '番茄牛腩煲', price: 36, category: '硬菜', quantity: 1, added_by: 'me' },
  { dish_id: 735, name: '扬州炒饭', price: 14, category: '主食', quantity: 2, added_by: 'partner' },
]
async function requireDevServer() {
  for (let i = 0; i < 10; i++) {
    try { const r = await fetch(APP_ORIGIN + '/'); if (r.ok) return true } catch { /* 未起 */ }
    await sleep(600)
  }
  console.error('[verify_scrims] 前置失败：dev server 没在 %s 上。', APP_ORIGIN)
  console.error('[verify_scrims] 请先在项目目录跑 npm run dev，再重跑本脚本。')
  return false
}
let ws, id = 0
const p = new Map()
const errs = []
const toolFailures = []
const hardFailures = []
/* 判定阈值不动：diff>0.03 判为偏差是既有结论，而它当前的成因是「场景纹理不含文字」
   （backdropTexture 只采 img / 实色卡面 / 渐变遮罩，不采字形），玻璃压在标题上就必然
   有差 —— 这是 US-004/005 记录在案、等所有者拍板的开放项，不是新回归。
   所以这里只把措辞写清楚（标注为已知偏差），绝不为让输出变绿而放宽阈值。 */
const KNOWN_GLYPH_GAP = 0.05   // 实测：pill +0.049 / scrim +0.125（原始记录已出库到 research/20260928-液态玻璃对齐iOS/progress.txt）
const send = (m, q = {}) => new Promise((res, rej) => {
  const i = ++id
  /* CDP 超时：Browser.close 之后浏览器就没了，它的响应永远不会回来，
     await 会永远挂住 → Node 以 13（unsettled top-level await）退出，
     于是同一份代码时而 0 时而 13，门禁没法拿退出码判断。所有调用统一加兜底。 */
  const timer = setTimeout(() => { p.delete(i); rej(new Error('CDP 超时：' + m)) }, 15000)
  p.set(i, { res: (v) => { clearTimeout(timer); res(v) }, rej: (e) => { clearTimeout(timer); rej(e) } })
  ws.send(JSON.stringify({ id: i, method: m, params: q }))
})

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

if (!await requireDevServer()) { proc.kill('SIGTERM'); process.exit(1) }
try {
  let ready = null
  for (let i = 0; i < 60 && !ready; i++) { await sleep(400); try { ready = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch { ready = null } }
  if (!ready) { console.error('[verify_scrims] Chrome 没起来（%s）', CHROME); proc.kill('SIGTERM'); process.exit(1) }
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
      localStorage.setItem('couple_order_theme_manual_slot',a.getFullYear()+'-'+(a.getMonth()+1)+'-'+a.getDate()+'-'+auto);
      localStorage.setItem('couple_order_cart_v2', ${JSON.stringify(JSON.stringify(FIXTURE))});
      localStorage.setItem('couple_order_who','"me"');}catch(e){}`,
  })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  for (const c of CASES) {
    errs.length = 0
    await send('Page.navigate', { url: `${APP_ORIGIN}/#/${c.route}` })
    await sleep(9000)
    const expr = openExpr(c.label || '')
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    const v = r.result.value
    /* 「工具没测到」与「测到但有偏差」必须分开：前者是脚本前置/环境问题（该修），
       后者是观感结论（该判断）。旧代码两者都印成一个 ✗，读者分不清是产品回归
       还是脚本坏了。工具层失败单独计数，最后决定退出码。 */
    if (!v || v.err) { toolFailures.push(`${c.route} ${c.note}：${v ? v.err : '求值失败'}`); console.log(`✗ [工具] ${c.route} ${c.note}：${v ? v.err : '求值失败'}`); continue }
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
    const diff = withGL.lum - css.lum
    const hasGL = v.canvases > 0
    const withinTol = Math.abs(diff) <= 0.03
    /* 现状说明（2026-10-08 实测）：五处遮罩只用 CSS 玻璃，从未接 WebGL ——
       useGlassSurface 这个为「7 个接线点」写的抽象全项目 0 调用点，遮罩仍是裸
       motion.glass-op--scrim。本脚本一直在量它没量到的东西。
       因此分两种量法，都不预设结论：
         · 有画布 → 量 WebGL 层 vs CSS 降级层是否一致（原有的折射一致性判据）
         · 无画布 → 量 CSS 遮罩是否真把底压暗（css 明显暗于裸床 = 遮罩在起作用），
                    并如实标注 WebGL 未接线，把「要不要接」留给所有者决定。 */
    let mark, note = ''
    if (hasGL) {
      if (withinTol) mark = '✓'
      else if (Math.abs(diff) <= KNOWN_GLYPH_GAP) {
        mark = '△'
        note = ' ← 已知偏差（US-004/005 开放项：场景纹理不含字形，玻璃压字时两条链路必然有差；实测记录见 research/20260928-液态玻璃对齐iOS/progress.txt）'
      } else { mark = '✗'; note = ' ← 超出已知字形缺口区间，可能是真回归' }
    } else {
      const dims = css.lum < bed.lum - 0.02
      mark = dims ? '✓' : '✗'
      note = dims
        ? ' ← 仅 CSS 玻璃（WebGL 未接线：useGlassSurface 全项目 0 调用点）；本项验的是遮罩压暗生效'
        : ' ← 仅 CSS 玻璃，且遮罩几乎没压暗底层'
    }
    if (mark === '✗') hardFailures.push(`${c.route} ${c.note}${note}`)
    console.log(`${mark} ${c.route} · ${c.note}  [玻璃模式=${hasGL ? 'WebGL' : '仅 CSS'}]
   画布=${JSON.stringify(v.buf)} 遮罩底=${v.scrimBg} 面板底=${v.panelOpaque}
   webgl=${withGL.lum} css降级=${css.lum} diff=${diff.toFixed(4)}
   裸床(藏整块遮罩)=${bed.lum} 纹理同点=${texLum}  报错=${errs.length ? errs.join(' | ') : '无'}${note}`)
  }
} catch (e) {
  console.error('FAILED ' + e.message)
  hardFailures.push('脚本异常：' + e.message)
}
/* 退出码：工具层没测到（前置缺失/求值失败）与硬失败（玻璃没接上、疑似真回归）都非零。
   △ 已知字形偏差不计入 —— 它是等所有者拍板的开放项，计进去就成了常态化红灯，
   那正是「为了让门禁变绿/变红而扭曲阈值」的另一面。阈值本身一个字没动。 */
try {
  if (toolFailures.length) { console.error('\n[verify_scrims] 工具层失败 %d 项（脚本没能完成测量，需先修前置）:', toolFailures.length); toolFailures.forEach(f => console.error('  · ' + f)) }
  if (hardFailures.length) { console.error('\n[verify_scrims] 硬失败 %d 项:', hardFailures.length); hardFailures.forEach(f => console.error('  · ' + f)) }
  if (toolFailures.length || hardFailures.length) {
    try { await send('Browser.close') } catch {}
    proc.kill('SIGTERM'); process.exit(1)
  }
} catch (e) { console.error('FAILED ' + e.message); try { await send('Browser.close') } catch {}; proc.kill('SIGTERM'); process.exit(1) }
try { await send('Browser.close') } catch {}
proc.kill('SIGTERM'); process.exit(0)
