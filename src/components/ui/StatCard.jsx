import { motion } from 'framer-motion'
import { cardEntrance } from '../../theme/motion'

/**
 * 统计卡 —— 用于 Profile 的 2 格与 Admin 的 3 格统计，此前两处各自手写。
 * 数值用 serif + tabular-nums，保持杂志感的数字排版。
 */
export default function StatCard({ value, label, emoji, accent = 'var(--color-clay)', delay = 0 }) {
  return (
    <motion.div
      {...cardEntrance(delay)}
      className="d3-card-face flex-1 min-w-0 text-center"
      style={{ padding: 'var(--space-card-p)' }}
    >
      {emoji && <div className="text-lg mb-0.5">{emoji}</div>}
      <div
        className="font-serif text-2xl font-bold tabular-nums leading-tight"
        style={{ color: accent }}
      >
        {value}
      </div>
      {label && <div className="text-xs text-[var(--color-ash)] mt-1 truncate">{label}</div>}
    </motion.div>
  )
}
