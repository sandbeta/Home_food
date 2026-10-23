import { launchChrome, openAndSettle, screenshot, closeChrome, sleep } from './cdp.mjs'

const base = process.env.BASE || 'http://localhost:5180'
const outDir = process.env.OUT || 'E:/tmp-lamb-shots'
const stamp = Date.now()
const port = 9350 + (stamp % 40)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/p${stamp}`)

const routes = (process.argv.slice(2).length ? process.argv.slice(2) : ['today', 'menu', 'me', 'orders', 'fridge'])
const errors = []

for (const route of routes) {
  const url = `${base}/#/${route}`
  const { client } = await openAndSettle({ port, url, wait: 2600 })
  client.on('Runtime.exceptionThrown', (p) => {
    errors.push(`[${route}] ${p?.exceptionDetails?.text || 'exception'} ${p?.exceptionDetails?.exception?.description || ''}`)
  })
  client.on('Runtime.consoleAPICalled', (p) => {
    if (p.type === 'error') errors.push(`[${route}] console.error ${p.args?.map((a) => a.value || a.description).join(' ')}`)
  })
  const height = await client.send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })
  const shot = `${outDir}/${route}.png`
  await screenshot(client, shot, { full: false })
  console.log(`saved ${shot} | scrollHeight=${height.result.value}`)
  client.close()
  await sleep(150)
}

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no runtime errors')
await closeChrome(chrome)
process.exit(0)
