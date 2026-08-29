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

const QUICK_ACTIONS = [
  { label: '菜单', emoji: '🍜', path: '/menu' },
  { label: '收藏', emoji: '⭐', path: '/menu?fav=1' },
  { label: '订单', emoji: '📋', path: '/orders' },
  { label: '我的', emoji: '👤', path: '/profile' },
]

const MOTIVATIONS = [
  '吃饱了才有力气减肥~', '今天也要好好吃饭呀', '唯有美食与爱不可辜负',
  '吃好喝好，长生不老', '人生苦短，再来一碗', '肚子饱了，心情就好了',
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/**
 * 首页 —— 按重构方案收敛为「主推大卡 + 2 列网格 + 竖列表」3 种列表隐喻，约 1.5 屏。
 * （此前的 3D 轮播 Banner、八大菜系横轨、为你推荐横轨均已移除：隐喻过多且推流重复）
 */
export default function Home() {
  const [recentOrders, setRecentOrders] = useState([])
  const [featured, setFeatured] = useState(null)
  const [popular, setPopular] = useState([])
  const [motivation] = useState(() => MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)])
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

      <PageHeader title={`${getGreeting()}，今天吃什么？`} subtitle={motivation} />

      <PageContainer>
        {/* 快捷入口 */}
        <motion.div className="grid grid-cols-4 gap-3" {...contentEnter()}>
          {QUICK_ACTIONS.map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.92, y: 2 }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400 } }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1.5 py-2"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl glass"
                style={{ boxShadow: 'var(--shadow-3)' }}
              >
                {action.emoji}
              </div>
              <span className="text-xs font-bold text-[var(--color-ash)]">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* 今日推荐主推大卡 */}
        {featured && (
          <motion.div {...contentEnter(0.05)}>
            <SectionHeader
              title="今日推荐"
              action={<button onClick={() => navigate('/menu')} className="text-xs text-[var(--color-clay)] font-bold">换一道 →</button>}
            />
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/dish/${featured.id}`)}
              className="d3-card-face overflow-hidden cursor-pointer mt-3"
            >
              <div className="relative h-48">
                {getDishImage(featured) ? (
                  <img src={getDishImage(featured)} alt={featured.name} className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-6xl"
                    style={{ background: 'linear-gradient(145deg, var(--color-cream), var(--color-cream-dark))' }}
                  >
                    {getCategoryEmoji(featured.category)}
                  </div>
                )}
                {/* 底部说明层：暖墨渐变压底保证可读 */}
                <div
                  className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-10"
                  style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(43,38,32,0.55) 100%)' }}
                >
                  <span
                    className="inline-block text-xs font-extrabold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--color-clay)', color: '#FFFDF9' }}
                  >
                    今日主推
                  </span>
                  <div className="flex items-end justify-between gap-3 mt-1.5">
                    <p className="text-lg font-bold text-[#FFFDF9] truncate">{featured.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <KissIcon className="w-4 h-4 text-[#FFFDF9]" />
                      <span className="text-lg font-extrabold text-[#FFFDF9] tabular-nums">{featured.price}</span>
                    </div>
                  </div>
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
              {popular.map((dish) => (
                <motion.div
                  key={dish.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/dish/${dish.id}`)}
                  className="d3-card-face cursor-pointer flex items-center gap-3"
                  style={{ padding: 'var(--space-card-p)' }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, var(--color-cream), var(--color-cream-dark))' }}
                  >
                    {getDishImage(dish)
                      ? <img src={getDishImage(dish)} className="w-full h-full object-cover" alt={dish.name} />
                      : <span>{getCategoryEmoji(dish?.category)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                      <span className="text-xs font-bold text-[var(--color-clay)]">{dish.price}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
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
                    <span className="text-sm font-bold text-[var(--color-clay)]">{order.total_price}</span>
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
