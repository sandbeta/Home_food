import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../theme/motion'
import { heroFallback } from '../theme/images'

// 全屏底片层：object-cover 美食大图 + 晨光浅叠层，衬于页面内容之下
// variant: 'immersive'（图清晰微提亮 + 顶部浅渐隐）| 'functional'（轻模糊 + 浅遮罩，作功能页背景）
// 宽度与 App 容器(480)对齐，桌面预览也不溢出；KenBurns 在 reduced-motion 下关闭
export default function FullBleedHero({ src, variant = 'immersive', alt = '', children, className = '' }) {
  const reduce = usePrefersReducedMotion()
  const functional = variant === 'functional'
  return (
    <div
      className={`fixed top-0 bottom-0 z-0 overflow-hidden ${className}`}
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(var(--shell-w), 100%)',
        background: 'var(--color-ink-900)',
      }}
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
            ? 'var(--hero-filter-functional)'
            : 'var(--hero-filter-immersive)',
        }}
      />
      {/* 晨光浅叠层：顶部保留照片氛围，往下溶入暖骨白，避免花哨底图与玻璃卡硬碰硬 */}
      <div
        className="absolute inset-0"
        style={{
          background: functional
            ? 'var(--hero-wash-functional)'
            : 'var(--hero-wash-immersive)',
        }}
      />
      {children}
    </div>
  )
}
