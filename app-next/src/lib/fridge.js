/* ============================================================
 * 批 6a · 厨房冰箱（本地设备级 · 家庭"我们家有啥菜"）
 * ------------------------------------------------------------
 * 存 localStorage（不进服务端，家庭几个人冰箱是同一份但每个人对现状了解不同，先设备级；
 *   未来若共享可扩展为服务端 fridge 表 + 双端 PUT 同步）
 * 数据形状：{ [ingredientName]: { qty:number, unit:string, updatedAt:ISO } }
 * 用途：PurchaseListSheet 生成时对照，命中打"家里有"绿标；未命中列在"要买"分组
 * ============================================================ */
const KEY = 'couple_order_fridge_v1'

export function readFridge() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
    const out = {}
    for (const [k, v] of Object.entries(raw)) {
      if (typeof k !== 'string' || !k.trim() || !v || typeof v !== 'object') continue
      out[k.trim()] = { qty: Number(v.qty) || 0, unit: String(v.unit || ''), updatedAt: String(v.updatedAt || new Date().toISOString()) }
    }
    return out
  } catch { return {} }
}

export function writeFridge(map) {
  try { localStorage.setItem(KEY, JSON.stringify(map || {})) } catch {}
}

export function upsertItem(name, { qty = 1, unit = '' } = {}) {
  const map = readFridge()
  const key = String(name || '').trim()
  if (!key) return map
  map[key] = { qty: Number(qty) || 0, unit: String(unit || ''), updatedAt: new Date().toISOString() }
  writeFridge(map)
  return map
}

export function removeItem(name) {
  const map = readFridge()
  delete map[String(name || '').trim()]
  writeFridge(map)
  return map
}

export function adjustQty(name, delta) {
  const map = readFridge()
  const key = String(name || '').trim()
  if (!map[key]) return map
  map[key] = { ...map[key], qty: Math.max(0, (map[key].qty || 0) + delta), updatedAt: new Date().toISOString() }
  if (map[key].qty === 0) delete map[key]
  writeFridge(map)
  return map
}

/** 匹配冰箱里有没有某原料（子串匹配，与 lib/avoid 一致的宽松度）：
 *  生姜 3 片 → 命中 fridge key "生姜"；"姜" 也在 fridge → 命中 */
export function hasInFridge(ingredientName, fridgeMap) {
  if (!ingredientName) return null
  const s = String(ingredientName).trim()
  const keys = Object.keys(fridgeMap || {})
  // 优先精确 → 再"ingredient 包含 fridgeKey"（生姜 ⊃ 姜）
  if (keys.includes(s)) return s
  const hit = keys.find(k => k && s.includes(k))
  return hit || null
}
