import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useDragControls } from 'framer-motion'
import Icon from './Icon.jsx'

export default function Sheet({ open, onClose, title, children, labelledBy = 'sheet-title' }) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="sheet">
          <motion.div
            className="sheet__scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? labelledBy : undefined}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.28 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 650) onClose?.()
            }}
          >
            <div
              className="sheet__grab"
              aria-hidden="true"
              onPointerDown={(e) => controls.start(e)}
            />
            {title ? (
              <div className="sheet__head">
                <div>
                  <p className="t-micro">懒懒的厨房</p>
                  <h2 id={labelledBy} className="t-title">{title}</h2>
                </div>
                <button type="button" className="icon-btn icon-btn--field" aria-label="关闭" onClick={onClose}>
                  <Icon name="close" size={18} />
                </button>
              </div>
            ) : null}
            <div className="sheet__body">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
