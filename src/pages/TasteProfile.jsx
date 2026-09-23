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
import { pickOne } from '../lib/sweetCopy'

/* ============================================================
 * 批 3b · 口味雷达
 * ------------------------------------------------------------
 * 从历史订单聚合到 5 维：荤（硬菜+菜系）/ 素（素菜+汤）/ 主食 / 小食（小吃+水果+饮品）/ 深夜（夜宵）
 * 手写 SVG 雷达（不引外部图表库），配 TOP 5 最爱菜。
 * 语义：让她看见"我们最近在吃什么"，让"这本别册"有了画像。
 * ============================================================ */
const DIMS = [
  { key: 'meat',    label: '荤',   cats: ['硬菜', '川菜', '粤菜', '湘菜', '鲁菜', '苏菜', '浙菜', '闽菜', '徽菜', '东北菜', '西北菜', '云贵菜'] },
  { key: 'veg',    label: '素',   cats: ['素菜', '汤类'] },
  { key: 'staple', label: '主食', cats: ['主食'] },
  { key: 'snack',  label: '小食', cats: ['小吃', '水果', '饮品'] },
  { key: 'night',  label: '深夜', cats: [] /* 走 isNightSnack 判定 */ },
]
const TP_TITLES = ['你的口味画像', '最近我们在吃啥', '这本别册的味道']

