/* ============================================================
 * 批 1 新增 · 纪念日命中判定与倒计时
 * ------------------------------------------------------------
 * 数据形状（与 mockApi/server 两端一致）：
 *   { id, name, date: "YYYY-MM-DD", annual: bool, dish_id: number|null, note: "" }
 *
 * 命中语义：
 *   · annual=true  → 月-日匹配即命中（每年重复）
 *   · annual=false → 完整 YYYY-MM-DD 匹配才命中（一次性事件）
 *   · 周年数 = today.year - anniversary.year（首次当年 = 0，第 2 年 = 1 周年）
 *
 * 距离下一个：未来 N 天内最近的一个；若都过完（非 annual 且过期）返回 null。
 * ============================================================ */

const MS_PER_DAY = 86400000

function pad(n) { return String(n).padStart(2, '0') }
function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

/** 今日命中的纪念日（可能多个，都返回） */
export function anniversariesToday(list, today = new Date()) {
  const t = ymd(today)
  const tMD = t.slice(5)
  const tY = t.slice(0, 4)
  return (list || []).filter(a => {
    if (!a || !a.date) return false
    if (a.annual) return a.date.slice(5) === tMD
    return a.date === t
  }).map(a => ({ ...a, years: Number(tY) - Number(a.date.slice(0, 4)) }))
}

/** 距离下一个纪念日还有多少天（不含今天；今天命中请走 anniversariesToday） */
export function nextAnniversary(list, today = new Date()) {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let best = null
  for (const a of (list || [])) {
    if (!a || !a.date) continue
    const y = Number(a.date.slice(0, 4)), m = Number(a.date.slice(5, 7)) - 1, d = Number(a.date.slice(8, 10))
    if (!Number.isFinite(m) || !Number.isFinite(d)) continue
    // 候选日期：annual 时先取今年，若已过取明年；非 annual 取原日期
    let target = new Date(y, m, d)
    if (a.annual) {
      target = new Date(t0.getFullYear(), m, d)
      if (target < t0) target = new Date(t0.getFullYear() + 1, m, d)
    }
    const diffDays = Math.round((target - t0) / MS_PER_DAY)
    if (diffDays > 0 && (!best || diffDays < best.days)) best = { anniversary: a, days: diffDays, target }
  }
  return best
}

/** 从 "YYYY-MM-DD" 提取月份/日，用于 UI 上「6月18日」这类展示 */
export function formatAnniDate(str) {
  if (!str || str.length < 10) return str || ''
  return `${Number(str.slice(5, 7))} 月 ${Number(str.slice(8, 10))} 日`
}
