/* ============================================================
 * 批 2b 新增 · 备菜/采购清单
 * ------------------------------------------------------------
 * 输入：cart items（[{ dish_id, quantity, name }]）+ recipes 映射（{ [id]: {ingredients:[]} }）
 * 输出：合并去重后的采购清单，按 ingredient 名称聚成一组，附"来自哪几道菜"。
 *
 * 简化决策（家庭自用足够）：
 *   · 不解析数量（"3 片 / 100 g / 适量"混着不好合并）
 *   · 每项 ingredient 只归一化到「第一个空格前 = 名字」→ 同名合并
 *   · 若 ingredient 无空格（如"盐 适量"→"盐"）保留原字符串
 *   · 不做荤/素/调料分组（家庭买菜的分类比菜谱更粗，交给用户心智分组）
 *
 * 用法：
 *   const list = await buildPurchaseList(items)
 *   list.map(e => e.name) 用于展示，toPlainText(list) 用于复制到剪贴板
 * ============================================================ */
import { requestJson } from './request'

function normName(raw) {
  // "生姜 3 片" → "生姜"；"盐 适量" → "盐"；"（可选）葱花" → "（可选）葱花"（无空格保留原样）
  if (!raw || typeof raw !== 'string') return ''
  const trimmed = raw.trim()
  const i = trimmed.search(/[\s ]/)
  return i === -1 ? trimmed : trimmed.slice(0, i)
}

/**
 * 拉每道菜的 recipe（懒加载）→ 合并 ingredients → 返回 [{ name, from: [dishName...] }]。
 * 无菜谱数据的菜（原 65 道老菜）跳过、单独列进 noRecipe，UI 提示"这几道没菜谱原料清单"。
 */
export async function buildPurchaseList(items) {
  const map = new Map() // name -> Set(dishName)
  const noRecipe = []
  for (const it of (items || [])) {
    if (!it || !it.dish_id) continue
    try {
      const res = await requestJson(`/api/dishes/${it.dish_id}`)
      const dish = await res.json()
      const ings = dish && dish.recipe && Array.isArray(dish.recipe.ingredients) ? dish.recipe.ingredients : null
      if (!ings) { noRecipe.push(it.name || `菜#${it.dish_id}`); continue }
      for (const raw of ings) {
        const name = normName(raw)
        if (!name) continue
        if (!map.has(name)) map.set(name, new Set())
        map.get(name).add(it.name || `菜#${it.dish_id}`)
      }
    } catch { noRecipe.push(it.name || `菜#${it.dish_id}`) }
  }
  const list = Array.from(map.entries())
    .map(([name, from]) => ({ name, from: Array.from(from) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  return { list, noRecipe }
}

/** 复制到剪贴板用的纯文本（一行一种 + 括号里注明来自哪几道菜） */
export function toPlainText({ list, noRecipe }) {
  const head = list.map(e => `${e.name}${e.from.length ? `（${e.from.join('、')}）` : ''}`)
  const lines = head.join('\n')
  if (noRecipe && noRecipe.length) return `${lines}\n\n（另：${noRecipe.join('、')} 没菜谱原料数据，凭印象准备）`
  return lines
}
