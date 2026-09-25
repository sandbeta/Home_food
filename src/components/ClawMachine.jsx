import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion'
import KissIcon from './KissIcon'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'
import { buildInitialSlots, refillOne, pickBuddyA, buildTimeline, decideOutcome, aimSlotIdx, CLAW_TIMING } from '../lib/clawPool'
import { useClawAim } from '../hooks/useClawAim'
import { motor, clank, chuteThud, winJingle, vibrate } from '../lib/sfx'

// ============================================================
// 抓娃娃点餐机（V6 · 拟真包，2026-09-25）
// ------------------------------------------------------------
// 承 V5 骨架（智能三层池 / 拖拽瞄准 / 点盘直抓 / 落袋即加购 / 可撤销 / 必中悬念），
// V6 按"复刻现实的过程张力、保留必赢的结局"补六件事：
//   ① 音效四件套：电机嗡嗡(drop/lift)→合爪咔哒(clank)→落盘哐当(chute)→中奖神曲(win)，
//      由 buildTimeline 的 sfx 事件在相位起点触发（sfx.js 统一开关与静默降级）；
//   ② 落槽终拍：release/settle 之后新增 chute 相位——出菜口挡板弹开、盘子掉进取物口；
//   ③ 物理感：小车行进时爪钩钟摆摆动（CSS .claw-swing）、下爪过冲 8px 再回弹咬合、
//      平移途中掠过菜堆——途经的盘子被碰歪抖一下（jostle）；
//   ④ 巡游模式：小车自动往复（真机的"时机"考验），点罩/空格在当前位置停爪下探；
//      拖拽瞄准保留为简单模式，头部小开关切换，reduced 下整个开关不出现；
//   ⑤ pity 保底演出：约 18% 概率演"滑脱→全场静止→第二爪抱死"（decideOutcome）；
//      连续 2 次滑脱第 3 抓必 pityWin（必带出一盘赔礼）。购物车起手已加购——
//      滑脱只消耗时间，从不消耗食物，这是与现实娃娃机最大的分野；
//   ⑥ 氛围：玻璃罩缓慢移动高光带（CSS .claw-case::after）、出菜旁今晚战利品小盘堆。
// 纪律不变：颜色全 var() 令牌；外层无 transform；CartContext/mockApi/favorites 只消费；
//   reduced-motion 不演巡游/滑脱/虚惊/音效编排外的动画（CSS 动画由全局 reduced 块停）。
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

