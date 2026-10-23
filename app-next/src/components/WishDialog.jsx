import { useEffect, useState } from 'react'
import Dialog from './Dialog.jsx'
import { api } from '../lib/api.js'
import { useData } from '../state/DataContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { useCart } from '../state/CartContext.jsx'

export default function WishDialog({ open, onClose }) {
  const { refreshWishes } = useData()
  const { whoAmI } = useCart()
  const toast = useToast()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [by, setBy] = useState(whoAmI)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setName('')
      setNote('')
      setBy(whoAmI)
      setError('')
      setSaving(false)
    }
  }, [open, whoAmI])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('先写个菜名，懒懒才知道你想吃啥')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.wishes.create({ name: name.trim(), note: note.trim(), by })
      await refreshWishes()
      toast('愿望收到了，等厨房安排')
      onClose?.()
    } catch {
      setError('没送出去，再试一次')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="wish-title">
      <form onSubmit={submit}>
        <h2 id="wish-title" className="t-h2">许个愿</h2>
        <p className="t-note" style={{ marginTop: 'var(--s1)', marginBottom: 'var(--s4)' }}>想吃就说，懒懒记着。</p>
        <label className="t-micro" htmlFor="wish-name">想吃的</label>
        <div className="field" style={{ marginTop: 'var(--s1)', marginBottom: 'var(--s3)' }}>
          <input
            id="wish-name"
            className="field__input"
            value={name}
            maxLength={24}
            placeholder="菜名，或者一句想吃的"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <label className="t-micro" htmlFor="wish-note">备注</label>
        <div className="field field--area" style={{ marginTop: 'var(--s1)', marginBottom: 'var(--s3)' }}>
          <textarea
            id="wish-note"
            className="field__input"
            value={note}
            maxLength={60}
            rows={3}
            placeholder="口味、做法、什么时候想吃"
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="field__count">{note.length}/60</span>
        </div>
        <div className="seg" style={{ marginBottom: 'var(--s4)' }}>
          <button type="button" className="seg__item" aria-pressed={by === 'me'} onClick={() => setBy('me')}>我</button>
          <button type="button" className="seg__item" aria-pressed={by === 'partner'} onClick={() => setBy('partner')}>TA</button>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>先不写</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? '送出去…' : '送出去'}</button>
        </div>
      </form>
    </Dialog>
  )
}
