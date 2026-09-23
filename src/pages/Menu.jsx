import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import ThemeToggle from '../components/ui/ThemeToggle'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import Chip from '../components/ui/Chip'
import DishRow from '../components/ui/DishRow'
import PageContainer from '../components/ui/PageContainer'
import EmptyState from '../components/ui/EmptyState'
import LuckyDishCard from '../components/ui/LuckyDishCard'
import Icon from '../components/ui/Icons'
import WishFormModal from '../components/WishFormModal'
import { useFavorites } from '../lib/favorites'
import { isNightSnack } from '../lib/nightRules'
import { SCENES, scenePick } from '../lib/sceneRules'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'
import { pickOne, MENU_TITLES, MENU_NOTES, RETRY_NOTES } from '../lib/sweetCopy'
import { tap, vibrate } from '../lib/sfx'
import { morphTo, heroNameFor, cacheList, getCachedList } from '../lib/vt'
import { requestJson } from '../lib/request'
import { EASE, usePrefersReducedMotion } from '../theme/motion'

/* M-k3 修：读屏用户完全听不出当前谁在点菜——这是全站加购归属人格的关键状态。
   改 role=radiogroup + role=radio + aria-checked，emoji span aria-hidden 避免「猫脸」被朗读。
   M-t3 修：两钮 min-h-[44px]（原 py-2 高约 38，未达触摸线）。 */
