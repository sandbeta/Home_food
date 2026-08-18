// ============================================================
// 暗房晚宴 · 图片资源中心
// hero / 背景用精选远程美食大图（Unsplash 固定 URL，带 webp/响应式参数）
// 三级回退：Unsplash → 本地 /dish-images/*.webp → ink 渐变占位
// 交付前可把 HERO_IMAGES 替换为最终素材（替换点已标注）
// ============================================================

const U = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`

// 各页 hero 大图（电影感 / 暗调更适合的餐饮摄影）
export const HERO_IMAGES = {
  // 替换点：首页签名菜（暗调高级餐饮）
  home: U('1414235077428-338989367dfe'),
  // 替换点：菜单浏览
  menu: U('1504674900247-0877df9cc836'),
  // 替换点：菜品详情
  dish: U('1546069901-ba9599a7e63c'),
  // 替换点：收藏
  favorites: U('1551782450-a2132b4ba21d'),
  // 替换点：我的订单
  orders: U('1466978913421-dad2ebd01d17'),
  // 替换点：订单详情
  order: U('1424847651672-bf20a4b0982b'),
  // 替换点：个人中心
  profile: U('1544005313-94ddf0286df2'),
}

// 本地回退图（public/dish-images 下已有 65 张 webp）
export const LOCAL_FALLBACKS = [
  '/dish-images/dish-1.webp',
  '/dish-images/dish-2.webp',
  '/dish-images/dish-3.webp',
  '/dish-images/dish-7.webp',
  '/dish-images/dish-12.webp',
  '/dish-images/dish-20.webp',
]

// 暖骨白→浅陶渐变占位（终极回退，无图时也不开天窗）
export const INK_PLACEHOLDER =
  'linear-gradient(135deg, #F7F3EC 0%, #EFE7DA 100%)'

// 给 <img onError> 用的三级回退：先本地 webp，再 ink 渐变
export function heroFallback(e, index = 0) {
  const el = e?.currentTarget
  if (!el) return
  const local = LOCAL_FALLBACKS[index % LOCAL_FALLBACKS.length]
  if (el.dataset.fb === 'local') {
    el.style.backgroundImage = INK_PLACEHOLDER
    el.style.display = 'none'
    return
  }
  if (el.src && el.src.indexOf(local) === -1) {
    el.dataset.fb = 'local'
    el.src = local
  } else {
    el.dataset.fb = 'done'
    el.style.backgroundImage = INK_PLACEHOLDER
    el.src = ''
  }
}

export function resolveHero(key, index = 0) {
  const src = HERO_IMAGES[key] || LOCAL_FALLBACKS[index % LOCAL_FALLBACKS.length]
  return src
}
