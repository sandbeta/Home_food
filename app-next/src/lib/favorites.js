import { useState, useCallback, useEffect } from 'react'

const KEY = 'couple_order_favorites'

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/* 批3 修 P1/P2（不可变文件 · 理由=消除白屏崩溃路径 + 补"收藏后娃娃机 A 层信号过期"）：
   ① write 包 try：无痕/配额满时收藏按钮不再在点击回调里抛未捕获异常打断 React；
   ② 同标签页广播 cg-fav 事件 + 跨标签 storage 事件 → 所有 useFavorites 实例即时同步
     （Menu 收藏后，Home 娃娃机 A 层的 favoriteIds 无需重挂载即刷新）。 */
function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)) } catch { console.warn('[favorites] 本地存储写入失败（隐私模式/配额）') }
  try { window.dispatchEvent(new Event('cg-fav')) } catch { /* 非浏览器环境 */ }
}

// Reactive favorites backed by localStorage. Returns the current list plus
// toggle / remove helpers and a `has` predicate for O(1)-ish lookups in lists.
export function useFavorites() {
  const [favorites, setFavorites] = useState(read)

  useEffect(() => {
    const sync = () => setFavorites(read())
    window.addEventListener('cg-fav', sync)
    const onStorage = (e) => { if (!e.key || e.key === KEY) sync() }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('cg-fav', sync); window.removeEventListener('storage', onStorage) }
  }, [])

  const persist = useCallback((next) => {
    write(next)
    setFavorites(next)
  }, [])

  const toggle = useCallback((dish) => {
    if (!dish || dish.id == null) return
    const list = read()
    const idx = list.findIndex((d) => d.id === dish.id)
    if (idx >= 0) list.splice(idx, 1)
    else list.unshift({ id: dish.id, name: dish.name, category: dish.category, price: dish.price, image_url: dish.image_url, description: dish.description })
    persist(list)
  }, [persist])

  const remove = useCallback((id) => {
    persist(read().filter((d) => d.id !== id))
  }, [persist])

  const has = useCallback((id) => favorites.some((d) => d.id === id), [favorites])

  return { favorites, toggle, remove, has }
}
