// ============================================================
// 深夜食堂开屏弹窗 —— 进入夜宵模式即端出一份宵夜菜单。
// 触发语义（2026-09-18 所有者反馈"只在初次弹"后改版）：每次进入夜宵都弹
// （light→night 切换 / 夜宵态刷新）；旧版按时段戳去重导致同晚再开关不弹，已废弃。
// 浮层骨架与 AddDishModal 同款：遮罩 + 底部卡。
// ============================================================
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from './CartContext'
import { useTheme } from '../theme/useTheme'
import { nightPick } from '../lib/nightRules'
import { getCategoryEmoji } from '../lib/categoryIcons'
import LazySheep from './ui/LazySheep'
import { pickOne, NIGHT_SNACK_NOTES, NIGHT_SNACK_TITLE } from '../lib/sweetCopy'
import { sheetUp, cardEntrance, glowPulse, tapScale, usePrefersReducedMotion } from '../theme/motion'
import useDialogA11y from '../lib/useDialogA11y'
import { requestJson } from '../lib/request'

/** Fisher-Yates 无偏洗牌取前 n 道 */
const shuffleTake = (arr, n) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

export default function NightSnackSheet() {
  const { isNight } = useTheme()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const reduced = usePrefersReducedMotion()
  const [dishes, setDishes] = useState([])
  const [open, setOpen] = useState(false)
  const [note] = useState(() => pickOne(NIGHT_SNACK_NOTES))

  /* M-s1 修：以前 effect 无 alive 校验，isNight true→false 快速切时旧 fetch resolve 仍会 setOpen(true)
     在白天界面弹出深夜模态并触发焦点锁。加 alive flag + isNight=false 时兜底关窗。
     M-s8 修：/api/dishes/all 不过滤 available，后台把夜宵菜下架后弹窗仍能一键加购 → 语义失效。
     修：先 filter available !==0 再 nightPick。 */
  useEffect(() => {
    let alive = true
    if (!isNight) { setOpen(false); return undefined }
    requestJson('/api/dishes/all').then(r => r.json()).then(all => {
      if (!alive) return
      const available = Array.isArray(all) ? all.filter(d => Number(d.available) !== 0) : []
      const pool = nightPick(available)
      if (pool.length) { setDishes(shuffleTake(pool, 6)); setOpen(true) }
    }).catch(() => { /* 拉不到不弹，不打扰用户 */ })
    return () => { alive = false }
  }, [isNight])

  // 「看全店」：跳点菜页并预选 🌙夜宵 筛选
  const goAll = () => { setOpen(false); navigate('/menu?cat=夜宵') }
  const close = () => setOpen(false)

  // 六宫格随托盘升起后逐格亮相（cardEntrance + 0.06 步进，基准 0.22 等 spring 起势，
  // 末格 0.52s 起、0.86s 内全部落定）；reduced 去位移只留淡入
  const cellEnter = (idx) => reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2, delay: 0.15 + idx * 0.06 } }
    : cardEntrance(0.22 + idx * 0.06)

  const panelRef = useDialogA11y(open, close)

  if (!dishes.length) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,36,41,0.35)' }}
          />
          <motion.div
            ref={panelRef}
            role="dialog" aria-modal="true" aria-label="深夜食堂宵夜推荐" tabIndex={-1}
            {...(reduced ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : sheetUp)}
            className="fixed bottom-0 left-0 right-0 mx-auto z-50 focus:outline-none"
            style={{ maxWidth: 'var(--shell-w)' }}
          >
            <div className="d3-card-face rounded-t-3xl overflow-hidden" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay), color-mix(in srgb, var(--color-clay) 14%, transparent))' }} />
              </div>
              <div className="px-5 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    {...(reduced ? {} : glowPulse('color-mix(in srgb, var(--sage-40) 22%, transparent)'))}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay))' }}
                  >
                    <LazySheep size={30} mood="sniff" />
                  </motion.div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-[var(--color-bone)] leading-tight">{NIGHT_SNACK_TITLE}</h2>
                    <p className="text-[11px] text-[var(--color-ash)]">{note}</p>
                  </div>
                </div>
                <button onClick={close} aria-label="关闭夜宵推荐"
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)] active:scale-95 transition-transform border-2 border-[var(--color-line)] bg-[var(--color-glass)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* 宵夜六宫格：emoji 大图标 + 菜名 + caramel 衬线价 + 一键加购 */}
              <div className="px-4 pb-1 grid grid-cols-2 gap-2">
                {dishes.map((d, idx) => (
                  <motion.div key={d.id} {...cellEnter(idx)} className="flex items-center gap-2 rounded-2xl px-2.5 py-2"
                    style={{ background: 'color-mix(in srgb, var(--color-clay) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-clay) 12%, transparent)' }}>
                    <span className="text-xl shrink-0" aria-hidden>{getCategoryEmoji(d.category)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--color-bone)] truncate">{d.name}</p>
                      <p className="text-xs font-serif font-bold text-[var(--color-caramel)]"><span className="text-[0.75em]">¥</span>{d.price}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => addItem(d)} aria-label={`加购${d.name}`}
                      className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-lg font-bold text-[var(--color-on-dark)]"
                      style={{ background: 'var(--color-clay)' }}>
                      +
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* 批4 修 P1：原 pb-7(28px) 顶不过 iPhone 34px 手势条——主 CTA 下沿落进上滑手势带，
                  与同族其余四张 sheet 的 safe-area 算法对齐 */}
              <div className="px-5 pt-3" style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 12px)' }}>
                <motion.button whileTap={tapScale} onClick={goAll}
                  className="d3-btn d3-btn-primary w-full py-3 text-sm">
                  去菜单看全店夜宵 →
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
