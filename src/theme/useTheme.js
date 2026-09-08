// ============================================================
// 晨光厨房 · 主题系统（晨光 light / 夜宵 night）
// 全站颜色均走 @theme 令牌，夜宵模式 = [data-theme="night"] 上的一组变量反相
// （index.css 末尾的夜宵区块），因此本模块只负责：初始值、切换、持久化、广播。
// ============================================================
import { useSyncExternalStore } from 'react'

const THEME_KEY = 'couple_order_theme'

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

function initialTheme() {
  // 调试/预览钩子：?theme=night 强制夜宵（不写入持久化，不影响真实用户）
  const url = readThemeParam()
  if (url === 'night' || url === 'light') return url
  const saved = localStorage.getItem(THEME_KEY)
  if (saved === 'light' || saved === 'night') return saved
  // 首访默认值：深夜时段（21 点—5 点）自动夜宵，护眼优先；白天为晨光
  const h = new Date().getHours()
  return (h >= 21 || h < 5) ? 'night' : 'light'
}

let current = typeof document === 'undefined' ? 'light' : initialTheme()
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
  apply(current)
  emit()
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
