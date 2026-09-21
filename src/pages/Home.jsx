import { useState, useEffect } from 'react'
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
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { contentEnter, usePrefersReducedMotion } from '../theme/motion'
import { NICKNAME, pickOne, HOME_NOTES, RETRY_NOTES } from '../lib/sweetCopy'
import { morphTo, heroNameFor, cacheList } from '../lib/vt'
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
  const { addItem } = useCart()

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
    <div className="relative flex flex-col" style={{ minHeight: 'calc(100dvh - var(--bottom-inset))' }}>
      <PageHeader title={`${getGreeting()}，${NICKNAME}`} subtitle={sweetNote} right={<ThemeToggle />} />

      <PageContainer>
        {/* —— 抓娃娃点餐机（V3 设计稿签名交互）：主页第一焦点 ——
            主推菜住玻璃罩，"换一道"=爪子垂下抓取；泡泡时钟常驻机顶。
            悬停暂停自动轮换的口径与旧版一致。 */}
        {featured && (
          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <ClawMachine
              dish={featured}
              indexNo={(rotIdx % rotSource.length) + 1}
              onCatch={addItem}
              onGrab={nextDish}
              onOpen={() => navigate(`/dish/${featured.id}`)}
              rotate={canRotate ? { key: `${featured.id}-${rotateToken}-${paused}-${tabVisible}`, durationMs: ROTATE_MS } : null}
            />
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
                      {chef === 'me' ? '🐱' : '🐑'}
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
              index={2}
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

      {/* 撑满剩余高度，把草地收边推到底（内容不足一屏时不留大片空白） */}
      <div aria-hidden="true" style={{ flex: '1 1 auto', minHeight: 'var(--space-section)' }} />
      {/* 牧场草地收边：页面在草皮上落幕（夜宵自动压暗） */}
      <div aria-hidden="true" className="grass-hem relative z-[2]" />
    </div>
  )
}
