import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import SectionHeader from '../components/ui/SectionHeader'
import { getCategoryEmoji, getDishImage } from '../lib/categoryIcons'
import { contentEnter } from '../theme/motion'
import { HERO_IMAGES } from '../theme/images'
import { HOT_TRENDS, matchTrendDish } from '../lib/hotRecipes'
import { tap, vibrate } from '../lib/sfx'

// 排名色：前三金/银铜，其余安静
const RANK_COLORS = ['#C8683F', '#9A8F7F', '#B5793F']

export default function HotDishes() {
  const [dishes, setDishes] = useState([])
  const [orders, setOrders] = useState([])
  const [keyword, setKeyword] = useState('')
  const [toast, setToast] = useState(null)
  const { addItem } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/dishes?category=全部').then(r => r.json()).then(setDishes)
    fetch('/api/orders').then(r => r.json()).then(setOrders)
  }, [])

  // 你们的"最近热门"：按点单份数聚合（与外部趋势榜分开，一个是权威口径、一个是自家数据）
  const ownHot = useMemo(() => {
    const count = {}
    orders.forEach(o => o.items.forEach(i => {
      count[i.dish_id] = (count[i.dish_id] || 0) + i.quantity
    }))
    return Object.entries(count)
      .map(([id, times]) => ({ dish: dishes.find(d => d.id === Number(id)), times }))
      .filter(x => x.dish)
      .sort((a, b) => b.times - a.times)
      .slice(0, 8)
  }, [orders, dishes])

  // 搜索词同时过滤两个区块
  const q = keyword.trim().toLowerCase()
  const shownOwn = q ? ownHot.filter(x => `${x.dish.name}${x.dish.category}`.toLowerCase().includes(q)) : ownHot
  const shownTrends = q
    ? HOT_TRENDS.filter(t => t.name.toLowerCase().includes(q))
    : HOT_TRENDS

  const addDish = (dish) => {
    addItem(dish)
    tap()
    vibrate(10)
    const id = Date.now()
    setToast({ id, text: `已加入 ${dish.name}` })
    setTimeout(() => setToast(t => (t && t.id === id ? null : t)), 1600)
  }

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.menu} variant="immersive" alt="热门菜谱" />

      <PageHeader title="热门菜谱" subtitle="大家都在做什么菜" />

      <PageContainer>
        {/* 搜索 */}
        <div className="d3-card-face flex items-center gap-2 px-3 py-2.5 mb-4">
          <svg className="w-4 h-4 text-[var(--color-ash)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜菜名或食材，比如 牛肉"
            className="d3-input bg-transparent flex-1 text-sm placeholder:text-[var(--color-mist)] outline-none"
          />
        </div>

        {/* 你们最近点最多的 */}
        <motion.div {...contentEnter(0.05)}>
          <SectionHeader title="你家最近热门" action={<span className="text-xs text-[var(--color-ash)]">按点单份数</span>} />
          {shownOwn.length === 0 ? (
            <div className="d3-card-face mt-3 text-center" style={{ padding: 'var(--space-card-p)' }}>
              <p className="text-sm text-[var(--color-ash)]">
                {q ? '没搜到点过的菜~' : '点几单之后，你家自己的热门榜会在这里长出来'}
              </p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar mt-3 pb-1 -mx-[var(--space-page-x)] px-[var(--space-page-x)]">
              {shownOwn.map(({ dish, times }, idx) => (
                <motion.div
                  key={dish.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/dish/${dish.id}`)}
                  className="d3-card-face shrink-0 cursor-pointer overflow-hidden"
                  style={{ width: 132 }}
                >
                  <div className="relative h-20 overflow-hidden flex items-center justify-center"
                    style={{ background: 'linear-gradient(145deg, var(--color-ink-900), var(--color-ink-850))' }}>
                    <span className="text-4xl">{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full text-[#FFFDF9]"
                      style={{ background: idx < 3 ? RANK_COLORS[idx] : 'rgba(43,38,32,0.45)' }}>
                      NO.{idx + 1}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-bold text-[var(--color-bone)] truncate">{dish.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-[var(--color-ash)]">点了 {times} 份</span>
                      <span className="font-serif text-sm font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.75em] mr-px">¥</span>{dish.price}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 2026 家常趋势榜 */}
        <motion.div {...contentEnter(0.1)} className="mt-6">
          <SectionHeader title="2026 家常趋势榜" action={<span className="text-xs text-[var(--color-ash)]">家庭烹饪率口径</span>} />
          <div className="d3-card-face mt-3 overflow-hidden">
            {shownTrends.length === 0 ? (
              <div className="text-center" style={{ padding: 'var(--space-card-p)' }}>
                <p className="text-sm text-[var(--color-ash)]">榜单里没有这道菜~</p>
              </div>
            ) : shownTrends.map((t, idx) => {
              const dish = matchTrendDish(t.name, dishes)
              return (
                <div key={t.name}
                  className="flex items-center gap-3"
                  style={{ padding: 'var(--space-card-p)', borderTop: idx ? '1px solid var(--color-glass-border)' : 'none' }}>
                  {/* 名次 */}
                  <span className="font-serif text-lg font-extrabold w-7 text-center shrink-0 tabular-nums"
                    style={{ color: idx < 3 ? RANK_COLORS[idx] : 'var(--color-mist)' }}>
                    {idx + 1}
                  </span>
                  {/* 菜名 + 热度 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[var(--color-bone)] truncate">{t.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                        style={{ background: 'rgba(200,104,63,0.10)', color: 'var(--color-clay)' }}>
                        {t.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ash)] mt-0.5">{t.heat}</p>
                  </div>
                  {/* 行动区：菜单里有 → 看菜谱/点一份；没有 → 提示 */}
                  {dish ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => navigate(`/dish/${dish.id}`)}
                        className="d3-btn-sm px-2.5 py-1.5 text-xs font-bold text-[var(--color-ash)]"
                        style={{ background: 'rgba(43,38,32,0.05)' }}
                      >
                        菜谱
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addDish(dish)}
                        aria-label={`点一份${t.name}`}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--color-clay-gradient)',
                          boxShadow: '0 4px 10px rgba(200,104,63,0.28), inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFDF9" strokeWidth="2.8" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </motion.button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--color-mist)] shrink-0">家里还没这道</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* 数据来源脚注：诚实标注口径 */}
          <p className="text-center text-[11px] text-[var(--color-mist)] mt-3 leading-relaxed">
            趋势数据综合 2026 年公开家常菜榜单整理，仅供参考
          </p>
        </motion.div>
      </PageContainer>

      {/* 加购轻提示 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
            style={{ bottom: 'calc(var(--bottom-inset) + 8px)' }}
          >
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[#FFFDF9]"
              style={{ background: 'var(--color-clay-gradient)', boxShadow: 'var(--shadow-4)' }}>
              <KissIcon className="w-3.5 h-3.5" />
              {toast.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
