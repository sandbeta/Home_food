// ============================================================
// useClawSignals · 娃娃机智能池的信号聚合（Home / NightHome 共用）
// ------------------------------------------------------------
// 把此前在 Home / NightHome 里各写一遍的
//   wishes / anniversaries / orders fetch + eatCounts 聚合 + tagLayers + 工作集粗筛
// 收进一处，调用方只喂一份 dishes（+ 可选 todayDishId）即可拿到带权重的堆料池。
// 纪律：不改 mockApi/server（不可变），只读消费现成接口；fetch 失败退化为等权（不阻断）。
// 网络副作用留在 hook 内，聚合/打标/粗筛全走 clawPool 纯函数 → 那部分可单测。
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { useFavorites } from '../lib/favorites'
import { computeEatSignals, tagLayers, trimPoolToWorkingSet } from '../lib/clawPool'

/**
 * @param {Array} dishes  当前页面的候选菜（Home=剔除网格后 rotSource；NightHome=夜宵池），裸 dish 对象数组
 * @param {object} opts   { workingSet?:number=48, promotedIds?:Set|Array, todayDishId?:number|null }
 * @returns {{ pool:Array, signalsOk:boolean }} pool=带 _layer/_weight/_flags 的工作集
 */
export function useClawSignals(dishes, { workingSet = 48, promotedIds, todayDishId } = {}) {
  const { favorites } = useFavorites()
  const [wishes, setWishes] = useState([])
  const [orders, setOrders] = useState([])
  const [signalsOk, setSignalsOk] = useState(true)

  useEffect(() => {
    let alive = true
    // 各自独立 catch：任一挂掉只让对应信号为空、退化为等权，不整体失败
    Promise.all([
      fetch('/api/wishes?status=added').then((r) => (r.ok ? r.json() : [])).catch(() => { if (alive) setSignalsOk(false); return [] }),
      fetch('/api/orders').then((r) => (r.ok ? r.json() : [])).catch(() => { if (alive) setSignalsOk(false); return [] }),
    ]).then(([w, o]) => {
      if (!alive) return
      setWishes(Array.isArray(w) ? w : [])
      setOrders(Array.isArray(o) ? o : [])
    })
    return () => { alive = false }
  }, [])

  const pool = useMemo(() => {
    if (!dishes || !dishes.length) return []
    const { counts, eatenIds } = computeEatSignals(orders)
    const wishDishIds = new Set(wishes.filter((x) => x && x.status === 'added' && x.added_dish_id != null).map((x) => Number(x.added_dish_id)))
    const tagged = tagLayers(dishes, {
      favoriteIds: new Set(favorites.map((f) => Number(f.id))),
      eatCounts: counts,
      wishDishIds,
      promotedIds: promotedIds ? (promotedIds instanceof Set ? promotedIds : new Set(promotedIds.map(Number))) : undefined,
      todayDishId: todayDishId != null ? Number(todayDishId) : null,
      eatenIds,
    })
    return trimPoolToWorkingSet(tagged, workingSet)
  }, [dishes, orders, wishes, favorites, promotedIds, todayDishId, workingSet])

  return { pool, signalsOk }
}
