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
import { pickOne, NIGHT_SNACK_NOTES } from '../lib/sweetCopy'
import { usePrefersReducedMotion } from '../theme/motion'

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

  // 每次「进入夜宵」都弹：light→night 切换、夜宵态下刷新/首挂载。
  // 组件常驻 App 外壳不随路由重挂载，关一次后切页不会重弹。
  useEffect(() => {
    if (!isNight) return
    fetch('/api/dishes/all').then(r => r.json()).then(all => {
      const pool = nightPick(all)
      if (pool.length) { setDishes(shuffleTake(pool, 6)); setOpen(true) }
    }).catch(() => {})
  }, [isNight])

  // 「看全店」：跳点菜页并预选 🌙夜宵 筛选
  const goAll = () => { setOpen(false); navigate('/menu?cat=夜宵') }
  const close = () => setOpen(false)

  if (!dishes.length) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} className="fixed inset-0 z-50"
            style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,38,32,0.35)' }}
          />
          <motion.div
            initial={reduced ? { opacity: 0 } : { y: '100%' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={reduced ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 mx-auto z-50"
            style={{ maxWidth: 'var(--shell-w)' }}
          >
            <div className="d3-card-face rounded-t-3xl overflow-hidden" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0' }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay), color-mix(in srgb, var(--color-clay) 14%, transparent))' }} />
              </div>
              <div className="px-5 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-clay) 14%, transparent), var(--color-clay))' }}>
                    🌙
                  </div>
                  <div>
                    <h2 className="text-base font-bold font-serif text-[var(--color-bone)] leading-tight">深夜食堂开张了</h2>
                    <p className="text-[11px] text-[var(--color-ash)]">{note}</p>
                  </div>
                </div>
                <button onClick={close} aria-label="关闭夜宵推荐"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-ash)] active:scale-95 transition-transform border border-[var(--color-glass-border)] bg-[var(--color-glass)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>

              {/* 宵夜六宫格：emoji 大图标 + 菜名 + caramel 衬线价 + 一键加购 */}
              <div className="px-4 pb-1 grid grid-cols-2 gap-2">
                {dishes.map(d => (
                  <div key={d.id} className="flex items-center gap-2 rounded-2xl px-2.5 py-2"
                    style={{ background: 'color-mix(in srgb, var(--color-clay) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--color-clay) 12%, transparent)' }}>
                    <span className="text-xl shrink-0" aria-hidden>{getCategoryEmoji(d.category)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[var(--color-bone)] truncate">{d.name}</p>
                      <p className="text-xs font-serif font-bold text-[var(--color-caramel)]"><span className="text-[0.75em]">¥</span>{d.price}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => addItem(d)} aria-label={`加购${d.name}`}
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-base font-bold text-[#FFFDF9]"
                      style={{ background: 'var(--color-clay)' }}>
                      +
                    </motion.button>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-7 pt-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={goAll}
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
