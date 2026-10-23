import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'

const CartContext = createContext(null)
const CART_KEY = 'couple_order_cart_v2'
const WHO_KEY = 'couple_order_who'

function safeReadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw
      .filter((it) => it && typeof it === 'object'
        && Number.isFinite(Number(it.dish_id))
        && Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0
        && (it.added_by === 'me' || it.added_by === 'partner'))
      .map((it) => ({
        dish_id: Number(it.dish_id),
        name: String(it.name || ''),
        price: Number(it.price) || 0,
        category: String(it.category || ''),
        image_url: String(it.image_url || ''),
        quantity: Number(it.quantity),
        added_by: it.added_by,
      }))
  } catch {
    return []
  }
}

function safeReadWho() {
  try {
    const w = localStorage.getItem(WHO_KEY)
    return w === 'partner' ? 'partner' : 'me'
  } catch {
    return 'me'
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 隐私模式/配额满：本次会话照常，只是不落盘 */
  }
}

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(safeReadCart)
  const [whoAmI, setWhoAmI] = useState(safeReadWho)

  useEffect(() => { safeWrite(CART_KEY, JSON.stringify(items)) }, [items])
  useEffect(() => { safeWrite(WHO_KEY, whoAmI) }, [whoAmI])

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return
      if (e.key === CART_KEY) setItems(safeReadCart())
      if (e.key === WHO_KEY) setWhoAmI(safeReadWho())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const addItem = useCallback((dish, by) => {
    if (!dish || dish.id == null) return
    const owner = by === 'partner' ? 'partner' : (by || whoAmI)
    setItems((prev) => {
      const found = prev.find((i) => i.dish_id === Number(dish.id) && i.added_by === owner)
      if (found) {
        return prev.map((i) => i === found ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, {
        dish_id: Number(dish.id),
        name: dish.name || '',
        price: Number(dish.price) || 0,
        category: dish.category || '',
        image_url: dish.image_url || '',
        quantity: 1,
        added_by: owner,
      }]
    })
  }, [whoAmI])

  const removeItem = useCallback((dishId, addedBy) => {
    setItems((prev) => prev.filter((i) => !(i.dish_id === Number(dishId) && (!addedBy || i.added_by === addedBy))))
  }, [])

  const setQuantity = useCallback((dishId, quantity, addedBy) => {
    const q = Number(quantity)
    setItems((prev) => {
      if (!Number.isFinite(q) || q <= 0) {
        return prev.filter((i) => !(i.dish_id === Number(dishId) && (!addedBy || i.added_by === addedBy)))
      }
      return prev.map((i) => (i.dish_id === Number(dishId) && (!addedBy || i.added_by === addedBy))
        ? { ...i, quantity: Math.min(99, q) }
        : i)
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const shareCart = useCallback(async () => {
    return api.cart.share({ items, by: whoAmI })
  }, [items, whoAmI])

  const fetchShared = useCallback(() => api.cart.shared(), [])

  const mergeShared = useCallback((shared) => {
    const list = Array.isArray(shared?.items) ? shared.items : []
    if (!list.length) return 0
    setItems((prev) => {
      const next = [...prev]
      for (const s of list) {
        const by = s.added_by === 'partner' ? 'partner' : 'me'
        const idx = next.findIndex((i) => i.dish_id === Number(s.dish_id) && i.added_by === by)
        const q = Math.max(1, Number(s.quantity) || 1)
        if (idx >= 0) next[idx] = { ...next[idx], quantity: Math.min(99, next[idx].quantity + q) }
        else next.push({
          dish_id: Number(s.dish_id),
          name: s.name || '',
          price: Number(s.price) || 0,
          category: s.category || '',
          image_url: s.image_url || '',
          quantity: q,
          added_by: by,
        })
      }
      return next
    })
    return list.length
  }, [])

  const total = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  )
  const count = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items],
  )
  const split = useMemo(() => items.reduce((acc, i) => {
    acc[i.added_by] = (acc[i.added_by] || 0) + (Number(i.price) || 0) * (Number(i.quantity) || 0)
    return acc
  }, { me: 0, partner: 0 }), [items])

  const value = useMemo(() => ({
    items, addItem, removeItem, setQuantity, clearCart,
    total, count, split, whoAmI, setWhoAmI,
    shareCart, fetchShared, mergeShared,
  }), [items, addItem, removeItem, setQuantity, clearCart, total, count, split, whoAmI, shareCart, fetchShared, mergeShared])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
