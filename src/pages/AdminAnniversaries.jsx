import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminShell from '../components/ui/AdminShell'
import Icon from '../components/ui/Icons'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { requestJson } from '../lib/request'
import { nextAnniversary, formatAnniDate } from '../lib/anniversary'

/* ============================================================
 * 批 1 新增 · 纪念日管理（他侧）
 * ------------------------------------------------------------
 * 一行 = 一个纪念日：名字 / 首次日期 / 每年重复 / 绑定菜（可选）/ 备注
 * 顶部展示"下一个纪念日倒计时"；行内展开式编辑（不额外挂弹窗），减少层数。
 * ============================================================ */
const EMPTY_FORM = { name: '', date: '', annual: true, dish_id: '', note: '' }

export default function AdminAnniversaries() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [editingId, setEditingId] = useState(null)  // null=收起 / 'new'=新增 / 数字=编辑
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  /* §7.22 修：§7.15 已全清原生 confirm，本批回归；改两段式（与 AdminDishes 同模式） */
  const [pendingDelId, setPendingDelId] = useState(null)
  useEffect(() => {
    if (pendingDelId === null) return undefined
    const t = setTimeout(() => setPendingDelId(null), 5000)
    return () => clearTimeout(t)
  }, [pendingDelId])

  const load = () => {
    setLoading(true); setErr('')
    requestJson('/api/anniversaries').then(r => r.json())
      .then(d => { setList(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('纪念日没加载出来，看看服务端开好了没') })
  }
  useEffect(() => { load() }, [])

  const next = useMemo(() => nextAnniversary(list), [list])

  const startNew = () => { setEditingId('new'); setForm(EMPTY_FORM) }
  const startEdit = (a) => {
    setEditingId(a.id)
    setForm({ name: a.name || '', date: a.date || '', annual: a.annual !== false, dish_id: a.dish_id || '', note: a.note || '' })
  }
  const cancel = () => { setEditingId(null); setForm(EMPTY_FORM) }

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.date) { setErr('名字和日期不能空') ; return }
    setSaving(true); setErr('')
    const payload = {
      name: form.name.trim(),
      date: form.date,
      annual: !!form.annual,
      dish_id: form.dish_id ? Number(form.dish_id) : null,
      note: form.note.trim(),
    }
    try {
      if (editingId === 'new') {
        await requestJson('/api/anniversaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        await requestJson(`/api/anniversaries/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      cancel(); setSaving(false); load()
      try { window.__cgAnnounce?.('纪念日已保存') } catch {}
    } catch { setSaving(false); setErr('保存没成功，服务端还在不？') }
  }

  const remove = async (id) => {
    try {
      await requestJson(`/api/anniversaries/${id}`, { method: 'DELETE' })
      load()
    } catch { setErr('删除失败，再试一次') }
  }

  return (
    <AdminShell title="纪念日" subtitle={list.length > 0 ? `共 ${list.length} 个日子` : ''}
      right={<button onClick={startNew} className="d3-btn d3-btn-primary px-4 py-2 min-h-[44px] text-xs font-bold" style={{ borderRadius: 'var(--radius-ctl)' }}>+ 添加</button>}>
      {err && (
        <div role="alert"
          className="flex items-center justify-between gap-3 px-3.5 py-2.5 mb-3"
          style={{ borderRadius: 'var(--radius-ctl)', background: 'color-mix(in srgb, var(--color-danger) 10%, var(--surface))', border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)' }}>
          <span className="text-sm font-semibold" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {err}</span>
          <button onClick={() => setErr('')} aria-label="关闭提示" className="text-xs font-bold shrink-0 min-h-[44px] px-3 rounded-full" style={{ color: 'var(--color-ash)' }}>知道了</button>
        </div>
      )}
      {!loading && !err && next && (
        <div className="mb-4 px-4 py-3 flex items-center gap-3"
          style={{ background: 'var(--anchor-ink)', borderRadius: 'var(--radius-card)', border: '2px solid var(--clay-deep)', color: 'var(--color-on-dark)', boxShadow: 'var(--shadow-3)' }}>
          <span aria-hidden className="text-2xl">🎂</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold" style={{ letterSpacing: '0.14em', opacity: 0.88 }}>下一个</p>
            <p className="text-sm font-bold truncate">{next.anniversary.name} · 还有 {next.days} 天</p>
          </div>
        </div>
      )}
      {loading ? <LoadingState emoji="🎂" /> : list.length === 0 ? (
        <EmptyState emoji="🎂" title="还没记下我们的日子" desc="在一起那天 / 生日 / 初吻 / 第一次吃饭 · 都记上吧"
          action={<button onClick={startNew} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold">记下第一个</button>} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-card-p)' }}>
          {list.map(a => (
            <div key={a.id} className="d3-card-face p-4" style={{ padding: 'var(--space-card-p)' }}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-base text-[var(--color-bone)] truncate">{a.name}</p>
                  <p className="text-xs text-[var(--color-ash)] mt-0.5">
                    {formatAnniDate(a.date)} · {a.annual ? '每年' : '一次性'}
                    {a.note ? ` · ${a.note}` : ''}
                  </p>
                </div>
                <button onClick={() => startEdit(a)} aria-label={`编辑 ${a.name}`}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)]"
                  style={{ border: '2px solid var(--color-line)' }}>
                  <Icon name="gear" size={16} strokeWidth={2} />
                </button>
                <button onClick={() => { if (pendingDelId === a.id) { remove(a.id); setPendingDelId(null) } else setPendingDelId(a.id) }} aria-label={pendingDelId === a.id ? `再次点击确认删除 ${a.name}` : `删除 ${a.name}`}
                  className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0 px-1"
                  style={{
                    background: pendingDelId === a.id ? 'var(--color-danger)' : 'var(--surface)',
                    color: pendingDelId === a.id ? 'var(--color-on-dark)' : 'var(--color-danger)',
                    border: '2px solid color-mix(in srgb, var(--color-danger) 40%, transparent)',
                  }}>
                  {pendingDelId === a.id ? '确认?' : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>}
                </button>
              </div>
              <AnimatePresence>
                {editingId === a.id && <AnniversaryForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />}
              </AnimatePresence>
            </div>
          ))}
          {editingId === 'new' && (
            <div className="d3-card-face" style={{ padding: 'var(--space-card-p)' }}>
              <AnniversaryForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
            </div>
          )}
        </div>
      )}
    </AdminShell>
  )
}

