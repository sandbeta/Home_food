import { motion } from 'framer-motion'

/**
 * 数量步进器 —— 取代此前 Cart(30px) 与 DishDetail(36px) 两套各自的实现。
 * 减号在 min 时禁用，避免把数量减到 0 以下。
 */
export default function Stepper({ value, onChange, min = 1, size = 44, className = '' }) {
  const dec = () => { if (value > min) onChange(value - 1) }
  const inc = () => onChange(value + 1)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={dec}
        disabled={value <= min}
        aria-label="减少"
        className="rounded-full flex items-center justify-center text-[var(--color-bone)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: size,
          height: size,
          background: 'var(--color-ink-850)',
          border: '2px solid var(--color-line)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <motion.span
        key={value}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-5 text-center font-bold text-base tabular-nums text-[var(--color-bone)]"
      >
        {value}
      </motion.span>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={inc}
        aria-label="增加"
        className="rounded-full flex items-center justify-center text-[var(--color-on-dark)]"
        style={{
          width: size,
          height: size,
          background: 'var(--color-clay)',
          border: '2px solid var(--clay-deep)',
          boxShadow: '0 2px 8px color-mix(in srgb, var(--clay-50) 28%, transparent)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>
    </div>
  )
}
