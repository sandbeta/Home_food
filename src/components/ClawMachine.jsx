import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import KissIcon from './KissIcon'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'

// ============================================================
// 抓娃娃点餐机（V4 · 现实娃娃机模型，2026-09-23）
// ------------------------------------------------------------
// 与旧版的根本区别：旧版是"外部传一个固定 featured、爪子永远抓它"；
// 这一版是**真·娃娃机**——罩底一堆有状态的槽位（slots），每个槽放一个菜品圆盘：
//   · 抓取 = 从堆里【随机】选一个槽位，夹起那个物品（抓到哪个是哪个）
//   · 抓走的槽位【刷新】补一个新的随机物品进来
//   · 下次再随机，可能又抓到刚补的、也可能抓到别的（纯随机，允许重复）
//   · 闲置时堆每隔几秒自动补货刷新（现实娃娃机不自动抓，只有补货动效）
//   · 出菜面板显示"上一个抓到的菜"（没抓过时显示堆里随机一个作示例）
// 抓到即"抓一个算一个"：onCatch(dish) 加购（起手乐观加购，防动画中途卸载丢失）。
// 纪律：颜色零硬编码全 var() 令牌；外层不带 transform；reduced-motion 不演行程直接结算。
// ============================================================

/* 抓取节拍（ms）——低频签名演出 */
const BEAT = { drop: 360, close: 170, lift: 460, carry: 330, release: 320, settle: 340 }
const SEQ = ['drop', 'close', 'lift', 'carry', 'release', 'settle']

/* 机内几何（px / %） */
const GEO = { railY: 16, carH: 12, cableUp: 22, cableDown: 112, clawH: 46, pileTop: 156, slotTop: 246, chuteX: '18%' }
const clawTop = (cable) => GEO.railY + GEO.carH + cable

/* 底部待抓菜堆：8 个槽位，错落堆在罩底（避开左侧出菜口 chuteX=18%）。x=left%、y=top(px)、r=rotate、s=直径 */
const PILE_SLOTS = [
  { x: '30%', y: 200, r: -10, s: 50 },
  { x: '46%', y: 214, r: 6,  s: 46 },
  { x: '62%', y: 202, r: -4, s: 48 },
  { x: '78%', y: 216, r: 9,  s: 44 },
  { x: '37%', y: 232, r: 4,  s: 44 },
  { x: '54%', y: 240, r: -8, s: 46 },
  { x: '70%', y: 236, r: 5,  s: 42 },
  { x: '88%', y: 220, r: -6, s: 40 },
]
const N = PILE_SLOTS.length

/* 从 pool 选一个不在当前 slots 里的随机菜作补货；pool 不足则随机任意（允许重复） */
function pickNew(pool, slots) {
  const src = pool || []
  if (!src.length) return null
  const inSlot = new Set((slots || []).filter(Boolean).map(d => d.id))
  const avail = src.filter(d => d && !inSlot.has(d.id))
  const from = avail.length ? avail : src
  return from[Math.floor(Math.random() * from.length)] || null
}

