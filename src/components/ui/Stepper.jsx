import { motion } from 'framer-motion'

/**
 * 数量步进器 —— 取代此前 Cart(30px) 与 DishDetail(36px) 两套各自的实现。
 * 减号在 min 时禁用，避免把数量减到 0 以下。
 */
export default function Stepper({ value, onChange, min = 1, size = 32, className = '' }) {
  const dec = () => { if (value > min) onChange(value - 1) }
  const inc = () => onChange(value + 1)

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.06 }}
        onClick={dec}
        disabled={value <= min}
        aria-label="减少"
        className="rounded-full flex items-center justify-center text-[var(--color-bone)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ width: size, height: size, background: 'rgba(43,38,32,0.05)' }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <motion.span
        key={value}
        initial={{ scale: 1.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 12 }}
        className="w-5 text-center font-bold text-base tabular-nums text-[var(--color-bone)]"
      >
        {value}
      </motion.span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        whileHover={{ scale: 1.06 }}
        onClick={inc}
        aria-label="增加"
        className="rounded-full flex items-center justify-center text-white"
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, var(--color-clay-soft), var(--color-clay))',
          boxShadow: '0 2px 8px rgba(200,104,63,0.28)',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>
    </div>
  )
}
