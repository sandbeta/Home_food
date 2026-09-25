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
import { morphTo, heroNameFor, cacheList, getCachedList } from '../lib/vt'
import { pickOne, HOT_TITLES, HOT_NOTES } from '../lib/sweetCopy'
import { requestJson } from '../lib/request'

// 排名色：前三金/银铜，其余安静
const RANK_COLORS = ['var(--color-clay)', 'var(--color-mist)', 'var(--color-caramel)']  // 名次大数字【前景】：随夜宵提亮（前景该反相）
const RANK_FILLS = ['var(--color-clay)', 'var(--color-mist-deep)', 'var(--color-caramel-deep)']  // NO.x 徽章【底】：不反相深档，配 on-dark 亮字两主题达 AA

export default function HotDishes() {
  /* m-22 修：以前 cacheList('hot', ...) 只写不读，从首页/热榜进详情再 morphBack 时首帧无
     dish-hero 元素 → 形变退化为普通淡入。useState 初值从 getCachedList('hot') 回填。 */
  const [dishes, setDishes] = useState(() => getCachedList('hot') || [])
  const [orders, setOrders] = useState([])
  const [keyword, setKeyword] = useState('')
  const [toast, setToast] = useState(null)
  // M-s3 修：以前两 fetch 无 catch → 服务端挂时静默空榜。补 catch → 顶部内联失败条。
  const [err, setErr] = useState('')
  const [reload, setReload] = useState(0)
  const { addItem } = useCart()
  const navigate = useNavigate()
  // M-v4 修：HotDishes 曾是全站唯一不走 sweetCopy 单源的用户页，补齐文案池
  const [pageTitle] = useState(() => pickOne(HOT_TITLES))
  const [pageNote] = useState(() => pickOne(HOT_NOTES))

  useEffect(() => {
    setErr('')
    let alive = true
    Promise.all([
      requestJson('/api/dishes?category=全部').then(r => r.json()),
      requestJson('/api/orders').then(r => r.json()),
    ]).then(([dList, oList]) => {
      if (!alive) return
      setDishes(Array.isArray(dList) ? dList : []); cacheList('hot', Array.isArray(dList) ? dList : [])
      setOrders(Array.isArray(oList) ? oList : [])
    }).catch(() => { if (alive) setErr('榜单没加载出来，看看服务端开好了没') })
    return () => { alive = false }
  }, [reload])

  // 你们的"最近热门"：按点单份数聚合（与外部趋势榜分开，一个是权威口径、一个是自家数据）
  const ownHot = useMemo(() => {
    const count = {}
    orders.forEach(o => (o.items || []).forEach(i => {
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

      <PageHeader title={pageTitle} subtitle={pageNote} />

      <PageContainer>
        {/* 搜索 —— 与点菜页同一枚糖果胶囊语言 */}
        <form role="search" onSubmit={(e) => e.preventDefault()} className="d3-card-face flex items-center gap-2 px-4 py-2" style={{ borderRadius: '999px', background: 'var(--surface)' }}>
          <label htmlFor="hot-search" className="sr-only">搜菜名或食材</label>
          <svg aria-hidden="true" className="w-4 h-4 text-[var(--color-ash)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            id="hot-search"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜菜名或食材，比如 牛肉"
            className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm text-[var(--color-bone)] placeholder:text-[var(--color-mist)]"
          />
        </form>

        {err && (
          <div role="alert"
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 mt-3"
            style={{
              borderRadius: 'var(--radius-ctl)',
              background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
              border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
            }}>
            <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</span>
            <button onClick={() => setReload(r => r + 1)} aria-label="重新加载热榜" className="text-xs font-bold shrink-0 min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>再试一次</button>
          </div>
        )}

        {/* 你们最近点最多的 */}
        <motion.div {...contentEnter(0.05)}>
          <SectionHeader title="你家点过的热门" action={<span className="text-xs text-[var(--color-ash)]">按点单份数</span>} />
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
                  onClick={(e) => morphTo(navigate, `/dish/${dish.id}`, e, dish, '/hot')}
                  /* B4：热榜横向卡键盘可达（进详情） */
                  role="button" tabIndex={0} aria-label={`查看${dish.name}详情`}
                  onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); navigate(`/dish/${dish.id}`) } }}
                  className="vt-dish-host d3-card-face shrink-0 cursor-pointer overflow-hidden"
                  style={{ width: 132 }}
                >
                  <div className="vt-dish-frame relative h-20 overflow-hidden flex items-center justify-center"
                    style={{ background: 'var(--plate-bg)', viewTransitionName: heroNameFor(dish.id) }}>
                    <span className="text-4xl" aria-hidden="true">{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    )}
                    {/* M-c7 修：第 4 名起 NO.x 用 rgba(43,36,41,0.45) 半透明底压任意菜品照片，浅图（白汤、米饭特写）上配白字对比不可控。
                        改用不反相深档 --color-mist-deep 与前三同族（#5E4F56，配 on-dark 亮字 ≥5:1 双主题达标），也让 NO.4+ 视觉与前三拉齐。 */}
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-[var(--color-on-dark)]"
                      style={{ background: idx < 3 ? RANK_FILLS[idx] : 'var(--color-mist-deep)' }}>
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

        {/* 家常灵感榜（修 P0-6：原「2026 家常趋势榜·家庭烹饪率 87.6%」为无来源伪权威数据，已去数字化） */}
        <motion.div {...contentEnter(0.1)} className="mt-6">
          <SectionHeader title="家常灵感榜" action={<span className="text-xs text-[var(--color-ash)]">口味方向参考 · 非统计</span>} />
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
                  <span className="font-serif text-display font-bold w-12 text-center shrink-0 tabular-nums leading-none"
                    style={{ color: idx < 3 ? RANK_COLORS[idx] : 'var(--color-mist)' }}>
                    {idx + 1}
                  </span>
                  {/* 菜名 + 热度 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[var(--color-bone)] truncate">{t.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-bold"
                        style={{ background: 'color-mix(in srgb, var(--clay-50) 10%, transparent)', color: 'var(--color-clay)' }}>
                        {t.tag}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-ash)] mt-0.5">{t.line}</p>
                  </div>
                  {/* 行动区：菜单里有 → 看菜谱/点一份；没有 → 提示 */}
                  {dish ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => navigate(`/dish/${dish.id}`)}
                        className="d3-btn-sm px-2.5 py-1.5 min-h-[44px] text-xs font-bold text-[var(--color-ash)]"
                        style={{ background: 'rgba(43,36,41,0.05)' }}
                      >
                        菜谱
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => addDish(dish)}
                        aria-label={`点一份${t.name}`}
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--color-clay-gradient)',
                          boxShadow: '0 4px 10px color-mix(in srgb, var(--clay-50) 28%, transparent), inset 0 1px 0 rgba(255,255,255,0.3)',
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-on-dark)" strokeWidth="2.8" strokeLinecap="round">
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

          {/* 诚实脚注：本榜只是口味方向参考，不挂任何外部统计口径 */}
          <p className="text-center text-[11px] text-[var(--color-mist)] mt-3 leading-relaxed">
            这榜只是「家常菜常有的口味方向」参考，没有任何统计口径；你家真实的热门在上面那节。
          </p>
        </motion.div>
      </PageContainer>

      {/* 加购轻提示 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status" aria-live="polite"
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
            style={{ bottom: 'calc(var(--bottom-inset) + 8px)' }}
          >
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-[var(--color-on-dark)]"
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
