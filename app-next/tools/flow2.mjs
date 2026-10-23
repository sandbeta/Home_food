import { launchChrome, openAndSettle, screenshot, evaluate, closeChrome, sleep } from './cdp.mjs'

const base = process.env.BASE || 'http://localhost:5180'
const out = 'E:/tmp-lamb-shots/flow2'
const stamp = Date.now()
const port = 9700 + (stamp % 20)
const chrome = await launchChrome(port, `E:/tmp-lamb-cdp/flow2${stamp}`)
const { client } = await openAndSettle({ port, url: `${base}/#/menu`, wait: 2600 })
const errors = []
client.on('Runtime.exceptionThrown', (p) => errors.push(p?.exceptionDetails?.exception?.description || p?.exceptionDetails?.text))

async function shot(name) {
  await screenshot(client, `${out}/${name}.png`)
  console.log('saved', name)
}
async function go(hash, wait = 900) {
  await evaluate(client, `location.hash = ${JSON.stringify(hash)}`)
  await sleep(wait)
}
async function waitFor(sel, timeout = 9000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const n = await evaluate(client, `document.querySelectorAll(${JSON.stringify(sel)}).length`)
    if (n > 0) return n
    await sleep(250)
  }
  console.log('waitFor timeout:', sel)
  return 0
}

// 1. 加两道菜 → 锅巴
console.log('menu rows', await waitFor('.dish-row__add'))
await evaluate(client, `document.querySelectorAll('.dish-row__add')[0]?.click()`)
await sleep(400)
await evaluate(client, `document.querySelectorAll('.dish-row__add')[2]?.click()`)
await sleep(500)
console.log('cart badge', await evaluate(client, `document.querySelector('.dock__badge')?.textContent || 'none'`))
await go('#/cart', 900)
await waitFor('.cart-total, .empty')
await shot('cart-before-order')

// 2. 下单
console.log('cart total present', await evaluate(client, `!!document.querySelector('.cart-total .btn--primary')`))
await evaluate(client, `document.querySelector('.cart-total .btn--primary')?.click()`)
await sleep(1600)
const orderHash = await evaluate(client, 'location.hash')
await shot('order-pending')
console.log('order hash', orderHash)

// 3. 后台推进四档
await go('#/admin/orders', 1100)
for (let i = 0; i < 4; i++) {
  await evaluate(client, `document.querySelector('.admin-order .btn--honey')?.click()`)
  await sleep(850)
}
await shot('admin-order-done')

// 4. 回订单详情评分
await go(orderHash, 1000)
await shot('order-completed')
await evaluate(client, `document.querySelector('.order-item__rate')?.click()`)
await sleep(500)
await shot('rating-dialog')
await evaluate(client, `document.querySelectorAll('.rating-star')[4]?.click()`)
await sleep(200)
await evaluate(client, `document.querySelector('.dialog__actions .btn--primary')?.click()`)
await sleep(900)
await shot('order-rated')

// 5. 冰箱加一样
await go('#/fridge', 900)
await evaluate(client, `(() => { const inp = document.querySelector('.fridge-add .field__input'); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; setter.call(inp, '鸡蛋'); inp.dispatchEvent(new Event('input', { bubbles: true })); })()`)
await sleep(200)
await evaluate(client, `document.querySelector('.fridge-add__btn')?.click()`)
await sleep(500)
await shot('fridge')

// 6. 弹层外观
await go('#/menu', 900)
await evaluate(client, `document.querySelector('[aria-label="许个愿"]')?.click()`)
await sleep(500)
await shot('wish-dialog')
await evaluate(client, `document.querySelector('.dialog__actions .btn--ghost')?.click()`)
await sleep(300)
await go('#/admin/dishes', 1000)
await evaluate(client, `document.querySelector('[aria-label="加一道菜"]')?.click()`)
await sleep(500)
await shot('admin-dish-form')
await evaluate(client, `document.querySelector('.dialog__actions .btn--ghost')?.click()`)
await sleep(300)

// 7. 四种角色状态（仅 dev 生效的 ?pose= 调试口）
for (const p of ['pray', 'play', 'bath', 'busy', 'steal']) {
  await go(`#/today?pose=${p}`, 900)
  await shot(`pose-${p}`)
}

// 8. 夜间空锅巴
await evaluate(client, `localStorage.setItem('lamb_theme','night'); localStorage.setItem('couple_order_cart_v2','[]')`)
await go('#/cart', 1200)
await shot('cart-night-empty')

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no runtime errors')
await closeChrome(chrome)
process.exit(0)
