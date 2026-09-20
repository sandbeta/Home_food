// ============================================================
// overdrive 翻页套件（View Transitions）
// 共享元素形变：列表/网格菜卡 ⇄ 详情页大图。要点：
//  - 目标页 chunk 先 preload 再 flushSync，绕开 lazy×Suspense 与同步 flush 的死结
//  - 前向：命令式给被点的 .vt-dish-frame 挂名（先清残留名，防同名双元素让形变失效）
//  - 后向：新 DOM 由 React 按 heroNameFor 挂名（列表首帧就有图才飞得回去 → 双缓存）
//  - 不支持 VT / reduced-motion / 任何异常 → 回落现有淡入；导航绝不因增强而断
// ============================================================

let target = null // { id, from } —— 最近一次形变目标与来源路径

const dishCache = new Map()
const listCache = new Map()

export const setMorphTarget = (t) => { target = t }
export const getMorphTarget = () => target
/** 该菜品是否为当前形变主角 → 是则该卡面容器挂 dish-hero 名 */
export const heroNameFor = (id) => (target && id != null && Number(id) === target.id ? 'dish-hero' : undefined)

export const cacheDish = (d) => { if (d && d.id != null) dishCache.set(Number(d.id), d) }
export const getCachedDish = (id) => dishCache.get(Number(id)) || null
export const cacheList = (key, arr) => { if (Array.isArray(arr)) listCache.set(key, arr.map(d => { cacheDish(d); return d })) }
export const getCachedList = (key) => listCache.get(key) || null

const ROUTES = [
  [/^\/home/, () => import('../pages/Home')],
  [/^\/menu/, () => import('../pages/Menu')],
  [/^\/dish\//, () => import('../pages/DishDetail')],
  [/^\/cart/, () => import('../pages/Cart')],
  [/^\/orders\/[^/]+/, () => import('../pages/OrderDetail')],
  [/^\/orders/, () => import('../pages/MyOrders')],
  [/^\/profile/, () => import('../pages/Profile')],
  [/^\/hot/, () => import('../pages/HotDishes')],
  [/^\/admin\/dishes/, () => import('../pages/AdminDishes')],
  [/^\/admin\/orders/, () => import('../pages/AdminOrders')],
  [/^\/admin/, () => import('../pages/Admin')],
]

export const vtSupported = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function'

const reduceMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

async function runVt(navigate, to, from) {
  const state = { vt: true, morphFrom: from }
  const plain = () => navigate(to, { state })
  const path = String(to).split('?')[0].split('#')[0]
  const load = (ROUTES.find(([re]) => re.test(path)) || [])[1]
  if (load) { try { await load() } catch { /* preload 挂了就走下面的兜底直切 */ } }
  if (!vtSupported() || reduceMotion()) { plain(); return }
  try {
    const { flushSync } = await import('react-dom')
    let t
    try {
      t = document.startViewTransition(() => { flushSync(() => navigate(to, { state })) })
    } catch { plain(); return }
    // 目标页渲染期抛错时，VT 不会提交新状态：这里再走一次普通导航兜底
    if (t && t.updateCallbackDone && t.updateCallbackDone.catch) {
      t.updateCallbackDone.catch(() => { try { navigate(to, { state }) } catch { /* 已在目标页则无事 */ } })
    }
  } catch { try { plain() } catch { /* 最后防线：放弃增强 */ } }
}

/** 卡面 → 详情。e 为点击事件（currentTarget 内含 .vt-dish-frame）；from 为当前列表路径 */
export function morphTo(navigate, to, e, dish, from) {
  if (dish && dish.id != null) {
    setMorphTarget({ id: Number(dish.id), from })
    cacheDish(dish)
    // 旧 DOM 快照前：先清同名残留，再命令式给被点卡面挂名（旧快照唯一可改时机）
    if (typeof document !== 'undefined' && document.querySelectorAll) {
      document.querySelectorAll('.vt-dish-frame').forEach((el) => {
        if (el.style && el.style.viewTransitionName) el.style.viewTransitionName = ''
      })
      const root = (e && e.currentTarget) || null
      const frame = root && root.querySelector ? root.querySelector('.vt-dish-frame') : null
      if (frame) frame.style.viewTransitionName = 'dish-hero'
    }
  }
  return runVt(navigate, to, from)
}

/** 详情 → 来源列表：仅当本页由形变进入（state.morphFrom 存在）时才走；旧 DOM 的 hero 已由 React 挂名 */
export function morphBack(navigate, to) { return runVt(navigate, to) }
