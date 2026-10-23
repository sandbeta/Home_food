import { useRef, useState } from 'react'

const WIDTH = 88

export default function SwipeRow({ onDelete, deleteLabel = '删除', children }) {
  const [dx, setDx] = useState(0)
  const [open, setOpen] = useState(false)
  const drag = useRef(null)
  const moved = useRef(false)

  const settle = (nextOpen) => {
    setOpen(nextOpen)
    setDx(nextOpen ? -WIDTH : 0)
  }

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    drag.current = { x: e.clientX, y: e.clientY, base: open ? -WIDTH : 0 }
    moved.current = false
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* 合成事件下可能失败 */ }
  }

  const onPointerMove = (e) => {
    if (!drag.current) return
    const deltaX = e.clientX - drag.current.x
    const deltaY = e.clientY - drag.current.y
    if (!moved.current) {
      if (Math.abs(deltaX) < 8 || Math.abs(deltaX) < Math.abs(deltaY)) return
      moved.current = true
    }
    const raw = drag.current.base + deltaX
    const next = raw > 0 ? raw * 0.25 : Math.max(-WIDTH - 28, raw)
    setDx(next)
  }

  const onPointerUp = () => {
    if (!drag.current) return
    drag.current = null
    if (dx < -44) settle(true)
    else settle(false)
  }

  return (
    <div className={`swipe${open || dx < -1 ? ' is-open' : ''}`}>
      <button
        type="button"
        className="swipe__delete"
        aria-label={deleteLabel}
        onFocus={() => settle(true)}
        onClick={() => { onDelete?.(); settle(false) }}
      >
        {deleteLabel}
      </button>
      <div
        className="swipe__content"
        style={{ transform: `translateX(${dx}px)`, transition: drag.current ? 'none' : 'transform 220ms cubic-bezier(.2,.8,.2,1)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => { if (open) settle(false) }}
      >
        {children}
      </div>
    </div>
  )
}
