import { useState, useEffect, useRef, useMemo } from 'react'
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
import { contentEnter, usePrefersReducedMotion } from '../theme/motion'
import { NICKNAME, pickOne, HOME_NOTES, RETRY_NOTES, ANNIVERSARY_TITLES, ANNIVERSARY_NOTES, MOOD_HOME_NOTES } from '../lib/sweetCopy'
import { anniversariesToday } from '../lib/anniversary'
import { MOODS, readMood, writeMood } from '../lib/mood'
import { morphTo, heroNameFor, cacheList, getCachedList } from '../lib/vt'
import { useCart } from '../components/CartContext'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}


// 常点人 mock：按菜品 id 稳定分配 🐱/🐑，让双人格出现在首页网格里
const chefOf = (dish) => (dish.id % 2 === 0 ? 'me' : 'partner')

// 主推卡自动轮换节奏。低于 4s 会让人来不及读完菜名与价格，高于 8s 则几乎感知不到在轮换。
// 改这个值时进度条会自动跟随（时长由内联样式按同一常量下发）。
const ROTATE_MS = 5000

/**
 * 首页 —— 「主推大卡 + 2 列网格 + 竖列表」，约 1 屏出头。
 * 不设快捷入口：与底部导航功能重复（用户实测反馈后移除），
 * 收藏走点菜页分段控件，订单/我的走底部导航。
 *
 * 主推大卡会自动轮换，但「常点的」网格保持静止：
 * 网格若跟着每 5 秒重排，用户刚看中的菜就会跑掉，反而降低可用性。
 */
