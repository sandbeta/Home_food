// ============================================================
// 深夜食堂首页 —— 夜宵模式下的专属界面（App.jsx 按 isNight 分发挂载）。
// 与白天 Home 是两套版面：主推大卡「换一道」+ 宵夜网格一键加购 + 全店夜宵入口。
// 内容全部来自 nightPick 夜宵池；双人格/购物车/谁买单/收藏四大语义不动。
// 动效遵守 Vercel 规范：入场 opacity+≥0.9 scale 淡入、UI<300ms、按压 0.92。
// ============================================================
import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import ClawMachine from '../components/ClawMachine'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import LoadingState from '../components/ui/LoadingState'
import EmptyState from '../components/ui/EmptyState'
import ThemeToggle from '../components/ui/ThemeToggle'
import DishShareCard from '../components/DishShareCard'
import { useCart } from '../components/CartContext'
import { useClawSignals } from '../hooks/useClawSignals'
import { nightPickInfo } from '../lib/nightRules'
import { getCategoryEmoji, getDishImage } from '../lib/categoryIcons'
import { contentEnter, cardEntrance, usePrefersReducedMotion } from '../theme/motion'
import { pickOne, NIGHT_HOME_TITLES, NIGHT_HOME_NOTES, RETRY_NOTES, MOOD_NIGHT_NOTES } from '../lib/sweetCopy'
import { MOODS, readMood, writeMood } from '../lib/mood'
import { vibrate } from '../lib/sfx'
import { morphTo, heroNameFor, cacheList, getCachedList } from '../lib/vt'
import { requestJson } from '../lib/request'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NightHome() {
  /* m-22 修：pool useState 初值从 getCachedList('night') 回填，让从夜宵网格 morphTo 详情再 morphBack
     时首帧就有 dish-hero 命名元素，共享元素形变不再静默退化。 */
  const [pool, setPool] = useState(() => getCachedList('night') || [])
  /* 批 8 · 娃娃机内部随机抓取，抓到的菜回传给 Home 供网格排除 + 后续扩展 */
  const [activeDish, setActiveDish] = useState(null)
  // 三态（对齐 Home）：加载/失败可重试/空池——此前 .catch 吞异常致整页空白，像坏了
  /* m-27 修：以前"取到数据但池为空"也 setFailed(true) → 渲染成"宵夜机暂时没通电 + 再试一次"，
     用户反复点重试永远空、误以为是网络故障。改成 empty/fallback 两态分离：
       · failed = 真网络/服务端错 → EmptyState error + 再试一次
       · empty  = 拉到数据但 available 过滤后为 0 → 引导去点菜/后台
       · fallback = nightPick 命中<min 回退整池 → SectionHeader 加提示角标（m-26） */
  const [loading, setLoading] = useState(() => !getCachedList('night'))
  const [failed, setFailed] = useState(false)
  const [empty, setEmpty] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()
  const { addItem, items, whoAmI, updateQuantity } = useCart()
  const reduced = usePrefersReducedMotion()
  const [title] = useState(() => pickOne(NIGHT_HOME_TITLES))
  const [note, setNote] = useState(() => pickOne(NIGHT_HOME_NOTES))
  /* 批 6d · 今日心情（与白天 Home 对齐：只切页头副标题池，不改主题色） */
  const [mood, setMood] = useState(() => readMood())
  const [shareOpen, setShareOpen] = useState(false)
  const handleMood = (k) => {
    const next = mood === k ? null : k
    setMood(next); writeMood(next)
    setNote(next ? pickOne(MOOD_NIGHT_NOTES[next] || NIGHT_HOME_NOTES) : pickOne(NIGHT_HOME_NOTES))
    try { window.__cgAnnounce?.(next ? `今日心情：${MOODS.find(m => m.key === next)?.label}` : '已取消心情标记') } catch {}
  }
  /* M-s2 修：撤销按【当前】whoAmI 会错人格；useRef 记抓取时快照，撤销按快照走 */
  const lastCatchPersonaRef = useRef(whoAmI)

  const onCatch = (dish) => {
    lastCatchPersonaRef.current = whoAmI
    addItem(dish)
  }

  // 撤销一次"抓取即加购"：该菜在**抓取那一刻人格**下的数量减一（M-s2）
  const undoCatch = (dish) => {
    const personaAt = lastCatchPersonaRef.current
    const cur = items.find(i => i.dish_id === dish.id && i.added_by === personaAt)?.quantity ?? 0
    if (cur > 0) updateQuantity(dish.id, cur - 1, personaAt)
  }

  // 网格错峰：8 格作为「一排端上桌」整体逐格亮相（cardEntrance + 0.06 步进，
  // 基准 0.1 让区块标题先到、格子随后）；reduced 下去掉位移只留短淡入，反馈仍可读
  const cellEnter = (idx) => reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: 0.1 + idx * 0.06 } }
    : cardEntrance(0.1 + idx * 0.06)

  useEffect(() => {
    requestJson('/api/dishes?category=全部').then(r => r.json())
      .then(d => {
        const available = (Array.isArray(d) ? d : []).filter(x => Number(x.available) !== 0)
        const { list, isFallback } = nightPickInfo(available)
        const l = shuffle(list)
        setPool(l); cacheList('night', l)
        setFallback(isFallback)
        setLoading(false)
        if (!l.length) setEmpty(true)
      })
      .catch(() => { setLoading(false); setFailed(true) })
  }, [reload])

  const grid = useMemo(() => pool.filter(d => d.id !== activeDish?.id).slice(0, 8), [pool, activeDish])

  /* 智能三层池（夜宵版）：从夜宵池聚合收藏/常点/愿望加权（安静陪吃，不叠加纪念日专属文案）。 */
  const { pool: clawPool } = useClawSignals(pool)

  return (
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100dvh - var(--bottom-inset))' }}>
      <PageHeader title={title} subtitle={note} right={<ThemeToggle />} />

      <PageContainer>
        {/* 批 6d · 今日心情 chips（与白天 Home 对齐） */}
        <div className="flex items-center gap-1.5 mb-2 -mt-1 overflow-x-auto no-scrollbar" role="radiogroup" aria-label="今日心情">
          <span className="text-[11px] text-[var(--color-ash)] font-bold shrink-0 mr-0.5">今日心情</span>
          {MOODS.map(m => {
            const active = mood === m.key
            return (
              <button key={m.key} onClick={() => handleMood(m.key)} role="radio" aria-checked={active}
                className="shrink-0 px-2.5 py-1 min-h-[44px] rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                style={{
                  background: active ? 'var(--color-clay)' : 'var(--surface)',
                  color: active ? 'var(--color-on-dark)' : 'var(--color-ash)',
                  border: `2px solid ${active ? 'var(--clay-deep)' : 'var(--color-line)'}`,
                }}>
                <span aria-hidden>{m.emoji}</span>{m.label}
              </button>
            )
          })}
          {mood && (
            <button onClick={() => handleMood(mood)} aria-label="取消心情"
              className="shrink-0 px-2 py-1 min-h-[44px] text-[11px] text-[var(--color-ash)] font-bold">清除</button>
          )}
        </div>
        {loading && !pool.length && <LoadingState text="开灯备宵夜…" />}
        {failed && !loading && (
          <EmptyState
            emoji="📡" tone="error"
            title="宵夜机暂时没通电"
            desc={pickOne(RETRY_NOTES)}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setFailed(false); setLoading(true); setReload(r => r + 1) }}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                再试一次
              </motion.button>
            }
          />
        )}
        {/* m-27：拉到数据但 available 过滤后为空 → 引导去点菜，别当"网络故障"骗用户反复重试 */}
        {empty && !loading && !failed && !pool.length && (
          <EmptyState
            who="badgeNight"
            title="宵夜池暂时空了"
            desc="厨房里今晚还没备宵夜，去点菜页挑几道加进来？"
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu')}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                去点菜
              </motion.button>
            }
          />
        )}
        {/* 深夜主推 —— 娃娃机宵夜变体：无泡泡时钟（安静陪吃），堆里随机抓、抓走的补货 */}
        {pool.length > 0 && (
          <div>
            <ClawMachine
              pool={clawPool}
              onCatch={onCatch}
              onUndo={undoCatch}
              onOpen={activeDish ? () => navigate(`/dish/${activeDish.id}`) : undefined}
              onActiveChange={setActiveDish}
              showClock={false}
              title="深夜宵夜机"
              note="深夜主推 · 安静陪吃"
            />
            {/* 批 3c · 分享"上一个抓到的菜"（与白天 Home 对齐） */}
            {activeDish && (
              <button
                onClick={() => setShareOpen(true)}
                aria-label={`分享菜卡：${activeDish.name}`}
                className="w-full mt-3 min-h-[44px] py-2 text-xs font-bold text-[var(--color-clay-text)] flex items-center justify-center gap-1 rounded-full"
                style={{ border: '2px dashed var(--color-line)' }}
              >
                <span aria-hidden>📸</span> 分享这张菜卡给 TA 看
              </button>
            )}
          </div>
        )}

        {/* 宵夜网格：每格一键加购，不用进详情 */}
        {grid.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
              title="这些适合深夜"
              action={
                <div className="flex items-center gap-2">
                  {/* m-26：nightPick 命中<6 回退整池 → 明示"这些不是纯宵夜"，避免佛跳墙/剁椒鱼头等正餐混入被误当深夜推荐 */}
                  {fallback && <span className="text-[11px] text-[var(--color-ash)] whitespace-nowrap">宵夜供给少，先看这些~</span>}
                  <button onClick={() => navigate('/menu?cat=夜宵')} className="min-h-[44px] px-2 -mx-2 text-xs text-[var(--color-clay-text)] font-bold rounded-full inline-flex items-center">全店夜宵 →</button>
                </div>
              }
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {grid.map((dish, idx) => (
                <motion.div
                  key={dish.id}
                  {...cellEnter(idx)}
                  className="vt-dish-host d3-card-face relative flex flex-col cursor-pointer"
                  style={{ padding: 'var(--space-card-p)' }}
                  onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/home')}
                  /* 批4：role=button 容器内嵌真加购 <button> 属非法 ARIA 嵌套（B4 老注只解了误触）；
                     容器降回普通点击面，键盘可达改由菜名真按钮承载（与 DishRow 同法）。 */
                >
                  <div className="vt-dish-frame relative h-16 rounded-xl overflow-hidden flex items-center justify-center mb-2.5"
                    style={{ background: 'var(--plate-bg)', viewTransitionName: heroNameFor(dish.id) }}>
                    <span className="text-3xl" aria-hidden="true">{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'var(--tile-img-filter)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <button type="button"
                    onClick={(e) => { e.stopPropagation(); morphTo(navigate, `/dish/${dish.id}`, e, dish, '/home') }}
                    aria-label={`查看${dish.name}详情`}
                    className="text-sm font-bold text-[var(--color-bone)] truncate text-left"
                    style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>
                    {dish.name}
                  </button>
                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <div className="flex items-center gap-1 shrink-0">
                      <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                      <span className="font-serif text-base font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.7em]">¥</span>{dish.price}</span>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={(e) => { e.stopPropagation(); addItem(dish); vibrate(12) }}
                      aria-label={`加购${dish.name}`}
                      className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-xl font-bold text-[var(--color-on-dark)]"
                      style={{ background: 'var(--color-clay)' }}
                    >
                      +
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </PageContainer>

      {/* 撑满剩余高度，把草地收边推到底 */}
      <div aria-hidden="true" style={{ flex: '1 1 auto', minHeight: 'var(--space-section)' }} />
      {/* 牧场草地收边（夜宵自动压暗） */}
      <div aria-hidden="true" className="grass-hem relative z-[2]" />

      {/* 批 3c · 今日菜卡分享（分享"上一个抓到的菜"，与白天 Home 对齐） */}
      <DishShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        dish={activeDish}
      />
    </div>
  )
}
