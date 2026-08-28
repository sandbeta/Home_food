// ============================================================
// 晨光厨房 · 动效封装
// 统一入场（玻璃卡从底部浮起）+ reduced-motion 降级
// ============================================================
import { useReducedMotion } from 'framer-motion'

// 玻璃卡统一入场：y:24→0 + opacity，ease-out ≈0.5s
export const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], delay },
})

// 页面转场
export const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
}

// 底部浮入（模态 / 玻璃卡从下滑入）
export const slideUpPanel = (delay = 0) => ({
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1], delay },
})

// 辉光脉冲（双人格激活态）
export const glowPulse = (color = 'rgba(230,178,90,0.22)') => ({
  animate: { boxShadow: [`0 0 0 0 ${color}`, `0 0 18px 3px ${color}`, `0 0 0 0 ${color}`] },
  transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
})

export function usePrefersReducedMotion() {
  return useReducedMotion()
}
