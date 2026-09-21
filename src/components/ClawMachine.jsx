import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import KissIcon from './KissIcon'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { EASE, contentEnter, usePrefersReducedMotion } from '../theme/motion'
import { CHARACTER, CLAW_POOL } from '../theme/characters'
import { heroNameFor } from '../lib/vt'

// ============================================================
// 抓娃娃点餐机（V3 设计稿 · 粉色基调落地，2026-09-21）
// ------------------------------------------------------------
// 首页第一焦点：主推菜住进玻璃罩，罩顶吊着官方角色素材轻摆；
// 「换一道」= 提走旧的 → 放下新的（两拍 + 一记落定，≈1.0s）。
// 机顶：羊毛云朵檐 + 机名 + No.xx 编号糖牌 + 泡泡时钟。
// 纪律：
//  - 颜色零硬编码，全部 var() 令牌（单源门禁）
//  - **不画爪钩/横梁/缆线**：素材自带完整抓娃娃场景，叠自绘机构会重影（见 index.css 注）
//  - reduced-motion：素材不摆，换菜退化为淡入
//  - 自动轮换时钟与进度条由 Home 编排，本组件只负责"演"
//  - 外层不带 transform（转场红线），位移全在内层
// ============================================================

/* 抓取节拍（ms）：总时长 ≈0.95s，低频装饰动效，不受 UI 300ms 档约束 */
const BEAT = { lift: 320, land: 400, settle: 200 }

/** 泡泡时钟：实时时间糖牌（实时信息，非文案池内容）；宵夜版 visible=false 不渲染 */
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

/**
 * @param dish      当前主推菜（id 变化即触发抓取演出）
 * @param onGrab    「换一道」回调（Home：手动换 + 重置轮换计时）
 * @param onOpen    点罩进详情（透传 click 事件，供 VT 共享元素形变取卡面）
 * @param indexNo   轮换序号（No.xx 糖牌 + 角色轮换）
 * @param rotate    { key, durationMs } | null —— 自动轮换进度条
 */
