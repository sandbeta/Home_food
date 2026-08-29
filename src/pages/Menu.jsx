import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import DishRow from '../components/ui/DishRow'
import PageContainer from '../components/ui/PageContainer'
import EmptyState from '../components/ui/EmptyState'
import { useFavorites } from '../lib/favorites'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'

// 仅保留 emoji；旧版彩虹色全部移除，改用晨光玻璃 + 赤陶/鼠尾草绿强调
const CATEGORY_CONFIG = {
  '全部': { emoji: '✨' }, '家常菜': { emoji: '🍳' }, '硬菜': { emoji: '🥩' }, '素菜': { emoji: '🥬' },
  '主食': { emoji: '🍚' }, '小吃': { emoji: '🍢' }, '水果': { emoji: '🍎' }, '饮品': { emoji: '🧋' },
  '汤类': { emoji: '🍲' }, '川菜': { emoji: '🌶️' }, '粤菜': { emoji: '🥢' }, '湘菜': { emoji: '🔥' },
  '鲁菜': { emoji: '🍤' }, '苏菜': { emoji: '🪷' }, '浙菜': { emoji: '🐟' }, '闽菜': { emoji: '🦐' },
  '徽菜': { emoji: '🍲' }, '东北菜': { emoji: '🥟' }, '西北菜': { emoji: '🍖' }, '云贵菜': { emoji: '🍄' },
  '其他': { emoji: '🍽️' },
}

