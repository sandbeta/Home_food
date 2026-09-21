import { motion } from 'framer-motion'
import Icon from './Icons'
import Character from './Character'

/**
 * 统一空态 —— 取代各页的手写空态变体。已接入：Cart / Menu / AdminDishes /
 * AdminOrders / MyOrders / OrderDetail / DishDetail。
 *
 * 主图三选一（V3 设计稿：空态=角色插画 + 引导按钮）：
 *  - who=CHARACTER 的 key → 官方角色素材（推荐，大尺寸肖像位）
 *  - icon=Icons.jsx 插画名（emptyPlate/stoveOff/potBoil）→ 细线插画
 *  - 否则吃 emoji
 */
export default function EmptyState({ emoji = '🍽️', icon, who, title, desc, action, tone, className = '' }) {
  // tone='error'：警示有温度——光斑与标题交给洋红红家族（bone 反相混色，双主题自动可读）；
  // 文案/主图/按钮语义不动，色只做氛围强化，不做唯一编码。
  const isError = tone === 'error'
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative flex flex-col items-center justify-center py-16 overflow-hidden ${className}`}
    >
      {/* 晨光光斑：玫瑰粉 + 鼠尾草双色，呼应双人格 */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: isError ? 'radial-gradient(circle, color-mix(in srgb, var(--color-danger) 16%, transparent), transparent 70%)' : 'radial-gradient(circle, color-mix(in srgb, var(--clay-50) 18%, transparent), transparent 70%)' }}
      />
      <div
        className="absolute bottom-12 left-1/4 w-24 h-24 rounded-full opacity-10 pointer-events-none"
        style={{ background: isError ? 'radial-gradient(circle, color-mix(in srgb, var(--color-danger) 10%, transparent), transparent 70%)' : 'radial-gradient(circle, color-mix(in srgb, var(--sage-40) 16%, transparent), transparent 70%)' }}
      />

      {who ? (
        <motion.div
          className="mb-5 relative z-10"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Character who={who} size={104} />
        </motion.div>
      ) : icon ? (
        <motion.div
          className="mb-5 relative z-10 text-[var(--color-ash)]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Icon name={icon} size={72} strokeWidth={1.4} />
        </motion.div>
      ) : (
        <motion.div
          className="text-7xl mb-5 relative z-10"
          animate={{ y: [0, -8, 0], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {emoji}
        </motion.div>
      )}

      {title && (
        <p className="text-base text-[var(--color-bone)] mb-1 font-bold relative z-10" style={isError ? { color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' } : undefined}>{title}</p>
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
