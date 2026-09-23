import { useEffect, useRef } from 'react'

/**
 * 底部弹窗 / 模态的无障碍增强（AddDishModal / NightSnackSheet 共用）。
 * open=true 时：记住触发元素→把焦点收进面板→Tab/Shift+Tab 只在面板内循环→Esc 关闭；
 * 关闭 / 卸载时：把焦点还给原触发元素。绕开"键盘能 Tab 到遮罩背后的页面"这一常见缺陷。
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

    const focusables = () => Array.from(
      panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ?? []
    ).filter((el) => el.offsetWidth || el.offsetHeight || el === document.activeElement)

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
      if (e.shiftKey && (active === first || active === panel)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus() }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // 归还焦点给触发元素
      const prev = lastFocus.current
      if (prev && document.contains(prev)) prev.focus?.()
    }
  }, [open])

  return ref
}
