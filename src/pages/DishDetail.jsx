import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import Stepper from '../components/ui/Stepper'
import Icon from '../components/ui/Icons'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { useFavorites } from '../lib/favorites'
import { HERO_IMAGES } from '../theme/images'
import { getDishImage } from '../lib/categoryIcons'
import { getCachedDish, cacheDish, heroNameFor, morphBack } from '../lib/vt'
import { PERSONA } from '../theme/persona'
import { requestJson } from '../lib/request'

export default function DishDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const morphFrom = location.state && location.state.morphFrom // 仅形变进入时存在；刷新/普通进入走原生返回
  const { addItem, whoAmI } = useCart()
  const { has, toggle } = useFavorites()
  const [dish, setDish] = useState(() => getCachedDish(id)) // 形变首帧命中缓存：有图才飞得起来
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(() => !getCachedDish(id))
  // m-29 修：区分「菜真不存在/已下架」与「网络失败/服务端挂了」——前者引导去逛逛，后者给再试一次。
  const [fetchErr, setFetchErr] = useState(null) // 'notfound' | 'network'
  const [reload, setReload] = useState(0)
  // m-19 修：加入购物车按钮加连点锁，防双击 quantity×2
  const addingRef = useRef(false)

  useEffect(() => {
    setLoading(true); setFetchErr(null)
    // m-29：走 requestJson（自带 r.ok），404 → notfound，其它错误/超时 → network
    requestJson(`/api/dishes/${id}`).then(r => r.json())
      .then(data => {
        const ok = data && data.id != null
        setDish(ok ? data : null)
        if (ok) cacheDish(data)
        if (!ok) setFetchErr('notfound')
        setLoading(false)
      })
      .catch((err) => {
        setDish(null)
        setFetchErr(err && err.status === 404 ? 'notfound' : 'network')
        setLoading(false)
      })
  }, [id, reload])

  const handleAdd = () => {
    if (!dish || addingRef.current) return
    addingRef.current = true
    for (let i = 0; i < quantity; i++) addItem(dish)
    try { window.__cgAnnounce?.(`已加入${quantity}份${dish.name}`) } catch {}
    navigate('/menu')
    // 离开本页即复位（AnimatePresence 会卸本组件）；若父层没卸也留一个兜底
    setTimeout(() => { addingRef.current = false }, 400)
  }

  const persona = PERSONA[whoAmI]

  if (loading) return <LoadingState text="正在端上来..." />

  if (!dish) {
    const isNetwork = fetchErr === 'network'
    return (
      <EmptyState
        emoji={isNetwork ? '📡' : '😵'} tone="error"
        title={isNetwork ? '厨房暂时断联' : '找不到这道菜'}
        desc={isNetwork ? '网络不稳，稍等一下再试' : '它可能已被下架，或者链接不对~'}
        action={
          isNetwork ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setReload(r => r + 1)}
              className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
            >再试一次</motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/menu')}
              className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
            >去逛逛</motion.button>
          )
        }
      />
    )
  }

  return (
    <div className="relative">
      <FullBleedHero src={getDishImage(dish) || HERO_IMAGES.dish} variant="immersive" alt={dish.name} name={heroNameFor(dish.id)} />

      <PageHeader
        title={dish.name}
        back
        onBack={morphFrom ? () => morphBack(navigate, morphFrom) : undefined}
        right={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => toggle(dish)}
            aria-label={has(dish.id) ? '取消收藏' : '收藏'}
            aria-pressed={has(dish.id)}
            className="w-11 h-11 rounded-full flex items-center justify-center glass"
          >
            <motion.span
              animate={has(dish.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={has(dish.id) ? 'text-[var(--color-love)]' : 'text-[var(--color-mist)]'}
            >
              <Icon name="heart" size={22} filled={has(dish.id)} strokeWidth={2} />
            </motion.span>
          </motion.button>
        }
      />

      <PageContainer>
        {/* 信息卡 —— GlassCard 本体无内边距，内容必须自带 padding，否则文字贴圆角边 */}
        <GlassCard>
          <div style={{ padding: 'var(--space-card-p)' }}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="font-serif text-xl font-bold text-[var(--color-bone)] truncate">{dish.name}</h2>
              <span className="d3-badge shrink-0">{dish.category}</span>
            </div>
            <p className="text-sm text-[var(--color-ash)] leading-relaxed">
              {(() => {
                const t = dish.description || '一道美味的菜品~'
                /* m-11 修：t[0] 会拆 emoji 代理对（🍲/👨‍🍳 类）→ 半个码元 = 乱码方块。
                   Array.from(t) 按 code point 迭代取首字素，emoji 也不再截半。
                   同时给整段完整文本一份 sr-only 让读屏读到完整首字，装饰版仍 aria-hidden 视觉。 */
                const cp = Array.from(t)
                const first = cp[0] || ''
                const rest = cp.slice(1).join('')
                return (
                  <>
                    <span aria-hidden="true">
                      <span
                        className="font-serif font-bold"
                        style={{ fontSize: '2.1em', lineHeight: 0.85, float: 'left', marginRight: 6, marginTop: 4, color: 'var(--clay-deep)' }}
                      >{first}</span>
                      {rest}
                    </span>
                    {/* 读屏用整段完整文本，不吃 float 拆分与 aria-hidden 副作用 */}
                    <span className="sr-only">{t}</span>
                  </>
                )
              })()}
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <KissIcon className="w-5 h-5 text-[var(--color-love)]" />
              <span className="font-serif text-2xl font-bold text-[var(--color-caramel)] tabular-nums"><span className="text-[0.7em] mr-0.5">¥</span>{dish.price}</span>
            </div>
          </div>
        </GlassCard>

        {/* 数量 */}
        <GlassCard delay={0.1}>
          <div className="flex items-center justify-between" style={{ padding: 'var(--space-card-p)' }}>
            <span className="text-sm font-bold text-[var(--color-bone)]">数量</span>
            <Stepper value={quantity} onChange={setQuantity} min={1} size={44} />
          </div>
        </GlassCard>

        {/* 加入购物车 */}
        <GlassCard delay={0.2}>
          <div style={{ padding: 'var(--space-card-p)' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className="d3-btn w-full py-4 text-center font-bold text-base"
              style={{ background: persona.gradient, color: persona.on }}
            >
              <span className="relative z-10">{persona.emoji} 加入购物车</span>
            </motion.button>
          </div>
        </GlassCard>

        {/* 男朋友的菜谱（HowToCook 灌库菜才有） */}
        {dish.recipe && (
          <GlassCard delay={0.25}>
            <div style={{ padding: 'var(--space-card-p)' }}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-bold text-[var(--color-bone)]">男朋友的菜谱</h2>
                <div className="flex items-center gap-1.5 shrink-0">
                  {dish.recipe.difficulty && <span className="d3-badge">{dish.recipe.difficulty}</span>}
                  {dish.recipe.calories && (
                    <span className="pill-tag"><span aria-hidden="true">🔥</span> {dish.recipe.calories}</span>
                  )}
                </div>
              </div>

              {dish.recipe.ingredients?.length > 0 && (
                <>
                  <p className="text-sm font-bold text-[var(--color-bone)] mt-4 mb-2"><span aria-hidden="true">🧺</span> 需要准备</p>
                  <div className="flex flex-wrap gap-1.5">
                    {dish.recipe.ingredients.map((it, i) => (
                      <span key={i} className="pill-tag">{it}</span>
                    ))}
                  </div>
                </>
              )}

              {dish.recipe.steps?.length > 0 && (
                <>
                  <p className="text-sm font-bold text-[var(--color-bone)] mt-4 mb-3"><span aria-hidden="true">🔥</span> 制作过程</p>
                  <ol className="space-y-3">
                    {dish.recipe.steps.map((s, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                          style={{ background: 'var(--color-clay-gradient)', color: 'var(--color-on-dark)' }}
                        >
                          {i + 1}
                        </span>
                        <p className="flex-1 text-sm text-[var(--color-bone)] leading-relaxed">{s}</p>
                      </li>
                    ))}
                  </ol>
                </>
              )}

              {dish.recipe.tip && (
                <p className="text-xs text-[var(--color-ash)] leading-relaxed mt-4 pt-3"
                  style={{ borderTop: '2px dashed var(--color-line)' }}>
                  <span aria-hidden="true">💡</span> {dish.recipe.tip}
                </p>
              )}
            </div>
          </GlassCard>
        )}
      </PageContainer>
    </div>
  )
}
