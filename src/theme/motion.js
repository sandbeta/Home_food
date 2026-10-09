// ============================================================
// 晨光厨房 · 动效系统
// 统一缓动 / 入场编排 / reduced-motion 降级
// ------------------------------------------------------------
// 三档时长与 index.css 的 --dur-fast / --dur-base / --dur-slow 同源同值，
// 规范条目见 .impeccable/design.json → /extensions/motion。
// 改这里必须同时改那两个地方，否则又出现「规范一套、实现另一套」。
// ============================================================
import { useReducedMotion } from 'framer-motion'

/** 时长三档（秒）。UI 进退场一律压进 base 以内；slow 只留给主题底色与签名演出。 */
export const DUR = { fast: 0.15, base: 0.25, slow: 0.45 }

/** 全站唯一「进退场」缓动：强 ease-out，快起慢收。与 CSS --ease-soft 同值。 */
export const EASE = [0.22, 1, 0.36, 1]

/** 屏内位移/形变（A 点走到 B 点、morph）用 ease-in-out；不要拿 EASE 硬套。 */
export const EASE_MORPH = [0.77, 0, 0.175, 1]

/**
 * 页面转场 —— 只用 opacity，绝不能带 transform。
 *
 * 原因：任何 transform 都会让该元素成为 position:fixed / sticky 后代的包含块，
 * 会导致 Header 的 sticky 吸顶失效、FullBleedHero 的 fixed 定位错乱。
 * 需要位移时请用 contentEnter 放在**内层**元素上。
 *
 * 出场比入场快：退场只是「让路」，用户已经在下一页了。
 */
export const pageEnter = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.08, ease: EASE } },
  transition: { duration: 0.16, ease: EASE },
}

/** 入场位移放在内层，避免再造包含块 */
export const contentEnter = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE } },
  transition: { duration: DUR.base, ease: EASE, delay },
})

/** 玻璃卡统一入场：y:16→0 + opacity（原 0.34 超出自定 dur-base 档，收回来） */
export const cardEntrance = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: DUR.fast, ease: EASE } },
  transition: { duration: DUR.base, ease: EASE, delay },
})

/**
 * 浮层退场统一用短 ease-out：入场是弹簧（可被拖拽打断、能续速），
 * 退场没有物理过程可言，干脆比 Q 弹更重要。
 */
export const sheetExit = { duration: 0.2, ease: EASE }

/** 底部浮层（Sheet / 弹窗）从下滑入 */
export const sheetUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%', transition: sheetExit },
  transition: { type: 'spring', damping: 28, stiffness: 300 },
}

/** 点击反馈（配合 whileTap 使用） */
export const tapScale = { scale: 0.97 }

/**
 * reduced-motion 下的按压反馈替代品。
 *
 * 「减少动效」不等于「零反馈」：位移/缩放要去掉，但按下去有没有回应必须留下，
 * 否则整站对前庭敏感用户变成了没有回执的静默界面。opacity 属 framer
 * MotionConfig reducedMotion="user" 允许保留的那一类。
 */
export const tapFade = { opacity: 0.82 }

/** 辉光脉冲（双人格激活态）—— 默认赤陶 */
export const glowPulse = (color = 'color-mix(in srgb, var(--clay-50) 22%, transparent)') => ({
  animate: { boxShadow: [`0 0 0 0 ${color}`, `0 0 18px 3px ${color}`, `0 0 0 0 ${color}`] },
  transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
})

export function usePrefersReducedMotion() {
  return useReducedMotion()
}