function polar(cx, cy, r, angle) {
  // 0 角指向正上方（-π/2）
  const rad = angle - Math.PI / 2
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

export default function TasteProfile() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [pageTitle] = useState(() => pickOne(TP_TITLES))

  const load = () => {
    setLoading(true); setErr('')
    requestJson('/api/orders').then(r => r.json())
      .then(d => { setOrders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false); setErr('没读到订单，先去点几单再来翻画像') })
  }
  useEffect(() => { load() }, [])

  /* 聚合：每菜按 category 落到一个维度；同名菜计数 TOP5 */
  const { dims, top, total } = useMemo(() => {
    const counts = { meat: 0, veg: 0, staple: 0, snack: 0, night: 0 }
    const dishCount = {}
    let total = 0
    for (const o of orders) {
      for (const it of (o.items || [])) {
        const qty = Number(it.quantity) || 1
        total += qty
        // 夜宵优先（一菜可能既是主食又是夜宵，"深夜" 单开一维不重复计）
        const nameCat = it.dish_name || ''
        const isNight = isNightSnack({ name: nameCat })
        if (isNight) { counts.night += qty }
        else {
          const d = DIMS.find(dim => dim.key !== 'night' && dim.cats.includes(it.category))
          if (d) counts[d.key] += qty
        }
        if (it.dish_name) dishCount[it.dish_name] = (dishCount[it.dish_name] || 0) + qty
      }
    }
    const sum = Object.values(counts).reduce((a, b) => a + b, 0) || 1
    const dims = DIMS.map(d => ({ ...d, count: counts[d.key], ratio: counts[d.key] / sum }))
    const top = Object.entries(dishCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { dims, top, total }
  }, [orders])

  // 雷达半径归一化：以最大维度为满格
  const maxRatio = Math.max(0.01, ...dims.map(d => d.ratio))

  /* 手绘 SVG 雷达：五维 */
  const CX = 100, CY = 100, R = 74
  const N = dims.length
  const angleFor = (i) => (i / N) * Math.PI * 2
  const pointsStr = dims.map((d, i) => polar(CX, CY, (d.ratio / maxRatio) * R, angleFor(i)).join(',')).join(' ')
  const gridRings = [0.33, 0.66, 1.0]

  return (
    <div className="relative">
      <FullBleedHero src={HERO_IMAGES.profile} variant="functional" alt="口味画像" />
      <PageHeader title={pageTitle} subtitle="从每一单里聚出来的你" back onBack={() => navigate('/profile')} />

      <PageContainer>
        {loading ? <LoadingState text="在算你爱吃什么…" /> : err ? (
          <EmptyState emoji="📡" tone="error" title="暂时看不到" desc={err}
            action={<button onClick={load} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold min-h-[44px]">再试一次</button>} />
        ) : total === 0 ? (
          <EmptyState who="badgeDay" title="还没吃过几单呢" desc="先去点菜页开开火，画像就会长出来"
            action={<button onClick={() => navigate('/menu')} className="d3-btn d3-btn-primary px-6 py-2.5 text-sm font-bold min-h-[44px]">去点菜</button>} />
        ) : (
          <>
            {/* 雷达图 */}
            <GlassCard>
              <div style={{ padding: 'var(--space-card-p)' }}>
                <p className="text-xs text-[var(--color-ash)] font-bold mb-1">五维口味</p>
                <p className="text-2xl font-serif font-bold text-[var(--color-bone)] mb-2 tabular-nums">
                  <span className="text-sm mr-1 opacity-70">共</span>{total}<span className="text-sm ml-1 opacity-70">份</span>
                </p>
                <svg viewBox="0 0 200 200" className="w-full" style={{ maxWidth: 280, margin: '0 auto', display: 'block' }} role="img" aria-label="五维口味雷达图">
                  {/* 三层同心网格 */}
                  {gridRings.map(r => (
                    <polygon key={r}
                      points={Array.from({ length: N }, (_, i) => polar(CX, CY, R * r, angleFor(i)).join(',')).join(' ')}
                      fill="none" stroke="var(--color-line)" strokeWidth="1" />
                  ))}
                  {/* 轴线 */}
                  {dims.map((d, i) => {
                    const [x, y] = polar(CX, CY, R, angleFor(i))
                    return <line key={d.key} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--color-line)" strokeWidth="1" />
                  })}
                  {/* 数据多边形：clay 半透明填充 + clay-deep 描边 */}
                  <polygon points={pointsStr}
                    fill="color-mix(in srgb, var(--clay-50) 22%, transparent)"
                    stroke="var(--clay-deep)" strokeWidth="2" strokeLinejoin="round" />
                  {/* 顶点小圆 */}
                  {dims.map((d, i) => {
                    const [x, y] = polar(CX, CY, (d.ratio / maxRatio) * R, angleFor(i))
                    return <circle key={d.key} cx={x} cy={y} r="3.5" fill="var(--color-clay)" stroke="var(--color-on-dark)" strokeWidth="1.5" />
                  })}
                  {/* 维度标签 */}
                  {dims.map((d, i) => {
                    const [x, y] = polar(CX, CY, R + 14, angleFor(i))
                    return <text key={d.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                      style={{ fill: 'var(--color-bone)', font: '700 12px var(--font-sans)' }}>{d.label}</text>
                  })}
                </svg>
                <div className="grid grid-cols-5 gap-1 mt-2 text-center">
                  {dims.map(d => (
                    <div key={d.key}>
                      <p className="text-[11px] font-bold text-[var(--color-bone)]">{d.label}</p>
                      <p className="text-[10px] text-[var(--color-ash)] tabular-nums">{(d.ratio * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* TOP5 最爱 */}
            <GlassCard delay={0.1}>
              <div style={{ padding: 'var(--space-card-p)' }}>
                <p className="text-xs text-[var(--color-ash)] font-bold mb-2">翻牌 TOP 5</p>
                {top.length === 0 ? (
                  <p className="text-sm text-[var(--color-ash)]">还没订单数据</p>
                ) : top.map(([name, cnt], i) => (
                  <div key={name} className="flex items-center gap-2.5 py-1.5" style={{ borderTop: i ? '1px solid var(--color-glass-border)' : 'none' }}>
                    <span className="font-serif text-lg font-bold w-6 text-center shrink-0 tabular-nums"
                      style={{ color: ['var(--color-clay)', 'var(--color-mist-deep)', 'var(--color-caramel-deep)', 'var(--color-ash)', 'var(--color-ash)'][i] }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-bold text-[var(--color-bone)] truncate">{name}</span>
                    <span className="text-xs text-[var(--color-ash)] tabular-nums shrink-0">{cnt} 份</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </PageContainer>
    </div>
  )
}
