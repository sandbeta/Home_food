import { motion } from 'framer-motion'
import { PAYER } from '../../theme/persona'

const OPTIONS = [
  { value: 'aa', label: 'AA', emoji: '✌️', desc: '各付各的' },
  { value: 'me', label: '我请', emoji: '🙋', desc: '今天我买单' },
  { value: 'partner', label: 'TA请', emoji: '💝', desc: '让TA来~' },
]

const ACTIVE_COLOR = {
  aa: 'var(--color-caramel)',
  me: 'var(--color-clay)',
  partner: 'var(--color-sage)',
}

/**
 * 谁买单选择器 —— 取代此前 Cart 与 Checkout 各自维护的一份常量 + 一份标记。
 */
export default function PayerSelector({ value, onChange, className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {OPTIONS.map((opt) => {
        const p = PAYER[opt.value]
        const active = value === opt.value
        const color = ACTIVE_COLOR[opt.value]
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex-1 py-3 rounded-xl text-center transition-all duration-300 relative overflow-hidden ${
              active ? 'd3-btn-primary' : 'text-[var(--color-ash)]'
            }`}
            style={{
              ...(active
                ? { borderColor: p.border, boxShadow: p.glow }
                : { background: 'rgba(43,38,32,0.04)' }),
            }}
          >
            {active && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  background: `radial-gradient(circle at 50% 30%, color-mix(in srgb, ${color} 13%, transparent), transparent 70%)`,
                }}
              />
            )}
            <motion.div
              className="text-2xl mb-1 relative"
              animate={active ? { scale: [1, 1.15, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              {opt.emoji}
            </motion.div>
            <div className="text-sm font-bold text-[var(--color-bone)] relative">{opt.label}</div>
            <div className="text-xs text-[var(--color-ash)] mt-0.5 relative">{opt.desc}</div>
          </motion.button>
        )
      })}
    </div>
  )
}