function AnniversaryField({ id, label, ...rest }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-[var(--color-ash)] block mb-1 font-semibold">{label}</label>
      <input id={id} {...rest} className="d3-input w-full px-3 py-2 text-sm" style={{ borderRadius: 'var(--radius-btn)' }} />
    </div>
  )
}

function AnniversaryForm({ form, setForm, onSave, onCancel, saving }) {
  const motion_props = { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, className: 'overflow-hidden mt-3 pt-3', style: { borderTop: '1px dashed var(--color-line)' } }
  return (
    <motion.form onSubmit={onSave} {...motion_props}>
      <div className="space-y-2.5">
        <AnniversaryField id="anni-name" label="叫什么" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="第一次吃饭纪念日" maxLength={20} required />
        <AnniversaryField id="anni-date" label="首次日期" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        <AnniversaryField id="anni-dish" label="回忆里那道菜（选填 dish_id）" type="number" value={form.dish_id} onChange={e => setForm({ ...form, dish_id: e.target.value })} placeholder="留空则不锁定娃娃机主推" inputMode="numeric" />
        <div>
          <label htmlFor="anni-note" className="text-xs text-[var(--color-ash)] block mb-1 font-semibold">小备注</label>
          <textarea id="anni-note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
            placeholder="他记得就好，你也可以留一句"
            className="d3-input w-full px-3 py-2 text-sm resize-none" rows={2} maxLength={80}
            style={{ borderRadius: 'var(--radius-btn)' }} />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--color-bone)] cursor-pointer min-h-[44px]">
          <input type="checkbox" checked={!!form.annual} onChange={e => setForm({ ...form, annual: e.target.checked })} className="w-4 h-4" />
          每年重复（生日/在一起那天默认勾选，一次性事件取消勾选）
        </label>
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onCancel} className="d3-btn-sm flex-1 py-2 text-xs font-bold min-h-[44px]">算了</button>
          <button type="submit" disabled={saving} className="d3-btn d3-btn-primary flex-1 py-2 text-xs font-bold min-h-[44px] disabled:opacity-60">{saving ? '保存中…' : '好啦'}</button>
        </div>
      </div>
    </motion.form>
  )
}
