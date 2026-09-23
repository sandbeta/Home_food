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
  /* 批 6c · 批量上下架模式 */
  const [batchMode, setBatchMode] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [batchBusy, setBatchBusy] = useState(false)

  /* m-30 修：两段式删除 pendingDel 一旦置位无自动收起——若管理员走神/切到别处，
     该按钮长期停在待确认高亮，回头随手一点即真删，误删风险随停留时间累积。
     起 5s 定时器自动复位（用户仍在这行二次点击就即时删除，不冲突）。 */
  useEffect(() => {
    if (pendingDel === null) return undefined
    const t = setTimeout(() => setPendingDel(null), 5000)
    return () => clearTimeout(t)
  }, [pendingDel])

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
    setSelected(new Set())
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

  /* 批 6c · 批量模式：勾选切换 + 批量上/下架（每道菜 PUT 一次；家庭 <千道量级） */
  const batchToggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const batchApply = async (wantAvailable) => {
    if (selected.size === 0 || batchBusy) return
    setBatchBusy(true); setListErr('')
    let ok = 0, fail = 0
    for (const id of selected) {
      try {
        const res = await fetch(`/api/dishes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ available: wantAvailable }),
        })
        if (!res.ok) fail++; else ok++
      } catch { fail++ }
    }
    setBatchBusy(false)
    setSelected(new Set())
    setBatchMode(false)
    loadDishes()
    try { window.__cgAnnounce?.(`批量${wantAvailable ? '上架' : '下架'}完成：成功 ${ok}${fail ? `，失败 ${fail}` : ''}`) } catch {}
    if (fail) setListErr(`批量操作有 ${fail} 道失败，其余 ${ok} 道已生效`)
  }

  return (
    <AdminShell
      title="菜品管理"
      subtitle={`共 ${dishes.length} 道菜`}
      right={
        <div className="flex gap-2">
          <button onClick={() => { setBatchMode(v => !v); setSelected(new Set()) }}
            aria-pressed={batchMode} aria-label="切换批量模式"
            className="d3-btn-sm px-3 py-2 min-h-[44px] text-xs font-bold"
            style={{ background: batchMode ? 'var(--color-clay)' : 'var(--surface)', color: batchMode ? 'var(--color-on-dark)' : 'var(--color-ash)', border: `2px solid ${batchMode ? 'var(--clay-deep)' : 'var(--color-line)'}` }}>
            ☑️ 批量
          </button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => { setPendingDel(null); setEditingDish(null); setShowModal(true) }}
            className="d3-btn d3-btn-primary px-4 py-2 min-h-[44px] text-xs font-bold"
            style={{ borderRadius: 'var(--radius-ctl)' }}
          >
            + 添加
          </motion.button>
        </div>
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
          <button onClick={() => setListErr('')} aria-label="关闭提示" className="text-xs font-bold shrink-0 min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>知道了</button>
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
            <div key={dish.id} className={dish.available ? '' : 'opacity-50'} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {batchMode && (
                <label className="shrink-0 w-11 h-11 flex items-center justify-center" aria-label={`选择 ${dish.name}`}>
                  <input type="checkbox" checked={selected.has(dish.id)} onChange={() => batchToggle(dish.id)}
                    style={{ width: 22, height: 22, accentColor: 'var(--color-clay)' }} />
                </label>
              )}
              <div className="flex-1 min-w-0">
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

      {/* 批 6c · 底部固定批量操作条 */}
      <AnimatePresence>
        {batchMode && selected.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed left-0 right-0 mx-auto z-40 flex items-center gap-2 px-3 py-2"
            style={{ bottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)', maxWidth: 'var(--shell-w)', background: 'var(--color-bone)', color: 'var(--color-on-dark)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-4)' }}
            role="toolbar" aria-label="批量操作"
          >
            <span className="text-sm font-bold px-2 shrink-0">选 {selected.size} 道</span>
            <div className="flex-1" />
            <button onClick={() => batchApply(1)} disabled={batchBusy}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-bold disabled:opacity-50"
              style={{ background: 'var(--color-sage)', color: 'var(--color-on-sage)', border: '2px solid var(--sage-60)' }}>
              {batchBusy ? '处理中…' : '上架'}
            </button>
            <button onClick={() => batchApply(0)} disabled={batchBusy}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-bold disabled:opacity-50"
              style={{ background: 'color-mix(in srgb, var(--color-ash) 24%, transparent)', color: 'var(--color-on-dark)', border: '2px solid color-mix(in srgb, var(--color-ash) 40%, transparent)' }}>
              下架
            </button>
            <button onClick={() => { setSelected(new Set()); setBatchMode(false) }}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-bold"
              style={{ color: 'var(--color-on-dark)', opacity: 0.8 }}>取消</button>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminShell>
  )
}
