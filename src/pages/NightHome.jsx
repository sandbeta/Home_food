// ============================================================
// 深夜食堂首页 —— 夜宵模式下的专属界面（App.jsx 按 isNight 分发挂载）。
// 与白天 Home 是两套版面：主推大卡「换一道」+ 宵夜网格一键加购 + 全店夜宵入口。
// 内容全部来自 nightPick 夜宵池；双人格/购物车/谁买单/收藏四大语义不动。
// 动效遵守 Vercel 规范：入场 opacity+≥0.9 scale 淡入、UI<300ms、按压 0.92。
// ============================================================
import { useState, useEffect, useMemo } from 'react'
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
import { useCart } from '../components/CartContext'
import { nightPick } from '../lib/nightRules'
import { getCategoryEmoji, getDishImage } from '../lib/categoryIcons'
import { contentEnter, cardEntrance, usePrefersReducedMotion } from '../theme/motion'
import { pickOne, NIGHT_HOME_TITLES, NIGHT_HOME_NOTES, RETRY_NOTES } from '../lib/sweetCopy'
import { vibrate } from '../lib/sfx'
import { morphTo, heroNameFor, cacheList } from '../lib/vt'

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function NightHome() {
  const [pool, setPool] = useState([])
  const [rotIdx, setRotIdx] = useState(0)
  // 三态（对齐 Home）：加载/失败可重试/空池——此前 .catch 吞异常致整页空白，像坏了
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()
  const { addItem, items, whoAmI, updateQuantity } = useCart()
  const reduced = usePrefersReducedMotion()
  const [title] = useState(() => pickOne(NIGHT_HOME_TITLES))
  const [note] = useState(() => pickOne(NIGHT_HOME_NOTES))

  // 撤销一次"抓取即加购"：该菜当前人格数量减一，减到 0 自动移除
  const undoCatch = (dish) => {
    const cur = items.find(i => i.dish_id === dish.id && i.added_by === whoAmI)?.quantity ?? 0
    if (cur > 0) updateQuantity(dish.id, cur - 1, whoAmI)
  }

  // 网格错峰：8 格作为「一排端上桌」整体逐格亮相（cardEntrance + 0.06 步进，
  // 基准 0.1 让区块标题先到、格子随后）；reduced 下去掉位移只留短淡入，反馈仍可读
  const cellEnter = (idx) => reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: 0.1 + idx * 0.06 } }
    : cardEntrance(0.1 + idx * 0.06)

  useEffect(() => {
    fetch('/api/dishes?category=全部')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(d => {
        const l = shuffle(nightPick(d))
        setPool(l); cacheList('night', l)
        setLoading(false)
        if (!l.length) setFailed(true)
      })
      .catch(() => { setLoading(false); setFailed(true) })
  }, [reload])

  const featured = pool.length ? pool[rotIdx % pool.length] : null
  const grid = useMemo(() => pool.filter(d => d.id !== featured?.id).slice(0, 8), [pool, featured])

  return (
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100dvh - var(--bottom-inset))' }}>
      <PageHeader title={title} subtitle={note} right={<ThemeToggle />} />

      <PageContainer>
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
        {/* 深夜主推 —— 娃娃机宵夜变体：无泡泡时钟（安静陪吃），手动换一道不自动轮换 */}
        {featured && (
          <ClawMachine
            dish={featured}
            indexNo={(rotIdx % (pool.length || 1)) + 1}
            onCatch={addItem}
            onUndo={undoCatch}
            onGrab={() => setRotIdx(i => i + 1)}
            onOpen={(e) => morphTo(navigate, `/dish/${featured.id}`, e, featured, '/home')}
            showClock={false}
            title="深夜宵夜机"
            note="深夜主推 · 安静陪吃"
          />
        )}

        {/* 宵夜网格：每格一键加购，不用进详情 */}
        {grid.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
              title="这些点得多"
              action={<button onClick={() => navigate('/menu?cat=夜宵')} className="text-xs text-[var(--color-clay-text)] font-bold">全店夜宵 →</button>}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {grid.map((dish, idx) => (
                <motion.div
                  key={dish.id}
                  {...cellEnter(idx)}
                  className="vt-dish-host d3-card-face relative flex flex-col cursor-pointer"
                  style={{ padding: 'var(--space-card-p)' }}
                  onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/home')}
                >
                  <div className="vt-dish-frame relative h-16 rounded-xl overflow-hidden flex items-center justify-center mb-2.5"
                    style={{ background: 'linear-gradient(145deg, var(--color-ink-900), var(--color-ink-850))', viewTransitionName: heroNameFor(dish.id) }}>
                    <span className="text-3xl">{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: 'var(--tile-img-filter)' }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                  </div>
                  <p className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</p>
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
    </div>
  )
}
