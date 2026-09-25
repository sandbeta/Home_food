import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/ui/PageContainer'
import FullBleedHero from '../components/FullBleedHero'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import OrderCard from '../components/ui/OrderCard'
import { HERO_IMAGES } from '../theme/images'
import { orderStatusOf } from '../theme/persona'
import { requestJson } from '../lib/request'
import { pickOne } from '../lib/sweetCopy'
import useDialogA11y from '../lib/useDialogA11y'

/* ============================================================
 * 批 3a · 菜谱日历（月历视图回看每天吃了什么）
 * ------------------------------------------------------------
 * 数据源：/api/orders 全表本地分桶（家庭订单量 <百级）
 * 视图：月历网格（7 列 × 5-6 行）；每格显日号 + 那天做了几个单，圆点色按主 category
 * 交互：月份切换 ← →；点击某日 → 底部 sheet 显当日所有订单（复用 OrderCard）
 * 语义：让「这本别册」能翻回某一天，"我们上次吃这个是什么时候"一查就知
 * ============================================================ */
const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']
const CAL_TITLES = ['我们一起吃过的日子', '厨房日历', '翻开这本别册', '每一格都是一顿饭']

function pad2(n) { return String(n).padStart(2, '0') }
function ymdStr(d) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

// 从日期字符串"YYYY-MM-DD..."取 y/m/d
function parseYmd(s) {
  const y = Number(s.slice(0, 4)), m = Number(s.slice(5, 7)) - 1, d = Number(s.slice(8, 10))
  return new Date(y, m, d)
}

