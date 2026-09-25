import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import PageContainer from '../components/ui/PageContainer'
import FullBleedHero from '../components/FullBleedHero'
import GlassCard from '../components/GlassCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingState from '../components/ui/LoadingState'
import { HERO_IMAGES } from '../theme/images'
import { requestJson } from '../lib/request'
import { isNightSnack } from '../lib/nightRules'
import { NICKNAME } from '../lib/sweetCopy'

/* ============================================================
 * 批 4c · 年度别册（可打印的年终总结）
 * ------------------------------------------------------------
 * 一屏汇总：全年总单/总花费/深夜比例/AA 结算两人分账 · 月度柱图 · TOP 10 最爱 · 最常开伙日
 * 导出：走浏览器 print stylesheet（@media print）→ 一张 A4 PDF 别册
 * 数据源：/api/orders 全表本地按年分桶（家庭订单量 <百级）
 * ============================================================ */
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function sum(o) { return (o.items || []).reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0) }

export default function AnnualReport() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const load = () => {
    setLoading(true); setErr('')
    requestJson('/api/orders').then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('订单没加载出来，看看服务端开好了没') })
  }
  useEffect(() => { load() }, [])

  /* 按年分桶 + 月度分布 + TOP10 + 深夜比例 + AA 结算 + 最常开伙日 */
  const data = useMemo(() => {
    const inYear = orders.filter(o => (o.created_at || '').slice(0, 4) === String(year))
    const monthTotals = Array.from({ length: 12 }, () => ({ total: 0, orders: 0, items: 0 }))
    const dishCount = {}
    const dayCount = {}
    let totalSpend = 0, totalItems = 0, nightItems = 0
    let owedMe = 0, owedPartner = 0
    let payerAA = 0, payerMe = 0, payerPartner = 0
    for (const o of inYear) {
      const m = Number(o.created_at.slice(5, 7)) - 1
      const amt = Number(o.total_price) || sum(o)
      totalSpend += amt
      monthTotals[m].total += amt
      monthTotals[m].orders += 1
      const items = o.items || []
      const qtySum = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)
      monthTotals[m].items += qtySum
      // 修 P0-4：与 UI「共 N 份」及 nightItems 同用「份数」口径，此前行数/份数混用可致深夜 300%/白天 −200%
      totalItems += qtySum
      // 分账：优先读快照，缺则按 items.added_by+payer 现算
      if (Number.isFinite(o.owed_me)) { owedMe += o.owed_me; owedPartner += o.owed_partner || 0 }
      else {
        const meSub = items.filter(i => i.added_by === 'me').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
        const pSub = items.filter(i => i.added_by === 'partner').reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
        if (o.payer === 'me') owedMe += amt
        else if (o.payer === 'partner') owedPartner += amt
        else { owedMe += meSub; owedPartner += pSub }
      }
      if (o.payer === 'aa') payerAA += amt; else if (o.payer === 'me') payerMe += amt; else if (o.payer === 'partner') payerPartner += amt
      const dkey = o.created_at.slice(0, 10)
      dayCount[dkey] = (dayCount[dkey] || 0) + 1
      for (const it of items) {
        if (it.dish_name) dishCount[it.dish_name] = (dishCount[it.dish_name] || 0) + (Number(it.quantity) || 1)
        if (isNightSnack({ name: it.dish_name })) nightItems += (Number(it.quantity) || 1)
      }
    }
    const top = Object.entries(dishCount).sort((a, b) => b[1] - a[1]).slice(0, 10)
    const maxDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]
    const busiest = maxDay ? { date: maxDay[0], count: maxDay[1], weekday: WEEKDAYS[new Date(maxDay[0]).getDay()] } : null
    const maxMonthAmt = Math.max(1, ...monthTotals.map(m => m.total))
    return { total: inYear.length, totalSpend, totalItems, nightItems, owedMe, owedPartner, payerAA, payerMe, payerPartner, monthTotals, top, busiest, maxMonthAmt }
  }, [orders, year])

  const yearsAvailable = useMemo(() => {
    const ys = new Set()
    orders.forEach(o => { const y = Number((o.created_at || '').slice(0, 4)); if (y) ys.add(y) })
    ys.add(currentYear)
    return Array.from(ys).sort((a, b) => b - a)
  }, [orders, currentYear])

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.orders} variant="functional" alt="年度别册" />
      <PageHeader title={`${year} 年度别册`} subtitle={`${NICKNAME}的厨房年报 · 可打印`} back onBack={() => navigate('/profile')} />

      <PageContainer>
        {loading ? <LoadingState text="在翻这一年的账…" /> : err ? (
          <EmptyState emoji="📡" tone="error" title="年报没加载出来" desc={err}
            action={<button onClick={load} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold min-h-[44px]">再试一次</button>} />
        ) : (
          <>
            {/* 年份切换（打印时隐藏） */}
            <div className="flex items-center justify-between gap-2 mb-3 no-print">
              <button onClick={() => setYear(y => y - 1)} aria-label="上一年"
                className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)]"
                style={{ border: '2px solid var(--color-line)' }}>‹</button>
              <div className="flex gap-1">
                {yearsAvailable.map(y => (
                  <button key={y} onClick={() => setYear(y)}
                    className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm font-bold ${y === year ? 'text-[var(--color-on-dark)]' : 'text-[var(--color-ash)]'}`}
                    style={{ background: y === year ? 'var(--color-clay)' : 'transparent', border: '2px solid ' + (y === year ? 'var(--clay-deep)' : 'var(--color-line)') }}>
                    {y}
                  </button>
                ))}
              </div>
              <button onClick={() => setYear(y => y + 1)} aria-label="下一年"
                className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-ash)]"
                style={{ border: '2px solid var(--color-line)' }}>›</button>
            </div>

            {data.total === 0 ? (
              <EmptyState who="badgeDay" title={`${year} 年还没开火`} desc="新年新开始，先点一单吧"
                action={<button onClick={() => navigate('/menu')} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold min-h-[44px]">去点菜</button>} />
            ) : (
              <>
                {/* 四大关键指标 */}
                <div className="grid grid-cols-2 gap-3">
                  <ReportStat label="这一年吃了" value={`${data.total}`} unit="单" accent="var(--color-clay)" />
                  <ReportStat label="总共花了" value={`¥${Math.round(data.totalSpend)}`} accent="var(--color-caramel)" />
                  <ReportStat label="我出了" value={`¥${Math.round(data.owedMe)}`} accent="var(--color-clay-text)" />
                  <ReportStat label="TA出了" value={`¥${Math.round(data.owedPartner)}`} accent="var(--color-sage)" />
                </div>

                {/* 月度柱图 */}
                <GlassCard delay={0.05}>
                  <div style={{ padding: 'var(--space-card-p)' }}>
                    <p className="text-xs text-[var(--color-ash)] font-bold mb-2">每月花了多少</p>
                    <div className="flex items-end justify-between gap-1" style={{ height: 120 }}>
                      {data.monthTotals.map((m, i) => {
                        const h = m.total > 0 ? Math.max(4, (m.total / data.maxMonthAmt) * 100) : 2
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-t" style={{ height: h, background: m.total > 0 ? 'var(--color-clay-gradient)' : 'var(--color-glass-border)' }} />
                            <span className="text-[10px] text-[var(--color-ash)] tabular-nums">{i + 1}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </GlassCard>

                {/* 深夜比例 */}
                {data.totalItems > 0 && (
                  <GlassCard delay={0.1}>
                    <div style={{ padding: 'var(--space-card-p)' }}>
                      <p className="text-xs text-[var(--color-ash)] font-bold mb-1">深夜与白天</p>
                      <p className="text-sm text-[var(--color-bone)]">
                        共 <span className="font-serif font-bold tabular-nums">{data.totalItems}</span> 份里
                        <span className="mx-1" style={{ color: 'var(--color-clay-text)' }}> 🌙 深夜 {Math.round((data.nightItems / data.totalItems) * 100)}%</span>
                        · 白天 {100 - Math.round((data.nightItems / data.totalItems) * 100)}%
                      </p>
                    </div>
                  </GlassCard>
                )}

                {/* TOP 10 */}
                {data.top.length > 0 && (
                  <GlassCard delay={0.15}>
                    <div style={{ padding: 'var(--space-card-p)' }}>
                      <p className="text-xs text-[var(--color-ash)] font-bold mb-2">翻牌 TOP {Math.min(10, data.top.length)}</p>
                      {data.top.map(([name, cnt], i) => (
                        <div key={name} className="flex items-center gap-2.5 py-1.5" style={{ borderTop: i ? '1px solid var(--color-glass-border)' : 'none' }}>
                          <span className="font-serif font-bold w-6 text-center shrink-0 tabular-nums"
                            style={{ color: ['var(--color-clay-text)', 'var(--color-mist)', 'var(--color-caramel)', 'var(--color-ash)'][Math.min(i, 3)] }}>
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm text-[var(--color-bone)] truncate">{name}</span>
                          <span className="text-xs text-[var(--color-ash)] tabular-nums shrink-0">{cnt} 份</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                )}

                {/* 最常开伙日 */}
                {data.busiest && (
                  <GlassCard delay={0.2}>
                    <div style={{ padding: 'var(--space-card-p)' }}>
                      <p className="text-xs text-[var(--color-ash)] font-bold mb-1">最常开伙的一天</p>
                      <p className="text-sm text-[var(--color-bone)]">
                        {data.busiest.date} <span className="opacity-70">（{data.busiest.weekday}）· 那天下了 </span>
                        <span className="font-serif font-bold text-[var(--color-clay-text)] tabular-nums">{data.busiest.count}</span>
                        <span className="opacity-70"> 单</span>
                      </p>
                    </div>
                  </GlassCard>
                )}

                {/* 买单三档占比 */}
                <GlassCard delay={0.25}>
                  <div style={{ padding: 'var(--space-card-p)' }}>
                    <p className="text-xs text-[var(--color-ash)] font-bold mb-2">谁在买单</p>
                    <div className="flex items-center gap-3 text-xs">
                      <PayerBar label="AA" amount={data.payerAA} total={data.totalSpend} color="var(--color-caramel-deep)" />
                      <PayerBar label="我请" amount={data.payerMe} total={data.totalSpend} color="var(--color-clay)" />
                      <PayerBar label="TA请" amount={data.payerPartner} total={data.totalSpend} color="var(--color-sage)" />
                    </div>
                  </div>
                </GlassCard>

                {/* 打印按钮（无 print 时不显） */}
                <div className="mt-4 no-print">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => window.print()}
                    className="d3-btn d3-btn-primary w-full py-3 text-sm font-bold min-h-[44px]">
                    🖨️ 打印 / 存成 PDF 别册
                  </motion.button>
                  <p className="text-[11px] text-[var(--color-ash)] mt-2 leading-relaxed text-center">
                    浏览器打印对话框里选「保存为 PDF」即成一本年度别册
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </PageContainer>
    </div>
  )
}

function ReportStat({ label, value, unit, accent }) {
  return (
    <div className="d3-card-face" style={{ padding: 'var(--space-card-p)' }}>
      <p className="text-[11px] font-bold mb-1" style={{ color: 'var(--color-ash)', letterSpacing: '0.1em' }}>{label}</p>
      <p className="font-serif font-bold leading-none tabular-nums" style={{ fontSize: '2rem', color: accent }}>
        {value}<span className="text-sm ml-1 opacity-70">{unit}</span>
      </p>
    </div>
  )
}

function PayerBar({ label, amount, total, color }) {
  const pct = total > 0 ? (amount / total) * 100 : 0
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[10px] mb-1">
        <span style={{ color: 'var(--color-ash)' }}>{label}</span>
        <span className="font-serif font-bold tabular-nums" style={{ color }}>¥{Math.round(amount)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-glass-border)' }}>
        <div className="h-full rounded-full" style={{ width: pct + '%', background: color }} />
      </div>
    </div>
  )
}
