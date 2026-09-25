// 娃娃机智能池纯函数测试 —— node scripts/test_clawPool.mjs（无框架）。
// 验证三层归层、权重偏向、加权抽样、堆生成/补货、虚惊 buddy 选取。
let failed = 0
const assert = (cond, msg) => {
  if (cond) console.log('✓', msg)
  else { console.error('✗', msg); failed++ }
}
// 确定性随机源：LCG，可复现
function makeRng(seed = 1) {
  let s = seed >>> 0
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296 }
}

const {
  CLAW_WEIGHTS, CLAW_TIMING, HOT_THRESHOLD,
  computeEatSignals, tagLayers, weightedPick,
  buildInitialSlots, refillOne, pickBuddyA,
  buildTimeline, decideFeint, nearestSlotIdx, trimPoolToWorkingSet,
} = await import('../src/lib/clawPool.js')

const D = (id, extra = {}) => ({ id, name: '菜' + id, price: 10 + id, available: 1, ...extra })
const pool = [D(1), D(2), D(3), D(4), D(5), D(6)]

// 1) 订单聚合：频次 + 吃过集合
{
  const orders = [
    { items: [{ dish_id: 1, quantity: 2 }, { dish_id: 2, quantity: 1 }] },
    { items: [{ dish_id: 1, quantity: 1 }] },
    { items: [] },
  ]
  const { counts, eatenIds } = computeEatSignals(orders)
  assert(counts.get(1) === 3 && counts.get(2) === 1, 'computeEatSignals 累加 quantity 正确')
  assert(eatenIds.has(1) && eatenIds.has(2) && !eatenIds.has(3), 'eatenIds 收集吃过、漏掉没吃的')
  const empty = computeEatSignals(undefined)
  assert(empty.counts.size === 0 && empty.eatenIds.size === 0, 'computeEatSignals 容忍空输入')
}

// 2) 三层归层
{
  const sig = {
    favoriteIds: [1],
    eatCounts: { 2: HOT_THRESHOLD },
    wishDishIds: [3],
    todayDishId: 4,
    eatenIds: [1, 2, 4],
  }
  const tagged = tagLayers(pool, sig)
  const byId = Object.fromEntries(tagged.map(d => [d.id, d]))
  assert(byId[1]._layer === 'A' && byId[1]._flags.fav, '收藏→A 层并带 fav 标记')
  assert(byId[2]._layer === 'A' && byId[2]._flags.hot, '达到常点阈值→A 层并带 hot 标记')
  assert(byId[3]._layer === 'B' && byId[3]._flags.wish, '愿望菜→B 层')
  assert(byId[4]._layer === 'B' && byId[4]._flags.today, '纪念日绑定菜→B 层')
  assert(byId[5]._layer === 'C' && byId[5]._flags.new, '没吃过→C 层且标记 new')
  assert(CLAW_WEIGHTS.C_new > CLAW_WEIGHTS.C_eaten, '新菜权重高于吃过的普通菜（发现感）')
  assert(byId[1]._weight === CLAW_WEIGHTS.A && byId[4]._weight === CLAW_WEIGHTS.B, 'A/B 取对应权重')
}

// 3) 同菜多命中：B 优先于 A，weight 取最大，flags 全留
{
  const tagged = tagLayers([D(7)], { favoriteIds: [7], todayDishId: 7, eatenIds: [7] })
  const d = tagged[0]
  assert(d._layer === 'B', '收藏+纪念日同体→归 B（更有故事）')
  assert(d._weight === Math.max(CLAW_WEIGHTS.A, CLAW_WEIGHTS.B), 'weight 取所有命中最大值')
  assert(d._flags.fav && d._flags.today, 'flags 同时保留 fav 与 today')
}

// 4) 无 signals → 全部落 C
{
  const tagged = tagLayers(pool, {})
  assert(tagged.every(d => d._layer === 'C'), '无信号时全部落 C')
}

// 5) 加权偏向统计：A 层被抽中频率显著高于吃过的 C
{
  const a = { id: 1, name: 'x', _weight: CLAW_WEIGHTS.A }
  const cLow = { id: 99, name: 'y', _weight: CLAW_WEIGHTS.C_eaten }
  const items = [a, cLow]
  const rng = makeRng(42)
  let hitsA = 0
  const T = 4000
  for (let i = 0; i < T; i++) if (weightedPick(items, [], rng).id === 1) hitsA++
  const ratio = hitsA / T
  assert(ratio > 0.65 && ratio < 0.85, `加权抽取偏向高权重（A 命中率 ${(ratio * 100).toFixed(1)}%，期望≈75%）`)
}

// 6) buildInitialSlots：长度恒等、优先不重复、空池全 null
{
  const tagged = tagLayers(pool, { favoriteIds: [1] })
  const slots = buildInitialSlots(tagged, 8, makeRng(7))
  assert(slots.length === 8, '槽位数恒等于 count')
  const uniq = new Set(slots.filter(Boolean).map(d => d.id))
  assert(uniq.size === 6, 'pool=6<8 时先铺满不重复的 6 个')
  assert(slots.filter(Boolean).length === 8, '不足则允许重复补齐，无 null 空洞')
  assert(buildInitialSlots([], 5).every(d => d === null), '空池 → 全 null')
}

