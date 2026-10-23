import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function Dialog({ open, onClose, children, labelledBy, className = '' }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose?.()
      }
    }
    document.addEventListener('keydown', onKey)
    const t = setTimeout(() => {
      const first = panelRef.current?.querySelector('button, input, textarea, [href]')
      first?.focus?.()
    }, 30)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (prev && document.contains(prev)) prev.focus?.()
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="dialog" role="presentation">
      <div className="dialog__scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }} />
      <div
        className={`dialog__panel ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        ref={panelRef}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}
