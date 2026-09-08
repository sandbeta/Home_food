// ============================================================
// 晨光厨房 · 图片资源中心
// Hero 图已全部本地化（public/hero/*.jpg）。
// 路径经 assetUrl 转换，兼容 GitHub Pages 等 /{仓库名}/ 子路径部署。
// 本地文件缺失时仍保留两级回退：/dish-images → ink 渐变占位
// ============================================================
import { assetUrl } from '../lib/assetUrl'

// 各页 hero 大图（本地，已转基址）
export const HERO_IMAGES = {
  home: assetUrl('/hero/home.jpg'),
  menu: assetUrl('/hero/menu.jpg'),
  dish: assetUrl('/hero/dish.jpg'),
  orders: assetUrl('/hero/orders.jpg'),
  order: assetUrl('/hero/order.jpg'),
  profile: assetUrl('/hero/profile.jpg'),
}

// 本地回退图（public/dish-images 下已有 65 张 webp）
export const LOCAL_FALLBACKS = [
  '/dish-images/dish-1.webp',
  '/dish-images/dish-2.webp',
  '/dish-images/dish-3.webp',
  '/dish-images/dish-7.webp',
  '/dish-images/dish-12.webp',
  '/dish-images/dish-20.webp',
].map(assetUrl)

// 暖骨白→浅陶渐变占位（终极回退，无图时也不开天窗）
export const INK_PLACEHOLDER =
  'linear-gradient(135deg, var(--color-ink-900) 0%, var(--color-ink-850) 100%)'

// 给 <img onError> 用的回退：先本地 webp，再 ink 渐变
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
  return HERO_IMAGES[key] || LOCAL_FALLBACKS[index % LOCAL_FALLBACKS.length]
}
