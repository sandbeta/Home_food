import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import KissIcon from './KissIcon'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'
import { buildInitialSlots, refillOne, pickBuddyA, buildTimeline, decideFeint, CLAW_TIMING } from '../lib/clawPool'
import { useClawAim } from '../hooks/useClawAim'

// ============================================================
// 抓娃娃点餐机（V5 · 轻游戏化收敛版，2026-09-24）
// ------------------------------------------------------------
// 承 V4「现实娃娃机」骨架（8 槽有状态堆 + 抓走补货 + 闲置自动刷新 + 落袋即加购 + 可撤销），
// 在此之上按收敛方案叠加三件事，并做工程加固：
//   ① 智能三层池：堆料由 pool（带 _weight/_layer，来自 useClawSignals→tagLayers）加权生成，
//      偏向收藏/常点(A)、纪念日/愿望(B)、没吃过的新菜(C 探索加成)——"它怎么知道我想吃这个"。
//   ② 拖拽瞄准：按住罩横向拖，小车跟手、抬手即下爪抓瞄准那一格（所见即所得）；
//      键盘 ←→ 移格、空格/回车下爪；用 setPointerCapture 消除 window 监听卡死与拖后 click 竞态。
//   ③ 必中悬念（浓度 B·约三成）：落袋前"爪子一松、盘子往下滑又晃回来"，结果永远正反馈；
//      若演这出，落袋时顺手把旁边一格 A 层菜一起给你（那盘走同样的乐观加购，可撤销）。
//
// 工程加固（回应技术评审）：
//   · 时间线走纯函数 buildTimeline + 可整体 cancel 的调度器（clearTimeline），不再手算 setTimeout 累加；
//   · 起手仍乐观加购（M-s7：防动画中途路由卸载丢加购），落袋只补"带出的 A 层菜"；
//   · Plate memo、burst/confetti/shake 由 phase+grabCount 派生，减少无谓整树重渲染；
//   · 演出魔数全收进 CLAW_TIMING 单一真源；
//   · 瞄准切换经 sr-only aria-live 播报，屏幕阅读器可跟手；reduced-motion 不演拖拽/悬念，直接结算。
// 纪律：颜色零硬编码全 var() 令牌；外层不带 transform；不动 CartContext/mockApi/favorites，只消费。
// ============================================================

/* 机内几何（px / %）——布局常量，与演出时间无关，留在组件文件 */
const GEO = { railY: 16, carH: 12, cableUp: 22, cableDown: 112, clawH: 46, pileTop: 156, slotTop: 246, chuteX: '18%' }
const clawTop = (cable) => GEO.railY + GEO.carH + cable

/* 底部待抓菜堆：8 个槽位，错落堆在罩底（避开左侧出菜口 chuteX=18%）。x=left%、y=top(px)、r=rotate、s=直径
   批4 修 P1：①最小盘径 40/42 → 统一 ≥44（热区铁律）；②原底行 y232~240+直径 顶到 276~286，超出罩内净高 ~260
   被 overflow-hidden 裁半张盘——整堆上收 ~16px，底行盘脚全部回到罩内。 */
const PILE_SLOTS = [
  { x: '30%', y: 186, r: -10, s: 50 },
  { x: '46%', y: 196, r: 6,  s: 46 },
  { x: '62%', y: 186, r: -4, s: 48 },
  { x: '78%', y: 198, r: 9,  s: 44 },
  { x: '37%', y: 206, r: 4,  s: 44 },
  { x: '54%', y: 214, r: -8, s: 46 },
  { x: '70%', y: 210, r: 5,  s: 44 },
  { x: '88%', y: 198, r: -6, s: 44 },
]
const N = PILE_SLOTS.length

