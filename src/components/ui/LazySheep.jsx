import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '../../theme/motion'

// ============================================================
// 懒羊羊 accent 组件 v2（2026-09-21 所有者反馈"认不出是懒羊羊"后推倒重画）
// ------------------------------------------------------------
// v1 是细线轮廓，缩到 30px 就糊成一团。v2 改实心插画，锁定原作四大识别特征：
//   ① 头顶冰淇淋卷发型（"雪糕"卷——这只羊的灵魂，没它就不是懒羊羊）
//   ② 云朵状羊毛刘海（盖住额头的羊毛帽，下缘波浪）
//   ③ 圆白脸 + 绿豆眼（四表情：doze 犯困 / sleep 熟睡 / sniff 闻香 / happy 满足）
//   ④ 下巴口水巾（TA 侧 sage-30，懒羊羊的"身份证"）
// 颜色全部引用既有 static 令牌（WOOL=on-dark 羊毛白 / INK=clay-deep 深梅粉线稿 /
// sage-30 口水巾 / clay-30 腮红），零新色值、不改原有色调；
// 这四个令牌夜宵模式均不反相，羊在白天黑夜长得一样。
// 纯装饰层：aria-hidden；reduced-motion 下静止无 z。
// ============================================================

const WOOL = 'var(--color-on-dark)' /* 羊毛白（static，不随夜宵反相） */
const INK = 'var(--clay-deep)'      /* 线稿与瞳仁：深梅粉，粉纸/夜纸双主题均可读 */

/** 懒羊羊统一呼吸律动（仅本文件内使用）：比常规浮动慢一倍，"懒"要慢得出来 */
const sheepBreath = {
  duration: 4.5,
  repeat: Infinity,
  ease: 'easeInOut',
}

const EYES = {
  // 犯困：绿豆眼 + 压下来的眼皮
  doze: (
    <g stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none">
      <circle cx="19" cy="27.6" r="1.7" fill={INK} stroke="none" />
      <circle cx="29" cy="27.6" r="1.7" fill={INK} stroke="none" />
      <path d="M16.4 24.9q2.6-1.7 5.2 0" />
      <path d="M26.4 24.9q2.6-1.7 5.2 0" />
      <path d="M22.8 31.8q1.2 1.3 2.4 0" />
    </g>
  ),
  // 熟睡：两道向下弯的闭眼线
  sleep: (
    <g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none">
      <path d="M16.4 27q2.6 2.8 5.2 0" />
      <path d="M26.4 27q2.6 2.8 5.2 0" />
      <path d="M22.6 31.6q1.4 1.6 2.8 0" />
    </g>
  ),
  // 闻香：眼睛瞬间放大 + 高光 + 微张嘴（欧皇闻到好吃的）
  sniff: (
    <g>
      <circle cx="19" cy="27.2" r="2.5" fill={INK} />
      <circle cx="29" cy="27.2" r="2.5" fill={INK} />
      <circle cx="19.9" cy="26.3" r="0.85" fill={WOOL} />
      <circle cx="29.9" cy="26.3" r="0.85" fill={WOOL} />
      <path d="M22.4 31.8q1.6 1.9 3.2 0" stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <ellipse cx="15.2" cy="30.4" rx="2.2" ry="1.4" fill="var(--clay-30)" opacity="0.7" />
      <ellipse cx="32.8" cy="30.4" rx="2.2" ry="1.4" fill="var(--clay-30)" opacity="0.7" />
    </g>
  ),
  // 满足：眯眼笑 + 腮红
  happy: (
    <g>
      <path d="M16.4 28q2.6-2.8 5.2 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M26.4 28q2.6-2.8 5.2 0" stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M21.8 31.2q2.2 2.6 4.4 0" stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <ellipse cx="15.2" cy="30.2" rx="2.3" ry="1.5" fill="var(--clay-30)" opacity="0.8" />
      <ellipse cx="32.8" cy="30.2" rx="2.3" ry="1.5" fill="var(--clay-30)" opacity="0.8" />
    </g>
  ),
}

/**
 * 懒羊羊头像（48 viewBox 实心插画，卷发型/羊毛帽/绿豆眼/口水巾四特征齐备）。
 * @param size    渲染边长 px
 * @param mood    doze | sleep | sniff | happy
 * @param bib     是否画口水巾（默认 true；极小尺寸可关）
 * @param breathe 慢呼吸律动开关（reduced-motion 自动静止）
 */
