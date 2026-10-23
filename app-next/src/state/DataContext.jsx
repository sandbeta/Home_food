import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../lib/api.js'

const DataContext = createContext(null)

const LOADERS = {
  dishes: () => api.dishes.all(),
  orders: () => api.orders.list(),
  anniversaries: () => api.anniversaries.list(),
  wishes: () => api.wishes.list(),
  ratings: () => api.ratings.list(),
}

export function useData() {
  return useContext(DataContext)
}

export function DataProvider({ children }) {
  const [data, setData] = useState({
    dishes: [],
    orders: [],
    anniversaries: [],
    wishes: [],
    ratings: [],
  })
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const alive = useRef(true)

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const load = useCallback(async (keys = Object.keys(LOADERS)) => {
    setLoading(true)
    const results = await Promise.allSettled(keys.map(async (k) => [k, await LOADERS[k]()]))
    if (!alive.current) return
    const patch = {}
    const errs = {}
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const [k, value] = r.value
        patch[k] = Array.isArray(value) ? value : []
      } else {
        const reason = r.reason || {}
        const k = keys[results.indexOf(r)]
        errs[k] = reason.status === 404 ? 'not-found' : (reason.message || 'load-failed')
      }
    }
    setData((prev) => ({ ...prev, ...patch }))
    setErrors((prev) => ({ ...prev, ...errs }))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const reload = useCallback(() => load(), [load])
  const refresh = useCallback((key) => load([key]), [load])

  const dishesById = useMemo(() => {
    const map = new Map()
    for (const d of data.dishes) map.set(Number(d.id), d)
    return map
  }, [data.dishes])

  const value = useMemo(() => ({
    ...data,
    dishesById,
    loading,
    errors,
    reload,
    refresh,
    refreshDishes: () => refresh('dishes'),
    refreshOrders: () => refresh('orders'),
    refreshAnniversaries: () => refresh('anniversaries'),
    refreshWishes: () => refresh('wishes'),
    refreshRatings: () => refresh('ratings'),
  }), [data, dishesById, loading, errors, reload, refresh])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
