import { useEffect, useState } from 'react'
import Dialog from './Dialog.jsx'
import Icon from './Icon.jsx'
import { api } from '../lib/api.js'
import { useData } from '../state/DataContext.jsx'
import { useCart } from '../state/CartContext.jsx'
import { useToast } from '../state/ToastContext.jsx'
import { starCopy } from '../lib/dishRating.js'

export default function RatingDialog({ open, dish, orderId, onClose }) {
  const { refreshRatings } = useData()
  const { whoAmI } = useCart()
  const toast = useToast()
  const [stars, setStars] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setStars(0)
    setNote('')
    setError('')
    setSaving(false)
  }, [open, dish?.id])

  const submit = async () => {
    if (!dish || !stars) {
      setError('先点几颗星')
      return
    }
    setSaving(true)
    setError('')
    try {
      await api.ratings.create({
        dish_id: dish.dish_id ?? dish.id,
        stars,
        note: note.trim(),
        by: whoAmI,
        order_id: orderId,
      })
      await refreshRatings()
      toast('记下了')
      onClose?.()
    } catch {
      setError('没记上，再试一次')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy="rating-title">
      <h2 id="rating-title" className="t-h2">{dish?.dish_name || dish?.name || '这道菜'}</h2>
      <p className="t-note" style={{ marginTop: 'var(--s1)' }}>吃完说一句，下次更好。</p>
      <div className="rating-stars" role="group" aria-label="评分">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-star${stars >= n ? ' is-on' : ''}`}
            aria-label={`${n} 星`}
            aria-pressed={stars === n}
            onClick={() => setStars(n)}
          >
            <Icon name="star" size={30} fill={stars >= n} />
          </button>
        ))}
      </div>
      <p className="rating-copy" aria-live="polite">{stars ? starCopy(stars) : '还没点星'}</p>
      <div className="field field--area" style={{ marginTop: 'var(--s3)' }}>
        <textarea
          className="field__input"
          rows={3}
          maxLength={60}
          placeholder="咸淡、火候、下次想怎么改"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <span className="field__count">{note.length}/60</span>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>先不记</button>
        <button type="button" className="btn btn--primary" onClick={submit} disabled={saving}>{saving ? '记着…' : '记下'}</button>
      </div>
    </Dialog>
  )
}