export default function LazySheep({ size = 40, mood = 'doze', bib = true, breathe = true, className = '', style }) {
  const reduce = usePrefersReducedMotion()
  const anim = breathe && !reduce
    ? { animate: { scale: [1, 1.025, 1], y: [0, -1, 0] }, transition: sheepBreath }
    : {}
  return (
    <motion.svg
      {...anim}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* 耳朵：脸侧两瓣白叶（先画，被脸压住只露外侧） */}
      <ellipse cx="9.8" cy="26.8" rx="3.3" ry="2.1" transform="rotate(-20 9.8 26.8)" fill={WOOL} stroke={INK} strokeWidth="1.6" />
      <ellipse cx="38.2" cy="26.8" rx="3.3" ry="2.1" transform="rotate(20 38.2 26.8)" fill={WOOL} stroke={INK} strokeWidth="1.6" />
      {/* 圆脸 */}
      <ellipse cx="24" cy="26.2" rx="12.4" ry="10.6" fill={WOOL} stroke={INK} strokeWidth="1.8" />
      {/* 口水巾：sage-30 兜巾 + 扇贝缘（TA 色的"身份证"） */}
      {bib && (
        <g>
          <path
            d="M14.6 32.8Q18.4 36.6 24 36.6Q29.6 36.6 33.4 32.8Q32.8 40.4 24 42.4Q15.2 40.4 14.6 32.8Z"
            fill="var(--sage-30)"
            stroke={INK}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M18.2 38.6q1.9 2.1 3.8 0M26 38.6q1.9 2.1 3.8 0" stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55" />
        </g>
      )}
      {/* 羊毛刘海：云朵帽，上缘三团弧、下缘波浪压过额头 */}
      <path
        d="M12 25Q10.4 21 13.6 19.4Q13.6 15.4 17.6 15.4Q19.6 12 24 13Q28.4 12 30.4 15.4Q34.4 15.4 34.4 19.4Q37.6 21 36 25Q33.4 22.4 30 23.4Q27 21 24 23.4Q21 21 18 23.4Q14.6 22.4 12 25Z"
        fill={WOOL}
        stroke={INK}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* 冰淇淋卷发型：头顶向右盘起的"雪糕"卷（本羊灵魂，不可省） */}
      <path
        d="M20.6 13.6C19.4 9.2 21.8 5.6 25.8 6C29.6 6.4 31.4 9.6 29.6 12.2C28.6 13.7 26.5 13.9 25.5 12.7C24.7 11.8 25.2 10.4 26.4 10.2"
        fill={WOOL}
        stroke={INK}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 表情（mood 切换，0.18s 淡换） */}
      <AnimatePresence initial={false}>
        <motion.g
          key={mood}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {EYES[mood] || EYES.doze}
        </motion.g>
      </AnimatePresence>
    </motion.svg>
  )
}

/**
 * zZ z 泡 —— 懒羊羊睡梦中/等饭时头顶飘起的三枚 z。
 * 挂在 LazySheep 外层容器右上角；reduced-motion 下整层不渲染。
 */
export function SheepZzz({ size = 14, className = '', style }) {
  const reduce = usePrefersReducedMotion()
  if (reduce) return null
  const ZS = [
    { s: 0.72, delay: 0 },
    { s: 0.92, delay: 0.9 },
    { s: 1.15, delay: 1.8 },
  ]
  return (
    <span className={`pointer-events-none absolute -top-1 -right-2 ${className}`} style={style} aria-hidden="true">
      {ZS.map(({ s, delay }) => (
        <motion.span
          key={delay}
          className="absolute right-0 top-0 font-serif font-bold leading-none"
          style={{ fontSize: size * s, color: 'var(--color-ash)' }}
          initial={{ opacity: 0, y: 0, scale: 0.6 }}
          animate={{ opacity: [0, 0.85, 0], y: -16 * s, x: 4, scale: [0.6, 1, 1.15] }}
          transition={{ duration: 2.7, delay, repeat: Infinity, ease: 'easeOut' }}
        >
          z
        </motion.span>
      ))}
    </span>
  )
}
