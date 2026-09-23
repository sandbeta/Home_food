import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion, EASE } from '../theme/motion'
import Icon from './ui/Icons'
import LazySheep, { SheepZzz } from './ui/LazySheep'

/**
 * 灶台舞台 —— 订单详情页的「做菜叙事」动画，取代旧版静态状态环 D3StatusRing。
 *
 * 三个状态各有戏：
 *  - pending   灶台熄火，锅上冒着 💤，厨房静悄悄
 *  - preparing  灶膛点火（火焰摇曳）+ 蒸汽升腾 + 焖煮进度条（按下单时间推算，上限 92%）
 *  - completed  掀盖起锅：锅上移、白盘托着菜升起来，✨ 四散庆祝
 *
 * 尺寸对齐旧环的 --ring-size 令牌；全部动效在 prefers-reduced-motion 下停摆，
 * 只保留静态形态（火焰/蒸汽隐藏、进度条直读当前值）。
 */

// 与购物车「预估等待约 20-30 分钟」文案同源的焖煮时长
const COOK_MS = 25 * 60 * 1000
const PROGRESS_MAX = 0.92

function cookElapsed(createdAt) {
  try { return Math.max(0, Date.now() - new Date(createdAt).getTime()) } catch { return 0 }
}

export default function StoveStage({ statusKey = 'pending', createdAt }) {
  const reduce = usePrefersReducedMotion()
  const [progress, setProgress] = useState(() =>
    Math.min(cookElapsed(createdAt) / COOK_MS, PROGRESS_MAX))

  // 焖煮中：每 5 秒推进一次进度（封顶 PROGRESS_MAX，菜"做好"由后台推进状态决定）
  useEffect(() => {
    if (statusKey !== 'preparing') return undefined
    const tick = () => setProgress(p => Math.min(p + 5000 / COOK_MS, PROGRESS_MAX))
    const timer = setInterval(tick, 5000)
    return () => clearInterval(timer)
  }, [statusKey])

  /* 批 2a · 三态视觉兼容六值 statusKey：
     pending → 熄火陪等；completed → 起锅叙事；其它（preparing 旧 / cutting / cooking / plating 新）
     统一走"进行中"视觉（灶膛点火 + 蒸汽 + 焖煮进度）——灶火本身就是"在做了"的语义，细分档在跑灯与文案里区分。 */
  const pending = statusKey === 'pending'
  const preparing = !pending && statusKey !== 'completed'
  const completed = statusKey === 'completed'

  return (
    <div
      className="relative mx-auto"
      style={{
        width: 'var(--ring-size)',
        height: preparing ? 'calc(var(--ring-size) + 34px)' : 'var(--ring-size)',
      }}
    >
      {/* 灶台底座的柔光：状态色渲染氛围 */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: completed
            ? 'radial-gradient(circle, color-mix(in srgb, var(--sage-40) 22%, transparent), transparent 70%)'
            : preparing
              ? 'radial-gradient(circle, color-mix(in srgb, var(--clay-50) 20%, transparent), transparent 70%)'
              : 'radial-gradient(circle, color-mix(in srgb, var(--color-ember) 16%, transparent), transparent 70%)',
        }}
      />

      {/* ── completed：起锅动画（锅上移淡出 → 白盘升起） ── */}
      {completed ? (
        <>
          {!reduce && (
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 text-5xl"
              style={{ top: 34 }}
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -26, opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              🍲
            </motion.div>
          )}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: 26 }}
            initial={reduce ? false : { y: 40, opacity: 0, scale: 0.7 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.45, type: 'spring', stiffness: 200, damping: 14 }}
          >
            <div className="relative flex items-center justify-center">
              <div
                className="w-24 h-12 rounded-[50%] flex items-center justify-center"
                style={{
                  /* M-v1 关键修：起锅白盘原用 linear-gradient(180deg, on-dark → ink-850)——两端分属反相/不反相色系，
                     夜宵下白盘从奶油白渐变到深莓紫（=半融化灰盘），正是 DESIGN 图鉴盘底警告过的历史踩坑。
                     改两端都用不反相的 on-dark 家族：白盘跨主题恒为"奶油白 + 底部微玫瑰高光"，与签名拟物豁免段一致。 */
                  background: 'linear-gradient(180deg, var(--color-on-dark) 0%, color-mix(in srgb, var(--color-on-dark) 92%, var(--clay-30)) 100%)',
                  boxShadow: '0 10px 24px rgba(43,36,41,0.18), inset 0 2px 4px rgba(255,255,255,0.8)',
                }}
              >
                <span className="text-4xl -mt-2" aria-hidden="true">🍽️</span>
              </div>
              {/* 懒羊羊开饭仪式：小羊趴在盘边缓慢呼吸，配一个睡眠符号 */}
              <motion.div
                className="absolute -right-7 bottom-0.5"
                style={{ color: 'var(--sage-60)' }}
                animate={reduce ? undefined : { scale: [1, 1.06, 1], y: [0, -1.5, 0] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 1.1 }}
              >
                <LazySheep size={40} mood="happy" />
              </motion.div>
              {!reduce && <SheepZzz size={11} className="-right-8 -top-2" />}
              {!reduce && (
                <>
                  <motion.span
                    className="absolute -left-3 -top-2 text-lg"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
                    transition={{ delay: 0.85, duration: 0.5 }}
                  >✨</motion.span>
                  <motion.span
                    className="absolute -right-3 top-0 text-sm"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
                    transition={{ delay: 1.0, duration: 0.5 }}
                  >✨</motion.span>
                  <motion.span
                    className="absolute left-1/2 -top-5 -translate-x-1/2 text-base"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.9] }}
                    transition={{ delay: 0.95, duration: 0.5 }}
                  >🎉</motion.span>
                </>
              )}
            </div>
          </motion.div>
          {/* 空灶台：火已熄灭 */}
          <div className="stove-base" />
        </>
      ) : (
        <>
          {/* ── 蒸汽（preparing 专属） ── */}
          {preparing && !reduce && (
            <div className="absolute left-1/2 -translate-x-1/2 top-1 flex gap-2 pointer-events-none">
              <span className="steam-puff" style={{ animationDelay: '0s' }} />
              <span className="steam-puff" style={{ animationDelay: '0.9s' }} />
              <span className="steam-puff" style={{ animationDelay: '1.7s' }} />
            </div>
          )}

          {/* 炉火光晕：灶膛加热时锅底映出的暖橙氛围（动画受全局 reduced-motion 停摆） */}
          {preparing && <div className="stove-glow" />}
          {pending && <div className="stove-glow ember" />}

          {/* 懒羊羊守在灶边打盹：饭点未到，先睡一觉（欧羊的等待方式） */}
          {pending && (
            <div className="absolute text-[var(--color-sage)]" style={{ right: -6, top: 76 }}>
              <LazySheep size={32} mood="sleep" bib={false} />
              <SheepZzz size={9} className="-top-1 -right-1" />
            </div>
          )}
          {/* 饭菜上桌，懒羊羊闻香睁眼 */}
          {preparing && (
            <div className="absolute text-[var(--color-sage)]" style={{ right: -6, top: 76 }}>
              <LazySheep size={32} mood="sniff" bib={false} />
            </div>
          )}

          {/* ── 锅 ── */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 30 }}>
            <motion.span
              className={`block text-6xl ${pending ? 'opacity-70' : ''}`}
              style={pending ? { filter: 'grayscale(0.7)' } : undefined}
              animate={preparing && !reduce ? { y: [0, -2, 0] } : { y: 0 }}
              transition={preparing && !reduce ? { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
            >
              🍲
            </motion.span>
            {pending && (
              <motion.span
                className="absolute -top-2 -right-4 text-xl"
                animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                💤
              </motion.span>
            )}
          </div>

          {/* ── 灶膛与火焰 ── */}
          <div className={`stove-base ${preparing ? 'is-live' : ''}`}>
            {preparing ? (
              <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 flex gap-1 items-end">
                <span className="stove-flame" style={{ height: 16, animationDelay: '0s' }} />
                <span className="stove-flame" style={{ height: 22, animationDelay: '0.25s' }} />
                <span className="stove-flame" style={{ height: 14, animationDelay: '0.5s' }} />
              </div>
            ) : (
              <Icon name="flame" size={14} strokeWidth={1.8} className="absolute left-1/2 -translate-x-1/2 -top-1 opacity-40" />
            )}
          </div>

          {/* ── 焖煮进度（preparing 专属） ── */}
          {preparing && (
            <motion.div
              className="absolute"
              style={{ left: -28, right: -28, top: 'calc(var(--ring-size) - 2px)' }}
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4, ease: EASE }}
            >
              <div
                className="h-[5px] rounded-full overflow-hidden"
                style={{ background: 'color-mix(in srgb, var(--clay-50) 14%, transparent)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(progress * 100)}%`,
                    background: 'var(--color-clay-gradient)',
                    transition: 'width 1s linear',
                  }}
                />
              </div>
              <p className="text-center text-[11px] text-[var(--color-ash)] mt-1.5 font-semibold whitespace-nowrap">
                小火慢炖中 · 已焖 {Math.max(1, Math.round(cookElapsed(createdAt) / 60000))} 分钟
              </p>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
