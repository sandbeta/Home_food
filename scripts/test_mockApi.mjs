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

// 8) 批 9 新增 · 星级评分 ratings（与家庭服务端同口径）
{
  const empty = await req('/api/ratings')
  assert(empty.status === 200 && Array.isArray(empty.body) && empty.body.length === 0, 'ratings 初值空表（老 state 兼容补齐）')

  const bad1 = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 999999, stars: 5 }) })
  assert(bad1.status === 400, '查无此菜 → 400')
  const bad2 = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: '不难' }) })
  assert(bad2.status === 400, '星级非法 → 400')

  const r1 = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: 5, note: '绝了', by: 'partner', order_id: post.body.id }) })
  assert(r1.status === 201 && r1.body.stars === 5 && r1.body.dish_name === d502.body.name && r1.body.by === 'partner' && r1.body.order_id === post.body.id, '打分落库：快照菜名/人格/订单号')
  const r2 = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: 4.5 }) })
  await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: 5 }) })
  const r4 = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: 5 }) })
  assert(r2.body.stars === 4.5, '半星可存')
  const one = await req('/api/ratings?dish_id=502')
  assert(one.body.length === 4 && one.body[0].id === r4.body.id, '按菜过滤 + 新记录在前')
  const clipped = await req('/api/ratings?limit=2')
  assert(clipped.status === 200 && clipped.body.length === 2, 'limit 生效')
  assert(one.body.filter(x => x.stars === 5).length === 3, '同一道菜攒到 3 颗五星（拿手菜门槛数据就位）')
  const dirty = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dish_id: 502, stars: 9, note: 'x'.repeat(200) }) })
  assert(dirty.body.stars === 5 && dirty.body.note.length === 60, '越界星级钳到 5、评语截断 60 字')

  /* 双轨一致性护栏（2026-09-27 复核补）：null / 空串 / 缺字段 必须 400，不能被 Number(null)===0
     钳成 1 星静默落库（污染均分）。家庭服务端 server/index.cjs 的 normStars 是本文件
     normalizeStars 的 CJS 手抄副本，正是漏过这挡板才出的分歧，故此处逐条钉住。 */
  const beforeDirty = (await req('/api/ratings')).body.length
  for (const [label, stars] of [['stars:null', null], ['stars:空串', ''], ['stars:缺字段', undefined], ['stars:文字', '星星']]) {
    const body = { dish_id: 502 }
    if (stars !== undefined) body.stars = stars
    const bad = await req('/api/ratings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    assert(bad.status === 400, `脏星级拒写 ${label} → 400`)
  }
  const afterDirty = (await req('/api/ratings')).body.length
  assert(afterDirty === beforeDirty, `四条脏星级一条都没落库（表长仍 ${beforeDirty} 条）`)

  const allAfter = await req('/api/dishes/all')
  assert(allAfter.status === 200 && allAfter.body.length === 432, '打分不污染菜品表')
}

console.log(failed ? `\n${failed} 项未通过` : '\n冒烟测试全部通过')
process.exitCode = failed ? 1 : 0
