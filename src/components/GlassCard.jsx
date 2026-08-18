import { motion } from 'framer-motion'
import { cardEntrance } from '../theme/motion'

// 浮起磨砂玻璃卡：圆角 28，统一入场（y:24→0 + opacity + ease-out≈0.5s）
// props: className / delay / glow(boxShadow 字符串) / style / 其余透传 motion props
export default function GlassCard({ as: _Tag = 'div', className = '', delay = 0, glow, children, style, ...rest }) {
  return (
    <motion.div
      {...cardEntrance(delay)}
      className={`glass rounded-[var(--radius-card)] ${className}`}
      style={{ ...(glow ? { boxShadow: glow } : {}), ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}
