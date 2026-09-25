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

// 1) 种子灌库：65 原始 + 342 HowToCook + 25 夜宵 = 432
const all = await req('/api/dishes/all')
assert(all.status === 200 && all.body.length === 432, `全量菜品 432 道（实际 ${all.body.length}）`)
assert(new Set(all.body.map(d => d.id)).size === all.body.length, '菜品 id 无重复')

// 2) 分类过滤 + 下架菜不出现
const veg = await req('/api/dishes?category=' + encodeURIComponent('素菜'))
assert(veg.body.length >= 60 && veg.body.every(d => d.category === '素菜'), `素菜分类过滤（${veg.body.length} 道）`)

// 3) 菜谱注入：详情接口带原料+步骤；批7 起全菜单 432/432 有做法（防"某道菜没菜谱"回归）
const d502 = await req('/api/dishes/502')
assert(d502.body.recipe?.steps?.length > 0 && d502.body.recipe.ingredients?.length > 0, '小龙虾(#502) 带原料+步骤菜谱')
const d1 = await req('/api/dishes/1')
assert(d1.body.recipe?.steps?.length > 0, '老种子菜(#1) 批7 已补做法（原 recipe=null）')

const recipes = (await import('../src/lib/seedRecipes.js')).default
const noRec = all.body.filter(d => !recipes[String(d.id)])
assert(noRec.length === 0, `每道菜都有菜谱：${all.body.length - noRec.length}/${all.body.length}${noRec.length ? ' 缺 ' + noRec.slice(0, 5).map(d => d.id + d.name).join(',') : ''}`)
const shapeBad = Object.entries(recipes).filter(([, r]) =>
  !Array.isArray(r.ingredients) || !r.ingredients.length || !Array.isArray(r.steps) || !r.steps.length ||
  !/^[★☆]{1,5}$/.test(r.difficulty || '') || !/^\d+ 大卡$/.test(r.calories || ''))
assert(shapeBad.length === 0, `菜谱字段完整（五字段合规，异常 ${shapeBad.length} 条）`)
const { default: fs } = await import('node:fs')
const serverCopy = JSON.parse(fs.readFileSync(new URL('../server/data/seed-recipes.json', import.meta.url), 'utf8'))
assert(JSON.stringify(serverCopy) === JSON.stringify(recipes), 'server 菜谱副本与前端逐字节一致（双端同源）')

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

// 6) 修 P0-3 回归位：下单 items 必须快照 category（画像/日历/成就三读取端的根因）
assert(post.body.items[0].category === d502.body.category, `订单快照分类落库（${post.body.items[0].category}）`)

// 7) 修 P0-2 回归位：愿望全链（建→补齐→PUT 回写 added_dish_id 必须持久化，
//    useClawSignals 靠 status==='added' && added_dish_id!=null 点亮娃娃机 B 层）
const wish = await req('/api/wishes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '冒烟愿望', note: '', by: 'partner' }),
})
assert(wish.status === 201 && wish.body.status === 'pending' && wish.body.added_dish_id === null, '愿望创建：pending + added_dish_id 初值 null')
const wishPut = await req(`/api/wishes/${wish.body.id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'added', added_dish_id: 502 }),
})
const wishGet = await req('/api/wishes')
const wishRow = wishGet.body.find((w) => w.id === wish.body.id)
assert(wishPut.status === 200 && wishRow?.status === 'added' && Number(wishRow?.added_dish_id) === 502, '愿望回写：added + added_dish_id 持久化（B 层链路可通电）')

console.log(failed ? `\n${failed} 项未通过` : '\n冒烟测试全部通过')
process.exitCode = failed ? 1 : 0