export default function ClawMachine({
  dish,
  onGrab,
  onOpen,
  indexNo = 1,
  rotate,
  showClock = true,
  title = '抓娃娃点餐机',
  note = '今日主推 · 抓到一个算一个',
}) {
  const reduced = usePrefersReducedMotion()
  const [shown, setShown] = useState(dish)
  const [phase, setPhase] = useState('idle') // idle | lift | land | settle
  const prevId = useRef(dish?.id)
  const timers = useRef([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    if (!dish) return
    if (dish.id === prevId.current) { setShown(dish); return }
    prevId.current = dish.id
    if (reduced) { setShown(dish); return }
    timers.current.forEach(clearTimeout)
    timers.current = [
      setTimeout(() => setPhase('lift'), 30),
      setTimeout(() => { setShown(dish); setPhase('land') }, 30 + BEAT.lift),
      setTimeout(() => setPhase('settle'), 30 + BEAT.lift + BEAT.land),
      setTimeout(() => setPhase('idle'), 30 + BEAT.lift + BEAT.land + BEAT.settle),
    ]
  }, [dish, reduced])

  if (!shown) return null
  const image = getDishImage(shown)
  const grabbing = phase !== 'idle'
  /* 挂爪角色：随轮换序号轮换官方素材池 */
  const char = CHARACTER[CLAW_POOL[(indexNo - 1) % CLAW_POOL.length]]

  /* 素材位移：提走（升上去淡出）→ 放下（从上方落回，带回弹） */
  const spriteAnim =
    phase === 'lift'
      ? { y: -52, opacity: 0.15, scale: 0.94 }
      : phase === 'land'
        ? { y: 0, opacity: 1, scale: 1 }
        : phase === 'settle'
          ? { y: [0, -8, 0], opacity: 1, scale: 1 }
          : { y: 0, opacity: 1, scale: 1 }
  const spriteDur =
    phase === 'lift' ? BEAT.lift / 1000 : phase === 'land' ? BEAT.land / 1000 : phase === 'settle' ? BEAT.settle / 1000 : 0.24

  return (
    <motion.div {...contentEnter(0.05)}>
      {/* 机身外壳：粉纸大卡 + 深梅粉描边（签名件用 clay-deep，与普通糖果描边区分） */}
      <div
        className="d3-card-face overflow-hidden"
        style={{ boxShadow: 'var(--shadow-4)', border: '2px solid var(--clay-deep)' }}
      >
        {/* 机顶：羊毛云朵檐 + 机名 + No.xx + 泡泡时钟 */}
        <div className="relative">
          <div className="wool-edge" aria-hidden="true" />
          <div
            className="flex items-center justify-between gap-3 px-4 pt-2.5 pb-3"
            style={{ borderBottom: '2px dashed var(--color-line)' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-serif text-xl font-bold text-[var(--color-bone)] truncate">{title}</h2>
              <span
                aria-hidden
                className="shrink-0 inline-flex items-center justify-center px-2 h-[22px] rounded-full font-serif text-[11px] font-bold tabular-nums"
                style={{
                  background: 'var(--clay-10)',
                  color: 'var(--clay-deep)',
                  border: '2px solid color-mix(in srgb, var(--color-clay) 40%, transparent)',
                }}
              >
                No.{String(indexNo).padStart(2, '0')}
              </span>
            </div>
            <BubbleClock visible={showClock} />
          </div>
        </div>

        {/* 玻璃罩：吊挂角色（素材自带横梁+爪钩）+ 主推菜圆盘 */}
        <div className="mx-3">
          <div
            className="claw-case relative h-[264px] overflow-hidden cursor-pointer"
            style={{ border: '2px solid var(--color-line)', borderRadius: 'var(--radius-tile)' }}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onOpen?.() }}
            aria-label={`今日主推：${shown.name}，点击查看做法`}
          >
            {/* 罩内彩点（静态装饰；避开中央吊挂区，贴边分布） */}
            <span aria-hidden className="absolute w-2.5 h-2.5 rounded-full" style={{ left: '7%', top: '26%', background: 'var(--clay-soft)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '8%', top: '18%', background: 'var(--sage-30)' }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ left: '10%', bottom: '30%', background: 'var(--color-love)', opacity: 0.5 }} />
            <span aria-hidden className="absolute w-2 h-2 rounded-full" style={{ right: '12%', bottom: '38%', background: 'var(--sage-30)' }} />

            {/* 吊挂角色：素材整幅（含横梁/缆线/爪钩/被抓的羊），盒顶对齐 → 读作从机顶横梁吊下 */}
            <div className="absolute left-1/2 top-0 z-20 pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
              <motion.img
                src={char.src}
                alt=""
                className={`claw-sprite ${reduced || grabbing ? '' : 'hang-sway'}`}
                initial={false}
                animate={spriteAnim}
                transition={{ duration: spriteDur, ease: EASE }}
              />
            </div>

            {/* 主推菜圆盘：换菜时淡入落位（守动效规范）；vt-dish-frame 供详情形变共享元素 */}
            <div className="absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
              <div
                key={shown.id}
                className="vt-dish-frame relative w-[124px] h-[124px] rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  viewTransitionName: heroNameFor(shown.id),
                  background: 'var(--plate-bg)',
                  border: '2px solid var(--color-clay-soft)',
                  boxShadow: '0 8px 22px rgba(43,36,41,0.12), inset 0 2px 0 rgba(255,255,255,0.6)',
                  opacity: phase === 'lift' ? 0.3 : 1,
                  transform: phase === 'lift' ? 'scale(0.94)' : 'scale(1)',
                  transition: 'opacity 0.26s var(--ease-soft), transform 0.26s var(--ease-soft)',
                }}
              >
                <span className="text-5xl" style={{ filter: 'var(--tile-img-filter)' }}>{getCategoryEmoji(shown.category)}</span>
                {image && (
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 出菜口面板：菜名 + 价格 + 换一道 */}
        <div className="claw-tray flex items-end justify-between gap-3 px-5 pt-3 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold truncate" style={{ letterSpacing: '0.05em', color: 'var(--color-ash)' }}>
              {note}
            </p>
            <p className="font-serif text-2xl font-bold text-[var(--color-bone)] truncate mt-0.5">{shown.name}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-baseline gap-1">
              <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[var(--color-love)]" />
              <span className="font-serif font-bold text-[var(--color-caramel)] tabular-nums" style={{ fontSize: '2rem', lineHeight: 1 }}>
                <span className="text-[0.55em] mr-0.5">¥</span>{shown.price}
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={(e) => { e.stopPropagation(); onGrab?.() }}
              disabled={grabbing}
              aria-label="换一道"
              className="font-serif text-sm font-bold px-4 py-2.5 rounded-full"
              style={{
                background: 'var(--color-clay)',
                color: 'var(--color-on-dark)',
                border: '2px solid var(--clay-deep)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--color-clay) 30%, transparent), inset 0 1px 0 rgba(255,255,255,0.25)',
                opacity: grabbing ? 0.55 : 1,
              }}
            >
              {grabbing ? '抓取中…' : '换一道'}
            </motion.button>
          </div>
        </div>

        {/* 自动轮换进度条：预告下一次抓取（clay 细线） */}
        {rotate && !grabbing && (
          <div className="h-[3px]" style={{ background: 'color-mix(in srgb, var(--clay-deep) 10%, transparent)' }}>
            <div
              key={rotate.key}
              className="h-full rot-progress-bar"
              style={{ background: 'var(--color-clay)', animationDuration: `${rotate.durationMs}ms` }}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
