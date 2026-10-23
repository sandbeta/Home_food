import { useMemo, useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import AdminTabs from '../../components/AdminTabs.jsx'
import Icon from '../../components/Icon.jsx'
import Dialog from '../../components/Dialog.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useData } from '../../state/DataContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { api } from '../../lib/api.js'
import { formatWhen } from '../../lib/format.js'

const FILTERS = [
  { key: 'pending', label: '待处理' },
  { key: 'added', label: '做过了' },
  { key: 'rejected', label: '婉拒了' },
  { key: 'all', label: '全部' },
]

const STATUS = {
  pending: { label: '想吃', tone: 'tag--warn' },
  added: { label: '做过了', tone: 'tag--success' },
  rejected: { label: '婉拒了', tone: 'tag' },
}

export default function AdminWishes() {
  const { wishes, dishes, loading, refreshWishes } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState('pending')
  const [convert, setConvert] = useState(null)
  const [dishId, setDishId] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sortedDishes = useMemo(() => [...dishes].sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh')), [dishes])
  const list = useMemo(() => {
    const sorted = [...wishes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return filter === 'all' ? sorted : sorted.filter((w) => w.status === filter)
  }, [wishes, filter])

  const dishName = (id) => dishes.find((d) => Number(d.id) === Number(id))?.name

  const openConvert = (w) => {
    setConvert(w)
    setDishId(w.added_dish_id ? String(w.added_dish_id) : '')
  }

  const doConvert = async () => {
    if (!convert) return
    setSaving(true)
    try {
      await api.wishes.update(convert.id, {
        status: 'added',
        added_dish_id: dishId ? Number(dishId) : null,
      })
      await refreshWishes()
      toast('记成菜了')
      setConvert(null)
    } catch {
      toast('没存上，再试一次')
    } finally {
      setSaving(false)
    }
  }

  const setStatus = async (w, status) => {
    try {
      await api.wishes.update(w.id, { status })
      await refreshWishes()
      toast(status === 'rejected' ? '婉拒了' : '放回待处理了')
    } catch {
      toast('没改成，再试一次')
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.wishes.remove(deleteTarget.id)
      await refreshWishes()
      toast('删掉了')
    } catch {
      toast('删不掉，再试一次')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <PageHeader title="愿望" sub={`${wishes.filter((w) => w.status === 'pending').length} 条等着`} back />
      <AdminTabs />
      <div className="page admin-page">
        <div className="admin-filters scroll-x" role="group" aria-label="按状态筛选">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`chip ${filter === f.key ? 'chip--active' : 'chip--field'}`} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && !wishes.length ? (
          <div className="stack">
            {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--r-lg)' }} />)}
          </div>
        ) : !list.length ? (
          <EmptyState pose="mate" title="这一栏空着" note="家人许的愿会出现在这里。" />
        ) : (
          <div className="stack">
            {list.map((w) => {
              const st = STATUS[w.status] || STATUS.pending
              return (
                <article key={w.id} className="card card--pad admin-wish">
                  <div className="admin-wish__top">
                    <span className={`tag ${st.tone}`}>{st.label}</span>
                    <span className="t-micro">{w.by === 'me' ? '我' : 'TA'} · {formatWhen(w.created_at)}</span>
                  </div>
                  <p className="admin-wish__name">{w.name}</p>
                  {w.note ? <p className="t-note">{w.note}</p> : null}
                  {w.added_dish_id ? <p className="t-micro">挂到了「{dishName(w.added_dish_id) || `#${w.added_dish_id}`}」</p> : null}
                  <div className="admin-wish__actions">
                    {w.status === 'pending' ? (
                      <>
                        <button type="button" className="btn btn--honey btn--sm" onClick={() => openConvert(w)}>做出来了</button>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStatus(w, 'rejected')}>婉拒</button>
                      </>
                    ) : null}
                    {w.status === 'rejected' ? (
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setStatus(w, 'pending')}>放回待处理</button>
                    ) : null}
                    <button type="button" className="icon-btn" aria-label={`删除 ${w.name}`} onClick={() => setDeleteTarget(w)}>
                      <Icon name="trash" size={18} />
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!convert} onClose={() => setConvert(null)} labelledBy="wish-done-title">
        <h2 id="wish-done-title" className="t-h2">「{convert?.name || ''}」做出来了</h2>
        <p className="t-note" style={{ marginTop: 'var(--s1)', marginBottom: 'var(--s3)' }}>可以顺手挂到菜单里的某道菜上。</p>
        <div className="field">
          <select className="field__input field__input--select" value={dishId} onChange={(e) => setDishId(e.target.value)} aria-label="挂到菜品">
            <option value="">先不挂菜</option>
            {sortedDishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConvert(null)}>先不挂</button>
          <button type="button" className="btn btn--primary" onClick={doConvert} disabled={saving}>{saving ? '存着…' : '记成菜'}</button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`删掉「${deleteTarget?.name || ''}」？`}
        note="删了就找不回来了。"
        confirmText="删掉"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </>
  )
}
