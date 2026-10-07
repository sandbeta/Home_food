import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Icon from './ui/Icons'
import LiquidGlass from './LiquidGlass'
import { useGlassRect, glassLayerStyle } from '../hooks/useGlassRect'

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
 *
 * 材质：`.glass-op` 那层 CSS 玻璃保留不动，它是首帧与 WebGL2 不可用时的降级态；
 * 在它之上叠一层 WebGL 折射（LiquidGlass），才有 iOS 那种「边缘把身后照片挤弯」。
 */
export default function FloatingPillNav() {
  const location = useLocation()
  const path = location.pathname
  const { targetRef, rect } = useGlassRect()
  // 药丸是 rounded-full → 玻璃圆角 = 高度的一半，跟着实测走（取整避免亚像素抖动
  // 让 LiquidGlass 的 GL effect 依赖变化而重建上下文）
  const radius = rect ? Math.round(rect.h / 2) : 0

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
      ref={targetRef}
      layout
      aria-label="主导航"
      className="relative flex-1 glass-op rounded-full px-2.5 py-2 flex items-center justify-around gap-1 pointer-events-auto"
      style={{ minHeight: 'var(--dock-h)' }}
    >
      {/* 必须是第一个子节点 + zIndex:-1：压在 CSS 玻璃之上、所有图标与文字之下 */}
      <LiquidGlass rect={rect} variant="panel" radius={radius} style={glassLayerStyle} />
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
                  boxShadow: '0 6px 18px color-mix(in srgb, var(--clay-50) 28%, transparent)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              />
            )}
            <span
              className={`relative transition-colors${active ? '' : ' glass-halo'}`}
              style={{ color: active ? 'var(--color-on-dark)' : 'var(--color-ash)' }}
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
