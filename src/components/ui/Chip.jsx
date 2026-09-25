import { motion } from 'framer-motion'

/**
 * 筛选胶囊 —— 统一 Menu 分类 chips 与 AdminOrders 状态筛选的外观（此前两处样式不一）。
 * V3 设计稿换装：静默=糖果描边纸面，激活=clay 渐变实底 + 深梅粉描边（糖果感来自可见轮廓）。
 */
export default function Chip({ active = false, onClick, children, className = '' }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 min-h-[44px] px-4 py-2.5 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 transition-colors duration-200 ${className}`}
      style={
        active
          ? {
              background: 'var(--color-clay-gradient)',
              color: 'var(--color-on-dark)',
              border: '2px solid var(--clay-deep)',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--clay-50) 26%, transparent)',
            }
          : {
              background: 'var(--surface)',
              color: 'var(--color-ash)',
              border: '2px solid var(--color-line)',
            }
      }
    >
      {children}
    </motion.button>
  )
}
