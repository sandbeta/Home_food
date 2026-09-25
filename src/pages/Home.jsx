import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import ClawMachine from '../components/ClawMachine'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import Icon from '../components/ui/Icons'
import ThemeToggle from '../components/ui/ThemeToggle'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import AnniversaryBanner from '../components/AnniversaryBanner'
import DishShareCard from '../components/DishShareCard'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { contentEnter } from '../theme/motion'
import { NICKNAME, pickOne, HOME_NOTES, RETRY_NOTES, ANNIVERSARY_TITLES, ANNIVERSARY_NOTES, MOOD_HOME_NOTES } from '../lib/sweetCopy'
import { anniversariesToday } from '../lib/anniversary'
import { MOODS, readMood, writeMood } from '../lib/mood'
import { morphTo, heroNameFor, cacheList, getCachedList } from '../lib/vt'
import { useCart } from '../components/CartContext'
import { useClawSignals } from '../hooks/useClawSignals'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// 常点人 mock：按菜品 id 稳定分配 🐱/🐑，让双人格出现在首页网格里
const chefOf = (dish) => (dish.id % 2 === 0 ? 'me' : 'partner')

/**
 * 首页 —— 「娃娃机 + 常点的网格 + 最近订单」，约 1 屏出头。
 *
 * 批 8（V4 现实娃娃机）：娃娃机内部自己管理"堆里 8 个槽位 + 随机抓一个 + 抓走的槽刷新补货"，
 * Home 只负责把候选池 rotSource 传下去（pool）、接住"上一个抓到的菜"（onActiveChange，供分享卡/跳详情），
 * 以及加购/撤销。旧的 rotIdx 顺序轮换、自动换主推、播放/暂停钮全部移除——现实娃娃机不会自己抓。
 * 「常点的」网格保持静止（那是"你家稳定爱吃的那几道"）。
 */
