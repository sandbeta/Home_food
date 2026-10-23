export const ORDER_FLOW = ['pending', 'cutting', 'cooking', 'plating', 'completed']

export const ORDER_STATUS = {
  pending: { label: '等着呢', desc: '交给厨房啦，等着就好', tone: 'warn' },
  preparing: { label: '切配中', desc: '洗洗切切中，砧板已经开工', tone: 'warn' },
  cutting: { label: '切配中', desc: '洗洗切切中，砧板已经开工', tone: 'warn' },
  cooking: { label: '下锅了', desc: '下锅了，油烟要起来啦', tone: 'honey' },
  plating: { label: '装盘中', desc: '开始装盘，就差端上桌', tone: 'sage' },
  completed: { label: '做好啦', desc: '快来吃吧，趁热', tone: 'success' },
}

export const PAYER_LABEL = {
  aa: 'AA 各付各的',
  me: '我请',
  partner: 'TA 请',
}

export function normalizeStatus(status) {
  return status === 'preparing' ? 'cooking' : status
}

export function statusInfo(status) {
  return ORDER_STATUS[status] || ORDER_STATUS.pending
}

export function statusIndex(status) {
  const i = ORDER_FLOW.indexOf(normalizeStatus(status))
  return i < 0 ? 0 : i
}

export function money(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? `¥${v}` : `¥${v.toFixed(2).replace(/0$/, '')}`
}

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function pad3(n) {
  return String(n).padStart(3, '0')
}

export function weekdayCN(date = new Date()) {
  return '日一二三四五六'[date.getDay()]
}

export function timeHM(date = new Date()) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function monthDay(date = new Date()) {
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`
}

export function ymd(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function sameDay(a, b = new Date()) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - offset)
  return d
}

export function formatWhen(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (sameDay(d, now)) return `今天 ${timeHM(d)}`
  if (sameDay(d, yesterday)) return `昨天 ${timeHM(d)}`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${timeHM(d)}`
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function formatDay(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export function monthLabel(key) {
  const [y, m] = String(key || '').split('-')
  return `${y} 年 ${Number(m)} 月`
}

export function daysBetween(from, to = new Date()) {
  const a = new Date(from)
  if (Number.isNaN(a.getTime())) return 0
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((end - start) / 86400000)
}

export function countThisWeek(orders, now = new Date()) {
  const start = startOfWeek(now).getTime()
  return (orders || []).filter((o) => new Date(o.created_at).getTime() >= start).length
}

export function orderItemsText(order, max = 3) {
  const items = Array.isArray(order?.items) ? order.items : []
  const names = items.slice(0, max).map((i) => i.dish_name || '一道菜')
  const rest = items.length - names.length
  return names.join('、') + (rest > 0 ? ` 等 ${items.length} 道` : '')
}

export function orderCount(order) {
  return (order?.items || []).reduce((s, i) => s + (Number(i.quantity) || 1), 0)
}

export function splitOrder(order) {
  if (Number.isFinite(Number(order?.owed_me)) || Number.isFinite(Number(order?.owed_partner))) {
    return { me: Number(order.owed_me) || 0, partner: Number(order.owed_partner) || 0 }
  }
  const items = order?.items || []
  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
  const meSub = items.filter((i) => i.added_by === 'me').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
  const partnerSub = items.filter((i) => i.added_by === 'partner').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
  if (order?.payer === 'me') return { me: total, partner: 0 }
  if (order?.payer === 'partner') return { me: 0, partner: total }
  return { me: meSub, partner: partnerSub }
}
