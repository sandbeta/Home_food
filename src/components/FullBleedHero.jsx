import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../theme/motion'
import { heroFallback } from '../theme/images'

// 全屏底片层：object-cover 美食大图 + 暗角/压暗，衬于页面内容之下
// variant: 'immersive'（仅暗角，图本身清晰）| 'functional'（模糊+压暗 40-60%，作功能页背景）
// 宽度与 App 容器(480)对齐，桌面预览也不溢出
export default function FullBleedHero({ src, variant = 'immersive', alt = '', children, className = '' }) {
  const reduce = usePrefersReducedMotion()
  const functional = variant === 'functional'
  return (
    <div
      className={`fixed top-0 bottom-0 z-0 overflow-hidden ${className}`}
      style={{ left: '50%', transform: 'translateX(-50%)', width: 'min(480px, 100%)', background: '#0E0C0A' }}
    >
      <motion.img
        src={src}
        alt={alt}
        onError={(e) => heroFallback(e)}
        initial={{ scale: 1.04 }}
        animate={reduce ? { scale: 1 } : { scale: [1.04, 1.0, 1.04] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: functional
            ? 'blur(20px) brightness(0.42) saturate(1.05)'
            : 'brightness(0.9) saturate(1.06) contrast(1.02)',
        }}
      />
      {/* 暗角 / 压暗叠层 */}
      <div
        className="absolute inset-0"
        style={{
          background: functional
            ? 'linear-gradient(180deg, rgba(8,6,4,0.55) 0%, rgba(8,6,4,0.62) 100%)'
            : 'radial-gradient(125% 85% at 50% 32%, transparent 38%, rgba(8,6,4,0.55) 100%), linear-gradient(180deg, rgba(8,6,4,0.15) 0%, rgba(8,6,4,0.45) 100%)',
        }}
      />
      {children}
    </div>
  )
}