export default function KitchenCalendar() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [today] = useState(() => new Date())
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-11
  const [selectedDay, setSelectedDay] = useState(null)          // 'YYYY-MM-DD' 或 null
  const [pageTitle] = useState(() => pickOne(CAL_TITLES))

  const load = () => {
    setLoading(true); setErr('')
    requestJson('/api/orders').then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('订单没加载出来，看看服务端开好了没') })
  }
  useEffect(() => { load() }, [])

  /* 按 YYYY-MM-DD 分桶，一天可能多单；同时统计每天 category 分布决定圆点色 */
  const dayMap = useMemo(() => {
    const map = {}
    for (const o of orders) {
      if (!o.created_at) continue
      const key = o.created_at.slice(0, 10)
      if (!map[key]) map[key] = { orders: [], cats: new Set() }
      map[key].orders.push(o)
      for (const it of (o.items || [])) if (it.category) map[key].cats.add(it.category)
    }
    return map
  }, [orders])

  /* 月历网格：从当月 1 号所在周一起铺，共 42 格（6 周） */
  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1)
    // 周一为一周首日：JS 里周日=0，故偏移 = (first.getDay()+6)%7
    const offset = (first.getDay() + 6) % 7
    const out = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(viewYear, viewMonth, 1 - offset + i)
      const key = ymdStr(d)
      const inMonth = d.getMonth() === viewMonth
      const day = dayMap[key]
      const isToday = key === ymdStr(today)
      out.push({ key, inMonth, dayNum: d.getDate(), has: day && day.orders.length, count: day ? day.orders.length : 0, cats: day ? Array.from(day.cats) : [], isToday, future: d > today })
    }
    return out
  }, [viewYear, viewMonth, dayMap, today])

  const shiftMonth = (delta) => {
    const d = new Date(viewYear, viewMonth + delta, 1)
    setViewYear(d.getFullYear()); setViewMonth(d.getMonth())
  }

  const selectedOrders = selectedDay && dayMap[selectedDay] ? dayMap[selectedDay].orders : []
  const daySheetRef = useDialogA11y(!!selectedDay, () => setSelectedDay(null))

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="厨房日历" />
      <PageHeader title={pageTitle} subtitle="点某天看那天吃了啥" back onBack={() => navigate('/profile')} />

      <PageContainer>
        {loading ? <LoadingState text="在翻这本别册…" /> : err ? (
          <EmptyState emoji="📡" tone="error" title="日历没加载出来" desc={err}
            action={<button onClick={load} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold min-h-[44px]">再试一次</button>} />
        ) : (
          <>
            {/* 月份切换 */}
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => shiftMonth(-1)} aria-label="上一月"
                className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)]"
                style={{ border: '2px solid var(--color-line)' }}>‹</button>
              <p className="font-serif font-bold text-lg text-[var(--color-bone)] tabular-nums">
                {viewYear} 年 {viewMonth + 1} 月
              </p>
              <button onClick={() => shiftMonth(1)} aria-label="下一月"
                className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)]"
                style={{ border: '2px solid var(--color-line)' }}>›</button>
            </div>

            {/* 星期表头 */}
            <div className="grid grid-cols-7 gap-1 mb-1 text-center">
              {WEEKDAYS.map(w => (
                <span key={w} className="text-[11px] font-bold text-[var(--color-ash)] py-1">{w}</span>
              ))}
            </div>

            {/* 42 格月历 */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map(c => (
                <button
                  key={c.key}
                  onClick={() => c.has && setSelectedDay(c.key)}
                  disabled={!c.has}
                  aria-label={c.has ? `${c.dayNum} 日，${c.count} 单，点看详情` : `${c.dayNum} 日，没下单`}
                  className="relative aspect-square rounded-[var(--radius-tile)] flex flex-col items-center justify-center transition-colors"
                  style={{
                    background: c.has
                      ? 'color-mix(in srgb, var(--clay-50) 12%, var(--surface))'
                      : 'transparent',
                    border: c.isToday ? '2px solid var(--color-clay)' : '2px solid transparent',
                    opacity: c.inMonth ? 1 : 0.28,
                    cursor: c.has ? 'pointer' : 'default',
                  }}
                >
                  <span className="font-serif font-bold text-sm tabular-nums text-[var(--color-bone)]">{c.dayNum}</span>
                  {c.has && (
                    <span className="flex gap-0.5 mt-0.5" aria-hidden>
                      {Array.from(new Set(c.cats)).slice(0, 3).map(cat => (
                        <span key={cat} className="w-1 h-1 rounded-full" style={{ background: 'var(--color-clay)' }} />
                      ))}
                    </span>
                  )}
                  {c.has && c.count > 1 && (
                    <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--color-love)', color: 'var(--color-on-dark)' }}
                      aria-label={`${c.count} 单`}>
                      {c.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* 图例 */}
            <p className="text-[11px] text-[var(--color-ash)] mt-3 leading-relaxed">
              点了菜的日子会亮起来 · 每下一单一枚圆点，最多显 3 枚 · 数字角标代表那天一共下了几单
            </p>
          </>
        )}
      </PageContainer>

      {/* 某日订单底部 sheet */}
      <AnimatePresence>
        {selectedDay && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)} className="fixed inset-0 z-50"
              style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(43,36,41,0.35)' }} />
            <motion.div
              ref={daySheetRef}
              initial={{ y: 400, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              role="dialog" aria-modal="true" aria-label="当日订单" tabIndex={-1}
              className="fixed bottom-0 left-0 right-0 mx-auto z-50"
              style={{ maxWidth: 'var(--shell-w)' }}>
              <div className="d3-card-face overflow-hidden" style={{ borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0', maxHeight: '75vh', display: 'flex', flexDirection: 'column' }}>
                <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0">
                  <div>
                    <h2 className="font-serif text-base font-bold text-[var(--color-bone)] leading-tight">{selectedDay.replace(/-/g, ' / ')}</h2>
                    <p className="text-[11px] text-[var(--color-ash)]">{selectedOrders.length} 单 · 我们一起吃了这些</p>
                  </div>
                  <button onClick={() => setSelectedDay(null)} aria-label="关闭"
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)] border-2 border-[var(--color-line)] bg-[var(--color-glass)]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
                <div className="px-5 space-y-3 overflow-y-auto" style={{ paddingBottom: 'calc(max(env(safe-area-inset-bottom, 0px), 16px) + 12px)' }}>
                  {selectedOrders.map(o => {
                    const st = orderStatusOf(o.status)
                    return <OrderCard key={o.id} order={o} status={{ ...st, bar: st.ring[1] }} variant="user" />
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
