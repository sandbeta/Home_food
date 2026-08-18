import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/home', label: '首页', emoji: '🏠' },
  { path: '/menu', label: '吃什么', emoji: '🍜' },
  { path: '/orders', label: '订单', emoji: '📋' },
  { path: '/profile', label: '我的', emoji: '👤' },
]

export default function TabBar() {
  const location = useLocation()
  const path = location.pathname

  const isActive = (tab) => {
    if (tab.path === '/home') return path === '/home'
    if (tab.path === '/menu') return path === '/menu'
    if (tab.path === '/orders') return path === '/orders' || path.startsWith('/orders/')
    if (tab.path === '/profile') return path === '/profile'
    return false
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 px-3 pb-3">
      <div className="d3-card-face bg-[var(--color-card)]/[0.95] backdrop-blur-2xl px-2 py-2 safe-bottom">
        <div className="flex items-center justify-around">
          {tabs.map(tab => {
            const active = isActive(tab)
            return (
              <Link key={tab.path} to={tab.path} className="flex flex-col items-center justify-center py-2 px-3 relative min-w-[64px]">
                {active && (
                  <motion.div layoutId="tabIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--color-peach), var(--color-primary))' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }} />
                )}
                <motion.span className="text-[22px]"
                  animate={active ? { scale: [1, 1.2, 1.08, 1], y: [0, -2, 0] } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.3 }}>
                  {tab.emoji}
                </motion.span>
                <span className={`text-[11px] mt-0.5 font-extrabold transition-all duration-200 ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
