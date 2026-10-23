import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launchChrome(port = 9333, profileDir = 'E:/tmp-lamb-cdp/profile') {
  await fs.mkdir(profileDir, { recursive: true })
  const child = spawn(CHROME, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-search-engine-choice-screen',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    'about:blank',
  ], { stdio: 'ignore', detached: false })
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`)
      if (r.ok) return { child, port }
    } catch { /* not up yet */ }
    await sleep(150)
  }
  throw new Error('Chrome CDP did not come up')
}

export async function newPage(port, url = 'about:blank') {
  const r = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!r.ok) throw new Error(`new tab failed ${r.status}`)
  const tab = await r.json()
  return tab.webSocketDebuggerUrl
}

export function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    const pending = new Map()
    const listeners = new Map()
    let id = 0
    ws.onopen = () => resolve({
      send(method, params = {}) {
        return new Promise((res, rej) => {
          const mid = ++id
          pending.set(mid, { res, rej })
          ws.send(JSON.stringify({ id: mid, method, params }))
        })
      },
      on(method, fn) {
        if (!listeners.has(method)) listeners.set(method, [])
        listeners.get(method).push(fn)
      },
      close() { try { ws.close() } catch {} },
    })
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data)
      if (msg.id) {
        const p = pending.get(msg.id)
        if (!p) return
        pending.delete(msg.id)
        if (msg.error) p.rej(new Error(msg.error.message || JSON.stringify(msg.error)))
        else p.res(msg.result)
        return
      }
      for (const fn of listeners.get(msg.method) || []) fn(msg.params)
    }
    ws.onerror = () => reject(new Error('ws error'))
  })
}

export async function evaluate(client, expression) {
  const r = await client.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'evaluate failed')
  return r.result?.value
}

export async function openAndSettle({ port, url, width = 390, height = 844, dpr = 2, wait = 2200 }) {
  const wsUrl = await newPage(port, 'about:blank')
  const client = await connect(wsUrl)
  await client.send('Page.enable')
  await client.send('Runtime.enable')
  await client.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: dpr,
    mobile: true,
    screenOrientation: { type: 'portraitPrimary', angle: 0 },
  })
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
  await client.send('Page.navigate', { url })
  await sleep(wait)
  return { client, wsUrl }
}

export async function screenshot(client, file, { full = false, width = 390 } = {}) {
  if (full) {
    const h = await evaluate(client, 'document.documentElement.scrollHeight')
    const vh = Math.max(Number(h) || 0, 844)
    await client.send('Emulation.setDeviceMetricsOverride', {
      width, height: vh, deviceScaleFactor: 2, mobile: true,
      screenOrientation: { type: 'portraitPrimary', angle: 0 },
    })
    await sleep(250)
  }
  const r = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true })
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, Buffer.from(r.data, 'base64'))
  return file
}

export async function closeChrome({ child }) {
  try { child.kill('SIGKILL') } catch {}
  await sleep(150)
}

export { sleep }
