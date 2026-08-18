import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useCart } from '../components/CartContext'
import Header from '../components/Header'
import GlassCard from '../components/GlassCard'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
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

  if (loading) return <div className="flex items-center justify-center py-32"><motion.div className="text-5xl" animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>🍳</motion.div></div>
  if (!dish) return <div className="flex flex-col items-center justify-center py-32 text-[var(--color-ash)]"><div className="text-6xl mb-4">😵</div><p>找不到这道菜</p></div>

  return (
    <div className="relative">
      <FullBleedHero src={dish.image_url || HERO_IMAGES.dish} variant="immersive" alt={dish.name} />

      <Header title={dish.name}
        right={
          <div className="flex items-center gap-2">
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
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)} className="d3-btn-sm px-3 py-1.5 bg-white/5 text-[var(--color-ash)]">← 返回</motion.button>
          </div>
        } />

      <div className="px-4 space-y-4">
        {/* 信息 */}
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-serif text-xl font-bold text-[var(--color-bone)]">{dish.name}</h2>
            <span className="d3-badge">{dish.category}</span>
          </div>
          <p className="text-sm text-[var(--color-ash)] leading-relaxed">{dish.description || '一道美味的菜品~'}</p>
          <div className="flex items-center gap-1.5 mt-3">
            <KissIcon className="w-5 h-5 text-[var(--color-love)]" />
            <span className="text-2xl font-bold text-[var(--color-gold-soft)]">{dish.price}</span>
          </div>
        </GlassCard>

        {/* 数量 */}
        <GlassCard delay={0.1}>
          <div className="p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-bone)]">数量</span>
            <div className="flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-[var(--color-bone)] font-bold text-lg">-</motion.button>
              <motion.span key={quantity} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="w-6 text-center font-bold text-lg text-[var(--color-bone)]">{quantity}</motion.span>
              <motion.button whileTap={{ scale: 0.8 }} onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-gold-soft), var(--color-gold))' }}>+</motion.button>
            </div>
          </div>
        </GlassCard>

        {/* 加入购物车 */}
        <GlassCard delay={0.2}>
          <motion.button whileTap={{ scale: 0.97, y: 2 }} whileHover={{ y: -1 }}
            onClick={handleAdd}
            className="d3-btn w-full py-4 text-center rounded-2xl font-extrabold text-[15px]"
            style={{ background: persona.gradient, color: whoAmI === 'me' ? '#2A1E0E' : '#1A1D22' }}>
            <span className="relative z-10">{persona.emoji} 加入购物车</span>
          </motion.button>
        </GlassCard>
      </div>
    </div>
  )
}