/** B 层专属文案（抓到纪念日/愿望菜时的心动一击）。内置默认，无需调用方传，避免白天/夜宵各写一份。 */
function blessingOf(dish) {
  const f = dish && dish._flags
  if (!f) return null
  if (f.today) return '这个，他早想给你安排上了 ❤'
  if (f.wish) return '你许过的愿望，被抓到了'
  if (f.promo) return '今日他替你挑的一道'
  return null
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
      transition={{ duration: grabbing ? CLAW_TIMING.carry / 1000 : 0.5, ease: EASE }}
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

/* 一个菜品圆盘（堆里 / 被夹的都用它）。memo：slots 数组每次变化时，未换的盘不再重算图片/emoji */
const Plate = memo(function Plate({ dish, size, grabbing, dim }) {
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
})

export default function ClawMachine({
  pool = [], onCatch, onUndo, onOpen, onActiveChange,
  showClock = true, title = '抓娃娃点餐机', note = '今日主推 · 点菜盘直接抓它，拖一下瞄准也行',
}) {
  const reduced = usePrefersReducedMotion()
  const [slots, setSlots] = useState(() => buildInitialSlots(pool, N))
  const [activeDish, setActiveDish] = useState(() => buildInitialSlots(pool, N).find(Boolean) || null)
  const [phase, setPhase] = useState('idle')
  const [slipping, setSlipping] = useState(false)    // 必中悬念：正在演"往下滑又晃回"
  const [grabIdx, setGrabIdx] = useState(-1)         // 抓取中的槽位
  const [frozen, setFrozen] = useState(null)         // 抓取中锁定的菜
  const [label, setLabel] = useState(null)
  const [grabCount, setGrabCount] = useState(0)
  const [buddyFly, setBuddyFly] = useState(null)     // 虚惊"带出"的 A 层菜：从原槽飞向出菜口的淡出元素
  const grabbing = phase !== 'idle'
  const caseRef = useRef(null)
  const timersRef = useRef([])
  const buddyRef = useRef(null)                      // 本轮虚惊"顺手带出的 A 层菜"
  const slotsRef = useRef(slots)                     // finalize 读最新堆（避免 setState updater 里做副作用）
  const grabbingRef = useRef(false)                  // 补货 tick 判断：抓取/拖拽中跳过
  const aimIdxRef = useRef(-1)                        // 补货 tick 判断：跳过当前瞄准那一格
  const shakeControls = useAnimationControls()

  const clearTimeline = useCallback(() => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }, [])
  useEffect(() => () => clearTimeline(), [clearTimeline])

  // pool 首次到达（数据加载完）且堆还空 → 加权填充
  useEffect(() => {
    if (!pool || !pool.length) return
    setSlots(prev => (prev.some(Boolean) ? prev : buildInitialSlots(pool, N)))
    setActiveDish(prev => prev || buildInitialSlots(pool, N).find(Boolean) || null)
  }, [pool])

  // activeDish 同步给父级（分享卡 / 跳详情用）
  useEffect(() => { onActiveChange?.(activeDish) }, [activeDish, onActiveChange])

  // 现实娃娃机：闲置补货逻辑见下方 useClawAim 之后（需读取 dragging/aimIdx，故后置定义）

  // 落袋结算（release 相位触发）：补货被抓槽 + 撤销浮标 + 落槽演出 + 虚惊"带出"补进车
  const finalizeCatch = useCallback((target, idx) => {
    const buddy = buddyRef.current
    buddyRef.current = null
    const next = [...slotsRef.current]
    if (idx >= 0) next[idx] = refillOne(pool, next)
    let fly = null
    if (buddy) {
      const bi = next.findIndex((d) => d && d.id === buddy.id)
      if (bi >= 0) {
        const withoutBuddy = next.map((d, k) => (k === bi ? null : d))
        next[bi] = refillOne(pool, withoutBuddy)   // 带出的那盘从堆里消失、补上新的
        fly = { dish: buddy, fromIdx: bi, key: Date.now() }
      }
    }
    setSlots(next)
    if (buddy) onCatch?.(buddy)   // 带出的 A 层菜走同样的乐观加购语义，可撤销
    const mainMsg = blessingOf(target) || `抓到「${target.name}」`
    // 修 P1：整轮抓到的菜（主抓+带出）都记进 label.dishes，撤销逐笔减，「可撤销」不再只对一半
    setLabel({ name: target.name, dish: target, dishes: buddy ? [target, buddy] : [target], key: Date.now(), msg: mainMsg, sub: buddy ? '虚惊一场，旁边这盘也一起给你了～' : null })
    if (fly) setBuddyFly(fly)
    shakeControls.start({ x: [0, -4, 4, -3, 3, 0], transition: { duration: 0.4, ease: EASE } })
  }, [pool, onCatch, shakeControls])

  // 按 buildTimeline 产出的相位计划调度一次抓取（可被下一次/卸载整体 cancel）
  const playGrab = useCallback((idx, target, feint) => {
    clearTimeline()
    const tl = buildTimeline({ feint })
    let releaseTimer = null
    for (const ev of tl) {
      const id = setTimeout(() => {
        if (ev.type === 'phase') setPhase(ev.phase)
        else if (ev.type === 'slipOn') setSlipping(true)
        else if (ev.type === 'slipOff') setSlipping(false)
        else if (ev.type === 'end') { setPhase('idle'); setGrabIdx(-1); setFrozen(null); setSlipping(false) }
      }, ev.at)
      timersRef.current.push(id)
      if (ev.type === 'phase' && ev.phase === 'release') {
        releaseTimer = setTimeout(() => finalizeCatch(target, idx), ev.at)
        timersRef.current.push(releaseTimer)
      }
    }
  }, [clearTimeline, finalizeCatch])

  const runGrab = useCallback((idxArg) => {
    if (grabbing) return
    // 批4 修 P1：随机位只在非空槽里抽——原 Math.random()*N 可能砸中空槽后静默 return，
    // 池小或补货不及时的瞬间点「领取」会出现"按了没反应"。
    // 有瞄准（拖拽/键盘）则抓那一格，否则随机（兼容 reduced / 领取键）
    let idx = (typeof idxArg === 'number' && idxArg >= 0) ? idxArg : -1
    if (idx < 0) {
      const occupied = []
      for (let i = 0; i < N; i++) if (slots[i]) occupied.push(i)
      if (!occupied.length) return            // 整堆全空：无事可抓（理论上补货会很快填满）
      idx = occupied[Math.floor(Math.random() * occupied.length)]
    }
    const target = slots[idx]
    if (!target) return
    // 约三成演虚惊（浓度 B）。修 P1：动画可关、奖励不关——reduced 也照常「带出」，只是不演滑落
    const feint = decideFeint(Math.random)
    buddyRef.current = (feint && pickBuddyA(slots, idx)) || null
    clearTimeline()
    setBuddyFly(null)
    setGrabIdx(idx)
    setFrozen(target)
    setGrabCount(c => c + 1)
    setSlipping(false)
    onCatch?.(target)   // 起手乐观加购（防动画中途卸载丢失，M-s7）
    setActiveDish(target)
    if (reduced) {
      const buddy = buddyRef.current; buddyRef.current = null
      setSlots(prev => {
        const n = [...prev]; if (idx >= 0) n[idx] = refillOne(pool, n)
        if (buddy) {
          const bi = n.findIndex((d) => d && d.id === buddy.id)
          if (bi >= 0) { const wo = n.map((d, k) => (k === bi ? null : d)); n[bi] = refillOne(pool, wo) }
        }
        return n
      })
      if (buddy) onCatch?.(buddy)
      const mainMsg = blessingOf(target) || `抓到「${target.name}」`
      setLabel({ name: target.name, dish: target, dishes: buddy ? [target, buddy] : [target], key: Date.now(), msg: mainMsg, sub: buddy ? '虚惊一场，旁边这盘也一起给你了～' : null })
      setGrabIdx(-1); setFrozen(null)
      return
    }
    playGrab(idx, target, feint)
  }, [grabbing, slots, reduced, onCatch, pool, clearTimeline, playGrab])

  const undoCatch = (dish) => { onUndo?.(dish) }

  // 拖拽瞄准：setPointerCapture 版（抬手即下爪抓瞄准那一格）
  const aim = useClawAim({ caseRef, slots, layout: PILE_SLOTS, disabled: grabbing || reduced, onDrop: runGrab })
  const aimIdx = aim.aimIdx

  // 最新堆同步给 finalizeCatch 读（避免在 setState updater 里触发飞行/加购等副作用）
  useEffect(() => { slotsRef.current = slots }, [slots])
  // 抓取中 / 拖拽中 → 冻结闲置补货；记下当前瞄准格
  useEffect(() => { grabbingRef.current = grabbing || aim.dragging }, [grabbing, aim.dragging])
  useEffect(() => { aimIdxRef.current = aimIdx }, [aimIdx])

  // 现实娃娃机：闲置时每隔几秒按权重补货刷新一个槽（爪子不自动抓）；reduced 不刷
  useEffect(() => {
    if (reduced || !pool.length) return undefined
    const t = setInterval(() => {
      if (grabbingRef.current) return                 // 拖拽/抓取中完全暂停补货
      setSlots(prev => {
        const cands = []
        for (let i = 0; i < N; i++) if (i !== aimIdxRef.current) cands.push(i)  // 不刷新用户正瞄准那一格
        if (!cands.length) return prev
        const idx = cands[Math.floor(Math.random() * cands.length)]
        const nd = refillOne(pool, prev)
        if (!nd) return prev
        const next = [...prev]; next[idx] = nd
        return next
      })
    }, 4500)
    return () => clearInterval(t)
  }, [pool, reduced])

  /* 几何 */
  const targetSpot = grabIdx >= 0 ? PILE_SLOTS[grabIdx] : (aimIdx >= 0 ? PILE_SLOTS[aimIdx] : null)
  // 下探深度按被抓槽位动态算：让爪尖（绝对 Y≈57+cable）够到盘子顶再 +10px 咬合，
  // 消除旧版固定 cableDown=112（爪尖停在≈169）对 y=200~240 的盘子「隔空取物」。上限收在 200 防戳出罩底。
  const dropCable = targetSpot
    ? Math.min(Math.max(targetSpot.y - 47, GEO.cableUp), 200)
    : GEO.cableDown
  const cable = (phase === 'drop' || phase === 'close') ? dropCable : GEO.cableUp
  const jawOpen = !['close', 'lift', 'carry'].includes(phase)
  const held = ['close', 'lift', 'carry'].includes(phase)
  // release 与 settle 都属「已释放/落槽」侧：盘锁终态隐藏、钩子留在出菜口，避免 settle 帧重算回槽位造成回弹
  const falling = phase === 'release' || phase === 'settle'
  // 爪子：carry/release/settle 移到出菜口，否则对准被抓槽位（drop 前也滑到该槽上方）
  const carX = ['carry', 'release', 'settle'].includes(phase) ? GEO.chuteX : (targetSpot ? targetSpot.x : '50%')
  // 被夹盘：drop/close 留在原槽位（等钳子咬合）、lift/carry 随爪升起、release/settle 落槽下坠
  const grabX = ['carry', 'release', 'settle'].includes(phase) ? GEO.chuteX : (targetSpot ? targetSpot.x : '50%')
  const grabY = (phase === 'drop' || phase === 'close')
    ? (targetSpot ? targetSpot.y : GEO.pileTop)
    : falling ? GEO.slotTop
    : clawTop(cable) + 16 + (phase === 'carry' && slipping ? 14 : 0)   // 虚惊：carry 尾段盘子往下滑 14px 又晃回
  const jig = !reduced && (phase === 'drop' || phase === 'close')
  const burstOn = (phase === 'close' || phase === 'lift')
  const confettiOn = falling

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

        {/* 玻璃罩：可交互抓取舞台（拖拽瞄准 + 抬手落爪；reduced 退回点按直抓） */}
        <div className="relative mx-3">
          <motion.div
            ref={caseRef}
            className="claw-case relative overflow-hidden cursor-pointer"
            style={{ height: 264, border: '2px solid var(--color-line)', borderRadius: 'var(--radius-tile)' }}
            animate={shakeControls}
            {...(reduced
              ? { onClick: () => runGrab(-1) }
              : aim.handlers)}
            role="group" tabIndex={0}
            onKeyDown={(e) => {
              if (reduced) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runGrab(-1) } return }
              if (e.key === 'ArrowLeft') { e.preventDefault(); aim.shiftAim(-1) }
              else if (e.key === 'ArrowRight') { e.preventDefault(); aim.shiftAim(1) }
              else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runGrab(aimIdx) }
            }}
            aria-label={reduced
              ? '抓娃娃点餐机。点某个菜盘抓它，或Tab到下方「领取」按钮随机抓一个'
              : '抓娃娃点餐机。点菜盘直接抓对应那道；也可按住横向拖动瞄准、松手下爪；键盘左右方向键移格、空格下爪'}
          >
            {/* 瞄准播报（屏幕阅读器）：切换格子时朗读当前瞄准菜名 */}
            {!reduced && <span className="sr-only" aria-live="polite">{aim.aimLabel}</span>}
            {/* 顶部轨道 */}
            <div className="absolute" style={{ left: 12, right: 12, top: GEO.railY + 4, height: 5, borderRadius: 999, background: 'color-mix(in srgb, var(--clay-deep) 45%, transparent)' }} />
            {/* 罩内彩点 */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '9%', top: '28%', background: 'var(--color-clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '10%', top: '20%', background: 'var(--sage-30)' }} />

            {/* 出菜口（落槽） */}
            <div className="absolute" style={{ left: GEO.chuteX, bottom: 8, transform: 'translateX(-50%)', width: 74, height: 26, borderRadius: '0 0 12px 12px', background: 'var(--color-ink-800)', border: '2px solid var(--color-line)', borderTop: 'none' }}>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-ash)', letterSpacing: '0.1em' }}>出菜口</span>
            </div>

            {/* 底部菜堆：8 个槽位。每盘是可点按钮——点它即抓那道菜（stopPropagation 让点盘不触发拖拽瞄准） */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {slots.map((p, i) => {
                if (!p) return null
                if (grabbing && i === grabIdx) return null   // 被夹走的不留在堆里
                const lay = PILE_SLOTS[i]
                const amp = 5 + (i % 3) * 3
                const isAim = !reduced && aimIdx === i && !grabbing
                return (
                  <button
                    type="button"
                    key={i}
                    disabled={grabbing}
                    aria-label={`抓取「${p.name}」`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); runGrab(i) }}
                    className="absolute cursor-pointer disabled:cursor-default"
                    style={{ left: lay.x, top: lay.y, transform: `translateX(-50%) rotate(${lay.r}deg)`, padding: 0, border: 'none', background: 'transparent', touchAction: 'none' }}
                  >
                    <motion.div
                      animate={jig ? { y: [0, -amp, 0] } : { y: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      style={{ position: 'relative' }}
                    >
                      {isAim && (
                        <span aria-hidden className="absolute inset-0 rounded-full"
                          style={{ border: '2px solid var(--color-clay)', boxShadow: 'var(--shadow-glow-clay)', transform: 'scale(1.14)' }} />
                      )}
                      <Plate dish={p} size={lay.s} dim />
                    </motion.div>
                  </button>
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
                      ? { x: '-50%', left: GEO.chuteX, top: GEO.slotTop, opacity: 0, rotate: [0, -18, 14, 0], transition: { duration: CLAW_TIMING.release / 1000, ease: [0.5, 0, 0.9, 0.6] } }
                      : { x: '-50%', left: grabX, top: grabY, opacity: 1, scale: slipping ? 0.95 : 1, rotate: slipping ? -10 : (held ? [0, -4, 4, 0] : 0), transition: { duration: 0.4, ease: EASE } }
                  }
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                >
                  <Plate dish={frozen} size={72} grabbing />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 虚惊"带出"的 A 层菜：从原槽飞向出菜口淡出，让"这盘也给你了"在画面里被确认 */}
            <AnimatePresence>
              {buddyFly && !reduced && (
                <motion.div
                  key={`buddyfly-${buddyFly.key}`}
                  className="absolute z-[15] pointer-events-none"
                  style={{ left: PILE_SLOTS[buddyFly.fromIdx].x, top: PILE_SLOTS[buddyFly.fromIdx].y }}
                  initial={{ x: '-50%', opacity: 1, scale: 1 }}
                  animate={{ left: GEO.chuteX, top: GEO.slotTop, x: '-50%', opacity: 0, scale: 0.5, rotate: 12, transition: { duration: 0.55, ease: EASE } }}
                  exit={{ opacity: 0 }}
                  onAnimationComplete={() => setBuddyFly(null)}
                >
                  <Plate dish={buddyFly.dish} size={44} grabbing />
                </motion.div>
              )}
            </AnimatePresence>

            {/* 合钳星芒（由 phase+grabCount 派生，一次抓一轮） */}
            <AnimatePresence>
              {burstOn && !reduced && targetSpot && (
                <motion.div key={`burst-${grabCount}`} className="absolute z-30 pointer-events-none" style={{ left: targetSpot.x, top: targetSpot.y + targetSpot.s / 2, transform: 'translateX(-50%)' }}>
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
              {confettiOn && !reduced && (
                <motion.div key={`confetti-${grabCount}`} className="absolute z-30 pointer-events-none" style={{ left: GEO.chuteX, top: GEO.slotTop - 30, transform: 'translateX(-50%)' }}>
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
                style={{ left: GEO.chuteX, top: GEO.slotTop - (label.sub ? 72 : 52) }}
                initial={{ x: '-50%', opacity: 0, y: 8, scale: 0.9 }}
                animate={{ x: '-50%', opacity: 1, y: -8, scale: 1 }}
                exit={{ x: '-50%', opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                onAnimationComplete={() => setTimeout(() => setLabel((l) => (l && l.key === label.key ? null : l)), CLAW_TIMING.labelHold)}>
                <div role="status" aria-live="polite" className="inline-flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full whitespace-nowrap min-h-[44px]"
                  style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)', boxShadow: 'var(--shadow-3)' }}>
                  <span className="inline-flex flex-col justify-center leading-tight">
                    <span className="inline-flex items-center gap-1 font-bold text-xs">
                      <KissIcon className="w-3.5 h-3.5" /> {label.msg || `抓到「${label.name}」`}
                    </span>
                    {label.sub && <span className="text-[10px] font-medium opacity-90 pl-[18px]">{label.sub}</span>}
                  </span>
                  {onUndo && label.dish && (
                    <button type="button" aria-label={label.dishes && label.dishes.length > 1 ? `撤销加入的「${label.name}」等 ${label.dishes.length} 道菜` : `撤销加入的「${label.name}」`}
                      onClick={(e) => { e.stopPropagation(); const ds = label.dishes || [label.dish]; setLabel(null); ds.forEach((d) => undoCatch(d)) }}
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

        {/* 出菜面板：显示上一个抓到的菜（菜名点看做法 + 价格 + 抓取按钮） */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>{grabCount === 0 ? note : '上一个抓到的'}</p>
            <button onClick={onOpen} disabled={!activeDish} className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5 max-w-full min-h-[44px] text-left" style={{ textUnderlineOffset: 3 }}>
              {activeDish ? activeDish.name : '拖一下瞄准 · 松手下爪'}
            </button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-1">
              <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[var(--color-love)]" />
              <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums" style={{ fontSize: '2rem', lineHeight: 1 }}>
                <span className="text-[0.55em] mr-0.5">¥</span>{activeDish ? activeDish.price : '—'}
              </span>
            </div>
            <motion.button whileTap={{ scale: 0.93 }} onClick={(e) => { e.stopPropagation(); runGrab(-1) }} disabled={grabbing}
              aria-label="随机领取一道" className="font-serif text-sm font-bold px-4 py-2.5 rounded-full inline-flex items-center justify-center min-h-[44px]"
              style={{ background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-clay) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)', opacity: grabbing ? 0.6 : 1 }}>
              {grabbing ? '抓取中…' : '领取'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
