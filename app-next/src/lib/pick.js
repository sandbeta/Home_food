import { isNightSnack } from './nightRules.js'

/* 今日主推的候选池：收藏 / 常点 / 故事菜（许愿、纪念日）/ 新菜 / 普通菜，
   再乘一层心情倍率。输出用每日种子洗牌，同一天同一份数据得到同一顺序，
   「换一道」只是往后翻一位，不会每次刷新都跳。 */

const BASE = { favorite: 6, hot: 5, story: 5, fresh: 3, regular: 2 }
const HOT_THRESHOLD = 2
const RECENT_DAYS = 3

const MOOD = {
  tired: { quick: 1.7, slow: .5, neutral: 1 },
  spicy: { hot: 1.8, cool: .7, neutral: 1 },
  light: { clean: 1.6, heavy: .5, neutral: 1 },
  sweet: { sweet: 1.55, other: .85, night: 1 },
}

const RE = {
  hot: /辣|麻辣|香辣|剁椒|酸辣|酸汤|孜然|咖喱|烧烤|烤|炸|卤|串|锅气|下饭|浓香|过瘾|上头|重油/,
  clean: /汤|羹|粥|蒸|煮|炖|凉拌|凉|白灼|清炒|清蒸|爽|素|沙拉|暖胃|清润/,
  heavy: /炸|烤|烧烤|煎|干锅|铁板|串|焗|红烧|扣肉|酥|锅包|重油|浓汁/,
  sweet: /甜|糖|蜜|布丁|慕斯|曲奇|蛋挞|松饼|华夫|奶茶|可可|酸奶|奶|草莓|桃胶|银耳|芋圆|西米|豆花|冰|酒酿|汤圆|果切|果汁/,
  quick: /拌|凉|汤|羹|粥|蒸蛋|蛋|煮|泡|快炒|炒蛋|炒饭|炒面|吐司|三明治|沙拉|酸奶|果切|冲泡|即食/,
  slow: /炖|煲|卤|煨|扣|红烧|狮子头|佛跳墙|一品锅|汽锅|老火|高汤|发酵|自制|整只|挂糊|酥|焗|烤/,
}

export function moodBiasFor(dish, mood) {
  const table = MOOD[mood]
  if (!dish || !table) return 1
  const hay = `${dish.name || ''}${dish.category || ''}${dish.description || ''}`
  if (mood === 'tired') {
    const quick = RE.quick.test(hay), slow = RE.slow.test(hay)
    return quick && !slow ? table.quick : slow && !quick ? table.slow : table.neutral
  }
  if (mood === 'spicy') {
    if (RE.hot.test(hay)) return table.hot
    if (RE.clean.test(hay)) return table.cool
    return table.neutral
  }
  if (mood === 'light') {
    if (RE.heavy.test(hay)) return table.heavy
    if (RE.clean.test(hay)) return table.clean
    return table.neutral
  }
  if (mood === 'sweet') {
    if (RE.sweet.test(hay)) return table.sweet
    return isNightSnack(dish) ? table.night : table.other
  }
  return 1
}

export function computeEatSignals(orders) {
  const counts = new Map()
  const lastEaten = new Map()
  for (const o of orders || []) {
    const t = new Date(o?.created_at).getTime()
    for (const it of o?.items || []) {
      const id = Number(it?.dish_id)
      if (!Number.isFinite(id)) continue
      const qty = Number(it.quantity) || 1
      counts.set(id, (counts.get(id) || 0) + qty)
      if (Number.isFinite(t) && (!lastEaten.has(id) || t > lastEaten.get(id))) lastEaten.set(id, t)
    }
  }
  return { counts, lastEaten }
}

/**
 * 给每道菜打权重。纯函数，测试直接断言数值。
 * @returns {Array<{dish:object, weight:number, flags:object}>}
 */
export function scoreDishes(dishes, signals = {}) {
  const favorites = new Set((signals.favoriteIds || []).map(Number))
  const stories = new Set((signals.storyIds || []).map(Number))
  const { counts = new Map(), lastEaten = new Map() } = signals.eat || {}
  const now = signals.now instanceof Date ? signals.now : new Date()
  const recentMs = RECENT_DAYS * 86400000

  return (dishes || [])
    .filter((d) => d && d.id != null && Number(d.available) !== 0)
    .map((dish) => {
      const id = Number(dish.id)
      const count = counts.get(id) || 0
      const isFavorite = favorites.has(id)
      const isHot = count >= HOT_THRESHOLD
      const isStory = stories.has(id)
      const isNew = !counts.has(id)

      let weight = isNew ? BASE.fresh : BASE.regular
      if (isFavorite || isHot) weight = Math.max(weight, BASE.favorite)
      if (isStory) weight = Math.max(weight, BASE.story)

      const last = lastEaten.get(id)
      if (last && now.getTime() - last < recentMs) weight *= .55
      if (last && now.getTime() - last < 86400000) weight *= .45

      weight *= moodBiasFor(dish, signals.mood)
      return {
        dish,
        weight: Math.round(weight * 1000) / 1000,
        flags: { favorite: isFavorite, hot: isHot, story: isStory, fresh: isNew, count },
      }
    })
}

/* 每日稳定随机：同一个 seed 永远给同一组顺序 */
export function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function weightedShuffle(items, rng = Math.random) {
  return (items || [])
    .map((it) => ({ it, score: Math.pow(Math.max(rng(), 1e-9), 1 / Math.max(it.weight || 1, .001)) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it)
}

/**
 * 今日候选池。
 * @param {object} p
 * @param {Array} p.dishes
 * @param {object} p.signals { favoriteIds, storyIds, mood, orders, now, night }
 * @returns {Array<{dish:object, weight:number, flags:object}>}
 */
export function pickPool({ dishes, signals = {} }) {
  let pool = (dishes || []).filter((d) => d && Number(d.available) !== 0)
  if (signals.night) {
    const nightOnly = pool.filter(isNightSnack)
    if (nightOnly.length >= 6) pool = nightOnly
  }
  const scored = scoreDishes(pool, signals)
  if (!scored.length) return []
  const key = [
    signals.dateKey || '',
    signals.mood || '',
    signals.night ? 'n' : 'd',
    String(scored.length),
  ].join('|')
  return weightedShuffle(scored, mulberry32(hashSeed(key)))
}

export function pickDaily({ dishes, signals, limit = 8 }) {
  return pickPool({ dishes, signals }).slice(0, limit)
}
