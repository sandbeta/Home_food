import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'

/**
 * 数量步进器 —— 取代此前 Cart(30px) 与 DishDetail(36px) 两套各自的实现。
 * 减号在 min 时禁用，避免把数量减到 0 以下。
 *
 * m-20 修：原 inc/dec 用 onChange(value±1)，同一帧连点多次读到的都是 stale value → 丢更新。
 *   加 valRef 缓存累加基线，外部 value 变化时同步；同帧内连点也基于 valRef.current 递增，
 *   每次 onChange 都传"下一档"给父组件，父组件绝对 setter 也不影响连点。
 * m-9 修：+/- 名称只说"减少/增加"，购物车多行时读屏听不出改的是哪道菜。
 *   新增可选 name prop（菜品名），aria-label 与 role=group/aria-live 都吃它。
 */
export default function Stepper({ value, onChange, min = 1, size = 44, className = '', name }) {
  const valRef = useRef(value)
  useEffect(() => { valRef.current = value }, [value])
  const dec = () => {
    const next = Math.max(min, valRef.current - 1)
    if (next === valRef.current) return
    valRef.current = next
    onChange(next)
  }
  const inc = () => {
    const next = valRef.current + 1
    valRef.current = next
    onChange(next)
  }
  const nameSuffix = name ? `「${name}」数量` : '数量'

  return (
    <div className={`flex items-center gap-1.5 ${className}`} role="group" aria-label={`调整${nameSuffix}`}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={dec}
        disabled={value <= min}
        aria-label={name ? `减少${name}数量，当前 ${value} 份` : `减少${nameSuffix}数量，当前 ${value} 份`}
        className="rounded-full flex items-center justify-center text-[var(--color-bone)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          width: size,
          height: size,
          background: 'var(--color-ink-850)',
          border: '2px solid var(--color-line)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <motion.span
        key={value}
        initial={{ scale: 1.18 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="w-5 text-center font-bold text-base tabular-nums text-[var(--color-bone)]"
        aria-hidden="true"
      >
        {/* 批4：原 key+aria-live 组合=整块替换式播报，NVDA/VoiceOver 经常不念；
            数量读数已由两个按钮的 aria-label（当前 N 份）承载，这里回归纯视觉弹动。 */}
        {value}
      </motion.span>

      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        onClick={inc}
        aria-label={name ? `增加${name}数量，当前 ${value} 份` : `增加${nameSuffix}数量，当前 ${value} 份`}
        className="rounded-full flex items-center justify-center text-[var(--color-on-dark)]"
        style={{
          width: size,
          height: size,
          background: 'var(--color-clay)',
          border: '2px solid var(--clay-deep)',
          boxShadow: '0 2px 8px color-mix(in srgb, var(--clay-50) 28%, transparent)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>
    </div>
  )
}
