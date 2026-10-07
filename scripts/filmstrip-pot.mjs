/* filmstrip-pot.mjs —— 点「端上来」后每 160ms 截一帧，共 10 帧，拼成竖条一次看完
 * 用法：node filmstrip-pot.mjs（DEV 必须在 5173 上）
 */
import { spawn } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.join(__dirname, '..') + path.sep)
const sharp = require('sharp')

const PORT = Number(process.env.PORT || 9591)
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const OUT = 'C:/Users/87374/AppData/Local/Temp/opencode/shots'
const TMP = path.join(os.tmpdir(), 'chenguang-film')

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${TMP}-${Date.now()}`,
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(r => setTimeout(r, ms))
let ws, id = 0
const p = new Map()
const send = (m, q = {}) => new Promise((res, rej) => { const i = ++id; p.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: q })) })

try {
  let ready = null
  for (let i = 0; i < 60 && !ready; i++) { await sleep(400); try { ready = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json() } catch { ready = null } }
  ws = new WebSocket(ready.find(t => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { const x = p.get(d.id); p.delete(d.id); if (d.error) x.rej(new Error(d.error.message)); else x.res(d.result) } }
  await send('Page.enable')
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{var d=new Date(),h=d.getHours(),auto=(h>=21||h<5)?'night':'light';var a=new Date(d);if(a.getHours()<5)a.setDate(a.getDate()-1);
      localStorage.setItem('couple_order_theme','light');
      localStorage.setItem('couple_order_theme_manual_slot',a.getFullYear()+'-'+(a.getMonth()+1)+'-'+a.getDate()+'-'+auto);}catch(e){}`,
  })
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://localhost:5173/#/home' })
  await sleep(9000)
  // 滚到签名件顶部，让舞台占满视口上半
  await send('Runtime.evaluate', { expression: `window.scrollTo(0, 0); 1` })
  await sleep(600)
  await send('Runtime.evaluate', { expression: `(function(){ const b=[...document.querySelectorAll('button')].find(x=>/^端上/.test(x.getAttribute('aria-label')||'')); if(b) b.click(); return !!b })()` })
  const frames = []
  for (let i = 0; i < 10; i++) {
    await sleep(160)
    const s = await send('Page.captureScreenshot', { format: 'png' })
    frames.push(Buffer.from(s.data, 'base64'))
  }
  // 只留舞台附近：裁掉顶栏与底部（每帧取 y 330..1010）
  const thumbs = []
  for (const f of frames) {
    const t = await sharp(f).extract({ left: 0, top: 260, width: 390, height: 560 }).png().toBuffer()
    thumbs.push(t)
  }
  await sharp({ create: { width: 390 * 5, height: 560 * 2, channels: 4, background: '#2B2429' } })
    .composite(thumbs.map((t, i) => ({ input: t, left: (i % 5) * 390, top: Math.floor(i / 5) * 560 })))
    .png().toFile(`${OUT}/filmstrip.png`)
  console.log('已保存', `${OUT}/filmstrip.png`)
} catch (e) { console.error('FAILED ' + e.message); process.exitCode = 1 }
try { await Promise.race([send('Browser.close'), sleep(3000)]) } catch {}
proc.kill('SIGTERM'); process.exit(process.exitCode || 0)
