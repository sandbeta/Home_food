// Category icon mapping - emojis for category badges
import { assetUrl } from './assetUrl'

export const CATEGORY_ICONS = {
  '家常菜': '🍳',
  '硬菜': '🥩',
  '素菜': '🥬',
  '主食': '🍚',
  '小吃': '🥟',
  '水果': '🍎',
  '饮品': '🥤',
  '汤类': '🍲',
  '川菜': '🌶️',
  '粤菜': '🦐',
  '湘菜': '🌶️',
  '鲁菜': '🍖',
  '苏菜': '🦀',
  '浙菜': '🐟',
  '闽菜': '🍜',
  '徽菜': '🍄',
  '东北菜': '🥟',
  '西北菜': '🍜',
  '云贵菜': '🍲',
  '其他': '🍽️',
}

// Get emoji icon for category badges
export function getCategoryEmoji(category) {
  return CATEGORY_ICONS[category] || '🍽️'
}

// 本地菜品图 → 缩略图档位目录的映射，只认这一种形态：/dish-images/<相对路径>.<扩展名>
const LOCAL_DISH_IMG_RE = /^\/dish-images\/(.+?\.(?:jpe?g|png|webp))$/i
// 已经在 thumb/ 或 w800/ 里的路径不再二次映射（避免 thumb/thumb/... 这种自我嵌套）
const SIZED_DIR_RE = /^\/dish-images\/(?:thumb|w800)\//i
const THUMB_SIZES = ['thumb', 'w800']

/**
 * 取菜品的展示图，并按用途返回对应分辨率档位（缩略图管线的唯一入口）。
 *
 * 三档用途：
 *  - 'thumb'（默认）：宽 160 的 WebP —— 列表行 / 70px 格子 / 小圆盘等一切小尺寸展示
 *  - 'w800'         ：宽 ≤800 的 WebP —— 详情页主视觉、大图预览这类占满宽度的展示
 *  - 'orig'         ：原图直出，**不做任何映射** —— 兜底 / 用途未知 / 需要原始像素时用它
 *
 * 映射规则（与 scripts/build_thumbs.mjs 的产出**逐字一致**；两处互为唯一真源，改一处必须同步改另一处）：
 *   `/dish-images/<相对路径>.<jpg|jpeg|png|webp>` → `/dish-images/<档>/<相对路径>.<原扩展名>.webp`
 *   即 **保留原扩展名、末尾追加 .webp**，因此 .webp 源会出现双后缀：
 *     /dish-images/htc/502.jpg  → /dish-images/thumb/htc/502.jpg.webp
 *     /dish-images/real/10.webp → /dish-images/thumb/real/10.webp.webp   ← 双后缀是设计如此
 *   为什么留原扩展名：同目录下的 a.jpg 与 a.png 若都压成 a.webp 会互相覆盖。
 *
 * 不映射、原样透传的形态：http(s)/data:/blob: 外链、空值、非 /dish-images/ 本地形态、
 * 已在 thumb|w800 目录里的路径、size='orig'（含未知档位）。
 * 所有返回值最后都过 assetUrl() —— GitHub Pages 等子路径部署下绝对路径会 404。
 *
 * 前置条件：thumb/ 与 w800/ 由 `npm run thumbs`（scripts/build_thumbs.mjs）预生成；
 * 未跑过构建时缩略图 404，调用点的 onError 会退回 emoji 垫底。
 *
 * @param {{ image_url?: string }|null|undefined} dish 菜品对象
 * @param {'thumb'|'w800'|'orig'} [size='thumb'] 分辨率档位
 * @returns {string|null} 可直接给 <img src> 的路径；无图时为 null（调用方 emoji 兜底）
 */
export function getDishImage(dish, size = 'thumb') {
  if (!dish) return null
  const raw = dish.image_url
  if (!raw) return null
  if (!THUMB_SIZES.includes(size)) return assetUrl(raw) // 'orig' 与未知档位：不动路径
  if (SIZED_DIR_RE.test(raw)) return assetUrl(raw)      // 已是档位路径：不重复映射
  const m = LOCAL_DISH_IMG_RE.exec(raw)
  if (!m) return assetUrl(raw)                         // 外链 / data: / blob: / 其他形态：原逻辑
  return assetUrl(`/dish-images/${size}/${m[1]}.webp`)
}
