import { motion } from 'framer-motion'

/**
 * 筛选胶囊 —— 统一 Menu 分类 chips 与 AdminOrders 状态筛选的外观（此前两处样式不一）。
 */
export default function Chip({ active = false, onClick, children, className = '' }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${className}`}
      style={
        active
          ? {
              background: 'var(--color-clay-gradient)',
              color: '#FFFDF9',
              border: '1px solid transparent',
              boxShadow: '0 4px 12px rgba(200,104,63,0.26)',
            }
          : {
              background: 'var(--color-glass)',
              color: 'var(--color-ash)',
              border: '1px solid var(--color-glass-border)',
            }
      }
    >
      {children}
    </motion.button>
  )
}