export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  // m-22：useState 初值从 getCachedList('home') 回填，让 morphBack 首页形变生效
  const [dishes, setDishes] = useState(() => getCachedList('home') || [])
  const [homeLoading, setHomeLoading] = useState(() => !getCachedList('home'))
  const [homeFailed, setHomeFailed] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [gridOffset] = useState(0)   // 网格固定（不再顺移）

  /* 批 1 · 纪念日：命中日一次性切页头文案池 */
  const [anniversaries, setAnniversaries] = useState([])
  const todayHit = useMemo(() => anniversariesToday(anniversaries)[0] || null, [anniversaries])
  const anniversaryAppliedRef = useRef(false)
  const [pageTitle, setPageTitle] = useState(() => `${getGreeting()}，${NICKNAME}`)
  const [sweetNote, setSweetNote] = useState(() => pickOne(HOME_NOTES))
  useEffect(() => {
    if (todayHit && !anniversaryAppliedRef.current) {
      anniversaryAppliedRef.current = true
      setPageTitle(pickOne(ANNIVERSARY_TITLES))
      setSweetNote(pickOne(ANNIVERSARY_NOTES))
    }
  }, [todayHit])
  // 纪念日绑定的"回忆里那道菜"（横幅跳详情用，独立于娃娃机）
  const hitDish = useMemo(() => {
    if (!todayHit || !todayHit.dish_id) return null
    return dishes.find(d => d.id === Number(todayHit.dish_id)) || null
  }, [todayHit, dishes])

  /* 批 6d · 今日心情（只切 HOME_NOTES 池，不改主题色） */
  const [mood, setMood] = useState(() => readMood())
  const handleMood = (k) => {
    const next = mood === k ? null : k
    setMood(next); writeMood(next)
    if (!anniversaryAppliedRef.current) setSweetNote(next ? pickOne(MOOD_HOME_NOTES[next] || HOME_NOTES) : pickOne(HOME_NOTES))
    try { window.__cgAnnounce?.(next ? `今日心情：${MOODS.find(m => m.key === next)?.label}` : '已取消心情标记') } catch {}
  }

  const navigate = useNavigate()
  const { addItem, items, whoAmI, updateQuantity } = useCart()
  // M-s2：撤销按【抓取那一刻】的人格快照减，避免浮标窗口内切人格错减
  const lastCatchPersonaRef = useRef(whoAmI)
  /* 批 8 · 娃娃机"上一个抓到的菜"由 ClawMachine 内部随机抓取产生，回传给 Home 供分享卡/跳详情 */
  const [activeDish, setActiveDish] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)

  const onCatch = useCallback((dish) => {
    lastCatchPersonaRef.current = whoAmI
    addItem(dish)
  }, [whoAmI, addItem])

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => setRecentOrders(d.slice(0, 3))).catch(() => {})
    fetch('/api/dishes?category=全部')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(d => {
        // 带实拍图的菜排前，娃娃机堆/主推更有图；Fisher-Yates 无偏洗牌
        const shuf = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
        const list = [...shuf(d.filter(x => getDishImage(x))), ...shuf(d.filter(x => !getDishImage(x)))]
        setDishes(list); cacheList('home', list)
        setHomeLoading(false)
      })
      .catch(() => { setHomeLoading(false); setHomeFailed(true) })
    fetch('/api/anniversaries').then(r => r.ok ? r.json() : []).then(setAnniversaries).catch(() => {})
  }, [reloadToken])

  const len = dishes.length
  // 网格占用的菜从娃娃机候选池剔除，避免同菜同时出现在网格和堆里
  const gridIdx = useMemo(() => len >= 7
    ? Array.from({ length: 6 }, (_, k) => (gridOffset + 1 + k) % len)
    : Array.from({ length: Math.min(6, len) }, (_, k) => k), [len, gridOffset])
  const rotSource = useMemo(() => {
    const pool = len ? dishes.filter((_, i) => !gridIdx.includes(i)) : []
    return pool.length ? pool : dishes
  }, [dishes, gridIdx, len])
  const popular = gridIdx.map(i => dishes[i])

  /* 智能三层池（白天版）：从 rotSource 聚合收藏/常点/愿望加权，并把当天纪念日绑定菜并入 B 层。 */
  const { pool: clawPool } = useClawSignals(rotSource, { todayDishId: todayHit?.dish_id ?? null })

  // 撤销一次"抓取即加购"：按抓取那一刻的人格快照减数量
  const undoCatch = useCallback((dish) => {
    const personaAt = lastCatchPersonaRef.current
    const cur = items.find(i => i.dish_id === dish.id && i.added_by === personaAt)?.quantity ?? 0
    if (cur > 0) updateQuantity(dish.id, cur - 1, personaAt)
  }, [items, updateQuantity])

  return (
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100dvh - var(--bottom-inset))' }}>
      <PageHeader title={pageTitle} subtitle={sweetNote} right={<ThemeToggle />} />

      <PageContainer>
        {/* 批 6d · 今日心情 chips */}
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
        {/* 批 1 · 纪念日横幅 */}
        {todayHit && (
          <AnniversaryBanner
            hit={todayHit}
            dishName={hitDish ? hitDish.name : ''}
            onOpenDish={hitDish ? () => navigate(`/dish/${hitDish.id}`) : undefined}
          />
        )}
        {/* 批 8 · 现实娃娃机：堆里 8 个槽位随机抓、抓走的补货；Home 传候选池 + 接住抓到的菜 */}
        {rotSource.length > 0 && (
          <div>
            <ClawMachine
              pool={clawPool}
              onCatch={onCatch}
              onUndo={undoCatch}
              onOpen={activeDish ? () => navigate(`/dish/${activeDish.id}`) : undefined}
              onActiveChange={setActiveDish}
            />
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

        {homeFailed && !dishes.length && (
          <EmptyState
            emoji="📡" tone="error"
            title="厨房暂时断联"
            desc={pickOne(RETRY_NOTES)}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setHomeFailed(false); setHomeLoading(true); setReloadToken(t => t + 1) }}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                再试一次
              </motion.button>
            }
          />
        )}
        {homeLoading && !dishes.length && !homeFailed && <LoadingState text="开火备菜中…" />}
        {!homeLoading && !homeFailed && !dishes.length && (
          <EmptyState
            who="badgeDay"
            title="厨房还空着"
            desc="懒羊羊盯着空锅，去点菜页挑几道开火"
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
        {/* 常点的 */}
        {popular.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
              index={1}
              title="常点的"
              action={<button onClick={() => navigate('/menu')} className="min-h-[44px] px-2 -mx-2 text-xs text-[var(--color-clay-text)] font-bold rounded-full inline-flex items-center">全部 →</button>}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {popular.map((dish) => {
                const chef = chefOf(dish)
                return (
                  <motion.div
                    key={dish.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/home')}
                    role="button" tabIndex={0} aria-label={`查看${dish.name}详情`}
                    onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/dish/${dish.id}`) } }}
                    className="vt-dish-host d3-card-face cursor-pointer flex items-center gap-3 relative"
                    style={{ padding: 'var(--space-card-p)' }}
                  >
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[var(--color-ink-900)] ${chef === 'me' ? 'avatar-me' : 'avatar-partner'}`}
                      title={chef === 'me' ? '我常点' : 'TA 常点'}
                    >
                      <span aria-hidden="true">{chef === 'me' ? '🐱' : '🐑'}</span>
                    </div>
                    <div
                      className="vt-dish-frame relative w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden"
                      style={{ background: 'var(--plate-bg)', viewTransitionName: heroNameFor(dish.id) }}
                    >
                      <span aria-hidden="true">{getCategoryEmoji(dish?.category)}</span>
                      {getDishImage(dish) && (
                        <img
                          src={getDishImage(dish)}
                          className="absolute inset-0 w-full h-full object-cover"
                          alt={dish.name}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                        <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{dish.price}</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* 最近订单 */}
        {recentOrders.length > 0 && (
          <motion.div {...contentEnter(0.15)}>
            <SectionHeader
              index={2}
              title="最近订单"
              action={<button onClick={() => navigate('/orders')} className="min-h-[44px] px-2 -mx-2 text-xs text-[var(--color-clay-text)] font-bold rounded-full inline-flex items-center">全部</button>}
            />
            <div className="space-y-2.5 mt-3">
              {recentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  role="button" tabIndex={0} aria-label={`查看订单 #${order.id}`}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/orders/${order.id}`) } }}
                  className="d3-card-face flex items-center justify-between gap-3 cursor-pointer"
                  style={{ padding: 'var(--space-card-p)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'var(--color-ink-850)', color: 'var(--color-ash)' }}
                    >
                      <Icon name="orders" size={18} strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[var(--color-bone)]">订单 #{order.id}</p>
                      <p className="text-xs text-[var(--color-ash)] mt-0.5 truncate">
                        {(order.items || []).map(i => `${i.dish_name}×${i.quantity}`).join('、')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
                    <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{order.total_price}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </PageContainer>

      <div aria-hidden="true" style={{ flex: '1 1 auto', minHeight: 'var(--space-section)' }} />
      <div aria-hidden="true" className="grass-hem relative z-[2]" />

      {/* 批 3c · 今日菜卡分享（分享"上一个抓到的菜"） */}
      <DishShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        dish={activeDish}
      />
    </div>
  )
}
