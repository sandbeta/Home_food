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

/* 批4 修 P1：
   ①串行 await → Promise.all 并发（同 dish_id 去重）：mock 每请求固定 160ms，
     10 道菜原来要 1.6s 起，现在一次并发拿齐；
   ②normName 剥掉括号说明再取词：真实语料 20.3% 原料形如「青蟹（别称：肉蟹）」，
     原实现把整串当名字——既不并名又把不可读的串复制进超市清单；
   ③厨具词过滤：烤箱/筛网/打蛋器…是工具不是食材（语料里 36 种 53 次），
     混进"要买这些东西"清单等于让人拿买菜钱买锅。 */
const PAREN_RE = /[（(][^）)]*[)）]/g
const TOOL_RE = /烤箱|烤盘|烤网|筛网|漏勺|滤网|打蛋器|料理机|破壁机|搅拌机|厨房秤|电子秤|不粘锅|砂锅|奶锅|雪平锅|模具|锡纸|保鲜膜|保鲜袋|油纸|烘焙纸|温度计|量杯|量勺|擀面杖|蒸笼|蒸屉/

function normName(raw) {
  if (!raw || typeof raw !== 'string') return ''
  const trimmed = raw.replace(PAREN_RE, '').trim()
  const i = trimmed.search(/[\s ]/)
  const name = i === -1 ? trimmed : trimmed.slice(0, i)
  if (!name || TOOL_RE.test(name)) return ''
  return name
}

/**
 * 并发拉每道菜的 recipe（懒加载）→ 合并 ingredients → 返回 { list, noRecipe }。
 * 无菜谱数据的菜跳过、单独列进 noRecipe（批7 补全后正常菜单已 0 命中；此路径保留给
 * 管理员新增菜与请求失败，UI 提示"这几道没菜谱原料清单"）。
 * 用法：const { list, noRecipe } = await buildPurchaseList(items)
 */
export async function buildPurchaseList(items) {
  const map = new Map() // name -> Set(dishName)
  const noRecipe = []
  const uniq = new Map() // dish_id -> name（同菜多行只拉一次）
  for (const it of (items || [])) {
    if (it && it.dish_id) uniq.set(String(it.dish_id), it.name || `菜#${it.dish_id}`)
  }
  await Promise.all(Array.from(uniq.entries()).map(async ([dishId, dishName]) => {
    try {
      const res = await requestJson(`/api/dishes/${dishId}`)
      const dish = await res.json()
      const ings = dish && dish.recipe && Array.isArray(dish.recipe.ingredients) ? dish.recipe.ingredients : null
      if (!ings) { noRecipe.push(dishName); return }
      for (const raw of ings) {
        const name = normName(raw)
        if (!name) continue
        if (!map.has(name)) map.set(name, new Set())
        map.get(name).add(dishName)
      }
    } catch { noRecipe.push(dishName) }
  }))
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
