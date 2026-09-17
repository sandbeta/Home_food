// ============================================================
// 晨光厨房 · 主题系统（晨光 light / 夜宵 night）
// 全站颜色均走 @theme 令牌，夜宵模式 = [data-theme="night"] 上的一组变量反相
// （index.css 末尾的夜宵区块），因此本模块只负责：时段判定、切换、持久化、广播。
//
// 自动跟随时间（2026-09-17 所有者需求）：
// 深夜时段（21:00—04:59）自动夜宵，其余自动晨光。手动开关**只在当前时段内**
// 生效（存手动值 + 生效时段戳），跨过 05:00 / 21:00 边界后自动回归时间规则——
// 白天赌气开着的夜宵，入夜护眼该接管还是接管。
// ============================================================
import { useSyncExternalStore } from 'react'

const THEME_KEY = 'couple_order_theme'
const MANUAL_SLOT_KEY = 'couple_order_theme_manual_slot'

// 读取 ?theme= 调试参数。hash 路由下查询串可能在 # 之后（/repo/#/menu?theme=night），
// 也可能在 # 之前，两处都解析，兼容开发与部署两种 URL 形态。
function readThemeParam() {
  const { search, hash } = window.location
  const fromSearch = new URLSearchParams(search).get('theme')
  if (fromSearch) return fromSearch
  const qIdx = hash.indexOf('?')
  if (qIdx !== -1) return new URLSearchParams(hash.slice(qIdx + 1)).get('theme')
  return null
}

/** 时段判定：深夜（21:00—04:59）= night，其余 = light */
export function slotTheme(d = new Date()) {
  const h = d.getHours()
  return (h >= 21 || h < 5) ? 'night' : 'light'
}

/**
 * 时段身份戳：凌晨 0—5 点归属前一晚（夜宵时段跨午夜），
 * 与"手动值写入时的戳"相等 = 还在用户当初心选的时段内，手动优先；
 * 不等 = 已跨时段，手动覆盖过期，回归自动。
 */
function slotStamp(d = new Date()) {
  const anchor = new Date(d)
  if (anchor.getHours() < 5) anchor.setDate(anchor.getDate() - 1)
  return `${anchor.getFullYear()}-${anchor.getMonth() + 1}-${anchor.getDate()}-${slotTheme(d)}`
}

/** 解析当前应生效的主题：调试参数 > 时段内的手动值 > 自动时段 */
function resolveTheme() {
  const url = readThemeParam()
  if (url === 'night' || url === 'light') return url
  const auto = slotTheme()
  const saved = localStorage.getItem(THEME_KEY)
  if ((saved === 'light' || saved === 'night') && localStorage.getItem(MANUAL_SLOT_KEY) === slotStamp()) {
    return saved
  }
  return auto
}

let current = typeof document === 'undefined' ? 'light' : resolveTheme()
const listeners = new Set()

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.toggle('theme-night', theme === 'night')
}
apply(current)

function emit() { listeners.forEach(l => l()) }

export function toggleTheme() {
  current = current === 'light' ? 'night' : 'light'
  localStorage.setItem(THEME_KEY, current)
  localStorage.setItem(MANUAL_SLOT_KEY, slotStamp())
  apply(current)
  emit()
}

/** 重算并广播（跨时段的分钟级轮询与前台恢复都走这里） */
function tick() {
  // 调试/预览钩子强制主题期间，暂停时间接管（预览里手动切换不应被轮询重置）
  const url = readThemeParam()
  if (url === 'night' || url === 'light') return
  const next = resolveTheme()
  if (next !== current) {
    current = next
    apply(current)
    emit()
  }
}

if (typeof document !== 'undefined') {
  // 时段边界（05:00 / 21:00）最多延迟 1 分钟生效；H5 常驻成本可忽略
  setInterval(tick, 60_000)
  // 手机切后台数小时后回前台，interval 不可靠，恢复可见时立即重算
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick() })
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React 钩子：任意组件读取/切换主题，全站同步 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => current)
  return { theme, toggle: toggleTheme, isNight: theme === 'night' }
}
