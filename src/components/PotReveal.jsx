import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KissIcon from './KissIcon'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'
import BubbleClock from './ui/BubbleClock'
import { motor, winJingle, vibrate } from '../lib/sfx'

// ============================================================
// 掀笼盖上菜 · PotReveal（首页签名件，2026-10）
// ------------------------------------------------------------
// 娃娃机退守深夜食堂做"夜市限定"后，白天首页的随机惊喜由这笼蒸屉接棒。
//
// 出笼不靠"行程"（v2 用槽位上下滑，实截证明穿帮：漏遮挡、切前壁、
// 双重居中顶偏——行程几何在 2D 里每一步都是坑）。本版规则只有一条：
//   菜永远坐在笼口里，动画只做亮 / 胀 / 蒸汽。
// 笼盖合上时，暗菜被盖 + 前壁天然遮住（开口几何已逐像素验算）；
// 掀盖 → 暗菜现身（它本来就在那儿）→ 变亮微胀 → 蒸汽散 → 端稳。
// 全程零位移、零 opacity、零 z 切换：没有Clip，没有穿帮的可能性。
//
// 调用口与 ClawMachine 对齐（pool/onCatch/onUndo/onOpen/onActiveChange），
// Home.jsx 换件不换接线；加权池（useClawSignals 的 today/wish/promo）原样吃。
// 纪律不变：颜色全 var() 令牌；外层无 transform；不动不可变文件；
// reduced-motion 直接 served + label + 1600ms 换菜（仍会换下一道）。
// ============================================================

/** B 层专属文案（愿望/主推命中的一击）。
 *  ⚠ 刻意不接 `f.today`：纪念日命中日 Home 已有页头标题 + 副标题 + AnniversaryBanner 三处
 *     整页级表达，浮标再说第四遍是过曝而不是惊喜。夜宵轨这三处都没有（AnniversaryBanner 只挂
 *     Home），所以 ClawMachine 那份 blessingOf 仍保留 today 分支 —— 两份**故意不同源**，
 *     改一处别忘了想另一处。 */
function blessingOf(dish) {
  const f = dish && dish._flags
  if (!f) return null
  if (f.wish) return '你许过的愿望，端上来了'
  if (f.promo) return '今日他替你挑的一道'
  return null
}

