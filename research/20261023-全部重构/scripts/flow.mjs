import { launchChrome, openAndSettle, screenshot, evaluate, closeChrome, sleep } from './cdp.mjs'

const base = process.env.BASE || 'http://localhost:5180'
const out = process.env.OUT || 'E:/tmp-lamb-shots/flow'
const stamp = Date.now()
const port = 9420 + (stamp % 30)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/flow${stamp}`)
const { client } = await openAndSettle({ port, url: `${base}/#/menu`, wait: 2500 })
const errors = []
client.on('Runtime.exceptionThrown', (p) => errors.push(p?.exceptionDetails?.exception?.description || p?.exceptionDetails?.text))

async function shot(name, opts = {}) {
  await screenshot(client, `${out}/${name}.png`, opts)
  console.log('saved', name)
}

// 1. 打开第一道菜的详情面板
await evaluate(client, `document.querySelector('.dish-row__main')?.click()`)
await sleep(800)
await shot('dish-sheet')

// 2. 加两份不同菜，回锅巴
await evaluate(client, `document.querySelector('.dish-sheet__body .btn--primary')?.click()`)
await sleep(600)
await evaluate(client, `document.querySelectorAll('.dish-row__add')[1]?.click()`)
await sleep(500)
await evaluate(client, `document.querySelectorAll('.dish-row__add')[3]?.click()`)
await sleep(500)
await evaluate(client, `location.hash = '#/cart'`)
await sleep(900)
await shot('cart')

// 3. 下单，落到订单详情
await evaluate(client, `document.querySelector('.cart-total .btn--primary')?.click()`)
await sleep(1400)
await shot('order-detail')
console.log('after order:', await evaluate(client, 'location.hash'))

// 4. 订单列表 / 后台
await evaluate(client, `location.hash = '#/orders'`)
await sleep(900)
await shot('orders')
await evaluate(client, `location.hash = '#/admin'`)
await sleep(900)
await shot('admin')
await evaluate(client, `location.hash = '#/admin/dishes'`)
await sleep(900)
await shot('admin-dishes')

// 5. 320px 档
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 320, height: 700, deviceScaleFactor: 2, mobile: true,
  screenOrientation: { type: 'portraitPrimary', angle: 0 },
})
await evaluate(client, `location.hash = '#/today'`)
await sleep(900)
await shot('today-320')
const overflow = await evaluate(client, `(() => {
  const d = document.documentElement;
  const els = [...document.querySelectorAll('*')];
  const bad = els.filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX === 'visible')
    .slice(0, 8).map((el) => el.className || el.tagName);
  return { doc: d.scrollWidth, win: innerWidth, bad };
})()`)
console.log('320 overflow check:', JSON.stringify(overflow))
await evaluate(client, `location.hash = '#/menu'`)
await sleep(900)
await shot('menu-320')

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no runtime errors')
await closeChrome(chrome)
process.exit(0)
