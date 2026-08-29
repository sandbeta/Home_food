import { motion } from 'framer-motion'

/**
 * 统一空态 —— 取代散落在各页的手写空态变体。当前已接入：Cart / Menu /
 * AdminDishes / AdminOrders；MyOrders 待 P4 迁移（Favorites 页已删除，其功能并入 Menu）。
 */
export default function EmptyState({ emoji = '🍽️', title, desc, action, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative flex flex-col items-center justify-center py-16 overflow-hidden ${className}`}
    >
      {/* 晨光光斑：赤陶 + 鼠尾草双色，呼应双人格 */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.18), transparent 70%)' }}
      />
      <div
        className="absolute bottom-12 left-1/4 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(127,163,122,0.16), transparent 70%)' }}
      />

      <motion.div
        className="text-7xl mb-5 relative z-10"
        animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.div>

      {title && (
        <p className="text-base text-[var(--color-bone)] mb-1 font-bold relative z-10">{title}</p>
      )}
      {desc && (
        <p className="text-sm text-[var(--color-ash)] mb-6 relative z-10 text-center px-6 leading-relaxed">
          {desc}
        </p>
      )}
      {action && <div className="relative z-10">{action}</div>}
    </motion.div>
  )
}
