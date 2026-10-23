import { launchChrome, openAndSettle, screenshot, evaluate, closeChrome, sleep } from './cdp.mjs'
const base = process.env.BASE || 'http://localhost:5180'
const out = 'E:/tmp-lamb-shots/night'
const stamp = Date.now()
const port = 9460 + (stamp % 30)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/night${stamp}`)
const { client } = await openAndSettle({ port, url: `${base}/#/today`, wait: 2200 })
await evaluate(client, `localStorage.setItem('lamb_theme','night'); location.reload()`)
await sleep(2600)
for (const r of ['today', 'menu', 'me', 'cart']) {
  await evaluate(client, `location.hash = '#/${r}'`)
  await sleep(1000)
  await screenshot(client, `${out}/${r}.png`)
  console.log('saved', r)
}
await closeChrome(chrome)
process.exit(0)
