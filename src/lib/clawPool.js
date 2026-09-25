/* ============================================================
 * 娃娃机 · 智能三层抓取池（轻游戏化收敛版 · 2026-09-24）
 * ------------------------------------------------------------
 * 目标：把娃娃机堆里的菜从"全随机"改成**偏向她真想吃**的三层加权混合，
 *       让"抓到 = 落袋今晚一顿饭"这件事更懂她。核心主张——每一次心跳都
 *       朝"更想吃"，不朝"更想玩"。
 *
 * 三层（对应设计方案 §2）：
 *   A 正中下怀   —— 收藏 + 高频常点，高权重。潜台词："它怎么知道我想吃这个"
 *   B 他惦记给你 —— 纪念日绑定菜 / 她许过已补齐的愿望 / 今日推荐，专属文案。
 *   C 随便逛的惊喜 —— 其余偏随机，刻意给"没吃过的新菜"一点加成，负责发现感。
 *
 * 纪律（守方案 §5 与不可变约束）：
 *   · 纯函数、无副作用、不碰网络、不新增服务端接口；
 *   · 只读消费 favorites / orders / anniversaries / wishes 现成数据，绝不修改；
 *   · 不引任何第三方依赖（连随机加权也手写 Efraimidis–Spirakis）；
 *   · 不新增 localStorage key、不做跨设备同步。
 *
 * 权重语义：weight 越大越容易进堆 / 被补货。归层优先级 B>A>C（B 最有故事），
 * 但同一道菜的 weight 取所有命中规则的最大值，flags 全保留供表现层用
 * （如 B 层专属文案、"虚惊顺手带出旁边 A 层菜"）。
 * ============================================================ */

/** 可配置默认值：改这里即可整体调偏，不必动组件 */
export const CLAW_WEIGHTS = {
  A: 6,        // 收藏 / 常点
  B: 5,        // 纪念日 / 愿望 / 今日推荐
  C_new: 3,    // 没吃过的新菜（探索加成）
  C_eaten: 2,  // 吃过但没到常点频次的普通菜
}
/** 点过 ≥ 此次数算"常点"（A 层）——家庭场景基数小，2 次即算偏好 */
export const HOT_THRESHOLD = 2

/* ---------- 从订单聚合"吃过频次"与"吃过的菜 id 集合" ---------- */
/**
 * @param {Array<{items?:Array<{dish_id?:number, quantity?:number}>}>} orders
 * @returns {{ counts: Map<number, number>, eatenIds: Set<number> }}
 */
export function computeEatSignals(orders) {
  const counts = new Map()
  const eatenIds = new Set()
  for (const o of (orders || [])) {
    for (const it of (o && o.items) || []) {
      const id = it && it.dish_id
      if (id == null) continue
      const qty = Number(it.quantity) || 1
      counts.set(id, (counts.get(id) || 0) + qty)
      eatenIds.add(id)
    }
  }
  return { counts, eatenIds }
}

/* ---------- 给候选池打三层标签 + 权重 ---------- */
/**
 * @param {Array<object>} pool  已按 available 过滤好的候选菜（裸 dish 对象数组）
 * @param {object} sig          信号集合（全部可选，缺省即等权 → 退化为旧版随机）
 *   { favoriteIds?:Set|Array, eatCounts?:Map|Object, wishDishIds?:Set|Array,
 *     todayDishId?:number|null, promotedIds?:Set|Array, eatenIds?:Set|Array }
 * @returns {Array<object>}     原 dish 浅拷贝 + { _layer, _weight, _flags }
 */
