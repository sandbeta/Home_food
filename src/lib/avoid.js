/* ============================================================
 * 批 4b · 忌口清单（她/他的"不吃这些"）
 * ------------------------------------------------------------
 * 存储：localStorage（设备级，家庭自用不共享；不进服务端 state.json 避免污染双端数据）
 * 结构：string[]，每项是一个关键词，会去 recipe.ingredients 里做子串匹配（不区分大小写）
 *
 * 语义：DishDetail 加购前 & Cart 提交前扫一次；命中 → 内联 warning（不阻断，家庭场景温柔提示，
 *   用户"仍然下单"即可通过；避免"我明明记得她不吃香菜，但今天这盘汤底有"的常见漏网）
 * ============================================================ */
const KEY = 'couple_order_avoid_v1'

export const PRESET_AVOIDS = [
  { key: '香菜', label: '香菜' },
  { key: '葱', label: '葱' },
  { key: '姜', label: '姜' },
  { key: '蒜', label: '蒜' },
  { key: '辣椒', label: '辣' },
  { key: '花椒', label: '麻' },
  { key: '海鲜', label: '海鲜', aliases: ['虾', '蟹', '贝', '蛤', '蛏', '鲍'] },
  { key: '酒精', label: '酒', aliases: ['料酒', '啤酒', '白酒', '红酒', '米酒', '醪糟'] },
]

/** 读设备忌口清单（关键词数组，去空去重） */
export function readAvoids() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(k => typeof k === 'string' && k.trim()).map(k => k.trim())
  } catch { return [] }
}

export function writeAvoids(list) {
  try { localStorage.setItem(KEY, JSON.stringify(Array.isArray(list) ? list.filter(x => typeof x === 'string' && x.trim()) : [])) } catch {}
}

/** 展开预设里的别名到关键词集合（避免"料酒"逃过"酒"匹配） */
function expandKeywords(list) {
  const out = new Set()
  for (const k of list) {
    out.add(k)
    const preset = PRESET_AVOIDS.find(p => p.key === k)
    if (preset && Array.isArray(preset.aliases)) preset.aliases.forEach(a => out.add(a))
  }
  return Array.from(out)
}

/** 扫一组 ingredients 命中哪些忌口；返回 [{ keyword, ingredient, hitIn }] */
export function matchAvoid(ingredients, avoidList) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return []
  const kws = expandKeywords(avoidList || [])
  if (kws.length === 0) return []
  const hits = []
  for (const ing of ingredients) {
    const s = String(ing || '')
    for (const k of kws) {
      if (k && s.includes(k)) { hits.push({ keyword: k, ingredient: s }); break }
    }
  }
  return hits
}

/** 一屏扫多道菜：返回 [{ dishName, hits: [...] }]（只保留命中的） */
export function scanDishes(dishesWithRecipe, avoidList) {
  const out = []
  for (const d of dishesWithRecipe) {
    const hits = matchAvoid(d?.recipe?.ingredients, avoidList)
    if (hits.length) out.push({ dishName: d.name, hits })
  }
  return out
}
