import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from './ui/Icons'

const tabs = [
  { path: '/home', label: '首页', icon: 'home' },
  { path: '/menu', label: '吃什么', icon: 'menu' },
  { path: '/hot', label: '热门', icon: 'flame' },
  { path: '/orders', label: '订单', icon: 'orders' },
  { path: '/profile', label: '我的', icon: 'user' },
]

/**
 * 底部玻璃药丸导航 —— 只渲染药丸本体，不做定位、不处理安全区。
 * 定位与安全区由 DockLayer 统一管理；layout 让首次加购/清空购物车时
 * 药丸宽度变化走平滑补间，而不是瞬间跳版。
 * 药丸宽度自适应（flex-1），与购物车球同行排布，任何屏宽下都不可能重叠。
 */
export default function FloatingPillNav() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (tab) => {
    if (tab.path === '/home') return path === '/home'
    if (tab.path === '/menu') return path === '/menu'
    if (tab.path === '/hot') return path === '/hot'
    if (tab.path === '/orders') return path === '/orders' || path.startsWith('/orders/')
    if (tab.path === '/profile') return path === '/profile'
    return false
  }

  return (
    <motion.nav
      layout
      className="flex-1 glass rounded-full px-2.5 py-2 flex items-center justify-around gap-1"
      style={{
        minHeight: 'var(--dock-h)',
        background: 'var(--glass-strong)',
        border: '1px solid var(--color-glass-border)',
        boxShadow: 'var(--shadow-3)',
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab)
        return (
          <Link
            key={tab.path}
            to={tab.path}
            aria-label={tab.label}
            aria-current={active ? 'page' : undefined}
            className="relative flex items-center justify-center flex-1 h-[48px] rounded-full"
          >
            {active && (
              <motion.div
                layoutId="navGlow"
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--color-clay-gradient)',
                  boxShadow: '0 6px 18px rgba(200,104,63,0.28)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              />
            )}
            <span
              className="relative transition-colors"
              style={{ color: active ? '#FFFDF9' : 'var(--color-ash)' }}
            >
              {/* 激活态压在 clay 渐变药丸上，图标必须转白，否则同色隐形 */}
              <Icon name={tab.icon} size={22} strokeWidth={active ? 2.2 : 2} />
            </span>
          </Link>
        )
      })}
    </motion.nav>
  )
}
