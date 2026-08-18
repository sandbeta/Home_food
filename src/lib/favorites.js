import { useState, useCallback } from 'react'

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

function write(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

// Reactive favorites backed by localStorage. Returns the current list plus
// toggle / remove helpers and a `has` predicate for O(1)-ish lookups in lists.
export function useFavorites() {
  const [favorites, setFavorites] = useState(read)

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

  const has = useCallback((id) => read().some((d) => d.id === id), [])

  return { favorites, toggle, remove, has }
}