/* 初始堆：从 pool 随机取 N 个不重复 */
function initSlots(pool) {
  const src = pool || []
  const picked = []
  const used = new Set()
  for (let i = 0; i < N; i++) {
    const avail = src.filter(d => d && !used.has(d.id))
    if (!avail.length) { picked.push(null); continue }
    const d = avail[Math.floor(Math.random() * avail.length)]
    picked.push(d); used.add(d.id)
  }
  return picked
}

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
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${hh}:${mm}`
  return (
    <time className="claw-clock shrink-0" dateTime={iso} aria-label={`${now.getMonth() + 1}月${now.getDate()}日 ${hh}:${mm}`}>
      <span className="time">{hh}:{mm}</span>
      <span className="date">{now.getMonth() + 1}-{String(now.getDate()).padStart(2, '0')}<br />周{'日一二三四五六'[now.getDay()]}</span>
    </time>
  )
}

/** 三指爪钩 */
function Claw({ open, x, cable, grabbing }) {
  const jawRot = open ? 26 : 4
  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ left: x, top: GEO.railY, transform: 'translateX(-50%)' }}
      animate={{ left: x }}
      transition={{ duration: grabbing ? BEAT.carry / 1000 : 0.5, ease: EASE }}
    >
      <div style={{ width: 26, height: GEO.carH, borderRadius: 6, background: 'var(--color-clay)', border: '2px solid var(--clay-deep)', margin: '0 auto', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }} />
      <motion.div style={{ width: 2, background: 'var(--clay-deep)', margin: '0 auto' }} animate={{ height: cable }} transition={{ duration: 0.36, ease: EASE }} />
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

/* 一个菜品圆盘（堆里 / 被夹的都用它） */
function Plate({ dish, size, grabbing, dim }) {
  if (!dish) return null
  const img = getDishImage(dish)
  return (
    <div className="relative flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: '50%', background: 'var(--plate-bg)',
        border: `2px solid ${grabbing ? 'var(--clay-deep)' : 'var(--color-clay-soft)'}`,
        boxShadow: grabbing ? 'var(--shadow-glow-clay)' : '0 3px 8px rgba(43,36,41,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
        opacity: dim ? 0.9 : 1 }}>
      <span style={{ fontSize: size * 0.5, filter: 'var(--tile-img-filter)' }} aria-hidden>{getCategoryEmoji(dish.category)}</span>
      {img && <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
    </div>
  )
}

export default function ClawMachine({
  pool = [], onCatch, onUndo, onOpen, onActiveChange,
  showClock = true, title = '抓娃娃点餐机', note = '今日主推 · 抓到一个算一个',
}) {
  const reduced = usePrefersReducedMotion()
  const [slots, setSlots] = useState(() => initSlots(pool))
  const [activeDish, setActiveDish] = useState(() => (initSlots(pool).find(Boolean)) || null)
  const [phase, setPhase] = useState('idle')
  const [grabIdx, setGrabIdx] = useState(-1)      // 抓取中的槽位
  const [frozen, setFrozen] = useState(null)       // 抓取中锁定的菜
  const [burst, setBurst] = useState(0)
  const [confetti, setConfetti] = useState(0)
  const [label, setLabel] = useState(null)
  const [shake, setShake] = useState(0)
  const [grabCount, setGrabCount] = useState(0)
  const timers = useRef([])
  const grabbing = phase !== 'idle'

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const after = (ms, fn) => { timers.current.push(setTimeout(fn, ms)) }

  // pool 首次到达（数据加载完）且堆还空 → 填充
  useEffect(() => {
    if (!pool || !pool.length) return
    setSlots(prev => (prev.some(Boolean) ? prev : initSlots(pool)))
    setActiveDish(prev => prev || initSlots(pool).find(Boolean) || null)
  }, [pool])

  // activeDish 同步给父级（分享卡 / 跳详情用）
  useEffect(() => { onActiveChange?.(activeDish) }, [activeDish, onActiveChange])

  // 现实娃娃机：闲置时堆每隔几秒自动补货刷新一个槽（爪子不自动抓）；reduced 不刷
  useEffect(() => {
    if (reduced || !pool.length) return undefined
    const t = setInterval(() => {
      setSlots(prev => {
        const idx = Math.floor(Math.random() * N)
        const nd = pickNew(pool, prev)
        if (!nd) return prev
        const next = [...prev]; next[idx] = nd
        return next
      })
    }, 4500)
    return () => clearInterval(t)
  }, [pool, reduced])

  const runGrab = useCallback(() => {
    if (grabbing) return
    const idx = Math.floor(Math.random() * N)
    const target = slots[idx]
    if (!target) return
    setGrabIdx(idx)
    setFrozen(target)
    setGrabCount(c => c + 1)
    onCatch?.(target)   // 起手乐观加购（防动画中途卸载丢失，M-s7）
    setActiveDish(target)
    if (reduced) {
      setLabel({ name: target.name, dish: target, key: Date.now() })
      setSlots(prev => { const n = [...prev]; n[idx] = pickNew(pool, prev); return n })
      setGrabIdx(-1); setFrozen(null)
      return
    }
    let t = 0
    SEQ.forEach((p) => { after(t, () => setPhase(p)); t += BEAT[p] })
    after(BEAT.drop, () => setBurst(b => b + 1))
    after(BEAT.drop + BEAT.close + BEAT.lift + BEAT.carry, () => {
      setPhase('release'); setConfetti(c => c + 1); setShake(s => s + 1)
      setLabel({ name: target.name, dish: target, key: Date.now() })
      // 抓走的槽位刷新补一个新随机物品
      setSlots(prev => { const n = [...prev]; n[idx] = pickNew(pool, prev); return n })
    })
    after(t, () => { setPhase('idle'); setGrabIdx(-1); setFrozen(null) })
  }, [grabbing, slots, reduced, onCatch, pool])

  const undoCatch = (dish) => { onUndo?.(dish) }

  /* 几何 */
  const cable = ['drop', 'close'].includes(phase) ? GEO.cableDown : GEO.cableUp
  const jawOpen = !['close', 'lift', 'carry'].includes(phase)
  const targetSpot = grabIdx >= 0 ? PILE_SLOTS[grabIdx] : null
  const held = ['close', 'lift', 'carry'].includes(phase)
  const falling = phase === 'release'
  // 爪子：carry/release 移到出菜口，否则对准被抓槽位（drop 前也滑到该槽上方）
  const carX = ['carry', 'release'].includes(phase) ? GEO.chuteX : (targetSpot ? targetSpot.x : '50%')
  // 被夹盘：drop 在原槽位、close/lift/carry 跟随爪、release 落槽下坠
  const grabX = ['carry', 'release'].includes(phase) ? GEO.chuteX : (targetSpot ? targetSpot.x : '50%')
  const grabY = phase === 'drop' ? (targetSpot ? targetSpot.y : GEO.pileTop)
    : falling ? GEO.slotTop
    : clawTop(cable) + 16
  const jig = !reduced && (phase === 'drop' || phase === 'close')

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
                第 {grabCount + 1} 抓
              </span>
            </div>
            <BubbleClock visible={showClock} />
          </div>
        </div>

        {/* 玻璃罩：可交互抓取舞台 */}
        <div className="relative mx-3">
          <motion.div
            className="claw-case relative overflow-hidden cursor-pointer"
            style={{ height: 264, border: '2px solid var(--color-line)', borderRadius: 'var(--radius-tile)' }}
            animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            onClick={runGrab}
            role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runGrab() } }}
            aria-label="抓娃娃点餐机，点按从堆里随机抓一个"
          >
            {/* 顶部轨道 */}
            <div className="absolute" style={{ left: 12, right: 12, top: GEO.railY + 4, height: 5, borderRadius: 999, background: 'color-mix(in srgb, var(--clay-deep) 45%, transparent)' }} />
            {/* 罩内彩点 */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '9%', top: '28%', background: 'var(--color-clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '10%', top: '20%', background: 'var(--sage-30)' }} />

            {/* 出菜口（落槽） */}
            <div className="absolute" style={{ left: GEO.chuteX, bottom: 8, transform: 'translateX(-50%)', width: 74, height: 26, borderRadius: '0 0 12px 12px', background: 'var(--color-ink-800)', border: '2px solid var(--color-line)', borderTop: 'none' }}>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-ash)', letterSpacing: '0.1em' }}>出菜口</span>
            </div>

            {/* 底部菜堆：8 个槽位的物品（抓取中被夹走的那个槽暂不渲染） */}
            <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
              {slots.map((p, i) => {
                if (!p) return null
                if (grabbing && i === grabIdx) return null   // 被夹走的不留在堆里
                const lay = PILE_SLOTS[i]
                const amp = 5 + (i % 3) * 3
                return (
                  <div key={i} className="absolute" style={{ left: lay.x, top: lay.y, transform: `translateX(-50%) rotate(${lay.r}deg)` }}>
                    <motion.div
                      animate={jig ? { y: [0, -amp, 0] } : { y: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      style={{ position: 'relative' }}
                    >
                      <Plate dish={p} size={lay.s} dim />
                    </motion.div>
                  </div>
                )
              })}
            </div>

            {/* 爪钩机构 */}
            <Claw open={jawOpen} x={carX} cable={cable} grabbing={grabbing} />

            {/* 被夹起的盘：从被抓槽位升起跟随爪子到出菜口落槽 */}
            <AnimatePresence>
              {grabbing && frozen && (
                <motion.div
                  key={`grab-${grabIdx}-${frozen.id}`}
                  className="absolute z-10 pointer-events-none"
                  style={{ left: grabX, top: grabY }}
                  initial={{ x: '-50%', opacity: 1, scale: 1 }}
                  animate={
                    falling || grabIdx < 0
                      ? { x: '-50%', left: GEO.chuteX, top: GEO.slotTop, opacity: 0, rotate: [0, -18, 14, 0], transition: { duration: BEAT.release / 1000, ease: [0.5, 0, 0.9, 0.6] } }
                      : { x: '-50%', left: grabX, top: grabY, opacity: 1, scale: 1, rotate: held ? [0, -4, 4, 0] : 0, transition: { duration: 0.4, ease: EASE } }
                  }
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <Plate dish={frozen} size={72} grabbing />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 合钳星芒 */}
            <AnimatePresence>
              {burst > 0 && !reduced && ['close', 'lift'].includes(phase) && targetSpot && (
                <motion.div key={burst} className="absolute z-30 pointer-events-none" style={{ left: targetSpot.x, top: clawTop(GEO.cableDown) + 10, transform: 'translateX(-50%)' }}>
                  {[0, 1, 2, 3, 4, 5].map((k) => {
                    const a = (k / 6) * Math.PI * 2
                    return <motion.span key={k} className="absolute block rounded-full"
                      style={{ width: 6, height: 6, background: k % 2 ? 'var(--color-love)' : 'var(--color-clay-soft)' }}
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

          {/* 抓到浮标（可撤销）——机壳外 sibling */}
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
                      onClick={(e) => { e.stopPropagation(); const d = label.dish; setLabel(null); undoCatch(d) }}
                      className="text-xs font-bold px-3 h-11 rounded-full shrink-0"
                      style={{ background: 'var(--color-on-dark)', color: 'var(--clay-deep)' }}>
                      撤销
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 出菜面板：显示上一个抓到的菜（菜名点看做法 + 价格 + 抓取按钮） */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>{grabCount === 0 ? note : '上一个抓到的'}</p>
            <button onClick={onOpen} disabled={!activeDish} className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5 max-w-full min-h-[44px] text-left" style={{ textUnderlineOffset: 3 }}>
              {activeDish ? activeDish.name : '点抓取试试运气'}
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-1">
              <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[var(--color-love)]" />
              <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums" style={{ fontSize: '2rem', lineHeight: 1 }}>
                <span className="text-[0.55em] mr-0.5">¥</span>{activeDish ? activeDish.price : '—'}
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.93 }} onClick={(e) => { e.stopPropagation(); runGrab() }} disabled={grabbing}
              aria-label="从堆里随机抓一个" className="font-serif text-sm font-bold px-4 py-2.5 rounded-full inline-flex items-center justify-center min-h-[44px]"
              style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-clay) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)', opacity: grabbing ? 0.6 : 1 }}>
              {grabbing ? '抓取中…' : '抓取'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
