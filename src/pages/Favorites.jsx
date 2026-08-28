import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import FullBleedHero from '../components/FullBleedHero'
import KissIcon from '../components/KissIcon'
import { useFavorites } from '../lib/favorites'
import { getDishImage, getCategoryEmoji } from '../lib/categoryIcons'
import { HERO_IMAGES } from '../theme/images'

export default function Favorites() {
  const { favorites, remove } = useFavorites()
  const navigate = useNavigate()

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.favorites} variant="immersive" alt="我的收藏" />

      <Header title="我的收藏" subtitle={`${favorites.length} 道喜欢的菜`} />

      <div className="px-4 pb-4">
        {favorites.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="text-7xl mb-5 animate-float">⭐</div>
            <p className="text-[var(--color-bone)] font-bold mb-1">还没有收藏</p>
            <p className="text-[var(--color-ash)] text-sm">去菜单里发现好吃的吧~</p>
            <Link to="/menu" className="d3-btn d3-btn-primary px-8 py-3 rounded-2xl text-sm font-bold mt-6">去选菜</Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {favorites.map((dish, i) => (
                <motion.div key={dish.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                  className="d3-card-face p-3.5 flex items-center gap-3 group">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                    style={{ background: 'linear-gradient(145deg, var(--color-cream) 0%, var(--color-cream-dark) 60%, rgba(200,104,63,0.08) 100%)' }}
                    onClick={() => navigate(`/dish/${dish.id}`)}>
                    {getDishImage(dish) ? (
                      <img src={getDishImage(dish)} alt={dish.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{getCategoryEmoji(dish?.category)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => navigate(`/dish/${dish.id}`)}>
                    <h3 className="font-bold text-sm text-[var(--color-bone)] truncate">{dish.name}</h3>
                    <p className="text-[11px] text-[var(--color-ash)]">{dish.category}</p>
                  </div>
                  <div className="flex items-center gap-1 mr-1">
                    <KissIcon className="w-3.5 h-3.5 text-[var(--color-love)]" />
                    <span className="text-sm font-bold text-[var(--color-clay-soft)]">{dish.price}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => remove(dish.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-mist)] hover:text-[var(--color-danger)] active:scale-90 transition-colors"
                    aria-label={`取消收藏${dish.name}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
