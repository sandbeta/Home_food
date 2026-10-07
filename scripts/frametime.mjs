/* frametime.mjs —— 滚动 3 秒的帧时基线 + 一次纹理重画的成本
 *
 * ⚠ 这台机器上跑的是 headless + swiftshader（软件光栅化 WebGL），**绝对帧时不能当
 *   真机基线读** —— 它只用来回答两个问题：①纹理重画本身是不是瓶颈；②哪些开销随
 *   玻璃数量增长。真机数字要在手机上用 performance panel 另测。
 *
 * 用户已决定「一律上 WebGL、不做低端机降级」，所以这里**只记录不设门槛**：
 * 把帧时与 p95 落成可复跑的数字，将来真机掉帧时有基线可比，而不是凭印象。
 *
 * 用法：node frametime.mjs [light|night] [route]
 */
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 9491)
const THEME = process.argv[2] || 'light'
const ROUTE = '#/' + String(process.argv[3] || 'menu').replace(/^#?\/?/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
// 可复现基线脚本：chrome profile 落系统临时目录，免硬编码旧 Qoder 绝对路径
const TMP = path.join(os.tmpdir(), 'chenguang-glass-frametime')
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TMP}/ft-${Date.now()}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let ws, id = 0
const p = new Map()
const send = (m, q = {}) => new Promise((res, rej) => { const i = ++id; p.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: q })) })

const expr = String.raw`(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(1500);
  const bt = await import('/src/lib/backdropTexture.js?v=' + Date.now());
  bt.attach(); await sleep(400);
  // ① 一次「变脏 → 整张纹理重画」的同步成本（含采集几何 + 画渐变/图片/遮罩）
  const repaints = [];
  for (let i = 0; i < 12; i++) {
    window.scrollBy(0, 7);
    bt.markDirty();                   // 必须显式置脏：passive scroll 回调在下一帧才跑，
                                      // 不置脏的话这里量到的是「直接返回缓存」的 0ms
    const t0 = performance.now();
    bt.getBackdropTexture();          // dirty 时同步重画
    repaints.push(performance.now() - t0);
    await sleep(30);
  }
  // ② 连续滚动 3 秒的真实帧间隔（含 React 测量循环 + 两块玻璃各画一帧）
  const frames = [];
  let last = performance.now(); let stop = performance.now() + 3000; let y = window.scrollY;
  await new Promise(res => {
    const tick = () => {
      const now = performance.now(); frames.push(now - last); last = now;
      y += 9; window.scrollTo(0, y);
      if (now < stop) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  const stat = a => {
    const s = [...a].sort((x, y2) => x - y2);
    const q = f => +s[Math.min(s.length - 1, Math.floor(s.length * f))].toFixed(2);
    return { n: s.length, mean: +(s.reduce((x, y2) => x + y2, 0) / s.length).toFixed(2), p50: q(0.5), p95: q(0.95), max: q(1) };
  };
  return {
    glCanvases: [...document.querySelectorAll('canvas')].filter(c => c.width > 1 && !c.classList.contains('ambient-gl')).length,
    texSize: (() => { const t = bt.getBackdropTexture(); return t ? [t.width, t.height] : null })(),
    repaint: stat(repaints.slice(1)),   // 丢掉第一次（含首帧建 canvas）
    frame: stat(frames.slice(2)),
    dpr: window.devicePixelRatio,
  };
})()`

try {
  let ready = null
  for (let i = 0; i < 60 && !ready; i++) { await sleep(400); try { ready = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch { ready = null } }
  ws = new WebSocket(ready.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { const x = p.get(d.id); p.delete(d.id); if (d.error) x.rej(new Error(d.error.message)); else x.res(d.result) } }
  await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{var d=new Date(),h=d.getHours(),auto=(h>=21||h<5)?'night':'light';var a=new Date(d);if(a.getHours()<5)a.setDate(a.getDate()-1);
      localStorage.setItem('couple_order_theme','${THEME}');
      localStorage.setItem('couple_order_theme_manual_slot',a.getFullYear()+'-'+(a.getMonth()+1)+'-'+a.getDate()+'-'+auto);}catch(e){}`,
  })
  // deviceScaleFactor=2：真手机是 2/3 倍图，画布 buffer 尺寸按它算，测出来的帧时才可比
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url: `http://localhost:5173/${ROUTE}` })
  await sleep(9000)
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
  console.log(THEME, ROUTE, JSON.stringify(r.result.value, null, 1))
} catch (e) { console.error('FAILED ' + e.message) }
try { await send('Browser.close') } catch {}
proc.kill('SIGTERM'); process.exit(0)