function WhoSelector({ whoAmI, setWhoAmI }) {
  return (
    <div className="d3-card-face p-1.5 flex items-center gap-1.5 mb-4">
      <span className="pl-2 pr-1 text-xs text-[var(--color-ash)] font-bold">给谁点</span>
      {[{ value: 'me', label: '自己', icon: '🐱' }, { value: 'partner', label: 'TA', icon: '🐰' }].map(opt => {
        const active = whoAmI === opt.value
        return (
          <motion.button key={opt.value} whileTap={{ scale: 0.95 }} onClick={() => setWhoAmI(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-sm font-bold transition-all duration-300 ease-out ${active ? (opt.value === 'me' ? 'avatar-me glow-clay' : 'avatar-partner glow-sage') : 'text-[var(--color-ash)] hover:bg-white/5'}`}
            animate={active ? { scale: 1.02 } : { scale: 1 }}>
            <motion.span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-xs"
              animate={active ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
              transition={{ duration: 0.5 }}>{opt.icon}</motion.span>
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}

function RecommendCard({ dishes, onAdd, spawnParticle }) {
  const randomDish = useMemo(() => {
    if (dishes.length === 0) return null
    return dishes[Math.floor(Math.random() * dishes.length)]
  }, [dishes])

  if (!randomDish) return null

  return (
    <GlassCard className="p-4 mb-4 overflow-hidden relative">
      <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full animate-float-gentle"
        style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.14), transparent 70%)' }} />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full animate-float"
        style={{ background: 'radial-gradient(circle, rgba(127,163,122,0.10), transparent 70%)', animationDelay: '1s' }} />

      <div className="relative flex items-center justify-between mb-3">
        <span className="badge-soft text-xs font-extrabold px-2.5 py-1 rounded-full"
          style={{ background: 'rgba(200,104,63,0.14)', color: 'var(--color-clay)' }}>今日灵感</span>
        <span className="text-xs text-[var(--color-ash)]">不知道吃啥就选它</span>
      </div>
      <div className="relative flex items-center gap-3">
        <div className="w-16 h-16 rounded-[var(--radius-tile)] flex items-center justify-center shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(145deg, var(--color-cream) 0%, var(--color-cream-dark) 60%, rgba(200,104,63,0.08) 100%)' }}>
          {randomDish.image_url ? <img src={randomDish.image_url} className="w-full h-full object-cover" alt={randomDish.name} /> : <span className="text-3xl">{CATEGORY_CONFIG[randomDish.category]?.emoji || '🍽️'}</span>}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-[var(--color-bone)] truncate">{randomDish.name}</h3>
          <p className="text-xs text-[var(--color-ash)] mt-0.5 line-clamp-1">{randomDish.description || '好吃的~'}</p>
          <div className="flex items-center gap-1 mt-1.5">
            <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
            <span className="font-serif text-base font-extrabold text-[var(--color-caramel)]">{randomDish.price}</span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.04 }} onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          spawnParticle(rect.left + rect.width / 2, rect.top)
          onAdd(randomDish)
        }}
          className="d3-btn d3-btn-primary px-3.5 py-2 rounded-2xl text-xs font-bold">
          加一份
        </motion.button>
      </div>
    </GlassCard>
  )
}

const CATEGORY_GROUPS = [
  { label: '家常', items: ['全部', '家常菜', '硬菜', '素菜', '主食', '小吃', '水果', '饮品', '汤类'] },
  { label: '八大菜系', items: ['川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜'] },
  { label: '地方风味', items: ['东北菜', '西北菜', '云贵菜', '其他'] },
]

export default function Menu() {
  const [dishes, setDishes] = useState([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchFocused, setSearchFocused] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const searchRef = useRef(null)
  const [particles, setParticles] = useState([])
  const { addItem, whoAmI, setWhoAmI } = useCart()
  const { favorites, has, toggle } = useFavorites()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 收藏已并入本页：'all'=全部菜品，'fav'=我的收藏
  // 支持 ?fav=1 直达收藏（/favorites 旧路由重定向到这里）
  const [scope, setScope] = useState(() => (searchParams.get('fav') ? 'fav' : 'all'))
  const isFavScope = scope === 'fav'

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dishes?category=${encodeURIComponent(activeCategory)}`)
      .then(r => r.json())
      .then(data => { setDishes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory])

  // 收藏页签的数据源是本地收藏夹，全部页签是服务端返回；关键词对两者都生效
  const filteredDishes = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const base = isFavScope ? favorites : dishes
    if (!q) return base
    return base.filter(d => `${d.name} ${d.category} ${d.description || ''}`.toLowerCase().includes(q))
  }, [isFavScope, favorites, dishes, keyword])

  // /favorites 旧链接会重定向到 /menu?fav=1；若此时已停在 /menu（组件未重挂载），这里热同步页签
  useEffect(() => {
    if (searchParams.get('fav')) setScope('fav')
  }, [searchParams])

  const spawnParticle = (x, y) => {
    const id = Date.now() + Math.random()
    setParticles(prev => [...prev, { id, x, y }])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 950)
  }

  const partner = PERSONA[whoAmI]

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.menu} variant="immersive" alt="菜单" />

      <PageHeader title="今天吃什么？" subtitle="一起选点好吃的吧~" />

      <PageContainer>
        <WhoSelector whoAmI={whoAmI} setWhoAmI={setWhoAmI} />

        {/* 分段控件：收藏并入点菜页（收藏的下一步动作永远是加购，不该埋两级深） */}
        <div className="d3-card-face p-1.5 flex items-center gap-1.5">
          {[
            { value: 'all', label: '全部菜品', emoji: '🍜' },
            { value: 'fav', label: '我的收藏', emoji: '⭐' },
          ].map((opt) => {
            const active = scope === opt.value
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScope(opt.value)}
                aria-pressed={active}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold transition-all duration-300"
                style={{
                  borderRadius: 'var(--radius-ctl)',
                  ...(active
                    ? {
                        background: 'var(--color-clay-gradient)',
                        color: '#FFFDF9',
                        boxShadow: '0 4px 12px rgba(200,104,63,0.26)',
                      }
                    : { color: 'var(--color-ash)' }),
                }}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </motion.button>
            )
          })}
        </div>

        {/* 搜索框 */}
        <div className={`d3-card-face flex items-center gap-2 px-3 py-2.5 mb-4 bg-[var(--color-ink-800)]/80 transition-all duration-300 ${searchFocused ? 'ring-[3px] ring-[var(--color-clay)]/25 border-[var(--color-clay)]/40' : ''}`}
          ref={searchRef}>
          <motion.svg className={`w-4 h-4 text-[var(--color-ash)] transition-colors duration-300 ${searchFocused ? 'text-[var(--color-clay)]' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
            animate={searchFocused ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </motion.svg>
          <input value={keyword} onChange={e => setKeyword(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="搜搜想吃的菜..."
            className="d3-input bg-transparent flex-1 text-sm placeholder:text-[var(--color-mist)] outline-none" />
          <AnimatePresence>
            {keyword && (
              <motion.button onClick={() => setKeyword('')}
                initial={{ opacity: 0, scale: 0.8, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-xs text-[var(--color-clay)] font-bold px-1 whitespace-nowrap overflow-hidden">清空</motion.button>
            )}
          </AnimatePresence>
        </div>

        {!loading && <RecommendCard dishes={filteredDishes.length ? filteredDishes : dishes} onAdd={addItem} spawnParticle={spawnParticle} />}

        {/* 分类标签 - 可折叠分组网格布局 */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {CATEGORY_GROUPS[0].items.map(cat => {
              const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['其他']
              const active = activeCategory === cat
              return (
                <motion.button key={cat}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -1 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${active ? 'd3-btn d3-btn-primary text-[#FFFDF9]' : 'd3-btn-sm text-[var(--color-ash)] hover:text-[var(--color-bone)]'}`}>
                  <span className="text-xs">{cfg.emoji}</span>{cat}
                </motion.button>
              )
            })}
            {!showAllCategories && (
              <motion.button
                key="toggle-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllCategories(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-[var(--color-clay)]/30 text-[var(--color-clay)] hover:bg-[var(--color-clay)]/5 transition-all duration-300">
                更多菜系
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 4.5L6 7.5L9 4.5" />
                </svg>
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showAllCategories && (
              <motion.div
                key="expanded-categories"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAllCategories(false)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-[var(--color-ash)] hover:text-[var(--color-clay)] transition-colors duration-200">
                      收起
                      <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7.5L6 4.5L9 7.5" />
                      </svg>
                    </motion.button>
                  </div>
                  {CATEGORY_GROUPS.slice(1).map(group => (
                    <div key={group.label}>
                      <div className="text-xs font-extrabold px-0.5 pb-1 text-[var(--color-clay)]">{group.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {group.items.map(cat => {
                          const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['其他']
                          const active = activeCategory === cat
                          return (
                            <motion.button key={cat}
                              whileTap={{ scale: 0.95 }}
                              whileHover={{ y: -1 }}
                              onClick={() => setActiveCategory(cat)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${active ? 'd3-btn d3-btn-primary text-[#FFFDF9]' : 'd3-btn-sm text-[var(--color-ash)] hover:text-[var(--color-bone)]'}`}>
                              <span className="text-xs">{cfg.emoji}</span>{cat}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loading ? (
          <div className="space-y-3.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="d3-card p-3.5 flex items-center gap-3 overflow-hidden">
                <div className="w-[70px] h-[70px] rounded-[var(--radius-tile)] animate-shimmer-fade shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-[16px] w-[55%] animate-shimmer-fade rounded-full" style={{ animationDelay: `${i * 0.15}s` }} />
                  <div className="h-[12px] w-[35%] animate-shimmer-fade rounded-full" style={{ animationDelay: `${i * 0.15 + 0.1}s` }} />
                  <div className="h-[12px] w-[25%] animate-shimmer-fade rounded-full" style={{ animationDelay: `${i * 0.15 + 0.2}s` }} />
                </div>
              </div>
            ))}
          </div>
        ) : isFavScope && favorites.length === 0 ? (
          <EmptyState
            emoji="⭐"
            title="还没有收藏的菜"
            desc="看到想吃的点个⭐，下次直接从这里找"
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setScope('all')}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                去逛逛
              </motion.button>
            }
          />
        ) : filteredDishes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="d3-card flex flex-col items-center justify-center py-16 px-4">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <div className="w-32 h-32 rounded-full animate-pulse-soft"
                style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.08), transparent 70%)' }} />
            </div>
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5 animate-float"
                style={{ background: 'linear-gradient(135deg, rgba(200,104,63,0.12), rgba(127,163,122,0.08))' }}>
                <span className="text-5xl">🔍</span>
              </div>
            </div>
            <p className="text-[var(--color-bone)] font-bold text-base">没搜到这口</p>
            <p className="text-[var(--color-ash)] text-sm mt-1.5 text-center max-w-[200px] leading-relaxed">换个关键词试试~<br />也许换个名字就能找到啦</p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
            {filteredDishes.map(dish => (
              <DishRow
                key={`${dish.id}-${dish.name}`}
                dish={dish}
                showFav
                favorited={has(dish.id)}
                onToggleFav={toggle}
                onClick={() => navigate(`/dish/${dish.id}`)}
                addLabel={`添加${dish.name}`}
                accent={partner.gradient}
                onAdd={(d, e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  spawnParticle(rect.left + rect.width / 2, rect.top)
                  addItem(d)
                }}
              />
            ))}
          </div>
        )}
      </PageContainer>

      {/* +1 飘升粒子 */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -60, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="fixed z-[100] pointer-events-none"
            style={{ left: p.x, top: p.y }}
          >
            <div className="flex items-center gap-0.5 bg-gradient-to-r from-[var(--color-clay-soft)] to-[var(--color-clay)] text-[#FFFDF9] text-xs font-extrabold px-2 py-1 rounded-full shadow-lg">
              <span>+1</span>
              <KissIcon className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  )
}
