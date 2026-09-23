import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const CartContext = createContext()
const CART_KEY = 'couple_order_cart_v2'
const WHO_KEY = 'couple_order_who'

/* M-s4 修（不可变文件 · 改动记入 PROJECT-HANDOFF §4 台账）：
   原 `JSON.parse(localStorage.cart||'[]')` 只在解析抛错时兜底，不校验类型。
   若该键被污染成 `{}`/`"null"`/`"0"` 或数组元素缺关键字段，items.reduce 抛 TypeError
   → CartProvider 崩 → 全站白屏（所有页面通过 useCart 消费）。
   加两道守卫：parse 结果必是数组 + 每项必是 {dish_id:number, quantity:number, added_by:'me'|'partner'}
   结构（不合法单项静默丢弃，不影响他项）。 */
function safeReadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    if (!Array.isArray(raw)) return []
    return raw.filter(it => it && typeof it === 'object'
      && Number.isFinite(Number(it.dish_id))
      && Number.isFinite(Number(it.quantity)) && Number(it.quantity) > 0)
      .map(it => ({ ...it, dish_id: Number(it.dish_id), quantity: Number(it.quantity), price: Number(it.price) || 0 }))
  } catch { return [] }
}
function safeReadWho() {
  const w = localStorage.getItem(WHO_KEY)
  return w === 'me' || w === 'partner' ? w : 'me'
}

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(safeReadCart)
  const [whoAmI, setWhoAmI] = useState(safeReadWho)

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem(WHO_KEY, whoAmI) }, [whoAmI])

  const addItem = useCallback((dish) => {
    setItems(prev => {
      const existing = prev.find(i => i.dish_id === dish.id && i.added_by === whoAmI)
      if (existing) {
        return prev.map(i => i.dish_id === dish.id && i.added_by === whoAmI ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { dish_id: dish.id, name: dish.name, price: dish.price, category: dish.category, quantity: 1, added_by: whoAmI }]
    })
  }, [whoAmI])

  const removeItem = useCallback((dishId, addedBy) => {
    setItems(prev => prev.filter(i => !(i.dish_id === dishId && (!addedBy || i.added_by === addedBy))))
  }, [])

  const updateQuantity = useCallback((dishId, quantity, addedBy) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.dish_id === dishId && (!addedBy || i.added_by === addedBy))))
    } else {
      setItems(prev => prev.map(i => i.dish_id === dishId && (!addedBy || i.added_by === addedBy) ? { ...i, quantity } : i))
    }
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  /* —— 批 5 新增 · 跨设备分享购物车（家庭场景"手动分享 + 拉取合并"） ——
     语义：她点几份"分享给 TA" → 服务端存 sharedCart → 他打开 Cart 看到"TA 分享了 N 件"
     → 点合并 = 把 sharedCart.items 逐个并入本地（保留每条原 added_by 归属，不重贴当前人格）。
     只做增量：items/whoAmI 主 reducer 语义不变，仅加三个方法。 */
  const shareCart = useCallback(async () => {
    const res = await fetch('/api/cart/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, by: whoAmI }),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    try { window.__cgAnnounce?.(`购物车已分享给${whoAmI === 'me' ? 'TA' : '你'}，共 ${items.length} 件`) } catch {}
    return data
  }, [items, whoAmI])

  const fetchSharedCart = useCallback(async () => {
    const res = await fetch('/api/cart/shared')
    if (!res.ok) throw new Error('HTTP ' + res.status)
    return res.json()
  }, [])

  const mergeSharedCart = useCallback((sharedItems) => {
    if (!Array.isArray(sharedItems) || sharedItems.length === 0) return 0
    let merged = 0
    setItems(prev => {
      let next = [...prev]
      for (const s of sharedItems) {
        const by = s.added_by === 'partner' ? 'partner' : 'me'
        const idx = next.findIndex(i => i.dish_id === s.dish_id && i.added_by === by)
        if (idx >= 0) {
          next[idx] = { ...next[idx], quantity: next[idx].quantity + (Number(s.quantity) || 1) }
        } else {
          next.push({ dish_id: Number(s.dish_id), name: s.name, price: Number(s.price) || 0, category: s.category || '', quantity: Number(s.quantity) || 1, added_by: by })
        }
        merged++
      }
      return next
    })
    try { window.__cgAnnounce?.(`已合并 ${sharedItems.length} 件到购物车`) } catch {}
    return merged
  }, [])

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const split = items.reduce((acc, i) => ({ ...acc, [i.added_by]: (acc[i.added_by] || 0) + i.price * i.quantity }), { me: 0, partner: 0 })

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalCount, split, whoAmI, setWhoAmI, shareCart, fetchSharedCart, mergeSharedCart }}>
      {children}
    </CartContext.Provider>
  )
}
