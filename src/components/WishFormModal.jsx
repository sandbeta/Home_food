import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useDialogA11y from '../lib/useDialogA11y'
import { sheetUp, usePrefersReducedMotion } from '../theme/motion'
import { requestJson } from '../lib/request'
import { useCart } from './CartContext'
import { tap, vibrate } from '../lib/sfx'

/* ============================================================
 * 批 1 新增 · 愿望池表单弹窗
 * ------------------------------------------------------------
 * 语义：她（或他）想吃的菜但菜单没有 → 提交愿望 → 他在 Admin 补齐/拒绝。
 * 关闭即提交，不预校验，name 必填、note 选填。
 * by 用当前 whoAmI 落库（partner 提的是"她想要"，me 提的是"他自提"）。
 * ============================================================ */
export default function WishFormModal({ open, onClose, onSubmitted }) {
  const { whoAmI } = useCart()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const reduce = usePrefersReducedMotion()
  const panelRef = useDialogA11y(open, onClose)
  if (!open) return null

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setErr('给它起个名，他才知道做啥~'); return }
    setSaving(true); setErr('')
    try {
      const res = await requestJson('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), note: note.trim(), by: whoAmI }),
      })
      const item = await res.json()
      setName(''); setNote(''); setSaving(false)
      tap(); vibrate([10, 30, 12])
      try { window.__cgAnnounce?.(`愿望已送到，他会看到`) } catch {}
      onSubmitted?.(item)
      onClose()
    } catch {
      setSaving(false); setErr('没送出去——服务端还在不？再点一次')
    }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,36,41,0.35)' }} />
      <motion.div ref={panelRef}
        role="dialog" aria-modal="true" aria-label="告诉他想吃什么" tabIndex={-1}
        {...(reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : sheetUp)}
        className="fixed bottom-0 left-0 right-0 mx-auto z-50 focus:outline-none"
        style={{ maxWidth: 'var(--shell-w)' }}>
        <div className="d3-card-face rounded-t-3xl overflow-hidden" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0' }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-ash) 30%, transparent)' }} />
          </div>
          <div className="px-5 pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--color-bone)]">许个愿 🌠</h2>
              <p className="text-xs text-[var(--color-ash)] mt-0.5">想吃什么菜单没有？说给他，他给你变出来。</p>
            </div>
            <button onClick={onClose} aria-label="关闭"
              className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)] border-2 border-[var(--color-line)] bg-[var(--color-glass)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <form onSubmit={submit} className="px-5 space-y-3"
            style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 16px)' }}>
            <div>
              <label htmlFor="wish-name" className="text-sm text-[var(--color-ash)] block mb-1.5 font-semibold">叫什么<span aria-hidden> *</span></label>
              <input id="wish-name" value={name} onChange={e => setName(e.target.value)}
                placeholder="比如「外婆牌梅菜扣肉」" maxLength={30} required aria-required
                className="d3-input w-full px-3.5 py-2.5 text-sm"
                style={{ borderRadius: 'var(--radius-btn)' }} />
            </div>
            <div>
              <label htmlFor="wish-note" className="text-sm text-[var(--color-ash)] block mb-1.5 font-semibold">长什么样 / 什么味道</label>
              <textarea id="wish-note" value={note} onChange={e => setNote(e.target.value)}
                placeholder="让他知道往哪个方向做才对味…" rows={3} maxLength={140}
                className="d3-input w-full px-3.5 py-2.5 text-sm resize-none"
                style={{ borderRadius: 'var(--radius-btn)' }} />
            </div>
            {err && (
              <div id="wish-err" role="alert"
                className="text-xs font-semibold px-3 py-2 rounded-xl"
                style={{
                  background: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--color-danger) 30%, transparent)',
                  color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))',
                }}>{err}</div>
            )}
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} aria-describedby={err ? 'wish-err' : undefined}
              className="d3-btn d3-btn-primary w-full py-3 text-sm font-bold min-h-[44px] disabled:opacity-60">
              {saving ? '正在送出…' : '送到他的厨房 🚚'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
