import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useDialogA11y from '../lib/useDialogA11y'
import { sheetUp, usePrefersReducedMotion, tapScale } from '../theme/motion'
import { buildPurchaseList, toPlainText } from '../lib/purchaseList'
import Icon from './ui/Icons'
import LoadingState from './ui/LoadingState'
import { tap, vibrate } from '../lib/sfx'

/* ============================================================
 * 批 2b 新增 · 备菜清单底部 Sheet
 * ------------------------------------------------------------
 * 语义：Cart 页面「生成采购清单」入口 → 打开底部 sheet，展示合并去重后的原料列表，
 *   一键复制到剪贴板，可带去超市。
 * 数据来自 lib/purchaseList：懒加载每道菜的 recipe → ingredients 归一化 → 同名合并。
 * ============================================================ */
export default function PurchaseListSheet({ open, onClose, items }) {
  const reduce = usePrefersReducedMotion()
  const panelRef = useDialogA11y(open, onClose)
  const [state, setState] = useState({ loading: true, list: [], noRecipe: [], err: '' })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    let alive = true
    setState({ loading: true, list: [], noRecipe: [], err: '' })
    buildPurchaseList(items)
      .then(r => { if (alive) setState({ loading: false, ...r, err: '' }) })
      .catch(() => { if (alive) setState({ loading: false, list: [], noRecipe: [], err: '拉不到菜谱数据，看看服务端还在不？' }) })
    return () => { alive = false }
  }, [open, items])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(toPlainText(state))
      setCopied(true); tap(); vibrate([10, 30, 12])
      setTimeout(() => setCopied(false), 1800)
      try { window.__cgAnnounce?.('采购清单已复制') } catch {}
    } catch { try { window.__cgAnnounce?.('复制失败，长按选中文字手动复制') } catch {} }
  }

  if (!open) return null

  return createPortal(
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50"
        style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,36,41,0.35)' }} />
      <motion.div ref={panelRef}
        role="dialog" aria-modal="true" aria-label="采购清单" tabIndex={-1}
        {...(reduce ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : sheetUp)}
        className="fixed bottom-0 left-0 right-0 mx-auto z-50 focus:outline-none"
        style={{ maxWidth: 'var(--shell-w)' }}>
        <div className="d3-card-face overflow-hidden flex flex-col" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0', maxHeight: '85vh' }}>
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--color-ash) 30%, transparent)' }} />
          </div>
          <div className="px-5 pb-2 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold font-serif text-[var(--color-bone)] leading-tight">🛒 要买这些东西</h2>
              <p className="text-[11px] text-[var(--color-ash)] mt-0.5">按当前购物车合并，去超市照着买</p>
            </div>
            <button onClick={onClose} aria-label="关闭采购清单"
              className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)] border-2 border-[var(--color-line)] bg-[var(--color-glass)]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-5 flex-1 overflow-y-auto min-h-0" style={{ paddingBottom: 8 }}>
            {state.loading ? (
              <LoadingState text="在合每道菜的原料…" />
            ) : state.err ? (
              <p className="text-sm text-center py-8" style={{ color: 'color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))' }}>⚠️ {state.err}</p>
            ) : state.list.length === 0 ? (
              <p className="text-sm text-center py-8 text-[var(--color-ash)]">这些菜都还没录菜谱原料清单，凭印象买吧~</p>
            ) : (
              <>
                <ul className="space-y-1.5 mt-1" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {state.list.map(e => (
                    <li key={e.name} className="flex items-baseline gap-2 py-1.5 px-2.5 rounded-lg"
                      style={{ background: 'color-mix(in srgb, var(--clay-50) 6%, transparent)' }}>
                      <span aria-hidden className="text-[var(--color-clay-text)] text-sm leading-5">·</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-[var(--color-bone)]">{e.name}</span>
                        {e.from.length > 1 && (
                          <p className="text-[11px] text-[var(--color-ash)] mt-0.5">用在：{e.from.join('、')}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {state.noRecipe.length > 0 && (
                  <p className="text-[11px] text-[var(--color-ash)] mt-3 leading-relaxed">
                    另：{state.noRecipe.join('、')} 没录原料清单，凭印象准备。
                  </p>
                )}
              </>
            )}
          </div>

          <div className="px-5 pt-2 shrink-0" style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 8px)' }}>
            <motion.button whileTap={tapScale} onClick={copy} disabled={state.loading || !state.list.length}
              className="d3-btn d3-btn-primary w-full py-3 text-sm font-bold min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-1.5"
              aria-label="复制采购清单到剪贴板">
              {copied ? (<><Icon name="check" size={16} strokeWidth={2.4} /> 已复制，去超市吧</>) : '一键复制清单 📋'}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
