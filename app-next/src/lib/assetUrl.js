const BASE = import.meta.env.BASE_URL || '/'

export function assetUrl(path) {
  if (!path) return path
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  if (!path.startsWith('/')) return path
  return BASE.endsWith('/') ? BASE + path.slice(1) : BASE + path
}

export function dishImage(dish) {
  return assetUrl(dish?.image_url || '')
}