/** 三指爪钩。swing=行进中挂钟摆类（缆线顶端为轴心）；carDur=小车横移动画秒数（巡游停爪时短距对位） */
function Claw({ open, x, cable, grabbing, swing = false, carDur }) {
  const jawRot = open ? 26 : 4
  return (
    <motion.div
      className="absolute z-20 pointer-events-none"
      style={{ left: x, top: GEO.railY, transform: 'translateX(-50%)' }}
      animate={{ left: x }}
      transition={{ duration: carDur != null ? carDur : (grabbing ? CLAW_TIMING.carry / 1000 : 0.5), ease: EASE }}
    >
      <div style={{ width: 26, height: GEO.carH, borderRadius: 6, background: 'var(--color-clay)', border: '2px solid var(--clay-deep)', margin: '0 auto', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4)' }} />
      {/* 钟摆：缆线+爪整体以挂点为轴小幅晃（CSS 关键帧，全局 reduced 块自动停摆） */}
      <div className={swing ? 'claw-swing' : undefined} style={{ transformOrigin: '50% 0' }}>
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
      </div>
    </motion.div>
  )
}

/* 一个菜品圆盘（堆里 / 被夹的都用它）。memo：slots 数组每次变化时，未换的盘不再重算图片/emoji */
const Plate = memo(function Plate({ dish, size, grabbing, dim }) {
  if (!dish) return null
  // 圆盘只有 44~72px（见 PLATES / <Plate size>），thumb 档足够，不需要 w800
  const img = getDishImage(dish)
  return (
    <div className="relative flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size, borderRadius: '50%', background: 'var(--plate-bg)',
        border: `2px solid ${grabbing ? 'var(--clay-deep)' : 'var(--color-clay-soft)'}`,
        boxShadow: grabbing ? 'var(--shadow-glow-clay)' : '0 3px 8px rgba(43,36,41,0.10), inset 0 1px 0 rgba(255,255,255,0.5)',
        opacity: dim ? 0.9 : 1 }}>
      <span style={{ fontSize: size * 0.5, filter: 'var(--tile-img-filter)' }} aria-hidden>{getCategoryEmoji(dish.category)}</span>
      {img && <img src={img} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />}
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
  const [cruise, setCruise] = useState(false)        // 批6 · 巡游模式（真机时机考验），reduced 下不可开
  const [cruiseX, setCruiseX] = useState(59)         // 巡游小车当前位置（%），50ms tick 三角波
  const [jostle, setJostle] = useState([])           // 被爪子平移掠碰的槽位下标（抖一下）
  const [trophies, setTrophies] = useState([])       // 今晚战利品（最近 6 道，出菜面板下小盘堆）
  const [bigWin, setBigWin] = useState(false)        // pityWin 加强庆祝（双倍彩纸）
  const grabbing = phase !== 'idle'
  const caseRef = useRef(null)
  const timersRef = useRef([])
  const buddyRef = useRef(null)                      // 本轮虚惊"顺手带出的 A 层菜"
  const slotsRef = useRef(slots)                     // finalize 读最新堆（避免 setState updater 里做副作用）
  const grabbingRef = useRef(false)                  // 补货 tick 判断：抓取/拖拽中跳过
  const aimIdxRef = useRef(-1)                        // 补货 tick 判断：跳过当前瞄准那一格
  const slipStreakRef = useRef(0)                     // 批6 · 连续滑脱计数（pity 保底：2 次后第 3 抓必大团圆）
  const outcomeRef = useRef('normal')                 // 本抓结局（finalize 写文案用）
  const cruiseT0Ref = useRef(0)
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
    const oc = outcomeRef.current
    const mainMsg = blessingOf(target) || `抓到「${target.name}」`
    // 结局副文案：feint=虚惊带出 / slip=追回落袋 / pityWin=连败赔礼
    let sub = null
    if (oc === 'slip') sub = '跑掉的东西，它自己追回来了'
    else if (oc === 'pityWin') sub = buddy ? '连着没成，这回它多赔了你一盘～' : '连着没成，这盘抱得特别死'
    else if (buddy) sub = '虚惊一场，旁边这盘也一起给你了～'
    // 修 P1：整轮抓到的菜（主抓+带出）都记进 label.dishes，撤销逐笔减，「可撤销」不再只对一半
    setLabel({ name: target.name, dish: target, dishes: buddy ? [target, buddy] : [target], key: Date.now(), msg: mainMsg, sub })
    if (fly) setBuddyFly(fly)
    setTrophies((t) => [...t, target].slice(-6))   // 批6 · 战利品堆（最近 6 道）
    if (oc === 'pityWin') setBigWin(true)
    shakeControls.start({ x: [0, -4, 4, -3, 3, 0], transition: { duration: 0.4, ease: EASE } })
  }, [pool, onCatch, shakeControls])

  // 按 buildTimeline 产出的相位计划调度一次抓取（可被下一次/卸载整体 cancel）
  const playGrab = useCallback((idx, target) => {
    clearTimeline()
    const tl = buildTimeline({ outcome: outcomeRef.current })
    for (const ev of tl) {
      const id = setTimeout(() => {
        if (ev.type === 'phase') setPhase(ev.phase)
        else if (ev.type === 'slipOn') setSlipping(true)
        else if (ev.type === 'slipOff') setSlipping(false)
        else if (ev.type === 'sfx') {
          // 音效编排：电机→合爪咔哒→落槽哐当→中奖神曲（sfx.js 内统一开关/静默降级）
          if (ev.name === 'motor') motor(ev.d || 380)
          else if (ev.name === 'clank') { clank(); vibrate(12) }
          else if (ev.name === 'chute') { chuteThud(); vibrate([12, 40, 18]) }
          else if (ev.name === 'win') winJingle()
        } else if (ev.type === 'end') { setPhase('idle'); setGrabIdx(-1); setFrozen(null); setSlipping(false); setBigWin(false) }
      }, ev.at)
      timersRef.current.push(id)
      if (ev.type === 'phase' && ev.phase === 'release') {
        timersRef.current.push(setTimeout(() => finalizeCatch(target, idx), ev.at))
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
    // 批6 · 结局判定：约 18% 滑脱演出、30% 虚惊、其余干脆利落；连续 2 滑脱第 3 抓必 pityWin。
    // reduced：不演滑脱（坠回重抓的过程动画），奖励语义保留（pityWin 仍带出赔礼盘）。
    let outcome = decideOutcome(Math.random, slipStreakRef.current)
    if (reduced && outcome === 'slip') outcome = 'normal'
    outcomeRef.current = outcome
    slipStreakRef.current = outcome === 'slip' ? slipStreakRef.current + 1 : 0
    const feint = outcome === 'feint'
    // 修 P1：动画可关、奖励不关——虚惊/pityWin 都带出一盘 A 层菜（reduced 只结算不演出）
    buddyRef.current = ((feint || outcome === 'pityWin') && pickBuddyA(slots, idx)) || null
    clearTimeline()
    setBuddyFly(null)
    setGrabIdx(idx)
    setFrozen(target)
    setGrabCount(c => c + 1)
    setSlipping(false)
    onCatch?.(target)   // 起手乐观加购（防动画中途卸载丢失，M-s7）——滑脱演出从不撤回这层语义
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
      setTrophies((t) => [...t, target].slice(-6))
      setGrabIdx(-1); setFrozen(null)
      return
    }
    playGrab(idx, target)
  }, [grabbing, slots, reduced, onCatch, pool, clearTimeline, playGrab])

  // 巡游模式：小车 30%↔88% 三角波往复（周期 6.8s），抓取中冻结；reduced/关巡游即停
  useEffect(() => {
    if (!cruise || reduced) return undefined
    cruiseT0Ref.current = performance.now()
    const iv = setInterval(() => {
      if (grabbingRef.current) return
      const p = (((performance.now() - cruiseT0Ref.current) % 6800) / 6800)
      const tri = p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4
      setCruiseX(59 + 29 * tri)
    }, 50)
    return () => clearInterval(iv)
  }, [cruise, reduced])

  // 巡游中落爪：停在哪个位置就抓最近的有菜槽（真机的"时机"考验）
  const dropCruise = useCallback(() => {
    runGrab(aimSlotIdx(cruiseX, PILE_SLOTS, slots))
  }, [cruiseX, slots, runGrab])

  // 掠碰：爪子平移（去出菜口）途经的盘子被带歪抖一下
  useEffect(() => {
    if (phase !== 'carry' && phase !== 'carry2') return undefined
    if (grabIdx < 0) return undefined
    const from = parseFloat(PILE_SLOTS[grabIdx].x)
    const to = parseFloat(GEO.chuteX)
    const lo = Math.min(from, to); const hi = Math.max(from, to)
    const hit = PILE_SLOTS.map((s, i) => i).filter((i) => i !== grabIdx && slotsRef.current[i] && parseFloat(PILE_SLOTS[i].x) > lo && parseFloat(PILE_SLOTS[i].x) < hi)
    if (!hit.length) return undefined
    setJostle(hit)
    const t = setTimeout(() => setJostle([]), 700)
    return () => clearTimeout(t)
  }, [phase, grabIdx])

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
  // 批6 相位集合：drop2/close2/lift2/carry2 = 滑脱后的第二爪（几何语义与一爪同名相位一致）
  const dropish = phase === 'drop' || phase === 'drop2'
  const closeish = phase === 'close' || phase === 'close2'
  const carryish = phase === 'carry' || phase === 'carry2'
  const slipBack = phase === 'slip' || phase === 'slipHold'   // 盘子已脱手坠回菜堆（爪空着）
  // 咬合过冲：下爪探到底再砸深 8px，close 时回弹——"重量感"来自这 8px
  const cable = dropish ? dropCable + 8 : closeish ? dropCable : GEO.cableUp
  const jawOpen = !(closeish || phase === 'lift' || phase === 'lift2' || carryish) || slipBack
  const held = closeish || phase === 'lift' || phase === 'lift2' || carryish
  // release 起属「已释放/落槽」侧：盘锁终态隐藏、钩子留在出菜口，避免重算回槽位造成回弹
  const falling = phase === 'release' || phase === 'settle' || phase === 'chute'
  // 爪子：平移/落槽/终拍在去出菜口的路上；待机时巡游模式跟巡游位、否则对准瞄准槽
  const carX = (carryish || falling) ? GEO.chuteX
    : targetSpot ? targetSpot.x
    : (cruise && !reduced) ? `${cruiseX}%` : '50%'
  // 被夹盘：drop/close 留在原槽位（等钳子咬合）、lift/carry 随爪升起、slip 坠回原槽、release 起落槽下坠
  const grabX = (carryish || falling) ? GEO.chuteX : (targetSpot ? targetSpot.x : '50%')
  const grabY = slipBack
    ? (targetSpot ? targetSpot.y + 10 : GEO.pileTop)
    : (dropish || closeish)
    ? (targetSpot ? targetSpot.y : GEO.pileTop)
    : falling ? (phase === 'chute' ? GEO.slotTop + 16 : GEO.slotTop)
    : clawTop(cable) + 16 + (carryish && slipping ? 14 : 0)   // 虚惊：carry 尾段盘子往下滑 14px 又晃回
  const jig = !reduced && (dropish || closeish)
  const burstOn = closeish || phase === 'lift' || phase === 'lift2'
  const confettiOn = falling
  const chuteOpen = falling   // 挡板：release 起弹开，chute 终拍后随 idle 闭合

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
              {!reduced && (
                <button type="button" onClick={() => setCruise(c => !c)} aria-pressed={cruise}
                  className="shrink-0 inline-flex items-center justify-center h-11 px-2 -mx-1"
                  aria-label={cruise ? '关闭巡游模式' : '开启巡游模式：小车自动移动，看准时机下爪'}>
                  <span aria-hidden className="inline-flex items-center justify-center px-2 h-[22px] rounded-full text-[11px] font-bold"
                    style={cruise
                      ? { background: 'var(--color-clay)', color: 'var(--color-on-dark)', border: '2px solid var(--clay-deep)' }
                      : { background: 'transparent', color: 'var(--color-ash)', border: '2px solid var(--color-line)' }}>
                    巡游
                  </span>
                </button>
              )}
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
              : cruise
                ? { onClick: dropCruise }
                : aim.handlers)}
            role="group" tabIndex={0}
            onKeyDown={(e) => {
              if (reduced) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runGrab(-1) } return }
              if (e.key === 'ArrowLeft') { e.preventDefault(); if (!cruise) aim.shiftAim(-1) }
              else if (e.key === 'ArrowRight') { e.preventDefault(); if (!cruise) aim.shiftAim(1) }
              else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cruise) dropCruise(); else runGrab(aimIdx) }
            }}
            aria-label={reduced
              ? '抓娃娃点餐机。点某个菜盘抓它，或Tab到下方「领取」按钮随机抓一个'
              : cruise
                ? '抓娃娃点餐机，巡游模式：小车自动往复，点一下罩面或空格在当前位置下爪，抓最近的菜盘'
                : '抓娃娃点餐机。点菜盘直接抓对应那道；也可按住横向拖动瞄准、松手下爪；键盘左右方向键移格、空格下爪'}
          >
            {/* 瞄准播报（屏幕阅读器）：切换格子时朗读当前瞄准菜名 */}
            {!reduced && <span className="sr-only" aria-live="polite">{aim.aimLabel}</span>}
            {/* 顶部轨道 */}
            <div className="absolute" style={{ left: 12, right: 12, top: GEO.railY + 4, height: 5, borderRadius: 999, background: 'color-mix(in srgb, var(--clay-deep) 45%, transparent)' }} />
            {/* 罩内彩点 */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '9%', top: '28%', background: 'var(--color-clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '10%', top: '20%', background: 'var(--sage-30)' }} />

            {/* 出菜口（落槽）+ 批6 挡板：落袋相位弹开、收口闭合（transform 只在挡板自身，安全） */}
            <div className="absolute" style={{ left: GEO.chuteX, bottom: 8, transform: 'translateX(-50%)', width: 74, height: 26, borderRadius: '0 0 12px 12px', background: 'var(--color-ink-800)', border: '2px solid var(--color-line)', borderTop: 'none', perspective: 140 }}>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--color-ash)', letterSpacing: '0.1em' }}>出菜口</span>
              <span aria-hidden className="claw-flap" data-open={chuteOpen && !reduced ? '1' : '0'} />
            </div>

            {/* 底部菜堆：8 个槽位。每盘是可点按钮——点它即抓那道菜（stopPropagation 让点盘不触发拖拽瞄准） */}
            <div style={{ position: 'absolute', inset: 0 }}>
              {slots.map((p, i) => {
                if (!p) return null
                if (grabbing && i === grabIdx) return null   // 被夹走的不留在堆里
                const lay = PILE_SLOTS[i]
                const amp = 5 + (i % 3) * 3
                const isAim = !reduced && aimIdx === i && !grabbing
                const jostled = jostle.includes(i)   // 批6：爪子平移掠碰——带歪抖一下
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
                      animate={jostled ? { rotate: [0, 10, -7, 2, 0], y: [0, -5, 2, 0] } : jig ? { y: [0, -amp, 0] } : { y: 0 }}
                      transition={jostled ? { duration: 0.55, ease: 'easeOut' } : { duration: 0.45, ease: 'easeOut' }}
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

            {/* 爪钩机构（行进中挂钟摆：巡游待机也摆，因为小车一直在动） */}
            <Claw open={jawOpen} x={carX} cable={cable} grabbing={grabbing}
              swing={!reduced && (carryish || (cruise && !grabbing))} />

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
                      ? { x: '-50%', left: GEO.chuteX, top: grabY, opacity: phase === 'chute' ? 0 : 0.9, rotate: [0, -18, 14, 0], transition: { duration: CLAW_TIMING.release / 1000, ease: [0.5, 0, 0.9, 0.6] } }
                      : slipBack
                      ? { x: '-50%', left: grabX, top: grabY, opacity: 1, scale: 1, rotate: [0, 16, -10, 4, 0], transition: { duration: CLAW_TIMING.slip / 1000, ease: [0.45, 0, 0.9, 0.45] } }
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

            {/* 落槽彩纸（pityWin 大团圆加倍） */}
            <AnimatePresence>
              {confettiOn && !reduced && (
                <motion.div key={`confetti-${grabCount}`} className="absolute z-30 pointer-events-none" style={{ left: GEO.chuteX, top: GEO.slotTop - 30, transform: 'translateX(-50%)' }}>
                  {Array.from({ length: bigWin ? 14 : 7 }).map((_, k) => (
                    <motion.span key={k} className="absolute block"
                      style={{ width: 6, height: 9, borderRadius: 2, background: ['var(--color-clay)', 'var(--color-love)', 'var(--color-sage)', 'var(--color-caramel)'][k % 4] }}
                      initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                      animate={{ x: (k - (bigWin ? 7 : 3)) * 13, y: [0, -26, 10], opacity: [1, 1, 0], rotate: 240 }}
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

        {/* 出菜面板：显示上一个抓到的菜（菜名点看做法 + 价格 + 抓取按钮）+ 批6 今晚战利品小盘堆 */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>{grabCount === 0 ? note : '上一个抓到的'}</p>
            <button onClick={onOpen} disabled={!activeDish} className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5 max-w-full min-h-[44px] text-left" style={{ textUnderlineOffset: 3 }}>
              {activeDish ? activeDish.name : (cruise && !reduced ? '看准了，按下去爪' : '拖一下瞄准 · 松手下爪')}
            </button>
            {trophies.length > 0 && (
              <div className="flex items-center gap-1 mt-1" role="img" aria-label={`今晚战利品：已抓 ${trophies.length} 道`}>
                <span className="text-[10px] font-bold mr-0.5" style={{ color: 'var(--color-mist)' }}>今晚</span>
                {trophies.map((d, k) => (
                  <span key={`${d.id}-${k}`} aria-hidden className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] shrink-0"
                    style={{ background: 'var(--plate-bg)', border: '1.5px solid var(--color-clay-soft)', opacity: 0.55 + 0.09 * k }}>
                    {getCategoryEmoji(d.category)}
                  </span>
                ))}
              </div>
            )}
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