function WhoSelector({ whoAmI, setWhoAmI }) {
  return (
    <div
      className="d3-card-face p-1.5 flex items-center gap-1.5 mb-4"
      role="radiogroup"
      aria-label="给谁点点菜"
    >
      <span className="pl-2 pr-1 text-xs text-[var(--color-ash)] font-bold">给谁点</span>
      {[{ value: 'me', label: '自己', icon: '🐱' }, { value: 'partner', label: 'TA', icon: '🐑' }].map(opt => {
        const active = whoAmI === opt.value
        return (
          <motion.button key={opt.value} whileTap={{ scale: 0.95 }} onClick={() => setWhoAmI(opt.value)}
            role="radio" aria-checked={active} aria-label={`${opt.label}点菜`}
            className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors duration-300 ${active ? (opt.value === 'me' ? 'avatar-me glow-clay' : 'avatar-partner glow-sage') : 'text-[var(--color-ash)]'}`}
            style={{ borderRadius: 'var(--radius-ctl)' }}
            animate={active ? { scale: 1.02 } : { scale: 1 }}>
            <motion.span className="w-5 h-5 rounded-full flex items-center justify-center text-xs" aria-hidden="true"
              style={{ background: 'color-mix(in srgb, var(--color-on-dark) 22%, transparent)' }}
              animate={active ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
              transition={{ duration: 0.5 }}>{opt.icon}</motion.span>
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}


const CATEGORY_GROUPS = [
  { label: '家常', items: ['全部', '夜宵', '家常菜', '硬菜', '素菜', '主食', '小吃', '水果', '饮品', '汤类'] },
  { label: '八大菜系', items: ['川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜'] },
  { label: '地方风味', items: ['东北菜', '西北菜', '云贵菜', '其他'] },
]

export default function Menu() {
  // 形变种子：从详情飞回来时首帧就有带图行，heroNameFor 才挂得上名（无缓存则维持骨架）
  const [searchParamsRaw] = useSearchParams()
  const [dishes, setDishes] = useState(() => getCachedList('menu') || [])
  /* m-24：activeCategory 初值从 URL ?cat= 读，避免 ?cat=夜宵 进入时先以 '全部' 发一次 + 热同步再置 '夜宵' 二次发的竞态 */
  const [activeCategory, setActiveCategory] = useState(() => searchParamsRaw.get('cat') || '全部')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(() => !getCachedList('menu'))
  const [loadError, setLoadError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)
  const [activeScene, setActiveScene] = useState(null) // 场景快选（sceneRules 前端过滤，与菜系正交）
  const [searchFocused, setSearchFocused] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [particles, setParticles] = useState([])
  /* 批 1 新增 · 愿望池入口（不管当前是否空态，末尾都给一个"菜单里没有？说给他"） */
  const [wishOpen, setWishOpen] = useState(false)
  const { addItem, whoAmI, setWhoAmI } = useCart()
  const { favorites, has, toggle } = useFavorites()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reduced = usePrefersReducedMotion()

  // 收藏已并入本页：'all'=全部菜品，'fav'=我的收藏
  // 支持 ?fav=1 直达收藏（/favorites 旧路由重定向到这里）
  const [scope, setScope] = useState(() => (searchParams.get('fav') ? 'fav' : 'all'))
  const isFavScope = scope === 'fav'

  // M-s8 修：夜宵伪分类与深夜弹窗都走 /api/dishes/all，但该端点不过滤 available → 下架后仍能一键加购。
  //   修：先 filter available !==0 再 nightPick；同时接 AbortController（m-24）与「有旧数据不整屏替换」（m-28）。
  //   activeCategory 初值从 searchParams 读，消掉 ?cat=夜宵 双发（m-24）。
  useEffect(() => {
    if (!getCachedList('menu')) setLoading(true)
    setLoadError(false)
    const ac = new AbortController()
    let alive = true
    const night = activeCategory === '夜宵' // 前端规则伪分类（nightRules），后端无此 category
    const url = night ? '/api/dishes/all' : `/api/dishes?category=${encodeURIComponent(activeCategory)}`
    requestJson(url, { signal: ac.signal }).then(r => r.json())
      .then(data => {
        if (!alive) return
        const available = Array.isArray(data) ? data.filter(d => Number(d.available) !== 0) : []
        const list = night ? available.filter(isNightSnack) : available
        setDishes(list); cacheList('menu', list); setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setLoading(false); setLoadError(true)
      })
    return () => { alive = false; try { ac.abort() } catch {} }
  }, [activeCategory, retryToken])

  // 收藏页签的数据源是本地收藏夹，全部页签是服务端返回；关键词对两者都生效
  const filteredDishes = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const base = isFavScope ? favorites : activeScene ? scenePick(dishes, activeScene) : dishes
    if (!q) return base
    return base.filter(d => `${d.name} ${d.category} ${d.description || ''}`.toLowerCase().includes(q))
  }, [isFavScope, favorites, dishes, keyword, activeScene])

  // /favorites 旧链接会重定向到 /menu?fav=1；若此时已停在 /menu（组件未重挂载），这里热同步页签
  useEffect(() => {
    if (searchParams.get('fav')) setScope('fav')
    if (searchParams.get('cat') === '夜宵') setActiveCategory('夜宵') // 夜宵弹窗「看全店」预选
  }, [searchParams])

  // 长列表分页渲染：初始 30 条 + 加载更多，避免 400+ 行一次性进 DOM（筛选条件变化时重置）
  const [visibleCount, setVisibleCount] = useState(30)
  useEffect(() => { setVisibleCount(30) }, [activeCategory, scope, keyword, activeScene])
  const visibleDishes = useMemo(
    () => filteredDishes.slice(0, visibleCount),
    [filteredDishes, visibleCount],
  )

  // 0 菜的分类不展示（如「其他」被清空时），避免点了空手而归
  const [catCounts, setCatCounts] = useState(null)
  const [pageTitle] = useState(() => pickOne(MENU_TITLES))
  const [pageNote] = useState(() => pickOne(MENU_NOTES))
  useEffect(() => {
    fetch('/api/dishes/all').then(r => r.json()).then(all => {
      const m = {}
      all.forEach(d => { if (Number(d.available) !== 0) m[d.category] = (m[d.category] || 0) + 1 })
      setCatCounts(m)
    }).catch(() => {})
  }, [])
  const visibleCats = (items) => (catCounts ? items.filter(cat => cat === '全部' || cat === '夜宵' || (catCounts[cat] || 0) > 0) : items)

  const spawnParticle = (x, y) => {
    tap()
    vibrate(8)
    const id = Date.now() + Math.random()
    const orb = document.getElementById('cart-orb')
    let tx, ty
    if (orb) { const r = orb.getBoundingClientRect(); tx = r.left + r.width / 2; ty = r.top + r.height / 2 }
    else { const shellW = Math.min(480, window.innerWidth); const shellL = (window.innerWidth - shellW) / 2; tx = shellL + shellW - 56; ty = window.innerHeight - 52 }
    setParticles(prev => [...prev, { id, x, y, tx, ty }])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 620)
  }

  const partner = PERSONA[whoAmI]

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.menu} variant="immersive" alt="菜单" />

      <PageHeader title={pageTitle} subtitle={pageNote} right={<ThemeToggle />} />

      <PageContainer>
        <WhoSelector whoAmI={whoAmI} setWhoAmI={setWhoAmI} />

        {/* 分段控件：收藏并入点菜页（收藏的下一步动作永远是加购，不该埋两级深）
            M-v5 修：emoji 🍜/⭐ 违反图标纪律 → 换 Icons.jsx 细线 SVG（menu=碗筷、heart=心），与其它 Chip/Dock 语言一致。 */}
        <div className="d3-card-face p-1.5 flex items-center gap-1.5" role="tablist">
          {[
            { value: 'all', label: '全部菜品', icon: 'menu' },
            { value: 'fav', label: '我的收藏', icon: 'heart' },
          ].map((opt) => {
            const active = scope === opt.value
            return (
              <motion.button
                key={opt.value}
                whileTap={{ scale: 0.96 }}
                onClick={() => setScope(opt.value)}
                role="tab"
                aria-selected={active}
                aria-pressed={active}
                className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-bold transition-colors duration-300"
                style={{
                  borderRadius: 'var(--radius-ctl)',
                  ...(active
                    ? {
                        background: 'var(--color-clay-gradient)',
                        color: 'var(--color-on-dark)',
                        boxShadow: '0 4px 12px color-mix(in srgb, var(--clay-50) 26%, transparent)',
                      }
                    : { color: 'var(--color-ash)' }),
                }}
              >
                <Icon name={opt.icon} size={16} strokeWidth={2.2} />
                {opt.label}
              </motion.button>
            )
          })}
        </div>

        {/* 搜索框 —— V3 设计稿：一枚糖果描边胶囊（此前是方卡套输入框，两层边界互相打架）
            m-15 修：input 无 label、外层无 role=search，读屏只朗读"编辑文本"→ 补 sr-only label + role=search。 */}
        <form role="search" onSubmit={(e) => e.preventDefault()}
          className={`d3-card-face flex items-center gap-2 px-4 py-2 transition-[box-shadow,border-color] duration-300 ${searchFocused ? 'ring-[3px] ring-[var(--color-clay)]/25 border-[var(--color-clay)]/40' : ''}`}
          style={{ borderRadius: '999px', background: 'var(--surface)' }}>
          <label htmlFor="menu-search" className="sr-only">搜菜名或食材</label>
          <motion.svg className={`w-4 h-4 shrink-0 text-[var(--color-ash)] transition-colors duration-300 ${searchFocused ? 'text-[var(--color-clay)]' : ''}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"
            animate={searchFocused ? { rotate: 90 } : { rotate: 0 }}
            transition={{ duration: 0.4, ease: EASE }}>
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </motion.svg>
          <input id="menu-search" value={keyword} onChange={e => setKeyword(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="想吃什么搜一下…"
            inputMode="search"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent border-0 text-sm text-[var(--color-bone)] placeholder:text-[var(--color-mist)]" />
          <AnimatePresence>
            {keyword && (
              <motion.button onClick={() => setKeyword('')} aria-label="清空搜索"
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.8, width: 0 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="min-h-[44px] text-xs text-[var(--color-clay-text)] font-bold px-2 whitespace-nowrap overflow-hidden shrink-0">清空</motion.button>
            )}
          </AnimatePresence>
        </form>

        {!loading && <LuckyDishCard dishes={dishes} onAdd={addItem} spawnParticle={spawnParticle} />}

        {/* 场景快选（2026-09-19 critique）：情侣心智语言的第一决策入口，再点一次取消；纯前端过滤当前列表 */}
        <div className="flex flex-wrap gap-2">
          {SCENES.map(s => (
            <Chip key={s.key} active={activeScene === s.key}
              onClick={() => { setActiveScene(cur => (cur === s.key ? null : s.key)); tap(); vibrate(6) }}>
              {s.label}
            </Chip>
          ))}
        </div>

        {/* 分类标签 - 可折叠分组网格布局（2026-09-19 收敛到共享 Chip：去 emoji、44px 触达、active clay 渐变） */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {(() => {
              const cats = visibleCats(CATEGORY_GROUPS[0].items)
              const shown = showAllCategories ? cats : cats.slice(0, 5)
              const withActive = !showAllCategories && activeCategory && !shown.includes(activeCategory) ? [...shown, activeCategory] : shown
              return withActive.map(cat => (
                <Chip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>{cat}</Chip>
              ))
            })()}
            {!showAllCategories && (
              <motion.button
                key="toggle-btn"
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAllCategories(true)}
                className="flex items-center gap-1 px-3 min-h-[44px] rounded-full text-xs font-bold border border-[var(--color-clay)]/30 text-[var(--color-clay-text)] hover:bg-[var(--color-clay)]/5 transition-colors duration-300">
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
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-end">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAllCategories(false)}
                      className="flex items-center gap-1 px-2 min-h-[44px] rounded-full text-xs font-bold text-[var(--color-ash)] hover:text-[var(--color-clay-text)] transition-colors duration-200">
                      收起
                      <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7.5L6 4.5L9 7.5" />
                      </svg>
                    </motion.button>
                  </div>
                  {CATEGORY_GROUPS.slice(1).map(group => (
                    <div key={group.label}>
                      <div className="text-xs font-bold px-0.5 pb-1 text-[var(--color-ash)]">{group.label}</div>
                      <div className="flex flex-wrap gap-2">
                        {visibleCats(group.items).map(cat => (
                          <Chip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>{cat}</Chip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {loadError && dishes.length > 0 ? (
          /* m-28 修：有旧数据时切分类失败不再整屏替换（刚浏览的菜被"断联"盖掉），改顶部内联失败条 + 保留列表 */
          <div role="alert"
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
            style={{
              borderRadius: 'var(--radius-ctl)',
              background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
              border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
            }}>
            <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ 这个分类没刷出来，先展示上一次的列表</span>
            <button onClick={() => setRetryToken(t => t + 1)} aria-label="重试加载分类" className="text-xs font-bold shrink-0 min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>再试一次</button>
          </div>
        ) : null}
        {loadError && dishes.length === 0 ? (
          <EmptyState
            emoji="📡" tone="error"
            title="厨房暂时断联"
            desc={pickOne(RETRY_NOTES)}
            action={
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setRetryToken(t => t + 1)}
                className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
                style={{ borderRadius: 'var(--radius-btn)' }}
              >
                再试一次
              </motion.button>
            }
          />
        ) : loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="d3-card flex items-center gap-3 overflow-hidden" style={{ padding: 'var(--space-card-p)' }}>
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
          /* M-v3 修：手写搜索空态与 ui/EmptyState 重复实现（漂移源），收敛到统一组件。
             Icons.jsx 补 search 后走 icon="search"；未加前仍走 emoji 保持向后兼容。 */
          <EmptyState
            emoji="🔍"
            title="没搜到这口"
            desc="换个关键词试试~也许换个名字就能找到啦"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
            {visibleDishes.map(dish => (
              <DishRow
                key={`${dish.id}-${dish.name}`}
                dish={dish}
                showFav
                favorited={has(dish.id)}
                onToggleFav={toggle}
                onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/menu')}
                vtName={heroNameFor(dish.id)}
                addLabel={`添加${dish.name}`}
                accent={partner.gradient}
                onAccent={partner.on}
                onAdd={(d, e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  spawnParticle(rect.left + rect.width / 2, rect.top)
                  addItem(d)
                }}
              />
            ))}
          </div>
        )}

        {visibleDishes.length < filteredDishes.length && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setVisibleCount(c => c + 30)}
            className="d3-btn-sm py-2.5 text-sm font-bold text-[var(--color-clay-text)] border border-[var(--color-clay)]/30 self-center px-6"
            style={{ borderRadius: 'var(--radius-btn)' }}
          >
            加载更多（还有 {filteredDishes.length - visibleDishes.length} 道）
          </motion.button>
        )}

        {/* 批 1 新增 · 愿望池入口：菜单里没找到想吃的？说给他，他补进菜单里 */}
        <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--color-glass-border)' }}>
          <p className="text-xs text-[var(--color-ash)] mb-1.5">菜单里没有想吃的那一道？</p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setWishOpen(true)}
            className="text-sm font-bold text-[var(--color-clay-text)] min-h-[44px] px-4 rounded-full"
            aria-label="告诉他想吃什么"
          >
            许个愿，让他变出来 🌠
          </motion.button>
        </div>
      </PageContainer>

      <WishFormModal open={wishOpen} onClose={() => setWishOpen(false)} />

      {/* +1 飘升粒子 */}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: p.x, y: p.y, opacity: 1, scale: reduced ? 1 : 0.8 }}
            animate={reduced
              ? { x: p.x, y: p.y - 40, opacity: 0, scale: 1.3 }
              : { x: [p.x, (p.x + p.tx) / 2, p.tx - 10], y: [p.y, Math.min(p.y, p.ty) - 52, p.ty - 10], opacity: [1, 1, 0.9], scale: [0.8, 1.15, 0.55] }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.4 : 0.55, ease: EASE, times: [0, 0.55, 1] }}
            className="fixed z-[100] pointer-events-none"
            style={{ left: 0, top: 0 }}
          >
            <div className="flex items-center gap-0.5 text-[var(--color-on-dark)] text-xs font-bold px-2 py-1 rounded-full shadow-lg" style={{ background: 'var(--color-clay)' }}>
              <span>+1</span>
              <KissIcon className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

    </div>
  )
}
