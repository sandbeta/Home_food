// mockApi 冒烟测试 —— 直接 node scripts/test_mockApi.mjs 运行（无需测试框架）。
// 以 stub 的 localStorage/location 装载真实 mockApi，验证种子灌库、分类过滤、
// 菜谱懒注入、下单总价与订单列表等核心链路。
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)) },
}
globalThis.location = { origin: 'http://localhost:5173' }
globalThis.window = globalThis

let failed = 0
const assert = (cond, msg) => {
  if (cond) console.log('✓', msg)
  else { console.error('✗', msg); failed++ }
}

const { installMockApi } = await import('../src/lib/mockApi.js')
installMockApi()

const req = async (path, init) => {
  const res = await window.fetch(path, init)
  return { status: res.status, body: await res.json() }
}

// 1) 种子灌库：65 原始 + 342 HowToCook = 407
const all = await req('/api/dishes/all')
assert(all.status === 200 && all.body.length === 407, `全量菜品 407 道（实际 ${all.body.length}）`)
assert(new Set(all.body.map(d => d.id)).size === all.body.length, '菜品 id 无重复')

// 2) 分类过滤 + 下架菜不出现
const veg = await req('/api/dishes?category=' + encodeURIComponent('素菜'))
assert(veg.body.length >= 60 && veg.body.every(d => d.category === '素菜'), `素菜分类过滤（${veg.body.length} 道）`)

// 3) 菜谱懒注入：HowToCook 菜带步骤，老种子菜为 null
const d502 = await req('/api/dishes/502')
assert(d502.body.recipe?.steps?.length > 0 && d502.body.recipe.ingredients?.length > 0, '小龙虾(#502) 带原料+步骤菜谱')
const d1 = await req('/api/dishes/1')
assert(d1.body.recipe === null, '老种子菜(#1) recipe=null')

// 4) 下单链路：总价按服务端菜价重算
const post = await req('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: [{ dish_id: 502, quantity: 2, added_by: 'me' }], note: '冒烟测试', payer: 'me' }),
})
assert(post.status === 201 && post.body.total_price === d502.body.price * 2, `下单成功，总价=菜价×数量（${post.body.total_price}）`)

// 5) 订单列表 + 状态推进
const orders = await req('/api/orders')
assert(orders.body.length === 1 && orders.body[0].status === 'pending', '订单列表可见新订单')
const advanced = await req(`/api/orders/${post.body.id}/status`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'preparing' }),
})
assert(advanced.body.status === 'preparing', '状态推进 pending→preparing')

console.log(failed ? `\n${failed} 项未通过` : '\n冒烟测试全部通过')
process.exitCode = failed ? 1 : 0
