import { useMemo, useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import AdminTabs from '../../components/AdminTabs.jsx'
import Icon from '../../components/Icon.jsx'
import Dialog from '../../components/Dialog.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Switch from '../../components/Switch.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useData } from '../../state/DataContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { api } from '../../lib/api.js'
import { formatAnniDate } from '../../lib/anniversary.js'
import { ymd } from '../../lib/format.js'

const EMPTY = { name: '', date: '', annual: true, dish_id: '', note: '' }

export default function AdminAnniversaries() {
  const { anniversaries, dishes, loading, refreshAnniversaries } = useData()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const sortedDishes = useMemo(() => [...dishes].sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh')), [dishes])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY, date: ymd() })
    setError('')
    setOpen(true)
  }

  const openEdit = (a) => {
    setEditing(a)
    setForm({
      name: a.name || '',
      date: a.date || '',
      annual: !!a.annual,
      dish_id: a.dish_id == null ? '' : String(a.dish_id),
      note: a.note || '',
    })
    setError('')
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('给这一天起个名字'); return }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) { setError('选一个日期'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        date: form.date,
        annual: form.annual,
        dish_id: form.dish_id ? Number(form.dish_id) : null,
        note: form.note.trim(),
      }
      if (editing) await api.anniversaries.update(editing.id, payload)
      else await api.anniversaries.create(payload)
      await refreshAnniversaries()
      setOpen(false)
      toast(editing ? '改好了' : '记下了')
    } catch {
      setError('没存上，再试一次')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.anniversaries.remove(deleteTarget.id)
      await refreshAnniversaries()
      toast('删掉了')
    } catch {
      toast('删不掉，再试一次')
    } finally {
      setDeleteTarget(null)
    }
  }

  const dishName = (id) => dishes.find((d) => Number(d.id) === Number(id))?.name

  return (
    <>
      <PageHeader
        title="日子"
        sub={`${anniversaries.length} 个日子 · 记着就不忘`}
        back
        right={(
          <button type="button" className="icon-btn icon-btn--surface" aria-label="记一个日子" onClick={openNew}>
            <Icon name="plus" size={22} />
          </button>
        )}
      />
      <AdminTabs />
      <div className="page admin-page">
        <div className="banner banner--sage admin-hint">
          <Icon name="info" size={18} />
          <span className="grow">把「在一起那天」记成不重复，首页就会显示陪伴天数。</span>
        </div>

        {loading && !anniversaries.length ? (
          <div className="stack">
            {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 88, borderRadius: 'var(--r-lg)' }} />)}
          </div>
        ) : !anniversaries.length ? (
          <EmptyState pose="mate" title="还没记日子" note="生日、在一起那天、第一次一起做饭，都可以记。" action={<button type="button" className="btn btn--honey" onClick={openNew}>记一个</button>} />
        ) : (
          <div className="stack">
            {anniversaries.map((a) => (
              <article key={a.id} className="card card--pad admin-anni">
                <div className="grow">
                  <p className="admin-anni__name">
                    {a.name}
                    {a.annual ? <span className="tag tag--honey">每年</span> : <span className="tag">一次性</span>}
                  </p>
                  <p className="t-note">{formatAnniDate(a.date)} · {a.date}</p>
                  {a.dish_id ? <p className="t-micro">绑着「{dishName(a.dish_id) || `#${a.dish_id}`}」</p> : null}
                  {a.note ? <p className="t-micro">{a.note}</p> : null}
                </div>
                <button type="button" className="icon-btn" aria-label={`编辑 ${a.name}`} onClick={() => openEdit(a)}>
                  <Icon name="edit" size={18} />
                </button>
                <button type="button" className="icon-btn" aria-label={`删除 ${a.name}`} onClick={() => setDeleteTarget(a)}>
                  <Icon name="trash" size={18} />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="anni-form-title" className="dialog__panel--tall">
        <h2 id="anni-form-title" className="t-h2">{editing ? '改这个日子' : '记一个日子'}</h2>
        <div className="form-grid">
          <label className="form-field">
            <span className="t-micro">名字</span>
            <div className="field">
              <input className="field__input" value={form.name} maxLength={20} placeholder="生日 / 在一起那天" onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </label>
          <label className="form-field">
            <span className="t-micro">日期</span>
            <div className="field">
              <input className="field__input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </label>
          <div className="setting-row">
            <div>
              <p className="t-body">每年都过</p>
              <p className="t-micro">关掉就是只记这一次</p>
            </div>
            <Switch checked={form.annual} label="每年都过" onChange={(v) => setForm({ ...form, annual: v })} />
          </div>
          <label className="form-field">
            <span className="t-micro">当天吃哪道（可空）</span>
            <div className="field">
              <select className="field__input field__input--select" value={form.dish_id} onChange={(e) => setForm({ ...form, dish_id: e.target.value })}>
                <option value="">不挂菜</option>
                {sortedDishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </label>
          <label className="form-field">
            <span className="t-micro">备注</span>
            <div className="field">
              <input className="field__input" value={form.note} maxLength={60} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </label>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>先不记</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>{saving ? '记着…' : '记下'}</button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`删掉「${deleteTarget?.name || ''}」？`}
        note="首页的倒计时会跟着变。"
        confirmText="删掉"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </>
  )
}
