import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '../theme/motion'

// 全屏底片层：object-cover 美食大图 + 晨光浅叠层，衬于页面内容之下
// variant: 'immersive'（图清晰微提亮 + 顶部浅渐隐）| 'functional'（轻模糊 + 浅遮罩，作功能页背景）
// 宽度与 App 容器(480)对齐，桌面预览也不溢出
// 批4 性能修：原 scale[1.04→1→1.04] 20s 无限循环 ×9 页 = 全站最稳定掉帧源
// （与 PageHeader backdrop-blur 同屏时每帧都在重算模糊+变换合成层），改为入场一次缓推后静止；
// 图挂了直接隐身露 --color-ink-900 纸底（heroFallback 是给背景图 div 写的，对 <img> 会连容器一起 display:none 掉、已弃用）。
export default function FullBleedHero({ src, variant = 'immersive', alt = '', children, className = '', name }) {
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
        viewTransitionName: name,
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        fetchPriority="high"
        decoding="async"
        onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
        initial={reduce ? false : { scale: 1.04 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
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