/* 主推菜圆盘（与 ClawMachine.Plate 同语言：图鉴盘底 + clay-soft 描边 + 实拍/emoji 兜底） */
const DishPlate = memo(function DishPlate({ dish, size }) {
  if (!dish) return null
  const img = getDishImage(dish)
  return (
    <div className="relative flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: '50%', background: 'var(--plate-bg)',
        border: '2px solid var(--color-clay-soft)',
        boxShadow: '0 3px 8px rgba(43,36,41,0.10), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
      <span style={{ fontSize: size * 0.5 }} aria-hidden>{getCategoryEmoji(dish.category)}</span>
      {img && <img src={img} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
    </div>
  )
})

function pickNext(pool, currentId) {
  const list = (pool || []).filter(Boolean)
  if (!list.length) return null
  if (list.length === 1) return list[0]
  let next = list[Math.floor(Math.random() * list.length)]
  if (next && Number(next.id) === Number(currentId)) {
    next = list[(list.indexOf(next) + 1) % list.length]
  }
  return next
}

// 相位：idle（盖合，菜在暗处）→ open（掀盖，暗菜现身+蒸汽起）
// → reveal（变亮微胀）→ served（持榜+喜带）→ idle（盖回，换下一道）。
// 蒸汽只在开口敞着时冒；喜带/名牌只在 served 出现。
const STEAM_PHASES = ['open', 'reveal', 'served'];
const LIT_PHASES = ['reveal', 'served'];

export default function PotReveal({
  pool = [], onCatch, onUndo, onOpen, onActiveChange,
  showClock = true, title = '今日主推', note = '点笼盖，端出今天这一道',
}) {
  const reduced = usePrefersReducedMotion()
  const [current, setCurrent] = useState(() => (pool || []).find(Boolean) || null)
  const [phase, setPhase] = useState('idle')
  const [label, setLabel] = useState(null)
  const [serveCount, setServeCount] = useState(0)
  const [served, setServed] = useState([])     // 今晚已端上（小盘堆，最近 6 道）
  const timersRef = useRef([])
  const currentRef = useRef(current)
  currentRef.current = current
  const busy = phase !== 'idle'

  const clearTimers = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }, [])
  useEffect(() => () => clearTimers(), [clearTimers])

  // 池首次到达且笼里还空 → 上第一道
  useEffect(() => {
    if (!pool || !pool.length) return
    setCurrent((prev) => prev || pool.find(Boolean) || null)
  }, [pool])

  useEffect(() => { onActiveChange?.(current) }, [current, onActiveChange])

  const serve = useCallback((dish) => {
    const target = dish || currentRef.current
    if (!target || busy) return
    motor(320)
    vibrate(12)
    setServeCount((c) => c + 1)
    onCatch?.(target)   // 乐观加购（防动画中途卸载丢失，与 ClawMachine 同语义 M-s7）
    setCurrent(target)
    if (reduced) {
      const mainMsg = blessingOf(target) || `端上「${target.name}」`
      setLabel({ name: target.name, dish: target, dishes: [target], key: Date.now(), msg: mainMsg, sub: null })
      setServed((t) => [...t, target].slice(-6))
      // 结算后仍要换下一道：不演动画不等于不换菜，否则 reduced 用户会永远端同一道。
      timersRef.current.push(setTimeout(() => {
        setCurrent((prev) => pickNext(pool, prev && prev.id) || prev)
      }, 1600))
      return
    }
    setPhase('open')
    timersRef.current.push(setTimeout(() => {
      setPhase('reveal')
      winJingle()
    }, 320))
    timersRef.current.push(setTimeout(() => {
      setPhase('served')
      vibrate([12, 40, 18])
      const mainMsg = blessingOf(target) || `端上「${target.name}」`
      setLabel({ name: target.name, dish: target, dishes: [target], key: Date.now(), msg: mainMsg, sub: null })
      setServed((t) => [...t, target].slice(-6))
    }, 720))
    timersRef.current.push(setTimeout(() => {
      setPhase('idle')
      setCurrent((prev) => pickNext(pool, prev && prev.id) || prev)
    }, 2900))
  }, [busy, reduced, onCatch, pool])

  // 换一道：只预览下一道，不加购（对应旧首页"换一道"语言）
  const previewNext = useCallback(() => {
    if (busy) return
    setCurrent((prev) => pickNext(pool, prev && prev.id) || prev)
  }, [busy, pool])

  const undoServe = (dish) => { onUndo?.(dish) }
  const lit = LIT_PHASES.includes(phase)

  return (
    <motion.div {...contentEnter(0.05)}>
      <div className="d3-card-face overflow-hidden" style={{ boxShadow: 'var(--shadow-4)', border: '2px solid var(--clay-deep)' }}>
        {/* 机顶 */}
        <div className="relative">
          <div className="wool-edge" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 px-4 pt-2.5 pb-3" style={{ borderBottom: '2px dashed var(--color-line)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-serif text-xl font-bold text-[var(--color-bone)] truncate">{title}</h2>
              <span aria-hidden className="shrink-0 inline-flex items-center justify-center px-2 h-[22px] rounded-full font-serif text-[11px] font-bold tabular-nums"
                style={{ background: 'var(--clay-10)', color: 'var(--clay-deep)', border: '2px solid color-mix(in srgb, var(--color-clay) 40%, transparent)' }}>
                今日第 {serveCount + 1} 道
              </span>
            </div>
            <BubbleClock visible={showClock} />
          </div>
        </div>

        {/* 竹笼舞台：点笼盖即揭晓 */}
        <div className="relative mx-3">
          <div
            data-bd-layer=""
            className="relative overflow-hidden"
            style={{ height: 264, border: '2px solid var(--color-line)', borderRadius: 'var(--radius-tile)', background: 'linear-gradient(180deg, var(--pot-stage-hi) 0%, var(--surface) 62%)' }}
          >
            {/* 罩内彩点 */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '9%', top: '28%', background: 'var(--color-clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '10%', top: '20%', background: 'var(--sage-30)' }} />

            {/* 蒸汽：从笼口冒（top≈100 对准前沿中心），只在开口敞着时冒 */}
            {STEAM_PHASES.includes(phase) && !reduced && (
              <div aria-hidden className="absolute flex gap-3" style={{ left: '50%', top: 100, transform: 'translateX(-50%)', zIndex: 5 }}>
                <span className="steam-puff" style={{ animationDelay: '0s' }} />
                <span className="steam-puff" style={{ animationDelay: '0.5s' }} />
                <span className="steam-puff" style={{ animationDelay: '1s' }} />
              </div>
            )}

            {/* 台布垫：竹色晨光，罩内不再是悬空 */}
            <div aria-hidden className="absolute left-1/2" style={{ bottom: 14, transform: 'translateX(-50%)', width: 232, height: 40, borderRadius: '50%',
              background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--sage-40) 28%, transparent) 0%, transparent 70%)' }} />
            {/* 竹笼落影 */}
            <div aria-hidden className="absolute left-1/2" style={{ bottom: 24, transform: 'translateX(-50%)', width: 168, height: 20, borderRadius: '50%',
              background: 'rgba(43,36,41,0.14)', filter: 'blur(6px)' }} />

            {/* 竹蒸笼：三明治分层 —— 后壁 svg(z1) / 菜(z2) / 前壁 svg(z3)。
                菜永远坐在笼口里不动：盖合时被盖 + 前壁天然遮住（开口几何已逐像素验算，
                全隐无需 opacity）；动画只做亮 / 胀 / 蒸汽。
                注意：wrapper 禁 transform（marginLeft 居中），否则层叠上下文会把
                z1/z2/z3 锁死在内部，前壁盖不住菜。 */}
            <div aria-hidden className="absolute left-1/2" style={{ bottom: 30, marginLeft: -98, width: 196, height: 141 }}>
              <svg viewBox="0 0 244 176" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', overflow: 'visible', zIndex: 1 }}>
                <defs>
                  <linearGradient id="cgBambooWall" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bamboo-hi)" />
                    <stop offset="42%" stopColor="var(--bamboo)" />
                    <stop offset="100%" stopColor="var(--bamboo-deep)" />
                  </linearGradient>
                  <linearGradient id="cgBambooHoop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--bamboo)" />
                    <stop offset="100%" stopColor="var(--color-caramel-deep)" />
                  </linearGradient>
                  {/* 编织纹：竖篾为主 + 横压丝，形成竹编的斜格感 */}
                  <pattern id="cgWeave" width="9" height="9" patternUnits="userSpaceOnUse">
                    <rect width="9" height="9" fill="transparent" />
                    <path d="M0 0 V9" stroke="var(--color-caramel-deep)" strokeOpacity="0.28" strokeWidth="1.4" />
                    <path d="M0 4.5 H9" stroke="var(--bamboo-hi)" strokeOpacity="0.45" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="cgBambooLid" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stopColor="var(--bamboo-hi)" />
                    <stop offset="55%" stopColor="var(--bamboo)" />
                    <stop offset="100%" stopColor="var(--bamboo-deep)" />
                  </linearGradient>
                  {/* 盖面径向编织：自盖钮向外的扇形篾 */}
                  <pattern id="cgLidWeave" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
                    <rect width="10" height="10" fill="transparent" />
                    <path d="M0 0 V10" stroke="var(--color-caramel-deep)" strokeOpacity="0.22" strokeWidth="1.2" />
                    <path d="M5 0 V10" stroke="var(--bamboo-hi)" strokeOpacity="0.4" strokeWidth="0.9" />
                  </pattern>
                  {/* 笼内腔：深色底（bone 随夜宵反相，腔内明暗跟主题走） */}
                  <radialGradient id="cgCavity" cx="50%" cy="32%" r="72%">
                    <stop offset="0%" stopColor="var(--color-bone)" stopOpacity="0.9" />
                    <stop offset="62%" stopColor="var(--color-bone)" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="var(--bamboo-deep)" stopOpacity="1" />
                  </radialGradient>
                </defs>

                {/* 台布垫 + 落影 */}
                <ellipse cx="122" cy="168" rx="112" ry="13" fill="var(--color-clay)" opacity="0.1" />
                <ellipse cx="122" cy="165" rx="92" ry="9" fill="var(--color-bone)" opacity="0.16" />
              </svg>

              {/* 下层屉画在前层 svg 里（与上层屉前壁同一层） */}
              <svg viewBox="0 0 244 176" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', overflow: 'visible', zIndex: 3 }}>
                <g>
                  <path d="M28 92 H216 L210 148 H34 Z" fill="url(#cgBambooWall)" />
                  <path d="M28 92 H216 L210 148 H34 Z" fill="url(#cgWeave)" />
                  <rect x="24" y="86" width="196" height="13" rx="4" fill="url(#cgBambooHoop)" />
                  <rect x="24" y="86" width="196" height="5" rx="2.5" fill="var(--bamboo-hi)" opacity="0.5" />
                  <rect x="34" y="143" width="176" height="9" rx="3" fill="var(--color-caramel-deep)" opacity="0.75" />
                </g>
                {/* 上层屉前壁：上缘 = 前沿弧。z3 盖住 z2 的菜 = 真遮挡的来源 */}
                <path d="M32 30 A90 20 0 0 0 212 30 L212 100 Q122 122 32 100 Z" fill="url(#cgBambooWall)" />
                <path d="M32 30 A90 20 0 0 0 212 30 L212 100 Q122 122 32 100 Z" fill="url(#cgWeave)" />
                <path d="M32 30 A90 20 0 0 0 212 30" fill="none" stroke="url(#cgBambooHoop)" strokeWidth="13" strokeLinecap="round" />
                <path d="M44 33 A78 16 0 0 0 200 33" fill="none" stroke="var(--bamboo-hi)" strokeWidth="2.5" strokeOpacity="0.5" strokeLinecap="round" />
                {/* 烫字 */}
                <text x="122" y="78" textAnchor="middle"
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 700, letterSpacing: '0.22em', fill: 'var(--color-caramel-deep)' }}>
                  晨光厨房
                </text>
              </svg>

              {/* 上层屉开口：内腔可见 + 后沿箍 + 内底（后层 z1，被前壁和菜压住） */}
              <svg viewBox="0 0 244 176" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', overflow: 'visible', zIndex: 1 }}>
                <ellipse cx="122" cy="30" rx="90" ry="20" fill="url(#cgCavity)" />
                <ellipse cx="122" cy="82" rx="58" ry="12" fill="var(--bamboo-deep)" opacity="0.5" />
                <ellipse cx="122" cy="82" rx="58" ry="12" fill="url(#cgWeave)" opacity="0.25" />
                <path d="M32 30 A90 20 0 0 1 212 30" fill="none" stroke="url(#cgBambooHoop)" strokeWidth="11" strokeLinecap="round" />
              </svg>
            </div>

            {/* 主推菜：永远坐在笼口里（slot 固定不动，z2 夹在后壁 z1 与前壁 z3 之间）。
                笼盖合上时：上被盖罩（盖 z5，87..136），下被前壁罩（>~132）→ 全隐；
                掀盖后：暗菜坐在黑腔里现身 → 变亮微胀（.55→.85）→ 端稳。
                名牌是槽内兄弟节点，只在 served 淡入（不等比缩放，避免贴片感）。 */}
            <div className="absolute left-1/2" style={{ width: 108, height: 108, top: 63, marginLeft: -54, zIndex: 2 }}>
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={lit ? { scale: 0.85 } : { scale: 0.55 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <DishPlate dish={current} size={108} />
                {/* 笼内压暗：独立遮罩做透明度（framer 的 filter 字符串插值在此处会卡死整组 tween，
                    实测 served 仍停在 idle 值；遮罩只走 opacity，万无一失） */}
                <motion.span
                  aria-hidden
                  className="absolute inset-0"
                  style={{ borderRadius: '50%', background: 'var(--color-bone)', pointerEvents: 'none' }}
                  initial={false}
                  animate={{ opacity: lit ? 0 : 0.45 }}
                  transition={{ duration: 0.35, ease: EASE }}
                />
              </motion.div>
              <motion.span
                aria-hidden
                className="absolute whitespace-nowrap font-bold"
                style={{ bottom: 11, left: '50%', x: '-50%', fontSize: 10, color: 'var(--color-caramel-deep)', background: 'color-mix(in srgb, var(--color-on-dark) 88%, transparent)', borderRadius: 999, padding: '0 8px', lineHeight: 1.7 }}
                initial={false}
                animate={{ opacity: phase === 'served' ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
              >
                {current ? `${current.name} · ¥${current.price}` : ''}
              </motion.span>
            </div>

            {/* 笼盖：单独一层 motion.button（要能掀开），内容是拟真盖面 */}
            <motion.button
              type="button"
              onClick={() => serve()}
              disabled={busy || !current}
              aria-label={current ? `掀开笼盖，端上「${current.name}」` : '笼里还没备菜'}
              whileTap={reduced ? {} : { scale: 0.96 }}
              animate={phase === 'idle' ? { y: 0, rotate: 0, opacity: 1 } : { y: -52, rotate: 14, opacity: 0.96 }}
              transition={{ duration: reduced ? 0.15 : 0.45, ease: EASE }}
              className="absolute left-1/2 flex items-center justify-center disabled:cursor-default"
              style={{ bottom: 128, x: '-50%', width: 164, height: 49, zIndex: 5, cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
            >
              <svg viewBox="0 0 200 60" width="164" height="49" style={{ display: 'block', overflow: 'visible' }}>
                {/* 盖沿：真蒸笼盖子比屉口略大，扣在收口箍外 */}
                <ellipse cx="100" cy="40" rx="94" ry="17" fill="url(#cgBambooHoop)" />
                <ellipse cx="100" cy="38" rx="94" ry="17" fill="none" stroke="var(--color-caramel-deep)" strokeWidth="1.5" strokeOpacity="0.6" />
                {/* 盖面穹顶 */}
                <path d="M8 38 A92 30 0 0 1 192 38 Z" fill="url(#cgBambooLid)" />
                <path d="M8 38 A92 30 0 0 1 192 38 Z" fill="url(#cgLidWeave)" />
                {/* 盖面高光：左上受光 */}
                <path d="M22 33 A78 24 0 0 1 96 15" fill="none" stroke="var(--bamboo-hi)" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.75" />
                {/* 盖钮：真竹盖是编织球形提手 */}
                <ellipse cx="100" cy="27" rx="15" ry="9" fill="url(#cgBambooLid)" stroke="var(--color-caramel-deep)" strokeWidth="1.6" strokeOpacity="0.75" />
                <ellipse cx="100" cy="26" rx="9" ry="5" fill="none" stroke="var(--bamboo-hi)" strokeWidth="1.4" strokeOpacity="0.8" />
              </svg>
            </motion.button>

            {/* 端上浮标（可撤销）：菜盘下方横贯的喜带，短暂压一下笼沿 */}
            <AnimatePresence>
              {label && (
                <motion.div key={label.key} className="absolute z-40"
                  style={{ left: '50%', top: 158 }}
                  initial={{ x: '-50%', opacity: 0, y: 8, scale: 0.9 }}
                  animate={{ x: '-50%', opacity: 1, y: -8, scale: 1 }}
                  exit={{ x: '-50%', opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onAnimationComplete={() => setTimeout(() => setLabel((l) => (l && l.key === label.key ? null : l)), 4200)}>
                  <div role="status" aria-live="polite" className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full whitespace-nowrap min-h-[44px]"
                    style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)', boxShadow: 'var(--shadow-3)' }}>
                    <span className="inline-flex items-center gap-1 font-bold text-xs">
                      <KissIcon className="w-3.5 h-3.5" /> {label.msg || `端上「${label.name}」`}
                    </span>
                    {onUndo && label.dish && (
                      <button type="button" aria-label={`撤销加入的「${label.name}」`}
                        onClick={(e) => { e.stopPropagation(); const ds = label.dishes || [label.dish]; setLabel(null); ds.forEach((d) => undoServe(d)) }}
                        className="text-xs font-bold px-3 h-11 rounded-full shrink-0 self-center"
                        style={{ background: 'var(--color-on-dark)', color: 'var(--clay-deep)' }}>
                        撤销
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 出菜面板：菜名点看做法 + 价格 + 换一道/端上来 */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>{serveCount === 0 ? note : '上一道端上的'}</p>
            <button onClick={onOpen} disabled={!current} className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5 max-w-full min-h-[44px] text-left" style={{ textUnderlineOffset: 3 }}>
              {current ? current.name : '笼里还没备菜'}
            </button>
            {served.length > 0 && (
              <div className="flex items-center gap-1 mt-1" role="img" aria-label={`今晚已端上：${served.length} 道`}>
                <span className="text-[10px] font-bold mr-0.5" style={{ color: 'var(--color-mist)' }}>今晚</span>
                {served.map((d, k) => (
                  <span key={`${d.id}-${k}`} aria-hidden className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0"
                    style={{ background: 'var(--plate-bg)', border: '1.5px solid var(--color-clay-soft)', opacity: 0.55 + 0.09 * k }}>
                    {getCategoryEmoji(d.category)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-baseline gap-1">
              <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[var(--color-love)]" />
              <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums" style={{ fontSize: '2rem', lineHeight: 1 }}>
                <span className="text-[0.55em] mr-0.5">¥</span>{current ? current.price : '—'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <motion.button whileTap={{ scale: 0.93 }} onClick={(e) => { e.stopPropagation(); serve() }} disabled={busy || !current}
                aria-label={current ? `端上${current.name}` : '端上来'}
                className="font-serif text-sm font-bold px-4 py-2 rounded-full inline-flex items-center justify-center min-h-[44px]"
                style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)',
                  boxShadow: '0 4px 12px color-mix(in srgb, var(--color-clay) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)', opacity: busy || !current ? 0.6 : 1 }}>
                {busy ? '上菜中…' : '端上来'}
              </motion.button>
              <motion.button whileTap={{ scale: 0.96 }} onClick={(e) => { e.stopPropagation(); previewNext() }} disabled={busy}
                aria-label="换一道"
                className="text-xs font-bold px-3 rounded-full inline-flex items-center justify-center min-h-[44px]"
                style={{ background: 'transparent', color: 'var(--color-clay-text)', border: '2px solid var(--color-line)' }}>
                换一道
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
