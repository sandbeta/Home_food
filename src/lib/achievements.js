/* ============================================================
 * 批 6b · 成就系统（懒洋洋干饭进阶徽章墙）
 * ------------------------------------------------------------
 * 全部基于 /api/orders 前端本地计算（家庭订单量 <千级）；
 * 服务端无需改动，成就进度实时刷新；未来要持久化"首次达成时间"可挪到 state.achievements。
 * 12 枚徽章：开张/深夜/请客/老饕/10 单/50 单/100 单/菜系/连火/共事/四季/周年
 * ============================================================ */
import { isNightSnack } from './nightRules'

const EIGHT_CUISINES = ['川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜']

export const ACHIEVEMENTS = [
  { key: 'first',      title: '开张之喜', icon: '🎉', desc: '下了第一单' },
  { key: 'night',      title: '深夜食客', icon: '🌙', desc: '第一次点夜宵' },
  { key: 'treat',      title: '请客大方', icon: '💝', desc: '第一次主动请客（非 AA）' },
  { key: 'feast',      title: '一桌老饕', icon: '🍽️', desc: '一单点够 10 份菜' },
  { key: 'ten',        title: '十单之约', icon: '🔟', desc: '累计 10 单' },
  { key: 'fifty',      title: '半百厨友', icon: '🥘', desc: '累计 50 单' },
  { key: 'hundred',    title: '百单厨神', icon: '👨‍🍳', desc: '累计 100 单' },
  { key: 'cuisine',    title: '吃遍八系', icon: '🗺️', desc: '同一单里点够 5 种菜系' },
  { key: 'week',       title: '一周不断火', icon: '🔥', desc: '连续 7 天都开了伙' },
  { key: 'duo',        title: '双人共事', icon: '🐱🐑', desc: '同一单里你俩都点过菜' },
  { key: 'seasons',    title: '四季同吃', icon: '🍂', desc: '跨 4 个自然月都有下单' },
  { key: 'anniversary',title: '一周年了', icon: '💍', desc: '第一单至今满 365 天' },
]

/**
 * 计算每枚徽章是否解锁 + 首次达成时间（ISO）；orders 是完整 /api/orders 返回
 * @param {Array} orders 历史订单
 * @param {Map<number,string>} [dishCats] 修 P0-3：dish_id → category 映射，
 *   给「下单时才快照 category」之前的老订单兜底；省略时行为与原先一致
 */
export function computeAchievements(orders, dishCats) {
  const out = {}
  if (!Array.isArray(orders) || orders.length === 0) return out
  /* 修 P0-3：老订单 items 无 category 快照 → 有 dishCats 时按 dish_id 兜底（有值时行为不变） */
  const catOf = (it) => it.category || (dishCats && typeof dishCats.get === 'function' ? dishCats.get(Number(it.dish_id)) : '') || ''
  const sorted = [...orders].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  // first
  out.first = { unlocked: true, at: first.created_at }
  // night：任一 items 里含 isNightSnack
  const nightOrder = sorted.find(o => (o.items || []).some(i => isNightSnack({ name: i.dish_name })))
  if (nightOrder) out.night = { unlocked: true, at: nightOrder.created_at }
  // treat：payer=me/partner 的第一单
  const treatOrder = sorted.find(o => o.payer === 'me' || o.payer === 'partner')
  if (treatOrder) out.treat = { unlocked: true, at: treatOrder.created_at }
  // feast：一单里 items.quantity 总和 >=10
  const feastOrder = sorted.find(o => (o.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0) >= 10)
  if (feastOrder) out.feast = { unlocked: true, at: feastOrder.created_at }
  // 10/50/100 单：累计
  if (sorted.length >= 10) out.ten = { unlocked: true, at: sorted[9].created_at }
  if (sorted.length >= 50) out.fifty = { unlocked: true, at: sorted[49].created_at }
  if (sorted.length >= 100) out.hundred = { unlocked: true, at: sorted[99].created_at }
  // 吃遍八系：某单含 >=5 种八大菜系
  const cuisineOrder = sorted.find(o => {
    const set = new Set((o.items || []).map(i => catOf(i)).filter(c => EIGHT_CUISINES.includes(c)))
    return set.size >= 5
  })
  if (cuisineOrder) out.cuisine = { unlocked: true, at: cuisineOrder.created_at }
  // 一周不断火：连续 7 天有单
  const dates = new Set(sorted.map(o => (o.created_at || '').slice(0, 10)))
  const sortedDates = Array.from(dates).sort()
  let run = 1, runAt = null
  for (let i = 1; i < sortedDates.length; i++) {
    const diff = (new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000
    if (diff === 1) { run++; if (run >= 7) { runAt = sortedDates[i]; break } }
    else run = 1
  }
  if (runAt) out.week = { unlocked: true, at: runAt + 'T12:00:00.000Z' }
  // 双人共事：某单 items 里 added_by 同时含 me 与 partner
  const duoOrder = sorted.find(o => {
    const set = new Set((o.items || []).map(i => i.added_by))
    return set.has('me') && set.has('partner')
  })
  if (duoOrder) out.duo = { unlocked: true, at: duoOrder.created_at }
  // 四季同吃：跨 4 个自然月
  const months = new Set(sorted.map(o => (o.created_at || '').slice(0, 7)))
  if (months.size >= 4) {
    const arr = Array.from(months).sort()
    out.seasons = { unlocked: true, at: arr[3] + '-01T12:00:00.000Z' }
  }
  // 一周年：首单至今 >=365 天
  const days = (Date.now() - new Date(first.created_at).getTime()) / 86400000
  if (days >= 365) out.anniversary = { unlocked: true, at: new Date(new Date(first.created_at).getTime() + 365 * 86400000).toISOString() }
  return out
}