export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  /* m-22 修：以前 cacheList('home', ...) 只写不读，导致从首页网格 morphTo 进详情再 morphBack('/home')
     时首帧 dishes=[] 无 dish-hero 命名元素，共享元素形变静默退化为普通淡入（首页 overdrive 从未生效）。
     照抄 Menu：useState 初值从 getCachedList('home') 回填，homeLoading 初值同步。 */
  const [dishes, setDishes] = useState(() => getCachedList('home') || [])
  // 三态（2026-09-19 critique）：加载中/失败可重试/0 菜引导——此前静默空白像页面坏了
  const [homeLoading, setHomeLoading] = useState(() => !getCachedList('home'))
  const [homeFailed, setHomeFailed] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [rotIdx, setRotIdx] = useState(0)
  const [gridOffset, setGridOffset] = useState(0)
  // 交互后重建定时器：避免用户刚点完「换一道」，1 秒后又被自动轮换顶掉
  const [rotateToken, setRotateToken] = useState(0)
  const [paused, setPaused] = useState(false)
  const [autoOn, setAutoOn] = useState(true)   // 自动轮换开关（机顶播放/暂停钮；触屏可关）
  const [tabVisible, setTabVisible] = useState(true)
  /* 批 1 新增 · 纪念日：异步拉 anniversaries 后判定今日命中；命中即一次性把 pageTitle/sweetNote 从常规池切到纪念日池
     （anniversaryAppliedRef 防重复抽；未命中保持原问候） */
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
  /* 批 6d · 今日心情（仅切 HOME_NOTES 池，不改主题色） */
  const [mood, setMood] = useState(() => readMood())
  const handleMood = (k) => {
    const next = mood === k ? null : k
    setMood(next); writeMood(next)
    if (!anniversaryAppliedRef.current) setSweetNote(next ? pickOne(MOOD_HOME_NOTES[next] || HOME_NOTES) : pickOne(HOME_NOTES))
    try { window.__cgAnnounce?.(next ? `今日心情：${MOODS.find(m => m.key === next)?.label}` : '已取消心情标记') } catch {}
  }
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  const { addItem, items, whoAmI, updateQuantity } = useCart()
  /* M-s2 修：抓取时人格 ≠ 撤销时人格 → 撤销按【当前】whoAmI 减会失效或错减 TA。
     useRef 记「抓取那一刻」的人格快照，撤销按快照走（浮标 4.2s 窗口内切人格不再误伤）。 */
  const lastCatchPersonaRef = useRef(whoAmI)
  /* 批 3c · 今日菜卡分享 */
  const [shareOpen, setShareOpen] = useState(false)

  const onCatch = (dish) => {
    lastCatchPersonaRef.current = whoAmI
    addItem(dish)
  }

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => setRecentOrders(d.slice(0, 3))).catch(() => {})
    fetch('/api/dishes?category=全部')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then(d => {
      // 主推大卡优先用带实拍图的菜（无图菜在大卡上只有一枚小 emoji，观感太素）；
      // 两组各自洗牌后拼接，保证主推位永远有图。Fisher-Yates 无偏洗牌。
      const shuf = (arr) => {
        const a = [...arr]
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[a[i], a[j]] = [a[j], a[i]]
        }
        return a
      }
      { const list = [...shuf(d.filter(x => getDishImage(x))), ...shuf(d.filter(x => !getDishImage(x)))]; setDishes(list); cacheList('home', list) }
      setRotIdx(0) // 新数据到来时轮换指针归零
      setGridOffset(0)
      setHomeLoading(false)
      })
      .catch(() => { setHomeLoading(false); setHomeFailed(true) })
    // 批 1：拉纪念日列表（命中判在 useMemo 里做）
    fetch('/api/anniversaries').then(r => r.ok ? r.json() : []).then(setAnniversaries).catch(() => {})
  }, [reloadToken])

  // 标签页切到后台时停摆：既省电，也避免用户切回来时大卡已经翻到陌生的菜
  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const len = dishes.length

  // 网格占用的菜从轮换池剔除，避免同一道菜同时出现在大卡和网格
  const gridIdx = len >= 7
    ? Array.from({ length: 6 }, (_, k) => (gridOffset + 1 + k) % len)
    : Array.from({ length: Math.min(6, len) }, (_, k) => k)
  const rotPool = len ? dishes.filter((_, i) => !gridIdx.includes(i)) : []
  const rotSource = rotPool.length ? rotPool : dishes

  /* 批 1 · 命中日首轮锁定：todayHit 且绑定了 dish_id 且 rotIdx===0（用户一进首页还没换过）
     → featured = hitDish；一旦点换一道/抓取（rotIdx>0）恢复正常轮换，不再锁死。 */
  const hitDish = useMemo(() => {
    if (!todayHit || !todayHit.dish_id || rotIdx !== 0) return null
    return dishes.find(d => d.id === Number(todayHit.dish_id)) || null
  }, [todayHit, dishes, rotIdx])
  const normalFeatured = rotSource.length ? rotSource[rotIdx % rotSource.length] : null
  const featured = hitDish || normalFeatured
  const popular = gridIdx.map(i => dishes[i])

  // reduced-motion / 关闭自动轮换 / 手指按住卡片 / 标签页隐藏 / 池子不足两道时都不自动轮换
  const canRotate = !reduced && autoOn && !paused && tabVisible && rotSource.length > 1

  useEffect(() => {
    if (!canRotate) return undefined
    // 批 7c · 自动轮换随机选池里一道（与手动抓取一致的"随机抓一个物品"手感）
    const timer = setInterval(() => setRotIdx(Math.floor(Math.random() * (rotSource.length || 1))), ROTATE_MS)
    return () => clearInterval(timer)
  }, [canRotate, rotateToken, rotSource.length])

  // 抓取后换主推：批 7c 改为「从池里随机抓任意一道」，不再顺序 rotIdx+1——
  // 模拟真娃娃机"每次抓上来的是堆里随机一个物品"。网格仍保持不动（那是"你家稳定爱吃的那几道"）。
  const nextDish = () => {
    setRotIdx(Math.floor(Math.random() * (rotSource.length || 1)))
    setRotateToken(t => t + 1)
  }

  // 撤销一次"抓取即加购"：按【抓取那一刻】的人格（lastCatchPersonaRef 快照）减数量，
  // 减到 0 自动移除该行。M-s2：避免浮标 4.2s 窗口内切人格撤销错减他人格。
  const undoCatch = (dish) => {
    const personaAt = lastCatchPersonaRef.current
    const cur = items.find(i => i.dish_id === dish.id && i.added_by === personaAt)?.quantity ?? 0
    if (cur > 0) updateQuantity(dish.id, cur - 1, personaAt)
  }

  return (
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100dvh - var(--bottom-inset))' }}>
      <PageHeader title={pageTitle} subtitle={sweetNote} right={<ThemeToggle />} />

      <PageContainer>
        {/* 批 6d · 今日心情 chips（只影响副标题池，不动主题色）*/}
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
        {/* 批 1 · 纪念日横幅：仅命中时插入，未命中不占位；绑定了 dish 时给一个跳详情的入口 */}
        {todayHit && (
          <AnniversaryBanner
            hit={todayHit}
            dishName={hitDish ? hitDish.name : ''}
            onOpenDish={hitDish ? () => navigate(`/dish/${hitDish.id}`) : undefined}
          />
        )}
        {/* —— 抓娃娃点餐机（V3 设计稿签名交互）：主页第一焦点 ——
            主推菜住玻璃罩，"抓取"=爪子垂下夹菜；泡泡时钟 + 自动轮换播放/暂停常驻机顶。
            悬停/键盘聚焦暂停轮换，触屏起手重置倒计时，避免用户正看时被换走。 */}
        {featured && (
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onTouchStart={() => setRotateToken((t) => t + 1)}
          >
            <ClawMachine
              dish={featured}
              indexNo={(rotIdx % rotSource.length) + 1}
              onCatch={onCatch}
              onUndo={undoCatch}
              onGrab={nextDish}
              onOpen={() => navigate(`/dish/${featured.id}`)}
              autoOn={autoOn}
              onToggleAuto={() => setAutoOn((v) => !v)}
              pool={rotSource}
              rotate={canRotate ? { key: `${featured.id}-${rotateToken}-${paused}-${tabVisible}`, durationMs: ROTATE_MS } : null}
            />
            {/* 批 3c · 今日菜卡分享入口：抓娃娃机之下小字按钮，点开弹生成海报 sheet */}
            <button
              onClick={() => setShareOpen(true)}
              aria-label={`分享今日菜卡：${featured.name}`}
              className="w-full mt-3 min-h-[44px] py-2 text-xs font-bold text-[var(--color-clay-text)] flex items-center justify-center gap-1 rounded-full"
              style={{ border: '2px dashed var(--color-line)' }}
            >
              <span aria-hidden>📸</span> 分享今日菜卡给 TA 看
            </button>
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
                    /* B4：网格卡键盘可达（进详情） */
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
                  /* B4：最近订单卡键盘可达 */
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

      {/* 撑满剩余高度，把草地收边推到底（内容不足一屏时不留大片空白） */}
      <div aria-hidden="true" style={{ flex: '1 1 auto', minHeight: 'var(--space-section)' }} />
      {/* 牧场草地收边：页面在草皮上落幕（夜宵自动压暗） */}
      <div aria-hidden="true" className="grass-hem relative z-[2]" />

      {/* 批 3c · 今日菜卡分享 sheet */}
      <DishShareCard
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        dish={featured}
        indexNo={rotSource.length ? (rotIdx % rotSource.length) + 1 : 1}
      />
    </div>
  )
}
