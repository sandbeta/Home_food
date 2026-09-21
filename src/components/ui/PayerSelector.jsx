import { motion } from 'framer-motion'
import { EASE } from '../../theme/motion'

const OPTIONS = [
  { value: 'aa', label: 'AA', emoji: '✌️', desc: '各付各的' },
  { value: 'me', label: '我请', emoji: '🙋', desc: '今天我买单' },
  { value: 'partner', label: 'TA请', emoji: '💝', desc: '让TA来~' },
]

/**
 * 谁买单选择器 —— 取代此前 Cart 与 Checkout 各自维护的一份常量 + 一份标记。
 * V3 设计稿换装（糖果三选）：AA = 金棕描边浅底 · 我请 = clay 实底 · TA请 = sage 实底。
 * 此前三档统一用 d3-btn-primary（全是 clay），把 TA 的身份色吞了 —— 双人格语义因此丢失。
 * 激活态弹性曲线收编全站唯一 EASE（快起慢收），不再用已废弃的过冲曲线。
 */
const ACTIVE = {
  aa: {
    background: 'color-mix(in srgb, var(--color-caramel) 12%, var(--surface))',
    borderColor: 'var(--color-caramel)',
    label: 'var(--color-caramel)',
    desc: 'var(--color-ash)',
  },
  me: {
    background: 'var(--color-clay)',
    borderColor: 'var(--clay-deep)',
    label: 'var(--color-on-dark)',
    desc: 'color-mix(in srgb, var(--color-on-dark) 82%, transparent)',
  },
  partner: {
    background: 'var(--color-sage)',
    borderColor: 'var(--sage-60)',
    label: 'var(--color-on-sage)',
    desc: 'color-mix(in srgb, var(--color-on-sage) 78%, transparent)',
  },
}

export default function PayerSelector({ value, onChange, className = '' }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        const skin = ACTIVE[opt.value]
        return (
          <motion.button
            key={opt.value}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className="flex-1 py-3 px-1 rounded-[var(--radius-tile)] text-center transition-colors duration-300"
            style={{
              border: `2px solid ${active ? skin.borderColor : 'var(--color-line)'}`,
              background: active ? skin.background : 'var(--surface)',
            }}
          >
            <motion.div
              className="text-2xl mb-1"
              animate={active ? { scale: [1, 1.13, 1] } : { scale: 1 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {opt.emoji}
            </motion.div>
            <div className="text-sm font-bold" style={{ color: active ? skin.label : 'var(--color-bone)' }}>
              {opt.label}
            </div>
            <div className="text-xs mt-0.5" style={{ color: active ? skin.desc : 'var(--color-ash)' }}>
              {opt.desc}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
