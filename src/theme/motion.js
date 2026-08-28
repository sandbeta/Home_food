// ============================================================
// 晨光厨房 · 动效系统
// 统一缓动 / 入场编排 / reduced-motion 降级
// ============================================================
import { useReducedMotion } from 'framer-motion'

// 全站唯一缓动：快起慢收，与 CSS --ease-soft 保持一致
export const EASE = [0.22, 1, 0.36, 1]

/**
 * 页面转场 —— 只用 opacity，绝不能带 transform。
 *
 * 原因：任何 transform 都会让该元素成为 position:fixed / sticky 后代的包含块，
 * 会导致 Header 的 sticky 吸顶失效、FullBleedHero 的 fixed 定位错乱。
 * 需要位移时请用 contentEnter 放在**内层**元素上。
 */
export const pageEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: EASE },
}

/** 入场位移放在内层，避免再造包含块 */
export const contentEnter = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.32, ease: EASE, delay },
})

/** 玻璃卡统一入场：y:24→0 + opacity */
export const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE, delay },
})

/** 底部浮层（Sheet / 弹窗）从下滑入 */
export const sheetUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { type: 'spring', damping: 28, stiffness: 300 },
}

/** 点击反馈（配合 whileTap 使用） */
export const tapScale = { scale: 0.97 }

/** 辉光脉冲（双人格激活态）—— 默认赤陶 */
export const glowPulse = (color = 'rgba(200,104,63,0.22)') => ({
  animate: { boxShadow: [`0 0 0 0 ${color}`, `0 0 18px 3px ${color}`, `0 0 0 0 ${color}`] },
  transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
})

/** 列表错峰编排容器 */
export const stagger = (staggerChildren = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

export function usePrefersReducedMotion() {
  return useReducedMotion()
}
