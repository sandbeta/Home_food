import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import GlassCard from '../GlassCard'
import KissIcon from '../KissIcon'
import { getCategoryEmoji, getDishImage } from '../../lib/categoryIcons'
import { usePrefersReducedMotion } from '../../theme/motion'
import { sfxEnabled, setSfxEnabled, tick, settle, tap, vibrate } from '../../lib/sfx'

// 老虎机节奏：12 档、先快后慢，总时长约 1.5s；低于 1s 来不及看清，高于 2.5s 让人等烦
const SPIN_STEPS = 12
const SHAKE_THRESHOLD = 24   // m/s²，含重力；静置约 9.8，明显甩动才触发
const SHAKE_COOLDOWN = 900   // 一次摇动只算一签

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

/**
 * 手气签 —— 「今日灵感」的升级交互：
 * 点骰子 / 摇一摇手机，老虎机式滚动 12 档后落定一道菜。
 * 只影响"推荐哪道"，不改任何加购语义；reduced-motion 下跳过滚动直接落定。
 * iOS 13+ 的 motion 权限必须在用户手势里申请，因此首次点骰子时顺带申请。
 */
export default function LuckyDishCard({ dishes, onAdd, spawnParticle }) {
  const reduce = usePrefersReducedMotion()
  const [drawing, setDrawing] = useState(false)
  const [soundOn, setSoundOn] = useState(() => sfxEnabled())
  const timerRef = useRef(null)
  const drawRef = useRef(null)
  const [current, setCurrent] = useState(() => (dishes.length ? pickRandom(dishes) : null))

  // 卸载时清掉未走完的滚动，避免对已卸载组件 setState
  useEffect(() => () => clearTimeout(timerRef.current), [])

  // 数据兜底：菜品池变化（后台上/下架）后，若当前推荐已不在池里则重选一道
  useEffect(() => {
    if (dishes.length && !drawing && !dishes.some(d => d.id === current?.id)) {
      setCurrent(pickRandom(dishes))
    }
  }, [dishes, drawing, current])

  const draw = () => {
    if (drawing || dishes.length === 0) return
    const D = window.DeviceMotionEvent
    if (D && typeof D.requestPermission === 'function') {
      D.requestPermission().catch(() => { /* 用户拒绝：按钮抽签仍可用 */ })
    }
    if (reduce) {
      setCurrent(pickRandom(dishes))
      settle(); vibrate(20)
      return
    }
    setDrawing(true)
    vibrate(12)
    let n = 0
    const step = () => {
      n += 1
      setCurrent(pickRandom(dishes))
      tick(n) // 滚动 tick：音高随档位爬升
      if (n < SPIN_STEPS) {
        timerRef.current = setTimeout(step, 65 + n * 11) // 先快后慢，模拟滚轮落定
      } else {
        setDrawing(false)
        settle()  // 落定：清脆三音收尾
        vibrate([10, 40, 18]) // 双段短振，"签出来了"的手感
      }
    }
    step()
  }
  drawRef.current = draw

  // 摇一摇：Android / 桌面 Chrome 直接可用；iOS 需上方手势申请授权
  useEffect(() => {
    let last = 0
    const onMotion = (ev) => {
      const a = ev.accelerationIncludingGravity
      if (!a) return
      if (Math.hypot(a.x || 0, a.y || 0, a.z || 0) > SHAKE_THRESHOLD && Date.now() - last > SHAKE_COOLDOWN) {
        last = Date.now()
        drawRef.current?.()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [])

  const dish = current
  if (!dish) return null
  const emoji = getCategoryEmoji(dish.category)
  const dishImg = getDishImage(dish)

  return (
    <GlassCard className="p-4 mb-4 overflow-hidden relative">
      {/* 氛围光斑：赤陶 + 鼠尾草双色，呼应双人格 */}
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full animate-float-gentle"
        style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.14), transparent 70%)' }} />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full animate-float"
        style={{ background: 'radial-gradient(circle, rgba(127,163,122,0.10), transparent 70%)', animationDelay: '1s' }} />

      <div className="relative flex items-center justify-between mb-3">
        <span className="badge-soft text-xs font-extrabold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(200,104,63,0.14)', color: 'var(--color-clay)' }}>
          手气签 · 今日灵感
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-ash)]">
            {drawing ? '签筒摇一摇…' : '不知道吃啥？摇一下'}
          </span>
          {/* 音效开关：全站唯一入口，控制签筒声与加购反馈音 */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              const next = !soundOn
              setSfxEnabled(next)
              setSoundOn(next)
              if (next) tap()
            }}
            role="switch"
            aria-checked={soundOn}
            aria-label={soundOn ? '关闭音效' : '开启音效'}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
            style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)' }}
          >
            {soundOn ? '🔔' : '🔕'}
          </motion.button>
        </div>
      </div>

      <div className={`relative flex items-center gap-3 ${drawing ? 'pointer-events-none' : ''}`}>
        {/* 缩略图：滚动时轻微缩放抖动，落定时弹一下 */}
        <motion.div
          key={drawing ? 'drawing' : `settle-${dish.id}`}
          initial={reduce || drawing ? false : { scale: 0.82 }}
          animate={{ scale: drawing ? [1, 1.04, 1] : 1 }}
          transition={drawing ? { duration: 0.42, repeat: Infinity, ease: 'easeInOut' } : { type: 'spring', stiffness: 280, damping: 15 }}
          className="relative w-16 h-16 rounded-[var(--radius-tile)] flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, var(--color-ink-900) 0%, var(--color-ink-850) 60%, rgba(200,104,63,0.08) 100%)' }}
        >
          <span className="text-3xl">{emoji}</span>
          {dishImg && (
            <img src={dishImg} alt={dish.name} loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none' }} />
          )}
        </motion.div>

        {/* 信息区：滚动中做轻微模糊，落定后清晰弹出 */}
        <div className={`flex-1 min-w-0 transition-all duration-200 ${drawing ? 'blur-[1.5px] opacity-70' : ''}`}>
          <h3 className="font-bold text-lg text-[var(--color-bone)] truncate">{dish.name}</h3>
          <p className="text-xs text-[var(--color-ash)] mt-0.5 line-clamp-1">{dish.description || '好吃的~'}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
            <span className="font-serif text-base font-extrabold text-[var(--color-caramel)]"><span className="text-[0.75em] mr-px">¥</span>{dish.price}</span>
          </div>
        </div>

        {/* 右列：骰子主按钮 + 加一份 */}
        <div className="flex flex-col items-stretch gap-2 shrink-0">
          <motion.button
            onClick={draw}
            whileTap={{ scale: 0.88 }}
            aria-label="摇签"
            className="d3-btn d3-btn-primary flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold"
          >
            <motion.span
              className="text-sm inline-block"
              animate={drawing ? { rotate: 360 } : { rotate: 0 }}
              transition={drawing ? { duration: 0.5, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
            >🎲</motion.span>
            {drawing ? '摇着' : '摇一签'}
          </motion.button>

          {/* 常驻占位：抽签中只淡出不卸载，避免卡片高度来回跳动 */}
          <motion.div animate={{ opacity: drawing ? 0 : 1, scale: drawing ? 0.85 : 1 }} transition={{ duration: 0.18 }}>
            <motion.button
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                spawnParticle(rect.left + rect.width / 2, rect.top)
                onAdd(dish)
              }}
              className="d3-btn-sm px-3.5 py-2 rounded-2xl text-xs font-bold text-[var(--color-clay)] border border-[var(--color-clay)]/30"
            >
              加一份
            </motion.button>
          </motion.div>
        </div>
      </div>
    </GlassCard>
  )
}
