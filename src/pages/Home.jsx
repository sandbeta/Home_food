import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { contentEnter } from '../theme/motion'
import { HERO_IMAGES } from '../theme/images'
import { NICKNAME, pickOne, HOME_NOTES } from '../lib/sweetCopy'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

// 常点人 mock：按菜品 id 稳定分配 🐱/🐰，让双人格出现在首页网格里
const chefOf = (dish) => (dish.id % 2 === 0 ? 'me' : 'partner')

/**
 * 首页 —— 「主推大卡 + 2 列网格 + 竖列表」，约 1 屏出头。
 * 不设快捷入口：与底部导航功能重复（用户实测反馈后移除），
 * 收藏走点菜页分段控件，订单/我的走底部导航。
 */
export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  const [featured, setFeatured] = useState(null)
  const [popular, setPopular] = useState([])
  const [sweetNote] = useState(() => pickOne(HOME_NOTES))
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/orders').then(r => r.json()).then(d => setRecentOrders(d.slice(0, 3)))
    fetch('/api/dishes?category=全部').then(r => r.json()).then(d => {
      const shuffled = [...d].sort(() => 0.5 - Math.random())
      setFeatured(shuffled[0] || null)
      setPopular(shuffled.slice(1, 7))
    })
  }, [])

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.home} variant="immersive" alt="今日美食" />

      <PageHeader title={`${getGreeting()}，${NICKNAME}`} subtitle={sweetNote} />

      <PageContainer>
        {/* 今日主推 —— 全页深色锚点：clay 实底 + 白字大号 serif 价格 */}
        {featured && (
          <motion.div {...contentEnter(0.05)}>
            <SectionHeader
              title="今日推荐"
              action={<button onClick={() => navigate('/menu')} className="text-xs text-[var(--color-clay)] font-bold">换一道 →</button>}
            />
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/dish/${featured.id}`)}
              className="overflow-hidden cursor-pointer mt-3"
              style={{
                borderRadius: 'var(--radius-card)',
                background: 'var(--color-clay-gradient)',
                boxShadow: 'var(--shadow-4)',
              }}
            >
              <div
                className="relative h-44 overflow-hidden flex items-center justify-center"
                style={{ background: 'rgba(255,253,249,0.16)' }}
              >
                <span className="text-6xl">{getCategoryEmoji(featured.category)}</span>
                {getDishImage(featured) && (
                  <img
                    src={getDishImage(featured)}
                    alt={featured.name}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
              <div className="flex items-end justify-between gap-3 px-4 pb-3.5 pt-3">
                <div className="min-w-0">
                  <span
                    className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,253,249,0.22)', color: '#FFFDF9' }}
                  >
                    今日主推
                  </span>
                  <p className="font-serif text-xl font-bold text-[#FFFDF9] truncate mt-1.5">{featured.name}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <KissIcon className="w-4 h-4 text-[#FFFDF9]" />
                  <span className="font-serif text-2xl font-extrabold text-[#FFFDF9] tabular-nums">{featured.price}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* 常点的 */}
        {popular.length > 0 && (
          <motion.div {...contentEnter(0.1)}>
            <SectionHeader
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
                    onClick={() => navigate(`/dish/${dish.id}`)}
                    className="d3-card-face cursor-pointer flex items-center gap-3 relative"
                    style={{ padding: 'var(--space-card-p)' }}
                  >
                    <div
                      className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2 border-[var(--color-ink-900)] ${chef === 'me' ? 'avatar-me' : 'avatar-partner'}`}
                      title={chef === 'me' ? '我常点' : 'TA 常点'}
                    >
                      {chef === 'me' ? '🐱' : '🐰'}
                    </div>
                    <div
                      className="relative w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden"
                      style={{ background: 'linear-gradient(145deg, var(--color-cream), var(--color-cream-dark))' }}
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
                        <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums">{dish.price}</span>
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
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--color-cream), var(--color-cream-dark))' }}
                    >
                      📦
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
                    <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums">{order.total_price}</span>
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
