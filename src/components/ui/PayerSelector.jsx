import { motion } from 'framer-motion'
import { EASE } from '../../theme/motion'

/* m-23 修：payer.me/partner 是**固定人格**（🐱/🐑），与当前 whoAmI 无关：
   以前 label 用「我请/TA请」，以 TA(🐑) 身份点「我请」实际写进订单的是 🐱，双人格语义在结算环节互相打架。
   改：label 里的「我/TA」换成 emoji 🐱/🐑（人格锚点直连），落库值 'me'/'partner' 保持不动（后端无需改）；
   desc 用「由 🐱 买单」等明示真实人格，避免"我"的两个含义在同一屏并存。 */
const OPTIONS = [
  { value: 'aa', label: 'AA', emoji: '✌️', desc: '各付各的' },
  { value: 'me', label: '🐱 请', emoji: '🙋', desc: '由 🐱（我）买单' },
  { value: 'partner', label: '🐑 请', emoji: '💝', desc: '由 🐑（TA）买单' },
]

/**
 * 谁买单选择器 —— 取代此前 Cart 与 Checkout 各自维护的一份常量 + 一份标记。
 * V3 设计稿换装（糖果三选）：AA = 金棕描边浅底 · 我请 = clay 实底 · TA请 = sage 实底。
 * 此前三档统一用 d3-btn-primary（全是 clay），把 TA 的身份色吞了 —— 双人格语义因此丢失。
 * 激活态弹性曲线收编全站唯一 EASE（快起慢收），不再用已废弃的过冲曲线。
 */
const ACTIVE = {
  /* M-c6 修：AA 档 caramel 会夜宵提亮 → 用作前景时压 tint 底两档 4.2-4.3:1 边缘不达 4.5。
     改用不反相 --color-caramel-deep 作实底 + on-dark 亮字（同 HotDishes RANK_FILLS 思路），
     双主题 ≥6:1 达标，也让「焦糖=中性/AA」的实底徽章模式在夜宵里更醒目。 */
  aa: {
    background: 'var(--color-caramel-deep)',
    borderColor: 'var(--color-caramel-deep)',
    label: 'var(--color-on-dark)',
    desc: 'var(--color-on-dark)',
  },
  /* M-c4 修：锚点卡上小字用 color-mix 82/78% 透明度会掉到 3.5-4.0:1；
     改回 100% 前景，让 persona.on 令牌真正生效（on-dark 4.52:1 / on-sage 8.31:1 均达标）。 */
  me: {
    background: 'var(--color-clay)',
    borderColor: 'var(--clay-deep)',
    label: 'var(--color-on-dark)',
    desc: 'var(--color-on-dark)',
  },
  partner: {
    background: 'var(--color-sage)',
    borderColor: 'var(--sage-60)',
    label: 'var(--color-on-sage)',
    desc: 'var(--color-on-sage)',
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
              aria-hidden="true"
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
