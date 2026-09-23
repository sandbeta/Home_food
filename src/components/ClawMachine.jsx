import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KissIcon from './KissIcon'
import Icon from './ui/Icons'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'

// ============================================================
// 抓娃娃点餐机（V3 · 可交互签名组件，2026-09-21 所有者要求"独立可交互有动画特效"）
// ------------------------------------------------------------
// 与上一版的根本区别：上一版机构交给素材自带、组件只淡入淡出换菜；
// 这一版**自绘整套爪钩机构**（轨道 + 滑车 + 缆线 + 三指开合爪），
// 被抓的"物品"= 当前主推菜品圆盘（实拍图 / 分类 emoji 兜底），点「抓取」或点罩子即演一遍完整抓取：
//   下爪 → 合钳(星芒) → 提起 → 横移到出菜口 → 松爪落槽(彩纸+机身一震+抓到浮标) → 换新玩偶落下。
// 抓到即"抓一个算一个"：落槽一刻回调 onCatch(dish)（Home 接购物车 addItem）。
// 纪律：
//  - 颜色零硬编码，全 var() 令牌（过 p6 色值门禁）
//  - 外层不带 transform（转场红线），所有位移在机内元素上
//  - prefers-reduced-motion：不演行程，直接淡入换新玩偶 + 立即 onCatch
//  - 图标一律 SVG / 自绘，无 emoji 图标（菜品占位 emoji 是数据不是图标）
// ============================================================

/* 抓取节拍（ms）——低频签名演出，不受 UI 300ms 档约束（设计稿 A7：娃娃机抓取 ≈1.2s） */
const BEAT = { drop: 360, close: 170, lift: 460, carry: 330, release: 320, settle: 340 }
const SEQ = ['drop', 'close', 'lift', 'carry', 'release', 'settle']

/* 机内几何（px / %） */
const GEO = { railY: 16, carH: 12, cableUp: 22, cableDown: 112, clawH: 46, pileTop: 156, slotTop: 246, chuteX: '18%' }
const clawTop = (cable) => GEO.railY + GEO.carH + cable

/** 泡泡时钟：实时时间糖牌（宵夜档 visible=false 不渲染） */
function BubbleClock({ visible = true }) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (!visible) return undefined
    const t = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(t)
  }, [visible])
  if (!visible) return null
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')
  return (
    <div className="claw-clock shrink-0" aria-label={`${now.getMonth() + 1}月${now.getDate()}日 ${hh}:${mm}`}>
      <span className="time">{hh}:{mm}</span>
      <span className="date">{now.getMonth() + 1}-{String(now.getDate()).padStart(2, '0')}<br />周{'日一二三四五六'[now.getDay()]}</span>
    </div>
  )
}

/** 三指爪钩：open 控制指爪外张/合拢，随缆线一起升降 */
function Claw({ open, x, cable, grabbing }) {
  const jawRot = open ? 26 : 4
  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ left: x, top: GEO.railY, transform: 'translateX(-50%)' }}
      animate={{ left: x }}
      transition={{ duration: grabbing ? BEAT.carry / 1000 : 0.4, ease: EASE }}
    >
      {/* 滑车 */}
      <div style={{ width: 26, height: GEO.carH, borderRadius: 6, background: 'var(--color-clay)', border: '2px solid var(--clay-deep)', margin: '0 auto', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }} />
      {/* 缆线 */}
      <motion.div style={{ width: 2, background: 'var(--clay-deep)', margin: '0 auto' }} animate={{ height: cable }} transition={{ duration: 0.36, ease: EASE }} />
      {/* 爪头 + 三指 */}
      <svg width={GEO.clawH} height={GEO.clawH} viewBox="0 0 46 46" style={{ display: 'block', margin: '-2px auto 0', overflow: 'visible' }}>
        <circle cx="23" cy="6" r="5.5" fill="var(--color-clay)" stroke="var(--clay-deep)" strokeWidth="2" />
        <circle cx="23" cy="6" r="1.8" fill="var(--color-love)" />
        {[-1, 0, 1].map((dir) => (
          <motion.g key={dir} style={{ transformOrigin: '23px 10px', transformBox: 'view-box' }}
            animate={{ rotate: dir === 0 ? 0 : (open ? dir * jawRot : dir * jawRot * 0.16) }}
            transition={{ duration: 0.18, ease: EASE }}>
            <path d={dir === 0 ? 'M23 10 L23 30' : `M23 10 Q${23 + dir * 12} 20 ${23 + dir * 10} 31`}
              fill="none" stroke="var(--clay-deep)" strokeWidth="3" strokeLinecap="round" />
            <path d={dir === 0 ? 'M23 30 l-3 -4 M23 30 l3 -4' : `M${23 + dir * 10} 31 l${dir * 3} -4`}
              fill="none" stroke="var(--clay-deep)" strokeWidth="3" strokeLinecap="round" />
          </motion.g>
        ))}
      </svg>
    </motion.div>
  )
}