export function tagLayers(pool, sig = {}) {
  const favSet = toSet(sig.favoriteIds)
  const wishSet = toSet(sig.wishDishIds)
  const promoSet = toSet(sig.promotedIds)
  const eatenSet = toSet(sig.eatenIds)
  const counts = toCountMap(sig.eatCounts)
  const todayId = sig.todayDishId != null ? Number(sig.todayDishId) : null

  return (pool || []).map((dish) => {
    if (!dish || dish.id == null) return dish
    const id = Number(dish.id)
    const count = counts.get(id) || 0
    const isFav = favSet.has(id)
    const isHot = count >= HOT_THRESHOLD
    const isToday = todayId != null && id === todayId
    const isWish = wishSet.has(id)
    const isPromo = promoSet.has(id)
    const isNew = !eatenSet.has(id)

    const inB = isToday || isWish || isPromo
    const inA = isFav || isHot

    let layer = 'C'
    if (inB) layer = 'B'
    else if (inA) layer = 'A'

    // weight 取所有命中规则最大值
    let w = isNew ? CLAW_WEIGHTS.C_new : CLAW_WEIGHTS.C_eaten
    if (inA) w = Math.max(w, CLAW_WEIGHTS.A)
    if (inB) w = Math.max(w, CLAW_WEIGHTS.B)

    return {
      ...dish,
      _layer: layer,
      _weight: w,
      _flags: { fav: isFav, hot: isHot, today: isToday, wish: isWish, promo: isPromo, new: isNew },
    }
  })
}

/* ---------- 加权无重复抽样（Efraimidis–Spirakis A-Res） ---------- */
/**
 * 按 _weight 加权洗牌：score = rand^(1/weight)，降序 = 权重越大越靠前。
 * 不传 weight 的裸对象按等权 1 处理（向后兼容旧调用）。
 * @param {Array<object>} items
 * @param {() => number} rng  注入随机源，便于单测确定性
 */
