import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import DishRow from '../components/ui/DishRow'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import AddDishModal from '../components/AddDishModal'

export default function AdminDishes() {
  const [dishes, setDishes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDish, setEditingDish] = useState(null)

  const [visibleCount, setVisibleCount] = useState(30)
  const loadDishes = () => {
    fetch('/api/dishes/all')
      .then((r) => r.json())
      .then((d) => { setDishes(d); setLoading(false) })
  }
  useEffect(() => { loadDishes() }, [])
  const visibleDishes = dishes.slice(0, visibleCount)

  const handleSave = async (form) => {
    if (editingDish) {
      await fetch(`/api/dishes/${editingDish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    } else {
      await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
    }
    setShowModal(false)
    setEditingDish(null)
    loadDishes()
  }

  const handleDelete = async (id) => {
    if (!confirm('确定不要这道菜了？')) return
    await fetch(`/api/dishes/${id}`, { method: 'DELETE' })
    loadDishes()
  }

  const handleToggle = async (d) => {
    await fetch(`/api/dishes/${d.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: d.available ? 0 : 1 }),
    })
    loadDishes()
  }

  return (
    <AdminShell
      title="菜品管理"
      subtitle={`共 ${dishes.length} 道菜`}
      right={
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingDish(null); setShowModal(true) }}
          className="d3-btn d3-btn-primary px-4 py-2 text-xs font-bold"
          style={{ borderRadius: 'var(--radius-ctl)' }}
        >
          + 添加
        </motion.button>
      }
    >
      {loading ? (
        <LoadingState emoji="🍽️" />
      ) : dishes.length === 0 ? (
        <EmptyState
          emoji="🍽️"
          title="还没有菜品"
          desc="点右上角「添加」创建第一道菜吧"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
          {visibleDishes.map((dish) => (
            <div key={dish.id} className={dish.available ? '' : 'opacity-50'}>
              <DishRow
                dish={dish}
                variant="manage"
                actions={
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle(dish)}
                      className="flex-1 py-2 text-xs font-bold"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        ...(dish.available
                          ? {
                              background: 'linear-gradient(135deg, var(--color-sage-soft), var(--color-sage))',
                              color: 'var(--color-bone)',
                              boxShadow: '0 2px 8px rgba(127,163,122,0.25)',
                            }
                          : {
                              background: 'var(--color-glass)',
                              color: 'var(--color-ash)',
                              border: '1px solid var(--color-glass-border)',
                            }),
                      }}
                    >
                      {dish.available ? '✓ 上架' : '已下架'}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setEditingDish(dish); setShowModal(true) }}
                      className="flex-1 py-2 text-xs font-bold text-white"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: 'var(--color-caramel)',
                        boxShadow: '0 2px 8px rgba(181,121,63,0.2)',
                      }}
                    >
                      编辑
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(dish.id)}
                      className="flex-1 py-2 text-xs font-bold text-white"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: 'linear-gradient(135deg, var(--color-love), var(--color-danger))',
                        boxShadow: '0 2px 8px rgba(194,84,63,0.2)',
                      }}
                    >
                      删除
                    </motion.button>
                  </>
                }
              />
            </div>
          ))}
        </div>
      )}

      {visibleDishes.length < dishes.length && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setVisibleCount(c => c + 30)}
          className="d3-btn-sm py-2.5 text-sm font-bold text-[var(--color-clay)] border border-[var(--color-clay)]/30 self-center px-6"
          style={{ borderRadius: 'var(--radius-btn)' }}
        >
          加载更多（还有 {dishes.length - visibleDishes.length} 道）
        </motion.button>
      )}

      <AnimatePresence>
        {showModal && (
          <AddDishModal
            dish={editingDish}
            onClose={() => { setShowModal(false); setEditingDish(null) }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </AdminShell>
  )
}
