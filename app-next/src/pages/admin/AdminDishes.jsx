import { useMemo, useState } from 'react'
import PageHeader from '../../components/PageHeader.jsx'
import AdminTabs from '../../components/AdminTabs.jsx'
import Icon from '../../components/Icon.jsx'
import Dialog from '../../components/Dialog.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import Switch from '../../components/Switch.jsx'
import DishArt from '../../components/DishArt.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import { useData } from '../../state/DataContext.jsx'
import { useToast } from '../../state/ToastContext.jsx'
import { api } from '../../lib/api.js'
import { dishImage } from '../../lib/assetUrl.js'
import { money } from '../../lib/format.js'

const CATS = ['家常菜', '主食', '素菜', '小吃', '硬菜', '汤类', '饮品', '川菜', '粤菜', '湘菜', '东北菜', '西北菜', '云贵菜', '徽菜', '闽菜', '浙菜', '苏菜', '鲁菜', '水果', '其他']

const EMPTY = { name: '', category: '家常菜', price: '', description: '', image_url: '', available: true }

export default function AdminDishes() {
  const { dishes, loading, refreshDishes } = useData()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const cats = useMemo(() => {
    const set = new Set(CATS)
    for (const d of dishes) if (d.category) set.add(d.category)
    return [...set]
  }, [dishes])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return dishes
      .filter((d) => {
        if (filter === 'on' && Number(d.available) === 0) return false
        if (filter === 'off' && Number(d.available) !== 0) return false
        if (!q) return true
        return `${d.name || ''}${d.category || ''}${d.description || ''}`.toLowerCase().includes(q)
      })
      .sort((a, b) => (Number(b.available) !== 0) - (Number(a.available) !== 0) || Number(b.id) - Number(a.id))
  }, [dishes, query, filter])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setError('')
    setOpen(true)
  }

  const openEdit = (d) => {
    setEditing(d)
    setForm({
      name: d.name || '',
      category: d.category || '家常菜',
      price: String(d.price ?? ''),
      description: d.description || '',
      image_url: d.image_url || '',
      available: Number(d.available) !== 0,
    })
    setError('')
    setOpen(true)
  }

  const save = async () => {
    if (!form.name.trim()) { setError('菜名要写'); return }
    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0) { setError('价格写个数字'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category || '其他',
        price,
        description: form.description.trim(),
        image_url: form.image_url.trim(),
        available: form.available ? 1 : 0,
      }
      if (editing) await api.dishes.update(editing.id, payload)
      else await api.dishes.create(payload)
      await refreshDishes()
      setOpen(false)
      toast(editing ? '改好了' : '加进去了')
    } catch {
      setError('没存上，再试一次')
    } finally {
      setSaving(false)
    }
  }

  const toggleAvailable = async (d) => {
    setBusyId(d.id)
    try {
      await api.dishes.update(d.id, { available: Number(d.available) !== 0 ? 0 : 1 })
      await refreshDishes()
      toast(Number(d.available) !== 0 ? '先藏起来了' : '又上架了')
    } catch {
      toast('没改成，再试一次')
    } finally {
      setBusyId(null)
    }
  }

  const doDelete = async () => {
    if (!deleteTarget) return
    try {
      await api.dishes.remove(deleteTarget.id)
      await refreshDishes()
      toast('删掉了')
    } catch {
      toast('删不掉，再试一次')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="菜品"
        sub={`${dishes.filter((d) => Number(d.available) !== 0).length} 道在架 · 共 ${dishes.length} 道`}
        back
        right={(
          <button type="button" className="icon-btn icon-btn--surface" aria-label="加一道菜" onClick={openNew}>
            <Icon name="plus" size={22} />
          </button>
        )}
      />
      <AdminTabs />
      <div className="page admin-page">
        <div className="field" style={{ marginBottom: 'var(--s3)' }}>
          <Icon name="menu" size={18} className="field__icon" />
          <input
            className="field__input"
            type="search"
            placeholder="搜菜名、分类、描述"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="搜索菜品"
          />
        </div>
        <div className="seg" style={{ marginBottom: 'var(--s3)' }}>
          <button type="button" className="seg__item" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>全部</button>
          <button type="button" className="seg__item" aria-pressed={filter === 'on'} onClick={() => setFilter('on')}>在架</button>
          <button type="button" className="seg__item" aria-pressed={filter === 'off'} onClick={() => setFilter('off')}>下架</button>
        </div>

        {loading && !dishes.length ? (
          <div className="stack">
            {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--r-md)' }} />)}
          </div>
        ) : !list.length ? (
          <EmptyState pose="mate" title="没找到菜" note="换个词，或者加一道新的。" action={<button type="button" className="btn btn--honey" onClick={openNew}>加一道</button>} />
        ) : (
          <div className="admin-rows">
            {list.map((d) => {
              const src = dishImage(d)
              const off = Number(d.available) === 0
              return (
                <div key={d.id} className={`admin-dish${off ? ' is-off' : ''}`}>
                  <span className="admin-dish__media">
                    {src ? <img src={src} alt="" loading="lazy" /> : <DishArt dish={d} size={38} />}
                  </span>
                  <div className="grow">
                    <p className="admin-dish__name">{d.name}</p>
                    <p className="t-micro">{d.category || '其他'} · {money(d.price)}{off ? ' · 已下架' : ''}</p>
                  </div>
                  <button type="button" className="icon-btn" aria-label={`${off ? '上架' : '下架'} ${d.name}`} disabled={busyId === d.id} onClick={() => toggleAvailable(d)}>
                    <Icon name={off ? 'eye' : 'eyeOff'} size={18} />
                  </button>
                  <button type="button" className="icon-btn" aria-label={`编辑 ${d.name}`} onClick={() => openEdit(d)}>
                    <Icon name="edit" size={18} />
                  </button>
                  <button type="button" className="icon-btn" aria-label={`删除 ${d.name}`} onClick={() => setDeleteTarget(d)}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="dish-form-title" className="dialog__panel--tall">
        <h2 id="dish-form-title" className="t-h2">{editing ? '改这道菜' : '加一道菜'}</h2>
        <div className="form-grid">
          <label className="form-field">
            <span className="t-micro">菜名</span>
            <div className="field">
              <input className="field__input" value={form.name} maxLength={24} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </label>
          <div className="form-row">
            <label className="form-field grow">
              <span className="t-micro">分类</span>
              <div className="field">
                <select className="field__input field__input--select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {cats.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </label>
            <label className="form-field form-field--price">
              <span className="t-micro">价格</span>
              <div className="field">
                <input className="field__input" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.]/g, '') })} />
              </div>
            </label>
          </div>
          <label className="form-field">
            <span className="t-micro">一句话描述</span>
            <div className="field">
              <input className="field__input" value={form.description} maxLength={60} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </label>
          <label className="form-field">
            <span className="t-micro">图片地址（可空）</span>
            <div className="field">
              <input className="field__input" value={form.image_url} placeholder="/dish-images/real/1.webp" onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
          </label>
          <div className="setting-row">
            <span className="t-body">在架</span>
            <Switch checked={form.available} label="在架" onChange={(v) => setForm({ ...form, available: v })} />
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </div>
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>先不改</button>
          <button type="button" className="btn btn--primary" onClick={save} disabled={saving}>{saving ? '存着…' : '存下'}</button>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title={`删掉「${deleteTarget?.name || ''}」？`}
        note="删了之后菜单里就没有这道了，历史订单仍留着。"
        confirmText="删掉"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={doDelete}
      />
    </>
  )
}
