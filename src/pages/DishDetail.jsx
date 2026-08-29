import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../components/CartContext'
import PageHeader from '../components/PageHeader'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import PageContainer from '../components/ui/PageContainer'
import Stepper from '../components/ui/Stepper'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { useFavorites } from '../lib/favorites'
import { HERO_IMAGES } from '../theme/images'
import { PERSONA } from '../theme/persona'

export default function DishDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem, whoAmI } = useCart()
  const { has, toggle } = useFavorites()
  const [dish, setDish] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/dishes/${id}`).then(r => r.json())
      .then(data => {
        setDish(data && data.id != null ? data : null)
        setLoading(false)
      })
      .catch(() => { setDish(null); setLoading(false) })
  }, [id])

  const handleAdd = () => {
    if (!dish) return
    for (let i = 0; i < quantity; i++) addItem(dish)
    navigate('/menu')
  }

  const persona = PERSONA[whoAmI]

  if (loading) return <LoadingState emoji="🍳" text="正在端上来..." />

  if (!dish) return (
    <EmptyState
      emoji="😵"
      title="找不到这道菜"
      desc="它可能已被下架，或者链接不对~"
      action={
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/menu')}
          className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold"
        >
          去逛逛
        </motion.button>
      }
    />
  )

  return (
    <div className="relative">
      <FullBleedHero src={dish.image_url || HERO_IMAGES.dish} variant="immersive" alt={dish.name} />

      <PageHeader
        title={dish.name}
        back
        right={
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => toggle(dish)}
            aria-label={has(dish.id) ? '取消收藏' : '收藏'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-lg glass"
          >
            <motion.span animate={has(dish.id) ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
              {has(dish.id) ? '⭐' : '🤍'}
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
            <p className="text-sm text-[var(--color-ash)] leading-relaxed">{dish.description || '一道美味的菜品~'}</p>
            <div className="flex items-center gap-1.5 mt-3">
              <KissIcon className="w-5 h-5 text-[var(--color-love)]" />
              <span className="font-serif text-2xl font-bold text-[var(--color-clay)] tabular-nums">{dish.price}</span>
            </div>
          </div>
        </GlassCard>

        {/* 数量 */}
        <GlassCard delay={0.1}>
          <div className="flex items-center justify-between" style={{ padding: 'var(--space-card-p)' }}>
            <span className="text-sm font-bold text-[var(--color-bone)]">数量</span>
            <Stepper value={quantity} onChange={setQuantity} min={1} size={36} />
          </div>
        </GlassCard>

        {/* 加入购物车 */}
        <GlassCard delay={0.2}>
          <div style={{ padding: 'var(--space-card-p)' }}>
            <motion.button
              whileTap={{ scale: 0.97, y: 2 }}
              whileHover={{ y: -1 }}
              onClick={handleAdd}
              className="d3-btn w-full py-4 text-center font-extrabold text-base"
              style={{ background: persona.gradient, color: '#FFFDF9' }}
            >
              <span className="relative z-10">{persona.emoji} 加入购物车</span>
            </motion.button>
          </div>
        </GlassCard>
      </PageContainer>
    </div>
  )
}