// 7) refillOne：排重优先 + 加权
{
  const tagged = tagLayers(pool, {})
  const current = [tagged[0], tagged[1], null, null]
  const nd = refillOne(tagged, current, makeRng(3))
  assert(nd && nd.id !== 1 && nd.id !== 2, 'refillOne 避开堆里已有的 id')
  assert(refillOne([], current) === null, '空候选补货返回 null')
}

// 8) pickBuddyA：优先非目标的 A 层
{
  const A = { id: 10, _layer: 'A' }
  const B = { id: 11, _layer: 'B' }
  const C = { id: 12, _layer: 'C' }
  const slots = [A, B, C]
  const buddy = pickBuddyA(slots, 1, makeRng(5))
  assert(buddy && buddy.id === 10, '虚惊 buddy 优先取 A 层非目标')
  const only = pickBuddyA([A], 0)
  assert(only === null, '仅剩目标本身时 buddy=null（表现层据此不演）')
  const noA = pickBuddyA([B, C], 0)
  assert(noA && noA.id === 12, '无 A 层时退取任意非目标菜')
}

// 9) buildTimeline：相位序列 + 时间单调；feint 插 slipOn/slipOff 且在 release 前
{
  const tl = buildTimeline({ feint: false })
  const phases = tl.filter((e) => e.type === 'phase').map((e) => e.phase)
  assert(JSON.stringify(phases) === JSON.stringify(['drop', 'close', 'lift', 'carry', 'release', 'settle']), '无虚惊时相位顺序为 drop→settle')
  const ats = tl.map((e) => e.at)
  assert(ats.every((v, i) => i === 0 || v >= ats[i - 1]), '时间戳单调不减')
  const end = tl.find((e) => e.type === 'end')
  const expectTotal = CLAW_TIMING.drop + CLAW_TIMING.close + CLAW_TIMING.lift + CLAW_TIMING.carry + CLAW_TIMING.release + CLAW_TIMING.settle
  assert(end.at === expectTotal, '无虚惊总时长 = 各节拍之和（自动累加，非手算）')
  assert(!tl.some((e) => e.type === 'slipOn'), '无虚惊不含 slipOn')

  const tlf = buildTimeline({ feint: true })
  const slipOn = tlf.find((e) => e.type === 'slipOn')
  const slipOff = tlf.find((e) => e.type === 'slipOff')
  const releaseAt = tlf.find((e) => e.type === 'phase' && e.phase === 'release').at
  assert(slipOn && slipOff, '虚惊插入 slipOn/slipOff 两个事件')
  assert(slipOn.at < slipOff.at && slipOff.at <= releaseAt, '滑出→晃回 顺序正确且不晚于落槽')
}

// 10) decideFeint：确定性 rng 命中/未命中
{
  assert(decideFeint(() => 0.1) === true, 'rng<rate → 触发虚惊')
  assert(decideFeint(() => 0.9) === false, 'rng>=rate → 不触发')
  assert(decideFeint(() => 0.5, 0.6) === true, '自定义 rate 生效')
}

// 11) nearestSlotIdx：横向百分比映射到最近槽位
{
  const layout = [{ x: '30%' }, { x: '50%' }, { x: '70%' }]
  assert(nearestSlotIdx(30, layout) === 0, '30% → 第 0 槽')
  assert(nearestSlotIdx(49, layout) === 1, '49% 更接近 50 → 第 1 槽')
  assert(nearestSlotIdx(100, layout) === 2, '100% 边缘 → 最近的第 2 槽')
  assert(nearestSlotIdx(50, []) === -1, '空布局返回 -1')
}

// 12) trimPoolToWorkingSet：全保 A/B、总数不超预算、小池原样
{
  const many = Array.from({ length: 100 }, (_, i) => D(i + 1))
  const tagged = tagLayers(many, { favoriteIds: [1, 2], todayDishId: 3, wishDishIds: [4], eatenIds: many.map(d => d.id) })
  // 1,2=A；3,4=B；其余 eaten→C_eaten
  const trimmed = trimPoolToWorkingSet(tagged, 20, makeRng(9))
  assert(trimmed.length <= 20, '工作集不超预算')
  const kept = new Set(trimmed.map(d => d.id))
  assert(kept.has(1) && kept.has(2) && kept.has(3) && kept.has(4), 'A/B 层全部保留在预算内')
  const small = trimPoolToWorkingSet(tagged.slice(0, 5), 20)
  assert(small.length === 5, '池本身小于预算时原样返回')
}

console.log(failed === 0 ? '\n[clawPool] 全部通过' : `\n[clawPool] ${failed} 项失败`)
process.exit(failed === 0 ? 0 : 1)
