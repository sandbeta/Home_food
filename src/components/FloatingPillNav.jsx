import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/home', label: '首页', emoji: '🏠' },
  { path: '/menu', label: '吃什么', emoji: '🍜' },
  { path: '/orders', label: '订单', emoji: '📋' },
  { path: '/profile', label: '我的', emoji: '👤' },
]

// 底部居中悬浮玻璃药丸导航（取代旧 TabBar）
// 仅图标 + 激活态品牌金辉光脉冲
export default function FloatingPillNav() {
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
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50" style={{ width: 'min(480px, 100%)' }}>
      <div className="flex justify-center px-3">
        <div className="glass glass-elevated rounded-full px-2.5 py-2 flex items-center gap-1 safe-bottom">
          {tabs.map((tab) => {
            const active = isActive(tab)
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label={tab.label}
                className="relative flex items-center justify-center w-[60px] h-[48px] rounded-full"
              >
                {active && (
                  <motion.div
                    layoutId="navGlow"
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(240,206,146,0.24) 0%, rgba(230,178,90,0.14) 100%)',
                      boxShadow: '0 0 18px 2px rgba(230,178,90,0.30)',
                    }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                  />
                )}
                <span
                  className="relative text-[22px] transition-transform"
                  style={{
                    filter: active ? 'none' : 'grayscale(0.3) opacity(0.7)',
                  }}
                >
                  {tab.emoji}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
