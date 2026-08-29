import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../components/CartContext'
import { useFavorites } from '../lib/favorites'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { pickOne, MENU_TITLES, MENU_NOTES } from '../lib/sweetCopy'
import Icon from '../components/ui/Icons'
import KissIcon from '../components/KissIcon'

/*
 * 点菜页 · WeUI 设计语言试点
 * 搜索框/白卡分组/发丝线/按压变色；逻辑与晨光版一致：
 * 收藏并入（?fav=1 热同步）、给谁点、今日灵感（吃全量池，搜索不扰动）、
 * 0 菜分类隐藏、长列表分页（初始 30 + 加载更多）。
 */

const hideImg = (e) => { e.currentTarget.style.display = 'none' }

function RecommendCard({ dish, onAdd, onReload }) {
  if (!dish) return null
  return (
    <div className="weui-group">
      <div className="weui-cell" style={{ display: 'block' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="weui-14 weui-t2">今日灵感</span>
          <button className="weui-link" onClick={onReload}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: 14 }}>
            换一个
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 4, overflow: 'hidden', flex: 'none', position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-weui-press)',
            }}
          >
            <span style={{ fontSize: 24 }}>{getCategoryEmoji(dish.category)}</span>
            {getDishImage(dish) && (
              <img src={getDishImage(dish)} alt={dish.name} loading="lazy"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={hideImg} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="weui-17 weui-medium weui-t1">{dish.name}</div>
            <div className="weui-14 weui-t2" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {dish.description || '好吃的~'}
            </div>
            <div className="weui-14 weui-medium weui-t1" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ display: 'inline-flex', color: 'var(--color-weui-text2)' }}>
                <KissIcon className="w-3 h-3" />
              </span>
              {dish.price}
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(dish) }}
            style={{
              flex: 'none', padding: '5px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
              border: '1px solid var(--color-weui-green)', background: 'none', color: 'var(--color-weui-green)',
            }}
          >
            加一份
          </button>
        </div>
      </div>
    </div>
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
  const [showAllCategories, setShowAllCategories] = useState(false)
  const { addItem, whoAmI, setWhoAmI } = useCart()
  const { favorites, has, toggle } = useFavorites()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 收藏已并入本页：'all'=全部菜品，'fav'=我的收藏；?fav=1 直达（热同步）
  const [scope, setScope] = useState(() => (searchParams.get('fav') ? 'fav' : 'all'))
  const isFavScope = scope === 'fav'

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dishes?category=${encodeURIComponent(activeCategory)}`)
      .then(r => r.json())
      .then(data => { setDishes(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory])

  const filteredDishes = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    const base = isFavScope ? favorites : dishes
    if (!q) return base
    return base.filter(d => `${d.name} ${d.category} ${d.description || ''}`.toLowerCase().includes(q))
  }, [isFavScope, favorites, dishes, keyword])

  // 长列表分页：初始 30 条 + 加载更多（筛选条件变化时重置）
  const [visibleCount, setVisibleCount] = useState(30)
  useEffect(() => { setVisibleCount(30) }, [activeCategory, scope, keyword])
  const visibleDishes = useMemo(
    () => filteredDishes.slice(0, visibleCount),
    [filteredDishes, visibleCount],
  )

  // 今日灵感吃全量池，搜索/筛选不扰动；「换一个」顺位轮换
  const [inspIdx, setInsIdx] = useState(0)
  const inspiration = dishes.length ? dishes[inspIdx % dishes.length] : null

  // 0 菜的分类不展示
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
  const visibleCats = (items) => (catCounts ? items.filter(cat => cat === '全部' || (catCounts[cat] || 0) > 0) : items)

  const pill = (active) => ({
    padding: '5px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer',
    border: active ? 'none' : '0.5px solid var(--color-weui-line)',
    background: active ? 'rgba(7, 193, 96, 0.08)' : 'var(--color-weui-card)',
    color: active ? 'var(--color-weui-green)' : 'var(--color-weui-text2)',
    fontWeight: active ? 500 : 400,
  })

  return (
    <div className="weui-theme">
      <header className="weui-nav"><span className="weui-nav-title">点菜</span></header>

      <div style={{ padding: '12px 16px 0' }}>
        <div className="weui-17 weui-medium weui-t1">{pageTitle}</div>
        <div className="weui-14 weui-t2" style={{ marginTop: 2 }}>{pageNote}</div>
      </div>

      <div style={{ padding: '12px 16px 76px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* 搜索框 */}
        <div className="weui-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="搜搜想吃的菜..." />
          {keyword && (
            <button onClick={() => setKeyword('')}
              style={{ border: 'none', background: 'none', color: 'var(--color-weui-text3)', fontSize: 14, cursor: 'pointer', padding: 0 }}>
              ✕
            </button>
          )}
        </div>

        {/* 全部菜品 / 我的收藏：文本页签，选中绿 + 绿色下划线 */}
        <div className="weui-group">
          <div style={{ display: 'flex' }}>
            {[{ value: 'all', label: '全部菜品' }, { value: 'fav', label: '⭐ 我的收藏' }].map((o) => {
              const active = scope === o.value
              return (
                <button key={o.value} onClick={() => setScope(o.value)}
                  style={{
                    flex: 1, padding: '10px 0 8px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    border: 'none', background: 'none',
                    color: active ? 'var(--color-weui-green)' : 'var(--color-weui-text2)',
                    borderBottom: active ? '2px solid var(--color-weui-green)' : '0.5px solid var(--color-weui-line)',
                  }}>
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 给谁点 */}
        <div className="weui-group">
          <div className="weui-cell">
            <span className="weui-17 weui-t1" style={{ flex: 1 }}>给谁点</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ value: 'me', label: '自己 🐱' }, { value: 'partner', label: 'TA 🐰' }].map(o => {
                const active = whoAmI === o.value
                return (
                  <button key={o.value} onClick={() => setWhoAmI(o.value)}
                    style={{
                      fontSize: 14, fontWeight: 500, padding: '4px 12px', borderRadius: 8, cursor: 'pointer', border: 'none',
                      color: active ? 'var(--color-weui-green)' : 'var(--color-weui-text2)',
                      background: active ? 'rgba(7, 193, 96, 0.08)' : 'transparent',
                    }}>
                    {o.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 今日灵感（吃全量池，搜索不扰动） */}
        <RecommendCard dish={inspiration} onAdd={addItem} onReload={() => setInsIdx(i => i + 1)} />

        {/* 分类标签 */}
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            {visibleCats(CATEGORY_GROUPS[0].items).map(cat => (
              <button key={cat} style={pill(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
                {cat}
              </button>
            ))}
            {!showAllCategories && (
              <button style={pill(false)} onClick={() => setShowAllCategories(true)}>更多菜系</button>
            )}
          </div>
          {showAllCategories && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ textAlign: 'right' }}>
                <button className="weui-link" onClick={() => setShowAllCategories(false)}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>收起</button>
              </div>
              {CATEGORY_GROUPS.slice(1).map(group => (
                <div key={group.label}>
                  <div className="weui-14 weui-t3" style={{ padding: '0 4px 4px' }}>{group.label}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {visibleCats(group.items).map(cat => (
                      <button key={cat} style={pill(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 菜品列表 */}
        {loading ? (
          <div className="weui-group" style={{ padding: 16 }}>
            <span className="weui-14 weui-t2">加载中...</span>
          </div>
        ) : isFavScope && favorites.length === 0 ? (
          <div className="weui-group" style={{ padding: '40px 0', textAlign: 'center' }}>
            <Icon name="star" size={40} style={{ color: 'var(--color-weui-text3)' }} />
            <p className="weui-17 weui-medium weui-t1" style={{ marginTop: 8 }}>还没有收藏的菜</p>
            <p className="weui-14 weui-t2" style={{ marginTop: 4 }}>看到想吃的点亮星星，下次直接从这里找</p>
            <button className="weui-link" onClick={() => setScope('all')}
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', marginTop: 12 }}>
              去逛逛
            </button>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="weui-group" style={{ padding: '40px 0', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-weui-text3)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto' }}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <p className="weui-17 weui-medium weui-t1" style={{ marginTop: 8 }}>没搜到这口</p>
            <p className="weui-14 weui-t2" style={{ marginTop: 4 }}>换个关键词试试~</p>
          </div>
        ) : (
          <>
            <div className="weui-group">
              {visibleDishes.map(dish => (
                <div key={`${dish.id}-${dish.name}`} className="weui-cell" onClick={() => navigate(`/dish/${dish.id}`)}>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flex: 'none', position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-weui-press)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{getCategoryEmoji(dish.category)}</span>
                    {getDishImage(dish) && (
                      <img src={getDishImage(dish)} alt={dish.name} loading="lazy"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={hideImg} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="weui-17 weui-t1" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dish.name}</span>
                      <button
                        aria-label={has(dish.id) ? '取消收藏' : '收藏'}
                        onClick={(e) => { e.stopPropagation(); toggle(dish) }}
                        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', color: has(dish.id) ? 'var(--color-weui-green)' : 'var(--color-weui-text3)' }}>
                        <Icon name="star" size={18} />
                      </button>
                    </div>
                    <div className="weui-14 weui-t2" style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dish.description || dish.category}
                    </div>
                    <div className="weui-17 weui-medium weui-t1" style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ display: 'inline-flex', color: 'var(--color-weui-text2)' }}>
                        <KissIcon className="w-3 h-3" />
                      </span>
                      {dish.price}
                    </div>
                  </div>
                  <button
                    aria-label={`添加${dish.name}`}
                    onClick={(e) => { e.stopPropagation(); addItem(dish) }}
                    style={{
                      flex: 'none', alignSelf: 'center', width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
                      border: '1px solid var(--color-weui-green)', background: 'none',
                      color: 'var(--color-weui-green)', fontSize: 18, lineHeight: 1,
                    }}
                  >
                    ＋
                  </button>
                </div>
              ))}
            </div>
            {visibleDishes.length < filteredDishes.length && (
              <div style={{ textAlign: 'center', padding: '4px 0' }}>
                <button className="weui-link" style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                  onClick={() => setVisibleCount(c => c + 30)}>
                  加载更多（还有 {filteredDishes.length - visibleDishes.length} 道）
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
