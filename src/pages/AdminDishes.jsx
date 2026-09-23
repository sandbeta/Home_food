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
  const [listErr, setListErr] = useState('')
  const [pendingDel, setPendingDel] = useState(null)   // 两段式删除：记住当前待确认的行
  const loadDishes = () => {
    fetch('/api/dishes/all')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then((d) => { setDishes(d); setLoading(false); setListErr('') })
      .catch(() => { setLoading(false); setListErr('菜品列表没加载出来，看看服务端开好了没') })
  }
  useEffect(() => { loadDishes() }, [])
  const visibleDishes = dishes.slice(0, visibleCount)

  const handleSave = async (form) => {
    const res = await fetch(editingDish ? `/api/dishes/${editingDish.id}` : '/api/dishes', {
      method: editingDish ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)   // 抛给弹窗处理：失败保留输入、不关闭
    setShowModal(false)
    setEditingDish(null)
    loadDishes()
  }

  const handleDelete = async (id) => {
    if (pendingDel !== id) { setPendingDel(id); return }   // 第一次=进入确认，再点才真删
    setPendingDel(null)
    try {
      const res = await fetch(`/api/dishes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      loadDishes()
    } catch { setListErr('这道菜没删掉，再试一次') }
  }

  const handleToggle = async (d) => {
    setPendingDel(null)
    try {
      const res = await fetch(`/api/dishes/${d.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: d.available ? 0 : 1 }),
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)
      loadDishes()
    } catch { setListErr('上架状态没改过来，再试一次') }
  }

  return (
    <AdminShell
      title="菜品管理"
      subtitle={`共 ${dishes.length} 道菜`}
      right={
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { setPendingDel(null); setEditingDish(null); setShowModal(true) }}
          className="d3-btn d3-btn-primary px-4 py-2 text-xs font-bold"
          style={{ borderRadius: 'var(--radius-ctl)' }}
        >
          + 添加
        </motion.button>
      }
    >
      {listErr && (
        <div role="alert"
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
          style={{
            borderRadius: 'var(--radius-ctl)',
            background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))',
            border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
          }}>
          <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {listErr}</span>
          <button onClick={() => setListErr('')} aria-label="关闭提示" className="text-xs font-bold shrink-0" style={{ color: 'var(--color-ash)' }}>知道了</button>
        </div>
      )}
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
                    {/* 管理端 quieter：行内次级动作全部中性化（安静纸面按钮），
                        人格色让位给右上角唯一主操作「+ 添加」；删除保留 danger 语义色 */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleToggle(dish)}
                      className="flex-1 min-h-[44px] px-2 text-xs font-bold"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: 'var(--surface)',
                        color: 'var(--color-ash)',
                        border: '2px solid var(--color-line)',
                      }}
                    >
                      {dish.available ? '✓ 上架' : '已下架'}
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { setPendingDel(null); setEditingDish(dish); setShowModal(true) }}
                      className="flex-1 min-h-[44px] px-2 text-xs font-bold"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: 'var(--surface)',
                        color: 'var(--color-bone)',
                        border: '2px solid var(--color-line)',
                      }}
                    >
                      编辑
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(dish.id)}
                      className="flex-1 min-h-[44px] px-2 text-xs font-bold"
                      style={{
                        borderRadius: 'var(--radius-ctl)',
                        background: pendingDel === dish.id ? 'var(--color-danger)' : 'var(--surface)',
                        color: pendingDel === dish.id ? 'var(--color-on-dark)' : 'var(--color-danger)',
                        border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)',
                      }}
                    >
                      {pendingDel === dish.id ? '确认删除？' : '删除'}
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
          className="d3-btn-sm py-2.5 text-sm font-bold text-[var(--color-ash)] self-center px-6"
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
