import { motion } from 'framer-motion'
import { cardEntrance } from '../theme/motion'

// 内容卡：严格重制后为纯色暖陶实面（玻璃只留给导航层），圆角走同心标尺，统一入场
// props: className / delay / glow(boxShadow 字符串) / style / 其余透传 motion props
export default function GlassCard({ as: _Tag = 'div', className = '', delay = 0, glow, children, style, ...rest }) {
  return (
    <motion.div
      {...cardEntrance(delay)}
      className={`rounded-[var(--radius-card)] border-2 border-[var(--color-line)] bg-[var(--surface)] ${className}`}
      style={{
        ...style,
        ...(glow
          ? { boxShadow: glow }
          : { boxShadow: 'var(--shadow-3)' }),
      }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
