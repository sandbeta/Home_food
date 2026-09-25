import { useEffect, useRef } from 'react'

/* 批4（R1 根因）：全站浮层统一 body 滚动锁——带引用计数，多层弹窗只在最外层关闭后解锁。 */
let scrollLocks = 0
let savedScrollTop = 0
function lockScroll() {
  if (scrollLocks === 0) {
    savedScrollTop = window.scrollY || document.documentElement.scrollTop || 0
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
}
function unlockScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) {
    document.body.style.overflow = ''
    window.scrollTo(0, savedScrollTop)
  }
}

/**
 * 底部弹窗 / 模态的无障碍增强（六张面板共用）。
 * open=true 时：滚动锁 → 记住触发元素 → 焦点收进面板 → Tab/Shift+Tab 严格环内 → Esc 关闭；
 * 关闭 / 卸载时：解锁滚回，且仅当焦点还在面板里才归还触发元素（用户已点别处则不抢）。
 *
 * @param {boolean} open    面板是否可见
 * @param {Function} onClose 关闭回调（Esc / 遮罩 / 关闭钮共用）
 * @returns {React.RefObject} 挂到面板根节点（需可聚焦，配 tabIndex={-1}）
 */
export default function useDialogA11y(open, onClose) {
  const ref = useRef(null)
  const lastFocus = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => { closeRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return undefined
    const panel = ref.current
    lastFocus.current = document.activeElement
    lockScroll()

    const focusables = () => Array.from(
      panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
    ).filter((el) => (el.checkVisibility ? el.checkVisibility() : (el.offsetWidth || el.offsetHeight || el.getClientRects().length)) || el === document.activeElement)

    // 初始焦点：第一个可交互控件（没有则面板本身）
    ;(focusables()[0] ?? panel)?.focus?.()

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current?.(); return }
      if (e.key !== 'Tab') return
      const items = focusables()
      if (!items.length) { e.preventDefault(); panel?.focus?.(); return }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      /* 批4 修 P1（假模态逃逸）：焦点一旦落到面板外（遮罩点击/panel 不可聚焦失败/body），
         原逻辑两头条件都不命中 → Tab 走进遮罩背后。现在先收敛回来再谈环绕。 */
      if (!(panel && panel.contains(active))) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
        return
      }
      if (e.shiftKey && (active === first || active === panel)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      unlockScroll()
      // 归还焦点给触发元素——仅在焦点还留在面板内时（用户已点到别处就不抢）
      const prev = lastFocus.current
      if (prev && document.contains(prev) && panel && panel.contains(document.activeElement)) prev.focus?.()
    }
  }, [open])

  return ref
}