export default function ClawMachine({
  dish, onOpen, onCatch, onUndo, onGrab, indexNo = 1,
  rotate, showClock = true, autoOn = true, onToggleAuto,
  title = '抓娃娃点餐机', note = '今日主推 · 抓到一个算一个',
}) {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState('idle')
  const [frozen, setFrozen] = useState(dish)   // 抓取期间锁住当前玩偶，防自动轮换中途换菜致动画错乱
  const [burst, setBurst] = useState(0)      // 星芒/彩纸触发计数
  const [confetti, setConfetti] = useState(0)
  const [label, setLabel] = useState(null)   // 抓到浮标 {name, key}
  const [shake, setShake] = useState(0)
  const timers = useRef([])
  const grabbing = phase !== 'idle'
  const shown = grabbing ? frozen : dish
  const image = shown ? getDishImage(shown) : null

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const after = (ms, fn) => { timers.current.push(setTimeout(fn, ms)) }

  const runGrab = useCallback(() => {
    if (grabbing || !dish) return
    if (reduced) {                       // 降级：不演行程，淡入换新 + 立即结算
      setLabel({ name: dish.name, dish, key: Date.now() })
      onCatch?.(dish); onGrab?.()
      return
    }
    setFrozen(dish)
    let t = 0
    SEQ.forEach((p) => { after(t, () => setPhase(p)); t += BEAT[p] })
    after(BEAT.drop, () => setBurst((b) => b + 1))                 // 合钳瞬间星芒
    after(BEAT.drop + BEAT.close + BEAT.lift + BEAT.carry, () => { // 落槽：彩纸 + 震动 + 结算
      setPhase('release'); setConfetti((c) => c + 1); setShake((s) => s + 1)
      setLabel({ name: dish.name, dish, key: Date.now() })
      onCatch?.(dish)
    })
    after(t, () => { setPhase('idle'); onGrab?.() })               // 收尾换新玩偶
  }, [grabbing, dish, reduced, onCatch, onGrab])

  /* 各相位下爪钩 / 玩偶的目标几何 */
  const cable = ['drop', 'close'].includes(phase) ? GEO.cableDown : GEO.cableUp
  const jawOpen = !['close', 'lift', 'carry'].includes(phase)
  const carX = ['carry', 'release'].includes(phase) ? GEO.chuteX : '50%'
  const held = ['close', 'lift', 'carry'].includes(phase)
  const resting = ['idle', 'aim', 'drop'].includes(phase)
  const falling = phase === 'release'
  const plushTop = resting ? GEO.pileTop : clawTop(cable) + 16
  const plushX = ['carry', 'release'].includes(phase) ? GEO.chuteX : '50%'

  return (
    <motion.div {...contentEnter(0.05)}>
      <div className="d3-card-face overflow-hidden" style={{ boxShadow: 'var(--shadow-4)', border: '2px solid var(--clay-deep)' }}>
        {/* 机顶：羊毛檐 + 机名 + No.xx 糖牌 + 泡泡时钟 */}
        <div className="relative">
          <div className="wool-edge" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 px-4 pt-2.5 pb-3" style={{ borderBottom: '2px dashed var(--color-line)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-serif text-xl font-bold text-[var(--color-bone)] truncate">{title}</h2>
              <span aria-hidden className="shrink-0 inline-flex items-center justify-center px-2 h-[22px] rounded-full font-serif text-[11px] font-bold tabular-nums"
                style={{ background: 'var(--clay-10)', color: 'var(--clay-deep)', border: '2px solid color-mix(in srgb, var(--color-clay) 40%, transparent)' }}>
                No.{String(indexNo).padStart(2, '0')}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onToggleAuto && !reduced && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onToggleAuto() }}
                  aria-label={autoOn ? '暂停自动轮换' : '开始自动轮换'}
                  aria-pressed={autoOn}
                  className="w-11 h-11 rounded-full flex items-center justify-center"
                  style={{ border: '2px solid var(--color-line)', color: 'var(--color-clay)', background: 'var(--surface)' }}
                >
                  <Icon name={autoOn ? 'pause' : 'play'} size={15} strokeWidth={2.4} filled={!autoOn} />
                </motion.button>
              )}
              <BubbleClock visible={showClock} />
            </div>
          </div>
        </div>

        {/* 玻璃罩：可交互抓取舞台（点任意处即演一遍抓取） */}
        <div className="relative mx-3">
          <motion.div
            className="claw-case relative overflow-hidden cursor-pointer"
            style={{ height: 264, border: '2px solid var(--color-line)', borderRadius: 'var(--radius-tile)' }}
            animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={runGrab}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runGrab() } }}
            aria-label={`抓娃娃点餐机，当前主推 ${shown?.name ?? ''}，点按抓取`}
          >
            {/* 顶部轨道 */}
            <div className="absolute" style={{ left: 12, right: 12, top: GEO.railY + 4, height: 5, borderRadius: 999, background: 'color-mix(in srgb, var(--clay-deep) 45%, transparent)' }} />
            {/* 罩内彩点 */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '9%', top: '30%', background: 'var(--clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '10%', top: '22%', background: 'var(--sage-30)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ left: '13%', bottom: '26%', background: 'var(--color-love)', opacity: 0.5 }} />

            {/* 出菜口（落槽） */}
            <div className="absolute" style={{ left: GEO.chuteX, bottom: 8, transform: 'translateX(-50%)', width: 74, height: 26, borderRadius: '0 0 12px 12px', background: 'var(--color-ink-800)', border: '2px solid var(--color-line)', borderTop: 'none' }}>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-ash)', letterSpacing: '0.1em' }}>出菜口</span>
            </div>

            {/* 爪钩机构 */}
            <Claw open={jawOpen} x={carX} cable={cable} grabbing={grabbing} />

            {/* 被抓的玩偶：闲置在中央 / 被提起随爪走 / 落槽下坠 */}
            <AnimatePresence mode="popLayout">
              {shown && (resting || held || falling) && (
                <motion.div
                  key={phase === 'release' ? `fall-${shown.id}` : `p-${shown.id}`}
                  className="absolute z-10 pointer-events-none"
                  style={{ left: plushX, top: plushTop }}
                  initial={reduced ? { x: '-50%', opacity: 0 } : { x: '-50%', opacity: 0, y: -26, scale: 0.82 }}
                  animate={
                    falling
                      ? { x: '-50%', left: GEO.chuteX, top: GEO.slotTop, opacity: 0, rotate: [0, -18, 14, 0], transition: { duration: BEAT.release / 1000, ease: [0.5, 0, 0.9, 0.6] } }
                      : { x: '-50%', left: plushX, top: plushTop, opacity: 1, y: 0, scale: 1, rotate: held ? [0, -3, 3, 0] : 0,
                          transition: { duration: reduced ? 0.24 : 0.42, ease: EASE } }
                  }
                  exit={{ x: '-50%', opacity: 0, transition: { duration: 0.18 } }}
                >
                  {/* 被抓的"物品"= 当前主推菜品圆盘（实拍图 / 分类 emoji 兜底）——抓一个算一个 */}
                  <div className="relative flex items-center justify-center overflow-hidden"
                    style={{ width: 92, height: 92, borderRadius: '50%', background: 'var(--plate-bg)', border: '2px solid var(--color-clay-soft)', boxShadow: '0 8px 20px rgba(43,36,41,0.14), inset 0 2px 0 rgba(255,255,255,0.6)' }}>
                    <span className="text-5xl" style={{ filter: 'var(--tile-img-filter)' }}>{getCategoryEmoji(shown.category)}</span>
                    {image && <img src={image} alt={shown.name} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 合钳星芒 */}
            <AnimatePresence>
              {burst > 0 && !reduced && ['close', 'lift'].includes(phase) && (
                <motion.div key={burst} className="absolute z-30 pointer-events-none" style={{ left: '50%', top: clawTop(GEO.cableDown) + 10, transform: 'translateX(-50%)' }}>
                  {[0, 1, 2, 3, 4, 5].map((k) => {
                    const a = (k / 6) * Math.PI * 2
                    return <motion.span key={k} className="absolute block rounded-full"
                      style={{ width: 6, height: 6, background: k % 2 ? 'var(--color-love)' : 'var(--clay-soft)' }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos(a) * 34, y: Math.sin(a) * 34, opacity: 0, scale: 0.3 }}
                      transition={{ duration: 0.5, ease: EASE }} />
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 落槽彩纸 */}
            <AnimatePresence>
              {confetti > 0 && !reduced && (
                <motion.div key={confetti} className="absolute z-30 pointer-events-none" style={{ left: GEO.chuteX, top: GEO.slotTop - 30, transform: 'translateX(-50%)' }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((k) => (
                    <motion.span key={k} className="absolute block"
                      style={{ width: 6, height: 9, borderRadius: 2, background: ['var(--color-clay)', 'var(--color-love)', 'var(--color-sage)', 'var(--color-caramel)'][k % 4] }}
                      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                      animate={{ x: (k - 3) * 13, y: [0, -26, 10], opacity: [1, 1, 0], rotate: 240 }}
                      transition={{ duration: 0.7, ease: EASE }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
          {/* 抓到浮标（可撤销）——移到可点机壳【外】做成合法 sibling：
              既免键盘 Enter/Space 冒泡误触发抓取，又免真按钮嵌进 role=button 被读屏扁平化；热区抬到 44。 */}
          <AnimatePresence>
            {label && (
              <motion.div key={label.key} className="absolute z-40"
                style={{ left: GEO.chuteX, top: GEO.slotTop - 52 }}
                initial={{ x: '-50%', opacity: 0, y: 8, scale: 0.9 }}
                animate={{ x: '-50%', opacity: 1, y: -8, scale: 1 }}
                exit={{ x: '-50%', opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onAnimationComplete={() => setTimeout(() => setLabel((l) => (l && l.key === label.key ? null : l)), 4200)}>
                <div role="status" aria-live="polite" className="inline-flex items-center gap-2 h-11 pl-3 pr-1.5 rounded-full whitespace-nowrap"
                  style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)', boxShadow: 'var(--shadow-3)' }}>
                  <span className="inline-flex items-center gap-1 font-bold text-xs">
                    <KissIcon className="w-3.5 h-3.5" /> 抓到「{label.name}」
                  </span>
                  {onUndo && label.dish && (
                    <button type="button" aria-label={`撤销加入的「${label.name}」`}
                      onClick={(e) => { e.stopPropagation(); const d = label.dish; setLabel(null); onUndo(d) }}
                      className="text-xs font-bold px-3 h-9 rounded-full shrink-0"
                      style={{ background: 'var(--color-on-dark)', color: 'var(--clay-deep)' }}>
                      撤销
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 出菜面板：菜名（点看做法）+ 价格 + 抓取按钮 */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>{note}</p>
            <button onClick={onOpen} className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5 max-w-full" style={{ textUnderlineOffset: 3 }}>
              {shown?.name}
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-1">
              <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[var(--color-love)]" />
              <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums" style={{ fontSize: '2rem', lineHeight: 1 }}>
                <span className="text-[0.55em] mr-0.5">¥</span>{shown?.price}
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.93 }} onClick={(e) => { e.stopPropagation(); runGrab() }} disabled={grabbing}
              aria-label="抓取这一只" className="font-serif text-sm font-bold px-4 py-2.5 rounded-full inline-flex items-center justify-center min-h-[44px]"
              style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-clay) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)', opacity: grabbing ? 0.6 : 1 }}>
              {grabbing ? '抓取中…' : '抓取'}
            </motion.button>
          </div>
        </div>

        {/* 自动轮换进度条（闲置时预告下一次） */}
        {rotate && !grabbing && (
          <div className="h-[3px]" style={{ background: 'color-mix(in srgb, var(--clay-deep) 10%, transparent)' }}>
            <div key={rotate.key} className="h-full rot-progress-bar" style={{ background: 'var(--color-clay)', animationDuration: `${rotate.durationMs}ms` }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
