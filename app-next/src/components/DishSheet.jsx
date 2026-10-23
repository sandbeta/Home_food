import { useEffect, useMemo, useState } from 'react'
import Sheet from './Sheet.jsx'
import Icon from './Icon.jsx'
import DishArt from './DishArt.jsx'
import Stepper from './Stepper.jsx'
import { api } from '../lib/api.js'
import { dishImage } from '../lib/assetUrl.js'
import { money } from '../lib/format.js'
import { isNightSnack } from '../lib/nightRules.js'
import { summarizeDish } from '../lib/dishRating.js'
import { useData } from '../state/DataContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { useFavorites } from '../lib/favorites.js'

export default function DishSheet({ dishId, open, onClose }) {
  const { dishesById, ratings } = useData()
  const { addItem } = useCart()
  const { favorites, toggle } = useFavorites()
  const toast = useToast()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)
  const [qty, setQty] = useState(1)
  const [showRecipe, setShowRecipe] = useState(false)

  const base = dishId != null ? dishesById.get(Number(dishId)) : null
  const dish = detail || base
  const id = dishId != null ? Number(dishId) : null
  const faved = id != null && favorites.some((f) => Number(f.id) === id)
  const rating = useMemo(() => {
    if (id == null) return null
    return summarizeDish((ratings || []).filter((r) => Number(r.dish_id) === id))
  }, [ratings, id])

  useEffect(() => {
    if (!open || dishId == null) return undefined
    let alive = true
    setQty(1)
    setShowRecipe(false)
    setLoading(true)
    api.dishes.get(dishId)
      .then((d) => { if (alive) setDetail(d) })
      .catch(() => { if (alive) setDetail(null) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [open, dishId])

  const src = dishImage(dish)
  const available = !dish || Number(dish.available) !== 0
  const night = dish ? isNightSnack(dish) : false

  const handleAdd = () => {
    if (!dish || !available) return
    for (let i = 0; i < qty; i++) addItem(dish)
    toast(`${dish.name} 进锅巴了`)
    onClose?.()
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="dish-sheet-name">
      {loading && !dish ? (
        <div className="dish-sheet__loading">
          <div className="skeleton" style={{ height: 220, borderRadius: 'var(--r-lg)' }} />
          <div className="skeleton" style={{ height: 24, width: '60%', marginTop: 16 }} />
          <div className="skeleton" style={{ height: 16, width: '85%', marginTop: 12 }} />
        </div>
      ) : !dish ? (
        <div className="dish-sheet__loading">
          <p className="t-note">这道菜没找到，可能被下架了。</p>
          <button type="button" className="btn btn--ghost" onClick={onClose}>回去看看</button>
        </div>
      ) : (
        <>
          <div className={`dish-sheet__hero${src ? ' has-photo' : ''}`}>
            {src ? <img src={src} alt={dish.name} decoding="async" /> : <DishArt dish={dish} size={150} />}
            <button type="button" className="icon-btn dish-sheet__close" aria-label="关闭" onClick={onClose}>
              <Icon name="close" size={20} />
            </button>
          </div>

          <div className="dish-sheet__body">
            <div className="row row--between" style={{ alignItems: 'flex-start' }}>
              <div className="grow">
                <h2 id="dish-sheet-name" className="t-title">{dish.name}</h2>
                <div className="dish-sheet__tags">
                  <span className="tag tag--sage">{dish.category || '家常'}</span>
                  {night ? <span className="tag tag--honey">夜宵</span> : null}
                  {!available ? <span className="tag tag--danger">今天不做了</span> : null}
                  {rating?.isSignature ? <span className="tag tag--coral">拿手菜</span> : null}
                </div>
              </div>
              <button
                type="button"
                className={`icon-btn icon-btn--surface${faved ? ' is-faved' : ''}`}
                aria-label={faved ? '取消收藏' : '收藏'}
                aria-pressed={faved}
                onClick={() => toggle(dish)}
              >
                <Icon name="heart" size={20} fill={faved} />
              </button>
            </div>

            {dish.description ? <p className="dish-sheet__desc">{dish.description}</p> : null}

            <div className="dish-sheet__rating">
              <span className="dish-sheet__stars" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon key={n} name="star" size={13} fill={rating && rating.avg >= n - 0.25} />
                ))}
              </span>
              <span className="t-note">
                {rating?.count ? `${rating.count} 次 · 均分 ${rating.avg}` : '还没记过分数'}
              </span>
            </div>

            <div className="dish-sheet__buy">
              <div>
                <p className="t-micro">一份</p>
                <p className="price">{money(dish.price)}</p>
              </div>
              <Stepper value={qty} onChange={setQty} min={1} max={20} label="要几份" />
            </div>

            <button
              type="button"
              className="btn btn--primary btn--block"
              onClick={handleAdd}
              disabled={!available}
            >
              {available ? `加进锅巴 · ${money((Number(dish.price) || 0) * qty)}` : '今天不做了'}
            </button>

            {detail?.recipe ? (
              <div className="recipe">
                <button
                  type="button"
                  className="recipe__toggle"
                  aria-expanded={showRecipe}
                  onClick={() => setShowRecipe((v) => !v)}
                >
                  <span className="row" style={{ gap: 'var(--s2)' }}>
                    <Icon name="list" size={18} />
                    <span className="t-body" style={{ fontWeight: 800 }}>看做法</span>
                    {detail.recipe.difficulty ? <span className="tag">{detail.recipe.difficulty}</span> : null}
                    {detail.recipe.calories ? <span className="tag">{detail.recipe.calories}</span> : null}
                  </span>
                  <Icon name="arrow" size={18} className={showRecipe ? 'rot-90' : ''} />
                </button>
                {showRecipe ? (
                  <div className="recipe__body">
                    {Array.isArray(detail.recipe.ingredients) && detail.recipe.ingredients.length ? (
                      <div className="recipe__ingredients">
                        {detail.recipe.ingredients.map((it) => (
                          <span key={it} className="tag tag--sage">{it}</span>
                        ))}
                      </div>
                    ) : null}
                    {Array.isArray(detail.recipe.steps) && detail.recipe.steps.length ? (
                      <ol className="recipe__steps">
                        {detail.recipe.steps.map((step, i) => (
                          <li key={i}><span className="recipe__n">{i + 1}</span><span>{step}</span></li>
                        ))}
                      </ol>
                    ) : null}
                    {detail.recipe.tip ? <p className="recipe__tip">{detail.recipe.tip}</p> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      )}
    </Sheet>
  )
}
