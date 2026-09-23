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
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const split = items.reduce((acc, i) => ({ ...acc, [i.added_by]: (acc[i.added_by] || 0) + i.price * i.quantity }), { me: 0, partner: 0 })

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalPrice, totalCount, split, whoAmI, setWhoAmI }}>
      {children}
    </CartContext.Provider>
  )
}