export function weightedShuffle(items, rng = Math.random) {
  return (items || [])
    .map((it) => ({ it, score: Math.pow(clamp01(rng()) || 1e-9, 1 / (it._weight || 1)) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it)
}

/**
 * 初始堆：加权取不重复的前 count 个；pool 不足则允许重复补齐（沿用旧版语义）。
 * @returns {Array<object|null>} 长度恒为 count（pool 为空时全 null）
 */
export function buildInitialSlots(items, count, rng = Math.random) {
  const src = (items || []).filter(Boolean)
  if (!src.length) return Array.from({ length: count }, () => null)
  const ordered = weightedShuffle(src, rng)
  const slots = []
  let i = 0
  while (slots.length < count) {
    if (i < ordered.length) {
      slots.push(ordered[i])            // 先铺不重复
      i += 1
    } else {
      slots.push(weightedPick(src, [], rng))  // 不够再允许重复补
    }
  }
  return slots
}

/**
 * 补货：加权抽一个尽量不与当前堆里已有的重复；全都重复则加权任取。
 * @param {Array<object>} items  带权重的候选池
 * @param {Array<object>} currentSlots  当前堆（用于排重）
 */
export function refillOne(items, currentSlots, rng = Math.random) {
  const src = (items || []).filter(Boolean)
  if (!src.length) return null
  const inSlot = new Set((currentSlots || []).filter(Boolean).map((d) => Number(d.id)))
  const avail = src.filter((d) => !inSlot.has(Number(d.id)))
  return weightedPick(avail.length ? avail : src, [], rng)
}

/** 单次加权随机抽一个 */
export function weightedPick(items, _exclude, rng = Math.random) {
  const src = (items || []).filter(Boolean)
  if (!src.length) return null
  let total = 0
  for (const it of src) total += (it._weight || 1)
  if (total <= 0) return src[Math.floor(rng() * src.length)] || null
  let r = rng() * total
  for (const it of src) {
    r -= (it._weight || 1)
    if (r <= 0) return it
  }
  return src[src.length - 1]
}

/**
 * "虚惊顺手带出旁边 A 层菜"：从堆里挑一个非目标、layer=A 的菜。
 * 找不到 A 就退而找任意非目标菜；都没有返回 null（表现层据此决定是否演这出）。
 */
export function pickBuddyA(slots, targetIdx, rng = Math.random) {
  const arr = (slots || []).map((d, i) => ({ d, i })).filter((x) => x.d && x.i !== targetIdx)
  if (!arr.length) return null
  const aLayer = arr.filter((x) => x.d._layer === 'A')
  const from = aLayer.length ? aLayer : arr
  return from[Math.floor(rng() * from.length)].d
}

/* ---------- 演出配置：单一真源，收口所有时间魔数 ---------- */
/** 抓取节拍 + 悬念/滑脱演出 + 撤销窗（ms）。改时长只动这里，buildTimeline 自动重排。
 *  批6 拟真包新增：chute 落槽终拍（挡板开合+哐当）、slip 滑脱演出（pity 保底的前戏）、
 *  drop2/close2/lift2/carry2 二段再抓；grabLockout 死常量已清。 */
export const CLAW_TIMING = {
  drop: 380, close: 180, lift: 460, carry: 340, release: 320, settle: 320,
  chute: 300,            // 落槽终拍：挡板弹开、盘子掉进取物口、哐当
  slip: 340,             // 滑脱：盘子从爪间坠回菜堆
  slipHold: 430,         // 全场静止一拍（真实的"啊？要跑了？"）
  drop2: 300, close2: 170, lift2: 380, carry2: 320,   // 再下一爪（这次抱死）
  feintSlip: 120,        // 盘子"往下滑"段
  feintRecover: 180,     // "又晃回爪上"段
  feintRate: 0.3,        // 虚惊浓度（normal 之上再叠的概率）
  slipRate: 0.18,        // 滑脱演出浓度（只消耗时间，从不消耗食物）
  labelHold: 4200,       // 撤销窗（落袋浮标停留）
}

/* ---------- 声明式抓取时间线（纯函数、可单测、无手算累加） ---------- */
/**
 * 产出相位计划 [{ type, phase?, name?, at, d? }]，at = 相对起手的毫秒偏移。
 *   type='phase' → 组件 setPhase(phase)
 *   type='slipOn'/'slipOff' → 虚惊：盘子往下滑 / 又晃回
 *   type='sfx'   → 音效（motor/clank/chute/win），d=建议时长
 *   type='end'   → 收口 setPhase('idle')
 * outcome（批6 拟真）：'normal' | 'feint'（虚惊悬念） | 'slip'（滑脱再抓，pity 演出）。
 * 兼容旧参数 feint=true ⇔ outcome='feint'。未知相位名直接 throw（原 `T[phase]||0` 会把拼错
 * 的相位静默成 0ms，测试全绿也发现不了——今天补上）。
 */
export function buildTimeline({ feint = false, outcome, T = CLAW_TIMING } = {}) {
  const oc = outcome || (feint ? 'feint' : 'normal')
  const seq = []
  let t = 0
  const step = (phase) => {
    const d = T[phase]
    if (!Number.isFinite(d)) throw new Error(`buildTimeline: 未知相位或缺时长 "${phase}"`)
    seq.push({ type: 'phase', phase, at: t })
    t += d
  }
  const beat = (phase, sound) => {
    const start = t
    step(phase)
    if (sound) seq.push({ type: 'sfx', name: sound, at: start, d: T[phase] })
  }
  const carryTo = (carryPhase) => {
    seq.push({ type: 'phase', phase: carryPhase, at: t })
    t += T[carryPhase]
  }

  if (oc === 'slip') {
    // 第一爪：抓起→平移途中脱手→坠回→静止一拍→第二爪抱死
    beat('drop', 'motor'); beat('close', 'clank'); beat('lift', 'motor')
    carryTo('carry')
    beat('slip'); beat('slipHold')
    beat('drop2', 'motor'); beat('close2', 'clank'); beat('lift2', 'motor')
    carryTo('carry2')
  } else {
    beat('drop', 'motor'); beat('close', 'clank'); beat('lift', 'motor')
    const carryStart = t
    carryTo('carry')
    if (oc === 'feint') {
      // 虚惊演出压在 carry 尾段：滑出→晃回，都在 release 前结束
      seq.push({ type: 'slipOn', at: carryStart + T.carry - T.feintRecover - T.feintSlip })
      seq.push({ type: 'slipOff', at: carryStart + T.carry - T.feintSlip })
    }
  }
  beat('release')
  beat('settle', 'win')
  beat('chute', 'chute')
  seq.push({ type: 'end', at: t })
  return seq
}

/**
 * 本抓结局判定（纯函数、注入 rng 可测）。街机 pity 机制的家庭化：
 * 滑脱只演"心跳过程"，购物车早已乐观加购——**失败从不消耗食物**；
 * 连续 slip 到第 3 抓必演"大团圆"（pityWin：抱死 + 必带出一盘赔礼）。
 * @param {() => number} rng
 * @param {number} slipStreak 连续滑脱次数（组件维护，>=2 时下一抓必 pityWin）
 * @returns {'normal'|'feint'|'slip'|'pityWin'}
 */
export function decideOutcome(rng = Math.random, slipStreak = 0) {
  if (slipStreak >= 2) return 'pityWin'
  const r = rng()
  if (r < CLAW_TIMING.slipRate) return 'slip'
  if (r < CLAW_TIMING.slipRate + CLAW_TIMING.feintRate) return 'feint'
  return 'normal'
}

/**
 * 拖拽/键盘瞄准的统一吸附真源（修 P1 门禁盲区：原 nearestSlotIdx 被 aimTo 内联
 * 版取代后成了"测试保护死码、真逻辑零覆盖"；现在反过来——aimTo 调用本函数）。
 * 把指针横向百分比(0~100)映射到槽位下标：优先吸附「最近的有菜槽位」，
 * 整堆全空才退回最近任意槽（杜绝拖到空槽抬手静默失败）。
 * slotLayout 每项含 x:'NN%'；slots 与之等长（空位为 null/undefined）。无有效槽位返回 -1。
 */
export function aimSlotIdx(percent, slotLayout, slots = []) {
  if (!slotLayout || !slotLayout.length) return -1
  let bestOcc = -1, dOcc = Infinity
  let bestAny = -1, dAny = Infinity
  slotLayout.forEach((s, i) => {
    const cx = parseFloat(s && s.x)
    if (!Number.isFinite(cx)) return
    const d = Math.abs(cx - percent)
    if (d < dAny) { dAny = d; bestAny = i }
    if (slots[i] && d < dOcc) { dOcc = d; bestOcc = i }
  })
  return bestOcc >= 0 ? bestOcc : bestAny
}

/**
 * 工作集粗筛：不再把整库(数百道)塞进组件做每帧权重遍历。
 * 规则：全部 A/B 层无条件保留（稀缺、最该被抓到），剩余名额按权重加权采样 C 层，
 * 合计不超过 budget。tagged 已按 _weight 标记。返回新数组（不截断 A/B）。
 */
export function trimPoolToWorkingSet(tagged, budget = 48, rng = Math.random) {
  const src = (tagged || []).filter(Boolean)
  if (src.length <= budget) return src
  const ab = src.filter((d) => d._layer === 'A' || d._layer === 'B')
  const c = src.filter((d) => d._layer !== 'A' && d._layer !== 'B')
  // A/B 若已超预算：按权重加权取前 budget（稀缺层内部也分高矮）
  if (ab.length >= budget) return weightedShuffle(ab, rng).slice(0, budget)
  const keep = ab.slice()
  const room = budget - keep.length
  if (room > 0 && c.length) keep.push(...weightedShuffle(c, rng).slice(0, room))
  return keep
}

/* ---------- 小工具 ---------- */
function clamp01(n) { return n < 0 ? 0 : n > 1 ? 1 : n }
function toSet(v) {
  if (!v) return new Set()
  if (v instanceof Set) return v
  if (Array.isArray(v)) return new Set(v.map(Number).filter((n) => !Number.isNaN(n)))
  return new Set()
}
function toCountMap(v) {
  if (!v) return new Map()
  if (v instanceof Map) return v
  if (typeof v === 'object') {
    const m = new Map()
    for (const k of Object.keys(v)) {
      const n = Number(k)
      if (!Number.isNaN(n)) m.set(n, Number(v[k]) || 0)
    }
    return m
  }
  return new Map()
}
