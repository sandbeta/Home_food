/* ============================================================
 * 批 9 新增 · 星级评分 + 制作记录（纯函数、零依赖，与 src/lib/*.js 同风格）
 * ------------------------------------------------------------
 * 记的是「这顿真做出来以后到底好不好吃」：1–5 星、允许半星，一次吃饭记一条。
 * 规则（全收在 RATING_RULES 里，可解释、可调，不必动判定逻辑）：
 *   · stars ≥ 3  → 记一次「完成」（做出来了，而且吃得下去）
 *   · stars = 5  → 记一次「超级好评」
 *   · 同一道菜累计 3 次 5 星 → 自动盖「拿手菜」章（UI 与 achievements 都从这里读）
 * 数据来源是 /api/ratings（家庭服务端 + mockApi 双轨）；本模块只做**聚合与文案**，
 * 不碰网络、不写 localStorage、不引任何依赖 —— 因此可脱离组件单测。
 * ============================================================ */

export const RATING_RULES = {
  min: 1,             // 最低 1 星：没有"0 星"这种羞辱，难吃也只给 1
  max: 5,
  halfStep: 0.5,      // 允许半星
  doneStars: 3,       // ≥3 星 = 一次「完成」
  superStars: 5,      // =5 星 = 一次「超级好评」
  signatureStars: 3,  // 同一道菜攒满 3 颗 5 星 → 「拿手菜」
}

/** 「拿手菜」徽章文案（UI/成就共用单源） */
export const SIGNATURE_BADGE = {
  label: '拿手菜',
  tip: '这道菜攒满 3 颗五星，以后就是你的招牌',
}

/* 半星档位文案：口吻是"吃完抹嘴说一句"，不写成评价平台的术语 */
const STAR_COPY = {
  1: '坨了，这次不算成功',
  1.5: '不太行，勉强扒了两口',
  2: '一般般，下次不太想点',
  2.5: '有点意思，还差一口气',
  3: '吃完了，盘子见底那种',
  3.5: '挺好吃，会主动点名',
  4: '很好，能端上桌待客',
  4.5: '相当可以，菜谱想再看一遍',
  5: '绝了，直接记进拿手菜',
}

/** 归一到合法星级：非法/缺失返回 null；小数向下贴到最近的半格 */
export function normalizeStars(v) {
  if (v === null || v === undefined || v === '') return null   // Number(null)===0 会被当成"1 星"，先挡掉
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const clamped = Math.min(RATING_RULES.max, Math.max(RATING_RULES.min, n))
  const stepped = Math.round(clamped / RATING_RULES.halfStep) * RATING_RULES.halfStep
  // 0.1+0.2 类浮点尾差抹掉，保证落库/比较都是干净的 x 或 x.5
  return Math.round(stepped * 10) / 10
}

/** 某条评分是否算一次「完成」 */
export function isDone(rec) {
  const s = normalizeStars(rec && rec.stars)
  return s != null && s >= RATING_RULES.doneStars
}

/** 某条评分是否算「超级好评」 */
export function isSuperLike(rec) {
  const s = normalizeStars(rec && rec.stars)
  return s != null && s >= RATING_RULES.superStars
}

/** 星级文案（半格向下取档，未知星级返回空串） */
export function starCopy(stars) {
  const s = normalizeStars(stars)
  if (s == null) return ''
  return STAR_COPY[s] || STAR_COPY[Math.floor(s)] || ''
}

/**
 * 单道菜聚合。
 * @param {Array} records 该菜的所有评分记录（顺序无所谓，内部按 created_at 排）
 * @returns {{count:number, avg:number, doneCount:number, superCount:number, fiveCount:number,
 *            isSignature:boolean, lastAt:string, lastStars:number}}
 */
export function summarizeDish(records) {
  const list = (Array.isArray(records) ? records : [])
    .map((r) => ({ ...r, stars: normalizeStars(r && r.stars) }))
    .filter((r) => r.stars != null)
    .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  const count = list.length
  const sum = list.reduce((s, r) => s + r.stars, 0)
  const doneCount = list.filter((r) => r.stars >= RATING_RULES.doneStars).length
  const fiveCount = list.filter((r) => r.stars >= RATING_RULES.superStars).length
  const last = list[count - 1]
  return {
    count,
    avg: count ? Math.round((sum / count) * 10) / 10 : 0,
    doneCount,
    superCount: fiveCount,
    fiveCount,
    isSignature: fiveCount >= RATING_RULES.signatureStars,
    lastAt: last ? (last.created_at || '') : '',
    lastStars: last ? last.stars : null,
  }
}

/**
 * 全量评分按 dish_id 聚合。
 * @param {Array} ratings /api/ratings 返回的记录数组
 * @returns {Map<number, object>} dish_id → summarizeDish 的结果
 */
export function summarizeByDish(ratings) {
  const buckets = new Map()
  for (const r of (Array.isArray(ratings) ? ratings : [])) {
    const id = Number(r && r.dish_id)
    if (!Number.isFinite(id)) continue
    if (!buckets.has(id)) buckets.set(id, [])
    buckets.get(id).push(r)
  }
  const out = new Map()
  buckets.forEach((list, id) => out.set(id, summarizeDish(list)))
  return out
}

/** 拿手菜 dish_id 集合（achievements / 徽章墙用它） */
export function signatureDishIds(ratings) {
  const ids = []
  summarizeByDish(ratings).forEach((sum, id) => { if (sum.isSignature) ids.push(id) })
  return ids.sort((a, b) => a - b)
}

/** 五颗星各自该画成什么（UI 只消费这个，不再自己算半星） */
export function starCells(stars) {
  const s = normalizeStars(stars)
  return Array.from({ length: 5 }, (_, i) => {
    const cell = i + 1
    if (s == null) return 'empty'
    if (s >= cell) return 'full'
    if (s >= cell - RATING_RULES.halfStep) return 'half'
    return 'empty'
  })
}

/** 聚合结果的一句话说明（空数据返回引导语，供 UI 直接显示） */
export function summaryCopy(sum) {
  if (!sum || !sum.count) return '还没记过分数，吃完顺手标一下'
  const bits = [`${sum.count} 次 · 均分 ${sum.avg}`]
  if (sum.doneCount) bits.push(`完成 ${sum.doneCount} 次`)
  if (sum.superCount) bits.push(`五星 ${sum.superCount} 次`)
  if (sum.isSignature) bits.push(SIGNATURE_BADGE.label)
  return bits.join(' · ')
}
