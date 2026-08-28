import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '../components/Header'
import AddDishModal from '../components/AddDishModal'
import KissIcon from '../components/KissIcon'

const CATEGORY_EMOJI = { '家常菜': '🍳', '硬菜': '🥩', '素菜': '🥬', '主食': '🍚', '汤类': '🍲', '小吃': '🍢', '水果': '🍎', '饮品': '🧋', '川菜': '🌶️', '粤菜': '🥢', '湘菜': '🔥', '鲁菜': '🍤', '苏菜': '🪷', '浙菜': '🐟', '闽菜': '🦐', '徽菜': '🍲', '东北菜': '🥟', '西北菜': '🍖', '云贵菜': '🍄', '其他': '🍽️' }

export default function AdminDishes() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDish, setEditingDish] = useState(null)

  const loadDishes = () => { fetch('/api/dishes/all').then(r => r.json()).then(d => { setDishes(d); setLoading(false) }) }
  useEffect(() => { loadDishes() }, [])

  const handleSave = async (form) => {
    if (editingDish) { await fetch(`/api/dishes/${editingDish.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }) }
    else { await fetch('/api/dishes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }) }
    setShowModal(false); setEditingDish(null); loadDishes()
  }
  const handleDelete = async (id) => { if (!confirm('确定不要这道菜了？')) return; await fetch(`/api/dishes/${id}`, { method: 'DELETE' }); loadDishes() }
  const handleToggle = async (d) => { await fetch(`/api/dishes/${d.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ available: d.available ? 0 : 1 }) }); loadDishes() }

  return (
    <div>
      <Header title="菜单管理" subtitle={`共 ${dishes.length} 道菜`}
        right={<motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingDish(null); setShowModal(true) }}
          className="d3-btn d3-btn-primary px-4 py-2 rounded-xl text-xs font-bold"
          >+ 添加</motion.button>} />

      <div className="px-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <motion.div className="text-5xl" animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }} transition={{ duration: 2, repeat: Infinity }}>📋</motion.div>
              <motion.div className="absolute -inset-4 rounded-full opacity-20"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.35), transparent 70%)' }} />
            </div>
            <div className="flex items-center gap-1.5 mt-4">
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-clay)]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
            <p className="text-[var(--color-ash)] text-sm mt-2">加载中...</p>
          </div>
        ) : dishes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 relative overflow-hidden">
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-44 h-44 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, rgba(200,104,63,0.35), transparent 70%)' }} />
            <div className="absolute bottom-16 right-1/4 w-28 h-28 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, rgba(127,163,122,0.35), transparent 70%)' }} />
            <motion.div className="text-7xl mb-5 animate-float relative z-10">🍽️</motion.div>
            <p className="text-[var(--color-ash)] relative z-10">还没有菜品，点右上角添加吧</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {dishes.map(dish => (
              <motion.div key={dish.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`glass rounded-[var(--radius-card)] overflow-hidden ${!dish.available ? 'opacity-50' : ''}`}>
                <div className="flex">
                  <div className="w-1 shrink-0" style={{ background: dish.available ? 'var(--color-clay)' : 'var(--color-mist)' }} />
                  <div className="p-3.5 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden bg-[var(--color-cream-dark)]">
                        <span className="text-2xl relative z-10">{CATEGORY_EMOJI[dish.category] || '🍽️'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-sm text-[var(--color-bone)] truncate">{dish.name}</h3>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-[var(--color-glass)] text-[var(--color-ash)] border border-[var(--color-glass-border)]">{dish.category}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <KissIcon className="w-3 h-3 text-[var(--color-love)]" />
                          <span className="text-[14px] font-bold text-[var(--color-clay)]">¥{dish.price}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-[var(--color-glass-border)]">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleToggle(dish)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${dish.available
                          ? 'text-[var(--color-bone)]'
                          : 'bg-[var(--color-glass)] text-[var(--color-ash)] border border-[var(--color-glass-border)]'}`}
                        style={dish.available ? { background: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))', boxShadow: '0 2px 8px rgba(127,163,122,0.25)' } : {}}>
                        {dish.available ? '✓ 上架' : '已下架'}
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setEditingDish(dish); setShowModal(true) }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'var(--color-caramel)', boxShadow: '0 2px 8px rgba(181,121,63,0.2)' }}>编辑</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleDelete(dish.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                        style={{ background: 'linear-gradient(135deg, var(--color-love), var(--color-danger))', boxShadow: '0 2px 8px rgba(194,84,63,0.2)' }}>删除</motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && <AddDishModal dish={editingDish} onClose={() => { setShowModal(false); setEditingDish(null) }} onSave={handleSave} />}
      </AnimatePresence>
    </div>
  )
}
