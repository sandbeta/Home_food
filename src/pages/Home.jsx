import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import Icon from '../components/ui/Icons'
import ThemeToggle from '../components/ui/ThemeToggle'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { contentEnter, EASE, usePrefersReducedMotion } from '../theme/motion'
import { HERO_IMAGES } from '../theme/images'
import { NICKNAME, pickOne, HOME_NOTES, RETRY_NOTES } from '../lib/sweetCopy'
import { morphTo, heroNameFor, cacheList } from '../lib/vt'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// 封面刊头条的竖排日期（实时信息，非文案池内容）
function todayLine() {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日 周${'日一二三四五六'[d.getDay()]}`
}

// 常点人 mock：按菜品 id 稳定分配 🐱/🐰，让双人格出现在首页网格里
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
  const [dishes, setDishes] = useState([])
  // 三态（2026-09-19 critique）：加载中/失败可重试/0 菜引导——此前静默空白像页面坏了
  const [homeLoading, setHomeLoading] = useState(true)
  const [homeFailed, setHomeFailed] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [rotIdx, setRotIdx] = useState(0)
  const [gridOffset, setGridOffset] = useState(0)
  // 交互后重建定时器：避免用户刚点完「换一道」，1 秒后又被自动轮换顶掉
  const [rotateToken, setRotateToken] = useState(0)
  const [paused, setPaused] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)
  const [sweetNote] = useState(() => pickOne(HOME_NOTES))
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  // 刊头条的期号 = 年内第几周（实时信息）
  const weekNo = (() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  })()

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

  const featured = rotSource.length ? rotSource[rotIdx % rotSource.length] : null
  const popular = gridIdx.map(i => dishes[i])

  // reduced-motion / 手指按住卡片 / 标签页隐藏 / 池子不足两道时都不自动轮换
  const canRotate = !reduced && !paused && tabVisible && rotSource.length > 1

  useEffect(() => {
    if (!canRotate) return undefined
    const timer = setInterval(() => setRotIdx(i => i + 1), ROTATE_MS)
    return () => clearInterval(timer)
  }, [canRotate, rotateToken, rotSource.length])

  // 手动「换一道」：大卡与网格一起顺移（保留原有手感），并重置自动轮换计时
  const nextDish = () => {
    setRotIdx(i => i + 1)
    setGridOffset(o => o + 1)
    setRotateToken(t => t + 1)
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.home} variant="immersive" alt="今日美食" />

      <PageHeader title={`${getGreeting()}，${NICKNAME}`} subtitle={sweetNote} right={<ThemeToggle />} />

      <PageContainer>
        {/* —— 封面刊头条（bolder 2026-09-19）：杂志封面语言 ——
            超大衬线刊名拆两行错位排布（晨光右上起、厨房右下收），书脊侧竖排日期，
            封面菜照片卡倾斜叠压刊名右下（图文叠压），
            folio 小字行（刊名英文 + 期号日期）压在大字之下、发丝线之上——
            杂志封面的正典顺序：报头是主角，刊号信息退为页脚注。
            整条落在 hero 底图上沿、靠加浓的 wash 顶部保对比；
            入场位移全在内层 motion，外层不带 transform。 */}
        <motion.div {...contentEnter(0.04)} className="relative">
          <div className="relative">
            {/* 书脊竖排日期 */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-2 text-[10px] font-bold"
              style={{ writingMode: 'vertical-rl', letterSpacing: '0.3em', color: 'var(--color-ash)' }}
            >
              {todayLine()}
            </span>
            {/* 错位刊名：两行大字各占一角，中间留出对角线张力 */}
            <h2
              className="font-serif font-bold"
              style={{
                fontSize: 'clamp(52px, 15vw, 74px)',
                lineHeight: 0.94,
                letterSpacing: '-0.035em',
                color: 'var(--color-bone)',
              }}
            >
              <span className="block" style={{ paddingLeft: 44 }}>晨光</span>
              <span className="block text-right" style={{ paddingRight: 112 }}>厨房</span>
            </h2>
            {/* 封面菜照片卡：倾斜 5° 叠压刊名第二行右角 */}
            {featured && (
              <motion.button
                type="button"
                {...contentEnter(0.14)}
                whileTap={{ scale: 0.96 }}
                onClick={(e) => morphTo(navigate, `/dish/${featured.id}`, e, featured, '/home')}
                aria-label={`封面菜：${featured.name}`}
                className="absolute right-0 -bottom-4 w-[124px] text-left cursor-pointer"
              >
                <span className="block rotate-[5deg]">
                  <span
                    className="d3-card-face block overflow-hidden"
                    style={{ borderRadius: 'var(--radius-tile)', boxShadow: 'var(--shadow-4)' }}
                  >
                    <span
                      className="vt-dish-frame relative flex h-[124px] items-center justify-center text-5xl overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, var(--color-ink-900), var(--color-ink-850))', viewTransitionName: heroNameFor(featured.id) }}
                    >
                      <span>{getCategoryEmoji(featured.category)}</span>
                      {getDishImage(featured) && (
                        <img
                          src={getDishImage(featured)}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                    </span>
                  </span>
                  <span
                    className="mt-1.5 block text-right text-[10px] font-bold truncate"
                    style={{ color: 'var(--color-ash)', letterSpacing: '0.06em' }}
                  >
                    封面 · {featured.name}
                  </span>
                </span>
              </motion.button>
            )}
            {/* folio 行：英文刊名 + 期号，左对齐一行读完；右侧整块让给悬挂的封面卡 */}
            <div className="relative mt-4 flex items-baseline gap-3">
              <span
                className="text-[10px] font-bold uppercase truncate"
                style={{ letterSpacing: '0.18em', color: 'var(--color-ash)' }}
              >
                The Kitchen Zine
              </span>
              <span aria-hidden="true" style={{ width: 18, borderTop: '1px solid var(--color-glass-border)' }} />
              <span
                className="shrink-0 font-serif text-sm font-bold tabular-nums"
                style={{ color: 'var(--clay-deep)' }}
              >
                No.{String(weekNo).padStart(2, '0')}
              </span>
            </div>
          </div>
          {/* 刊头条收口发丝线：与页头分隔线同一套栏目语言；留出封面卡卡注的下垂高度 */}
          <div className="ink-reveal-line" style={{ borderTop: '1px solid var(--color-glass-border)', marginTop: 32 }} />
        </motion.div>
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
            emoji="🍳"
            title="厨房还空着"
            desc="去点菜页挑几道，开火第一顿"
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
        {/* 今日主推 —— 全页深色锚点：clay 实底 + 白字大号 serif 价格 */}
        {featured && (
          <motion.div {...contentEnter(0.05)}>
            <SectionHeader
              index={1}
              title="今日推荐"
              action={
                <button
                  onClick={nextDish}
                  className="text-xs text-[var(--color-clay)] font-bold"
                >
                  换一道 →
                </button>
              }
            />
            <div
              className="relative mt-3"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={featured.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/dish/${featured.id}`)}
                  className="relative overflow-hidden cursor-pointer"
                  style={{
                    borderRadius: 'var(--radius-card)',
                    background: 'var(--anchor-ink)',
                    boxShadow: 'var(--shadow-4)',
                  }}
                >
                  <div
                    className="relative h-44 overflow-hidden flex items-center justify-center"
                    style={{ background: 'rgba(255,253,249,0.16)' }}
                  >
                    <div
                      className="absolute w-44 h-44 rounded-full"
                      style={{ background: 'radial-gradient(circle, rgba(255,253,249,0.22), transparent 70%)' }}
                    />
                    <span className="text-7xl relative">{getCategoryEmoji(featured.category)}</span>
                    {getDishImage(featured) && (
                      <img
                        src={getDishImage(featured)}
                        alt={featured.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3 px-5 pb-4 pt-3.5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase truncate" style={{ letterSpacing: '0.18em', color: 'rgba(255,253,249,0.78)' }}>
                        No.{String(rotIdx % rotSource.length + 1).padStart(2, '0')} · 今日主推
                      </p>
                      <p className="font-serif text-2xl font-bold text-[#FFFDF9] truncate mt-1">{featured.name}</p>
                    </div>
                    <div className="flex items-baseline gap-1 shrink-0">
                      <KissIcon className="w-4 h-4 shrink-0 translate-y-[-2px] text-[#FFFDF9]" />
                      <span className="font-serif font-bold text-[#FFFDF9] tabular-nums" style={{ fontSize: '2rem', letterSpacing: '-0.035em', lineHeight: 1 }}><span className="text-[0.55em] mr-0.5">¥</span>{featured.price}</span>
                    </div>
                  </div>

                  {/* 轮换进度条：预告下一次切换，让用户不会觉得画面"自己乱动" */}
                  {canRotate && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px]"
                      style={{ background: 'rgba(255,253,249,0.18)' }}
                    >
                      <div
                        key={`${featured.id}-${rotateToken}-${paused}-${tabVisible}`}
                        className="h-full rot-progress-bar"
                        style={{
                          background: 'rgba(255,253,249,0.78)',
                          animationDuration: `${ROTATE_MS}ms`,
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* 常点的 */}
        {popular.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
              index={2}
              title="常点的"
              action={<button onClick={() => navigate('/menu')} className="text-xs text-[var(--color-clay)] font-bold">全部 →</button>}
            />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {popular.map((dish) => {
                const chef = chefOf(dish)
                return (
                  <motion.div
                    key={dish.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/home')}
                    className="vt-dish-host d3-card-face cursor-pointer flex items-center gap-3 relative"
                    style={{ padding: 'var(--space-card-p)' }}
                  >
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[var(--color-ink-900)] ${chef === 'me' ? 'avatar-me' : 'avatar-partner'}`}
                      title={chef === 'me' ? '我常点' : 'TA 常点'}
                    >
                      {chef === 'me' ? '🐱' : '🐰'}
                    </div>
                    <div
                      className="vt-dish-frame relative w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, var(--color-ink-900), var(--color-ink-850))', viewTransitionName: heroNameFor(dish.id) }}
                    >
                      <span>{getCategoryEmoji(dish?.category)}</span>
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
              index={3}
              title="最近订单"
              action={<button onClick={() => navigate('/orders')} className="text-xs text-[var(--color-clay)] font-bold">全部</button>}
            />
            <div className="space-y-2.5 mt-3">
              {recentOrders.map((order) => (
                <motion.div
                  key={order.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
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
                        {order.items.map(i => `${i.dish_name}×${i.quantity}`).join('、')}
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
    </div>
  )
}
