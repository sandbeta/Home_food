import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DishRow from '../components/DishRow.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Icon from '../components/Icon.jsx'
import WishDialog from '../components/WishDialog.jsx'
import { useData } from '../state/DataContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useDishSheet } from '../state/DishSheetContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { useFavorites } from '../lib/favorites.js'
import { isNightSnack } from '../lib/nightRules.js'

const CAT_ORDER = [
  '家常菜', '主食', '素菜', '小吃', '硬菜', '汤类', '饮品', '夜宵',
  '川菜', '粤菜', '湘菜', '东北菜', '西北菜', '云贵菜', '徽菜', '闽菜', '浙菜', '苏菜', '鲁菜',
  '水果', '其他',
]

function sortCats(cats) {
  const rank = new Map(CAT_ORDER.map((c, i) => [c, i]))
  return cats.slice().sort((a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99))
}

export default function Menu() {
  const { dishes, loading, errors, reload } = useData()
  const { addItem, whoAmI, setWhoAmI, count: cartCount } = useCart()
  const { openDish } = useDishSheet()
  const toast = useToast()
  const { favorites, has } = useFavorites()
  const [params, setParams] = useSearchParams()

  const [query, setQuery] = useState('')
  const q = useDeferredValue(query.trim().toLowerCase())
  const [cat, setCat] = useState(() => params.get('cat') || '全部')
  const [favOnly, setFavOnly] = useState(() => params.get('fav') === '1')
  const [wishOpen, setWishOpen] = useState(() => params.get('wish') === '1')

  useEffect(() => {
    if (params.get('wish') === '1') setWishOpen(true)
  }, [params])

  const favIds = useMemo(() => new Set(favorites.map((f) => Number(f.id))), [favorites])

  const available = useMemo(
    () => (dishes || []).filter((d) => Number(d.available) !== 0),
    [dishes],
  )

  const cats = useMemo(() => {
    const set = new Set(available.map((d) => d.category).filter(Boolean))
    return ['全部', ...sortCats([...set]), '夜宵']
  }, [available])

  const list = useMemo(() => {
    let src = favOnly
      ? available.filter((d) => favIds.has(Number(d.id)))
      : available
    if (cat === '夜宵') src = src.filter(isNightSnack)
    else if (cat !== '全部') src = src.filter((d) => d.category === cat)
    if (q) {
      src = src.filter((d) => `${d.name || ''}${d.description || ''}${d.category || ''}`.toLowerCase().includes(q))
    }
    return src
  }, [available, favOnly, favIds, cat, q])

  const groups = useMemo(() => {
    if (cat !== '全部' || !list.length) return [{ category: '', items: list }]
    const map = new Map()
    for (const d of list) {
      const key = d.category || '其他'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(d)
    }
    return sortCats([...map.keys()]).map((k) => ({ category: k, items: map.get(k) }))
  }, [cat, list])

  const setFavOnlyAndParams = (next) => {
    setFavOnly(next)
    const np = new URLSearchParams(params)
    if (next) np.set('fav', '1')
    else np.delete('fav')
    setParams(np, { replace: true })
    setCat('全部')
    const np2 = new URLSearchParams(np)
    np2.delete('cat')
    setParams(np2, { replace: true })
  }

  const setCatAndParams = (next) => {
    setCat(next)
    const np = new URLSearchParams(params)
    if (next === '全部') np.delete('cat')
    else np.set('cat', next)
    setParams(np, { replace: true })
  }

  const closeWish = () => {
    setWishOpen(false)
    if (params.get('wish')) {
      const np = new URLSearchParams(params)
      np.delete('wish')
      setParams(np, { replace: true })
    }
  }

  const add = (dish) => {
    addItem(dish)
    toast(`${dish.name} 进锅巴了`)
  }

  const clearSearch = () => setQuery('')

  return (
    <div className="page page--top menu-page">
      <header className="menu-hero">
        <div className="row row--between" style={{ alignItems: 'flex-start' }}>
          <div>
            <p className="t-micro">懒懒的菜单</p>
            <h1 className="t-display">今天吃<span className="t-coral">什么</span></h1>
            <p className="menu-hero__sub">
              {loading ? '正在翻菜谱…' : `${available.length} 道 · 慢慢挑`}
            </p>
          </div>
          <button type="button" className="icon-btn icon-btn--surface" aria-label="许个愿" onClick={() => setWishOpen(true)}>
            <Icon name="wish" size={22} />
          </button>
        </div>
      </header>

      <div className="menu-controls">
        <div className="field">
          <Icon name="menu" size={18} className="field__icon" />
          <input
            className="field__input"
            type="search"
            enterKeyHint="search"
            placeholder="搜菜名、口味或分类"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索菜品"
          />
          {query ? (
            <button type="button" className="icon-btn" aria-label="清空搜索" onClick={clearSearch}>
              <Icon name="close" size={16} />
            </button>
          ) : null}
        </div>
        <div className="seg">
          <button type="button" className="seg__item" aria-pressed={!favOnly} onClick={() => setFavOnlyAndParams(false)}>
            全部菜品
          </button>
          <button type="button" className="seg__item" aria-pressed={favOnly} onClick={() => setFavOnlyAndParams(true)}>
            我的收藏{favorites.length ? ` ${favorites.length}` : ''}
          </button>
        </div>
        <div className="menu-who">
          <span className="t-micro">这顿记在</span>
          <div className="seg seg--compact">
            <button type="button" className="seg__item" aria-pressed={whoAmI === 'me'} onClick={() => setWhoAmI('me')}>我</button>
            <button type="button" className="seg__item" aria-pressed={whoAmI === 'partner'} onClick={() => setWhoAmI('partner')}>TA</button>
          </div>
          {cartCount ? <span className="t-micro">{cartCount} 份在锅巴</span> : null}
        </div>
      </div>

      <div className="menu-cats scroll-x" role="group" aria-label="菜品分类">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${cat === c ? 'chip--active' : 'chip--field'}`}
            aria-pressed={cat === c}
            onClick={() => setCatAndParams(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {errors.dishes && !available.length ? (
        <EmptyState
          pose="steal"
          title="没连上厨房"
          note="检查网络或服务端，再翻一次菜单。"
          action={<button type="button" className="btn btn--honey" onClick={reload}>再翻一次</button>}
        />
      ) : loading && !available.length ? (
        <div className="menu-list" aria-label="载入中">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="menu-skeleton">
              <div className="skeleton" style={{ width: 58, height: 58, borderRadius: 16 }} />
              <div className="grow">
                <div className="skeleton" style={{ height: 16, width: '45%' }} />
                <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '30%', marginTop: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : !list.length ? (
        favOnly ? (
          <EmptyState
            pose="mate"
            title="收藏的还是空的"
            note="看到想吃的，点开菜再点一下心。"
            action={<button type="button" className="btn btn--honey" onClick={() => setFavOnlyAndParams(false)}>去看全部</button>}
          />
        ) : q ? (
          <EmptyState
            pose="mate"
            title="没搜到这道菜"
            note={`换个词试试，或者把「${query}」许个愿。`}
            action={(
              <div className="row" style={{ gap: 'var(--s2)' }}>
                <button type="button" className="btn btn--ghost" onClick={clearSearch}>清掉搜索</button>
                <button type="button" className="btn btn--honey" onClick={() => setWishOpen(true)}>许个愿</button>
              </div>
            )}
          />
        ) : (
          <EmptyState
            pose="mate"
            title="这个分类空着"
            note="换一个分类看看，或者让厨房加两道。"
            action={<button type="button" className="btn btn--honey" onClick={() => setCatAndParams('全部')}>看全部</button>}
          />
        )
      ) : (
        <div className="menu-list">
          <p className="menu-count">{q ? `搜到 ${list.length} 道` : `共 ${list.length} 道`}</p>
          {groups.map((group) => (
            <section key={group.category || 'list'} className="menu-group">
              {group.category ? (
                <h2 className="menu-group__title">
                  {group.category}
                  <span className="menu-group__count">{group.items.length}</span>
                </h2>
              ) : null}
              <div className="rows">
                {group.items.map((d) => (
                  <DishRow
                    key={d.id}
                    dish={d}
                    onOpen={openDish}
                    onAdd={add}
                    faved={has(d.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <WishDialog open={wishOpen} onClose={closeWish} />
    </div>
  )
}
