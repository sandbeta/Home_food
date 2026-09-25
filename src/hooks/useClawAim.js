// ============================================================
// useClawAim · 娃娃机拖拽瞄准（V5 · 2026-09-24）
// ------------------------------------------------------------
// 按住罩横向拖 → 小车跟手 → 抬手即下爪抓瞄准那一格（所见即所得）。
// 用 setPointerCapture 而非手写 window 监听：
//   · 指针移出罩外仍能连续收到 pointermove，不会脱跟；
//   · pointerup / pointercancel 由浏览器统一回派到捕获元素，天然无"监听不摘/卡死"；
//   · 抬手在 onPointerUp 里直接落爪，不再依赖 onClick，消除"拖完紧跟一次 click"的竞态
//     （原 grabLockout 250ms 补丁因此不再需要，保留常量仅作兜底参考）。
// 瞄准格切换时抛一个 aria-live 文本给屏幕阅读器（当前瞄准哪道）。
// 映射逻辑走 clawPool.aimSlotIdx 纯函数单一真源：优先吸附「最近的有菜槽位」，
// 全空才退回最近任意槽，杜绝拖到空槽抬手静默失败（且有单测保护）。
// ============================================================
import { useCallback, useEffect, useRef, useState } from 'react'
import { aimSlotIdx } from '../lib/clawPool'

/**
 * @param {object}   o
 * @param {React.RefObject} o.caseRef   罩（承载 pointer 事件与 pointer capture 的元素）
 * @param {Array<object|null>} o.slots  当前堆（aimLabel 取菜名 + 判定槽位是否有菜用）
 * @param {Array<{x:string}>}  o.layout PILE_SLOTS（含每格 x:'NN%'）
 * @param {boolean}  o.disabled  抓取中禁用拖拽
 * @param {(idx:number)=>void} o.onDrop  抬手/确认下爪（传瞄准到的槽下标）
 * @returns {{aimIdx:number, dragging:boolean, aimLabel:string, shiftAim:(dir:number)=>void,
 *            handlers:{onPointerDown:(e:PointerEvent)=>void, onPointerMove:(e:PointerEvent)=>void,
 *            onPointerUp:(e:PointerEvent)=>void, onPointerCancel:(e:PointerEvent)=>void}}}
 */
export function useClawAim({ caseRef, slots, layout, disabled = false, onDrop }) {
  const [aimIdx, setAimIdx] = useState(-1)
  const [dragging, setDragging] = useState(false)
  const rectRef = useRef(null)     // pointerdown 时测一次，move 复用，避免每帧 getBoundingClientRect 触发 reflow
  const aimRef = useRef(-1)
  const pidRef = useRef(null)      // 本次拖拽的 pointerId（修 P1：原 el._pid 从未赋值，释放捕获是空操作）

  const setAim = useCallback((i) => {
    if (i !== aimRef.current) { aimRef.current = i; setAimIdx(i) }
  }, [])

  // 相对罩内的横向百分比（越界夹到 0~100）
  const percentFrom = (clientX) => {
    const r = rectRef.current
    if (!r || !r.width) return 50
    return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100))
  }

  const aimTo = useCallback((clientX) => {
    const pct = percentFrom(clientX)
    const target = aimSlotIdx(pct, layout, slots)
    if (target >= 0) setAim(target)
  }, [layout, slots, setAim])

  const onPointerDown = useCallback((e) => {
    if (disabled || e.button != null && e.button !== 0) return
    if (pidRef.current != null) return        // 多指：只认起手那一指，其余手指的 down/move/up 全部忽略
    const el = caseRef.current
    if (!el) return
    try { el.setPointerCapture(e.pointerId) } catch { /* 某些环境不支持则忽略，退回元素内事件 */ }
    pidRef.current = e.pointerId
    rectRef.current = el.getBoundingClientRect()
    setDragging(true)
    aimTo(e.clientX)
  }, [disabled, caseRef, aimTo])

  const onPointerMove = useCallback((e) => {
    if (!dragging || disabled || e.pointerId !== pidRef.current) return
    aimTo(e.clientX)
  }, [dragging, disabled, aimTo])

  // 抬手 = 下爪：抓到当前瞄准的那一格（未拖过则用 aimRef，可能 -1 交给 onDrop 兜随机）
  const endDrag = useCallback((commit) => {
    const el = caseRef.current
    if (el && pidRef.current != null) { try { el.releasePointerCapture(pidRef.current) } catch { /* 未捕获/已随抬手隐式释放 */ } }
    pidRef.current = null
    setDragging(false)
    if (commit && aimRef.current >= 0) onDrop?.(aimRef.current)
  }, [caseRef, onDrop])

  const onPointerUp = useCallback((e) => {
    if (e.pointerId !== pidRef.current) return   // 非起手手指抬起不参与落爪判定
    endDrag(true)
  }, [endDrag])
  // 系统手势/来电/多指打断：只清态不落爪，杜绝卡死
  const onPointerCancel = useCallback((e) => {
    if (e.pointerId !== pidRef.current) return
    endDrag(false)
  }, [endDrag])

  // 卸载兜底：清 dragging（pointer capture 由浏览器随元素销毁自动释放）
  useEffect(() => () => setDragging(false), [])

  // 键盘瞄准：←→ 移格（循环到下一个非空格），供无法拖拽时使用
  const shiftAim = useCallback((dir) => {
    setAimIdx((prev) => {
      let i = prev
      for (let step = 0; step < slots.length; step++) {
        i = (i < 0 ? (dir > 0 ? -1 : slots.length) : i) + dir
        i = (i + slots.length) % slots.length
        if (slots[i]) break
      }
      aimRef.current = i
      return i
    })
  }, [slots])

  const aimLabel = aimIdx >= 0 && slots[aimIdx] ? `当前瞄准：${slots[aimIdx].name}` : ''

  return {
    aimIdx, dragging, aimLabel, shiftAim,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  }
}
